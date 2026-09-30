export type AgentIntent =
  | 'DEAL_SCOUTING'
  | 'FINANCIAL_UNDERWRITING'
  | 'OUTREACH_DISPATCH'
  | 'PIPELINE_ADMIN'
  | 'OUT_OF_SCOPE';

export interface IntentClassificationResult {
  intent: AgentIntent;
  confidence: number; // 0.0 to 1.0
  matchedKeywords: string[];
  suggestedHandler: string;
  isOutOfScope: boolean;
  deflectionResponse?: string;
  latencyMs: number;
}

export interface GuardrailCheckResult {
  allowed: boolean;
  violationType?: 'PROMPT_INJECTION' | 'JAILBREAK_ATTEMPT' | 'PII_DETECTED' | 'OUT_OF_BOUNDS_VALUATION';
  rejectionMessage?: string;
  sanitizedInput?: string;
}

/**
 * 1. FRONT-DOOR INTENT CLASSIFIER
 * Fast deterministic & semantic intent routing (<15ms)
 * Immediately catches out-of-scope queries (like the classic "weather question" interview test).
 */
export class IntentClassifier {
  private static OUT_OF_SCOPE_PATTERNS = [
    /\b(weather|temperature|forecast|rain|snow|sunny|humidity)\b/i,
    /\b(sports|nba|nfl|mlb|score|game|player|stadium)\b/i,
    /\b(recipe|cooking|dinner|cocktail|restaurant)\b/i,
    /\b(write code|python script|javascript loop|leetcode)\b/i,
    /\b(who is the president|movie|actor|celebrity)\b/i
  ];

  private static DEAL_SCOUTING_KEYWORDS = [
    'scout', 'lead', 'leads', 'permit', 'drop', 'territory', 'map', 'zip', 'distance',
    'location', 'contractor', 'hvac', 'plumbing', 'electrical', 'roofing', 'registry', 'off-market'
  ];

  private static FINANCIAL_KEYWORDS = [
    'ebitda', 'revenue', 'multiple', 'lbo', 'irr', 'moic', 'valuation', 'debt',
    'waterfall', 'add-back', 'p&l', 'cash flow', 'sde', 'balance sheet', 'purchase price'
  ];

  private static OUTREACH_KEYWORDS = [
    'outreach', 'email', 'cadence', 'golden letter', 'direct mail', 'phone',
    'call', 'touchpoint', 'mailer', 'sendgrid', 'follow-up'
  ];

  private static PIPELINE_KEYWORDS = [
    'stage', 'kanban', 'fsm', 'transition', 'archive', 'loi', 'pause',
    'resume', 'audit', 'ledger', 'outbox', 'crm', 'hubspot', 'salesforce'
  ];

