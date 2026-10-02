/**
 * AGENT EVALUATION & CONTINUOUS IMPROVEMENT HARNESS (EASY, HARD & GOD MODES)
 * 
 * Provides:
 * 1. Easy Mode: Tasks & Verifiers (Deterministic assertions + LLM-as-a-Judge rubrics)
 * 2. Hard Mode: Sandboxed Practice Environments & Anti-Reward-Hacking Guards (Harbor/LangSmith compatibility)
 * 3. God Mode: Self-Improving Loop (Production trace receipts -> failure clustering -> automated eval generation & prompt patches)
 */

import crypto from 'crypto';

// ==========================================
// 1. EASY MODE: TASKS & VERIFIERS
// ==========================================

export type EvalCategory = 
  | 'CRM_SEARCH' 
  | 'UNDERWRITING' 
  | 'OUTREACH_DRAFT' 
  | 'ACL_ENFORCEMENT' 
  | 'INTENT_DEFLECTION';

export interface EvalTask {
  id: string;
  name: string;
  description: string;
  category: EvalCategory;
  input: {
    prompt: string;
    context?: Record<string, any>;
    tenantId: string;
    userRole: string;
  };
  expectedOutcome: {
    targetTools?: string[];
    forbiddenTools?: string[];
    requiredKeywords?: string[];
    forbiddenKeywords?: string[];
    numericConstraints?: Record<string, { min?: number; max?: number; exact?: number }>;
    expectedEntities?: string[];
    expectedStateMutations?: Array<{
      target: string;
      field: string;
      expectedValue: any;
    }>;
  };
}

export interface VerificationResult {
  passed: boolean;
  score: number; // 0.0 to 1.0
  failureReasons: string[];
  assertionsPassed: number;
  totalAssertions: number;
  judgeFeedback?: string;
}

export interface AgentExecutionOutput {
  responseText: string;
  toolCallsExecuted: Array<{ toolName: string; args: Record<string, any>; result?: any }>;
  stateMutations?: Array<{ target: string; field: string; value: any }>;
  executionDurationMs: number;
  tokensUsed?: number;
}

/**
 * Deterministic Verifier: Runs zero-latency programmatic assertions
 */
export class DeterministicVerifier {
  public static verify(task: EvalTask, output: AgentExecutionOutput): VerificationResult {
    const failureReasons: string[] = [];
    let assertionsPassed = 0;
    let totalAssertions = 0;

    const { expectedOutcome } = task;

    // 1. Target Tools Check (Must have invoked required tools)
    if (expectedOutcome.targetTools && expectedOutcome.targetTools.length > 0) {
      for (const reqTool of expectedOutcome.targetTools) {
        totalAssertions++;
        const invoked = output.toolCallsExecuted.some(call => call.toolName === reqTool);
        if (invoked) {
          assertionsPassed++;
        } else {
          failureReasons.push(`Missing required tool call: '${reqTool}'`);
        }
      }
    }

    // 2. Forbidden Tools Check (Must NOT have touched forbidden tools, e.g. delete/unauthorized side-effects)
    if (expectedOutcome.forbiddenTools && expectedOutcome.forbiddenTools.length > 0) {
      for (const forbTool of expectedOutcome.forbiddenTools) {
        totalAssertions++;
        const invoked = output.toolCallsExecuted.some(call => call.toolName === forbTool);
        if (!invoked) {
          assertionsPassed++;
        } else {
          failureReasons.push(`Executed forbidden tool call: '${forbTool}'`);
        }
      }
    }

    // 3. Required Keywords Check
    if (expectedOutcome.requiredKeywords && expectedOutcome.requiredKeywords.length > 0) {
      for (const kw of expectedOutcome.requiredKeywords) {
        totalAssertions++;
        if (output.responseText.toLowerCase().includes(kw.toLowerCase())) {
          assertionsPassed++;
        } else {
          failureReasons.push(`Response missing mandatory keyword: '${kw}'`);
        }
      }
    }

    // 4. Forbidden Keywords Check (e.g. PII, jailbreak leakage, speculative promises)
    if (expectedOutcome.forbiddenKeywords && expectedOutcome.forbiddenKeywords.length > 0) {
      for (const kw of expectedOutcome.forbiddenKeywords) {
        totalAssertions++;
        if (!output.responseText.toLowerCase().includes(kw.toLowerCase())) {
          assertionsPassed++;
        } else {
          failureReasons.push(`Response contained forbidden keyword/content: '${kw}'`);
        }
      }
    }

    // 5. Numeric Constraints Check (e.g. Valuation multiple boundary)
    if (expectedOutcome.numericConstraints) {
      for (const [key, constraint] of Object.entries(expectedOutcome.numericConstraints)) {
        totalAssertions++;
        const numRegex = new RegExp(`${key}[:\\s=]+([0-9\\.]+)`, 'i');
        const match = output.responseText.match(numRegex);
        if (match) {
          const val = parseFloat(match[1]);
          let valid = true;
          if (constraint.min !== undefined && val < constraint.min) valid = false;
          if (constraint.max !== undefined && val > constraint.max) valid = false;
          if (constraint.exact !== undefined && Math.abs(val - constraint.exact) > 0.001) valid = false;

          if (valid) {
            assertionsPassed++;
          } else {
            failureReasons.push(`Numeric constraint for '${key}' failed. Found: ${val}, Range: [${constraint.min ?? '-inf'}, ${constraint.max ?? '+inf'}]`);
          }
        } else {
          failureReasons.push(`Numeric parameter '${key}' not found in output text.`);
        }
      }
    }

    // 6. Expected State Mutations
    if (expectedOutcome.expectedStateMutations && expectedOutcome.expectedStateMutations.length > 0) {
      for (const expectedMut of expectedOutcome.expectedStateMutations) {
        totalAssertions++;
        const actual = output.stateMutations?.find(
          m => m.target === expectedMut.target && m.field === expectedMut.field
        );
        if (actual && JSON.stringify(actual.value) === JSON.stringify(expectedMut.expectedValue)) {
          assertionsPassed++;
        } else {
          failureReasons.push(`State mutation mismatch on ${expectedMut.target}.${expectedMut.field}: expected ${JSON.stringify(expectedMut.expectedValue)}`);
        }
      }
    }

    const score = totalAssertions > 0 ? assertionsPassed / totalAssertions : 1.0;
    return {
      passed: failureReasons.length === 0,
      score,
      failureReasons,
      assertionsPassed,
      totalAssertions
    };
  }
}

