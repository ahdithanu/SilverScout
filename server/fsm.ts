import { DealStage, DealDocument, WorkflowExecutionRecord, FundDeploymentConfig } from '../src/types';

export interface TransitionResult {
  success: boolean;
  newState?: DealStage;
  previousState?: DealStage | null;
  executionRecord?: WorkflowExecutionRecord;
  error?: string;
}

const STAGE_ORDER: DealStage[] = [
  'INGESTED',
  'ENRICHED',
  'SCORED',
  'UNDERWRITTEN',
  'IC_GENERATED',
  'APPROVAL_REQUIRED',
  'APPROVED',
  'OUTREACH_TRIGGERED',
  'CRM_SYNCED'
];

export function canTransitionStage(
  currentStage: DealStage,
  targetStage: DealStage,
  deal: Partial<DealDocument>,
  config: FundDeploymentConfig,
  actorRole: string
): { allowed: boolean; reason?: string } {
  if (deal.isPaused) {
    return { allowed: false, reason: 'Deal pipeline is currently PAUSED by operator intervention' };
  }

  // Allow explicit failure or pause
  if (targetStage === 'FAILED' || targetStage === 'PAUSED') {
    return { allowed: true };
  }

  // Check valid prerequisite stage
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStage);

  if (targetIndex === -1) {
    return { allowed: false, reason: `Unknown target stage: ${targetStage}` };
  }

  if (targetIndex > currentIndex + 1) {
    return { 
      allowed: false, 
      reason: `Cannot jump from ${currentStage} directly to ${targetStage}. Prerequisite stages must execute sequentially.` 
    };
  }

  // Prerequisite Guard Rules
  if (targetStage === 'UNDERWRITTEN') {
    if (!deal.revenue || deal.revenue < config.financialThresholds.minRevenue) {
      return { 
        allowed: false, 
        reason: `Revenue ($${deal.revenue || 0}) below Fund minimum threshold ($${config.financialThresholds.minRevenue})` 
      };
    }
  }

  if (targetStage === 'APPROVAL_REQUIRED') {
    if (!deal.aiThesis) {
      return { allowed: false, reason: 'AI IC Thesis generation required before LOI approval request' };
    }
  }

  if (targetStage === 'APPROVED') {
    if (config.approvalPolicy.requirePartnerLOIApproval && actorRole !== 'partner' && actorRole !== 'admin') {
      return { 
        allowed: false, 
        reason: `Partner or Admin approval required for stage APPROVED (Actor role: ${actorRole})` 
      };
    }
  }

  return { allowed: true };
}

export function executeStateTransition(
  deal: DealDocument,
  targetStage: DealStage,
  config: FundDeploymentConfig,
  actorId: string,
  actorRole: string
): TransitionResult {
  const check = canTransitionStage(deal.currentState, targetStage, deal, config, actorRole);
  if (!check.allowed) {
    return {
      success: false,
      error: check.reason || 'State transition rejected'
    };
  }

  const previousState = deal.currentState;
  deal.currentState = targetStage;
  deal.previousState = previousState;
  deal.stateVersion = (deal.stateVersion || 0) + 1;
  deal.updatedAt = new Date().toISOString();

  const record: WorkflowExecutionRecord = {
    recordId: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    dealId: deal.dealId,
    fundId: deal.fundId,
    stage: targetStage,
    status: 'SUCCESS',
    configVersion: config.configVersion,
    actorId,
    actorRole: actorRole as any,
    inputSnapshot: { previousState, targetStage },
    outputSnapshot: { currentState: targetStage, stateVersion: deal.stateVersion },
    provenance: {
      executionDurationMs: 1.2,
      idempotencyKey: `${deal.fundId}:${deal.dealId}:${targetStage}:v${deal.stateVersion}`
    },
    timestamp: new Date().toISOString()
  };

  return {
    success: true,
    newState: targetStage,
    previousState,
    executionRecord: record
  };
}