  public static classify(query: string): IntentClassificationResult {
    const startTime = Date.now();
    const clean = query.trim().toLowerCase();

    // 1. Check for Out-of-Scope queries first (Instant deflection)
    for (const pattern of this.OUT_OF_SCOPE_PATTERNS) {
      if (pattern.test(clean)) {
        const latencyMs = Date.now() - startTime;
        return {
          intent: 'OUT_OF_SCOPE',
          confidence: 0.98,
          matchedKeywords: [clean.match(pattern)?.[0] || 'out_of_scope_topic'],
          suggestedHandler: 'OutboundDeflectionHandler',
          isOutOfScope: true,
          deflectionResponse:
            "I specialize exclusively in proprietary SMB acquisitions, financial underwriting, and seller outreach for private equity search funds. I don't have access to general consumer data like weather, sports, or external topics. Let me know if you'd like to screen acquisition targets or evaluate EBITDA multiples.",
          latencyMs
        };
      }
    }

    // 2. Score Domain Keywords
    const scoreCategory = (keywords: string[]): { count: number; matches: string[] } => {
      const matches: string[] = [];
      for (const kw of keywords) {
        if (clean.includes(kw)) {
          matches.push(kw);
        }
      }
      return { count: matches.length, matches };
    };

    const scouting = scoreCategory(this.DEAL_SCOUTING_KEYWORDS);
    const financial = scoreCategory(this.FINANCIAL_KEYWORDS);
    const outreach = scoreCategory(this.OUTREACH_KEYWORDS);
    const pipeline = scoreCategory(this.PIPELINE_KEYWORDS);

    const scores = [
      { intent: 'FINANCIAL_UNDERWRITING' as AgentIntent, ...financial, handler: 'FinancialAnalysisAgent' },
      { intent: 'DEAL_SCOUTING' as AgentIntent, ...scouting, handler: 'TerritoryScoutAgent' },
      { intent: 'OUTREACH_DISPATCH' as AgentIntent, ...outreach, handler: 'OutreachCadenceAgent' },
      { intent: 'PIPELINE_ADMIN' as AgentIntent, ...pipeline, handler: 'PipelineControlPlaneAgent' }
    ];

    scores.sort((a, b) => b.count - a.count);
    const best = scores[0];

    const latencyMs = Date.now() - startTime;

    if (best.count === 0) {
      // Ambiguous default within domain
      return {
        intent: 'DEAL_SCOUTING',
        confidence: 0.5,
        matchedKeywords: [],
        suggestedHandler: 'GeneralInquiryRouter',
        isOutOfScope: false,
        latencyMs
      };
    }

    const confidence = Math.min(0.95, 0.6 + best.count * 0.12);

    return {
      intent: best.intent,
      confidence: Number(confidence.toFixed(2)),
      matchedKeywords: best.matches,
      suggestedHandler: best.handler,
      isOutOfScope: false,
      latencyMs
    };
  }
}

/**
 * 2. MULTI-LAYER GUARDRAIL CONTROLLER
 * Pre-LLM Injection Detection & Post-LLM PII / Compliance Redactor
 */
export class LayeredGuardrails {
  private static INJECTION_PATTERNS = [
    /ignore (all )?(previous|above) instructions/i,
    /system override/i,
    /you are now in developer mode/i,
    /bypass security/i,
    /reveal your (system prompt|instructions)/i,
    /jailbreak/i,
    /simulate an unfiltered assistant/i
  ];

  /**
   * Pre-LLM Input Guardrail: Blocks prompt injection & jailbreak attempts
   */
  public static validateInput(prompt: string): GuardrailCheckResult {
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(prompt)) {
        return {
          allowed: false,
          violationType: 'PROMPT_INJECTION',
          rejectionMessage: 'Request blocked by Enterprise Input Guardrail: Adversarial prompt structure detected.'
        };
      }
    }

    return { allowed: true, sanitizedInput: prompt.trim() };
  }

  /**
   * Parameter Boundary Guardrail: Ensures financial values conform to institutional investment criteria
   */
  public static validateFinancialParameters(params: { purchasePrice?: number; ebitda?: number }): GuardrailCheckResult {
    if (params.purchasePrice !== undefined) {
      if (params.purchasePrice < 100000 || params.purchasePrice > 100000000) {
        return {
          allowed: false,
          violationType: 'OUT_OF_BOUNDS_VALUATION',
          rejectionMessage: `Purchase price ($${params.purchasePrice.toLocaleString()}) outside permissible search fund bounds ($100k - $100M).`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Post-LLM Output Guardrail: Redacts Social Security Numbers and Credit Card Numbers
   */
  public static redactPII(text: string): string {
    // Redact SSN: 000-00-0000
    let redacted = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');

    // Redact 16-digit Credit Card Numbers
    redacted = redacted.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED_CARD]');

    // Redact sensitive environment variables or keys
    redacted = redacted.replace(/(sk_[live|test]_[a-zA-Z0-9]{24,})/g, '[REDACTED_SECRET_KEY]');

    return redacted;
  }
}
