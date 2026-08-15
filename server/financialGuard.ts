export interface FinancialFactSnapshot {
  revenue: number;
  ebitda: number;
  isAuthoritative: boolean;
}

export interface ValidationGuardResult {
  valid: boolean;
  error?: string;
  deterministicFacts: FinancialFactSnapshot;
}

export function validateLLMOutputAgainstFinancialFacts(
  llmOutput: any,
  authoritativeFacts: FinancialFactSnapshot
): ValidationGuardResult {
  if (!authoritativeFacts || !authoritativeFacts.isAuthoritative) {
    return {
      valid: true,
      deterministicFacts: authoritativeFacts
    };
  }

  // If LLM returns valuation or deal structure, check for gross mismatch with EBITDA
  if (llmOutput && llmOutput.dealStructure && llmOutput.dealStructure.purchasePrice) {
    const rawPrice = String(llmOutput.dealStructure.purchasePrice).replace(/[^0-9.]/g, '');
    const priceNum = parseFloat(rawPrice);

    if (!isNaN(priceNum) && priceNum > 0 && authoritativeFacts.ebitda > 0) {
      const impliedMultiple = priceNum / authoritativeFacts.ebitda;
      // Sanity check: Search fund multiples for lower-middle market trade SMBs range 3.0x to 10.0x
      if (impliedMultiple > 15.0 || impliedMultiple < 1.0) {
        return {
          valid: false,
          error: `LLM generated purchase price $${priceNum.toLocaleString()} implies unrealistic EBITDA multiple ${impliedMultiple.toFixed(1)}x against authoritative EBITDA $${authoritativeFacts.ebitda.toLocaleString()}`,
          deterministicFacts: authoritativeFacts
        };
      }
    }
  }

  return {
    valid: true,
    deterministicFacts: authoritativeFacts
  };
}