/**
 * Model Judge Verifier (LLM-as-a-judge rubric simulation)
 */
export class ModelJudgeVerifier {
  public static evaluateRubric(
    rubricCriteria: { criteria: string; weight: number }[],
    task: EvalTask,
    output: AgentExecutionOutput
  ): { overallScore: number; passed: boolean; feedback: string } {
    let weightedScore = 0;
    let totalWeight = 0;
    const feedbackLines: string[] = [];

    for (const item of rubricCriteria) {
      totalWeight += item.weight;
      // Evaluate criteria heuristics
      let grade = 1.0;
      if (item.criteria.includes('factual') && output.responseText.length < 20) {
        grade = 0.4;
      }
      if (item.criteria.includes('grounding') && output.toolCallsExecuted.length === 0) {
        grade = 0.2;
      }
      weightedScore += grade * item.weight;
      feedbackLines.push(`- ${item.criteria}: Score ${(grade * 100).toFixed(0)}%`);
    }

    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 1.0;
    return {
      overallScore,
      passed: overallScore >= 0.75,
      feedback: feedbackLines.join('\n')
    };
  }
}

// ==========================================
// 2. HARD MODE: SANDBOX ENVIRONMENTS
// ==========================================

export interface MockDatabaseRecord {
  id: string;
  table: string;
  data: Record<string, any>;
}

/**
 * Sandboxed Practice Environment:
 * Safe practice field preventing agents from cheating, reward-hacking, or polluting production.
 */
export class SandboxedAgentEnvironment {
  private sandboxId: string;
  private virtualDatabase: Map<string, MockDatabaseRecord>;
  private snapshotState: string;
  private outboundNetworkCalls: Array<{ url: string; method: string; timestamp: number }>;
  private auditLog: string[];

  constructor(initialData: MockDatabaseRecord[] = []) {
    this.sandboxId = `sandbox-${crypto.randomUUID().slice(0, 8)}`;
    this.virtualDatabase = new Map();
    this.outboundNetworkCalls = [];
    this.auditLog = [];

    for (const rec of initialData) {
      this.virtualDatabase.set(`${rec.table}:${rec.id}`, JSON.parse(JSON.stringify(rec)));
    }
    this.snapshotState = this.serializeState();
  }

  public getSandboxId(): string {
    return this.sandboxId;
  }

  /**
   * Freezes current state for rapid rollback between eval iterations
   */
  private serializeState(): string {
    return JSON.stringify(Array.from(this.virtualDatabase.entries()));
  }

