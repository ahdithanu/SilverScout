export type UserRole = 'admin' | 'partner' | 'associate' | 'analyst';

export type DealStage = 
  | 'INGESTED'
  | 'ENRICHED'
  | 'SCORED'
  | 'UNDERWRITTEN'
  | 'IC_GENERATED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'OUTREACH_TRIGGERED'
  | 'CRM_SYNCED'
  | 'FAILED'
  | 'PAUSED';

// Legacy alias compatibility
export type LeadStatus = 'new' | 'analyzing' | 'qualified' | 'outreach_triggered' | 'in_loi' | 'under_contract' | 'archived' | DealStage;

export interface FundDeploymentConfig {
  fundId: string;
  fundName: string;
  configVersion: number;
  updatedAt: string;
  
  financialThresholds: {
    minRevenue: number;
    minEbitda: number;
    minProfitMargin: number;
    maxPermitDropPct: number;
  };
  
  underwritingAssumptions: {
    defaultSeniorDebtLtv: number;
    interestRatePct: number;
    defaultHoldYears: number;
    minDscrThreshold: number;
  };
  
  scoringWeights: {
    permitDropWeight: number;
    marginWeight: number;
    entityAgeWeight: number;
    digitalPostWeight: number;
  };
  
  integrations: {
    outreachProvider: 'sendgrid' | 'smartlead' | 'mock';
    crmProvider: 'hubspot' | 'salesforce' | 'mock';
    aiModel: 'gemini-2.5-flash' | 'gemini-1.5-pro';
  };
  
  approvalPolicy: {
    requirePartnerLOIApproval: boolean;
    requireICMemoValidation: boolean;
  };
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
}

export interface DealComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  fundId: string; // Multi-Tenant Scoping Key
  name: string;
  industry: string;
  location: string;
  registrationDate: string;
  agentName: string;
  isCorporateAgent: boolean;
  permitVolume2023_2025: number;
  permitVolume2026: number;
  permitDrop: number;
  lastDigitalPostDate: string;
  reviewVelocity: number;
  exitPropensityScore: number;
  aiThesis: string;
  valuationEstimate: number;
  suggestedSubjectLines?: string[];
  status: LeadStatus;
  
  // Explicit Durable FSM States
  currentState?: DealStage;
  previousState?: DealStage | null;
  stateVersion?: number;
  isPaused?: boolean;
  
  revenue?: number;
  ebitda?: number;
  profitMargin?: number;
  archiveReason?: string;
  archiveNotes?: string;
  loiApprovalStatus?: 'pending_approval' | 'approved' | 'rejected';
  loiApprovedBy?: string;
  loiApprovedAt?: string;
  activityLogs?: ActivityLog[];
  comments?: DealComment[];
  thesisFeedback?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
  tags?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  permitAnalysis?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface UserProfile {
  uid: string;
  fundId: string; // Multi-Tenant Scoping Key
  email: string;
  displayName: string;
  role: UserRole;
  systemPrompt?: string;
  industryMultiples?: Record<string, number>;
  valuationParameters?: {
    defaultProfitMargin?: number;
    revenueTiers?: {
      min: number;
      max: number;
      multiplier: number;
    }[];
    profitMarginTiers?: {
      min: number;
      max: number;
      multiplier: number;
    }[];
    locationMultipliers?: Record<string, number>;
    ageMultipliers?: {
      minYears: number;
      multiplier: number;
    }[];
    customValuationRules?: string[];
  };
}