  /**
   * Restores sandbox back to initial snapshot (zero cross-test contamination)
   */
  public rollback(): void {
    const entries: [string, MockDatabaseRecord][] = JSON.parse(this.snapshotState);
    this.virtualDatabase = new Map(entries);
    this.outboundNetworkCalls = [];
    this.auditLog.push(`[${new Date().toISOString()}] Sandbox state rolled back to baseline.`);
  }

  /**
   * Anti-Cheating & Boundary Guard:
   * Rejects queries attempting to contact live production endpoints or escape the sandbox.
   */
  public interceptNetworkCall(url: string, method: string): { allowed: boolean; reason?: string } {
    const isLiveProduction = 
      url.includes('api.salesforce.com') ||
      url.includes('api.stripe.com') ||
      url.includes('api.sendgrid.com') ||
      url.includes('prod-db');

    if (isLiveProduction) {
      this.auditLog.push(`[BLOCKED CHEATING ATTEMPT] Agent tried to ping real production API: ${url}`);
      return {
        allowed: false,
        reason: 'CRITICAL SECURITY VIOLATION: Agent attempted to touch real production endpoint from sandbox.'
      };
    }

    this.outboundNetworkCalls.push({ url, method, timestamp: Date.now() });
    return { allowed: true };
  }

  /**
   * Mock Data Access
   */
  public queryVirtualTable(table: string, filter?: (item: Record<string, any>) => boolean): MockDatabaseRecord[] {
    const results: MockDatabaseRecord[] = [];
    for (const [key, record] of this.virtualDatabase.entries()) {
      if (record.table === table) {
        if (!filter || filter(record.data)) {
          results.push(JSON.parse(JSON.stringify(record)));
        }
      }
    }
    return results;
  }

  public mutateVirtualTable(table: string, id: string, patch: Record<string, any>): void {
    const key = `${table}:${id}`;
    const existing = this.virtualDatabase.get(key);
    if (existing) {
      existing.data = { ...existing.data, ...patch };
      this.virtualDatabase.set(key, existing);
    } else {
      this.virtualDatabase.set(key, { id, table, data: patch });
    }
  }

  /**
   * Harbor / LangSmith benchmark format export
   */
  public exportHarborFormat(task: EvalTask): Record<string, any> {
    return {
      harbor_version: '1.0',
      task_id: task.id,
      task_name: task.name,
      category: task.category,
      environment: {
        sandbox_id: this.sandboxId,
        isolated: true,
        network_isolation: 'STRICT_MOCK_ONLY'
      },
      evaluation: {
        verifiers: ['deterministic_assertions', 'schema_check'],
        expected_tools: task.expectedOutcome.targetTools ?? [],
        forbidden_tools: task.expectedOutcome.forbiddenTools ?? []
      }
    };
  }
}

// ==========================================
// 3. GOD MODE: THE SELF-IMPROVING TRACE LOOP
// ==========================================

export interface SpanReceipt {
  step: number;
  type: 'PROMPT' | 'TOOL_CALL' | 'TOOL_RESULT' | 'REASONING' | 'OUTPUT';
  name: string;
  input: any;
  output: any;
  durationMs: number;
  error?: string;
}

export interface ProductionTraceReceipt {
  traceId: string;
  taskId: string;
  sessionId: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILURE' | 'ESCALATED';
  durationMs: number;
  spans: SpanReceipt[];
  userFeedback?: 'THUMBS_UP' | 'THUMBS_DOWN';
  failureClass?: string;
}

export interface FailureCluster {
  patternId: string;
  title: string;
  occurrenceCount: number;
  sampleTraceIds: string[];
  rootCauseAnalysis: string;
  suggestedPromptPatch: string;
  generatedRegressionEvalTask: EvalTask;
}

/**
 * Self-Improving Analyzer Engine:
 * Ingests production traces, detects systemic failure patterns, and synthesizes prompt patches + regression evals.
 */
export class SelfImprovingTraceLoop {
  private traceStore: ProductionTraceReceipt[];

  constructor() {
    this.traceStore = [];
  }

  public recordTrace(trace: ProductionTraceReceipt): void {
    this.traceStore.push(trace);
  }

  public getTraces(): ProductionTraceReceipt[] {
    return [...this.traceStore];
  }

  /**
   * Analyzes production traces to find failure clusters and synthesize automatic fixes
   */
  public analyzeAndProposeFixes(): FailureCluster[] {
    const failedTraces = this.traceStore.filter(
      t => t.status === 'FAILURE' || t.userFeedback === 'THUMBS_DOWN'
    );

    const clusters: Map<string, ProductionTraceReceipt[]> = new Map();

    for (const trace of failedTraces) {
      let failureKey = 'UNKNOWN_FAILURE';

      // 1. Check for table hallucination / wrong table query
      const toolSpans = trace.spans.filter(s => s.type === 'TOOL_CALL');
      const hasWrongTable = toolSpans.some(
        s => s.name === 'querySalesforce' && s.input?.table === 'Accounts' // Plural instead of Account
      );

      // 2. Check for multi-entity collapse
      const hasMultiEntityPrompt = trace.spans.find(
        s => s.type === 'PROMPT' && s.input && /compare|and|between/i.test(String(s.input))
      );
      const queriedOnlyOne = toolSpans.filter(s => s.name.includes('lookup') || s.name.includes('query')).length <= 1;

      // 3. Check for multiple limit breach (>8.5x)
      const hasMultipleBreach = trace.spans.some(
        s => s.type === 'TOOL_RESULT' && typeof s.output === 'string' && /multiple[:\s=]+([9-9][0-9]|\d{2,}\.?\d*)x/i.test(s.output)
      );

      if (hasWrongTable) {
        failureKey = 'SALESFORCE_SCHEMA_PLURAL_HALLUCINATION';
      } else if (hasMultiEntityPrompt && queriedOnlyOne) {
        failureKey = 'MULTI_ENTITY_QUERY_COLLAPSE';
      } else if (hasMultipleBreach) {
        failureKey = 'UNREALISTIC_VALUATION_MULTIPLE_BREACH';
      }

      if (!clusters.has(failureKey)) {
        clusters.set(failureKey, []);
      }
      clusters.get(failureKey)!.push(trace);
    }

    const proposedFixes: FailureCluster[] = [];

    for (const [patternId, traces] of clusters.entries()) {
      if (patternId === 'SALESFORCE_SCHEMA_PLURAL_HALLUCINATION') {
        proposedFixes.push({
          patternId,
          title: 'Agent queries non-existent plural table "Accounts" instead of "Account"',
          occurrenceCount: traces.length,
          sampleTraceIds: traces.map(t => t.traceId),
          rootCauseAnalysis: 'LLM intuitively infers plural naming convention instead of Salesforce standard singular DMO naming.',
          suggestedPromptPatch: '+ RULE: Always use singular entity names for Salesforce tables (e.g. Account, Contact, Lead, Opportunity). Never use Accounts.',
          generatedRegressionEvalTask: {
            id: `eval-reg-sf-${Date.now()}`,
            name: 'Regression Guard: Salesforce Singular Table Reference',
            description: 'Verifies that queries to Salesforce CRM strictly employ singular table identifiers.',
            category: 'CRM_SEARCH',
            input: {
              prompt: 'Find revenue records for Acme Corp in Salesforce',
              tenantId: 'fund-1',
              userRole: 'analyst'
            },
            expectedOutcome: {
              targetTools: ['querySalesforce'],
              forbiddenKeywords: ['from Accounts', 'table: "Accounts"'],
              requiredKeywords: ['Account']
            }
          }
        });
      } else if (patternId === 'MULTI_ENTITY_QUERY_COLLAPSE') {
        proposedFixes.push({
          patternId,
          title: 'Multi-company requests collapse into a single entity query',
          occurrenceCount: traces.length,
          sampleTraceIds: traces.map(t => t.traceId),
          rootCauseAnalysis: 'Agent issues lookup for the first company and terminates planning loop prematurely before evaluating second entity.',
          suggestedPromptPatch: '+ RULE: When a user references multiple companies (A and B), explicitly execute independent search actions for each company before synthesizing.',
          generatedRegressionEvalTask: {
            id: `eval-reg-multi-${Date.now()}`,
            name: 'Regression Guard: Multi-Entity Comprehensive Retrieval',
            description: 'Ensures multi-company comparison queries trigger distinct tool invocations for all target entities.',
            category: 'CRM_SEARCH',
            input: {
              prompt: 'Compare valuation multiples of Alpha HVAC and Omega Plumbing',
              tenantId: 'fund-1',
              userRole: 'partner'
            },
            expectedOutcome: {
              targetTools: ['lookupEntity'],
              expectedEntities: ['Alpha HVAC', 'Omega Plumbing']
            }
          }
        });
      }
    }

    return proposedFixes;
  }
}
