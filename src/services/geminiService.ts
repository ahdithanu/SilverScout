import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { Lead } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const analyzeLeads = async (
  leads: Lead[], 
  feedbackExamples: any[] = [], 
  industryMultiples: Record<string, number> = {},
  valuationParameters: any = {},
  userLocation?: { latitude: number, longitude: number },
  useThinkingMode: boolean = false,
  customSystemPrompt?: string,
  useFastMode: boolean = false
): Promise<{ results: Partial<Lead>[], groundingSources: any[] }> => {
  let model = "gemini-2.5-flash";
  if (useThinkingMode) {
    model = "gemini-3.1-pro-preview";
  } else if (useFastMode) {
    model = "gemini-3.1-flash-lite-preview";
  }
  
  const feedbackContext = feedbackExamples.length > 0 
    ? `\n\nPrevious feedback from the user to help you refine your analysis:\n${feedbackExamples.map(f => `- Thesis: "${f.thesis}"\n  Rating: ${f.rating}/5\n  User Comment: ${f.comment || 'None'}`).join('\n')}`
    : '';

  const multiplesContext = Object.keys(industryMultiples).length > 0
    ? `\n\nUser-defined EBITDA multiples for valuation estimates:\n${Object.entries(industryMultiples).map(([industry, multiple]) => `- ${industry}: ${multiple}x`).join('\n')}`
    : '';

  const paramsContext = Object.keys(valuationParameters).length > 0
    ? `\n\nCustom valuation parameters:\n${
        valuationParameters.defaultProfitMargin ? `- Default Profit Margin: ${valuationParameters.defaultProfitMargin}%\n` : ''
      }${
        valuationParameters.revenueTiers?.length > 0 
          ? `- Revenue Tiers (Revenue Range -> Multiplier):\n${valuationParameters.revenueTiers.map((t: any) => `  * $${t.min.toLocaleString()} - $${t.max.toLocaleString()}: ${t.multiplier}x`).join('\n')}\n`
          : ''
      }${
        valuationParameters.profitMarginTiers?.length > 0 
          ? `- Profit Margin Tiers (Margin Range -> Multiplier Adjustment):\n${valuationParameters.profitMarginTiers.map((t: any) => `  * ${t.min}% - ${t.max}%: ${t.multiplier > 0 ? '+' : ''}${t.multiplier}x`).join('\n')}\n`
          : ''
      }${
        valuationParameters.locationMultipliers && Object.keys(valuationParameters.locationMultipliers).length > 0
          ? `- Location Multipliers (Location -> Multiplier Adjustment):\n${Object.entries(valuationParameters.locationMultipliers).map(([loc, mult]) => `  * ${loc}: ${(mult as number) > 0 ? '+' : ''}${mult}x`).join('\n')}\n`
          : ''
      }${
        valuationParameters.ageMultipliers?.length > 0 
          ? `- Business Age Multipliers (Min Years -> Multiplier Adjustment):\n${valuationParameters.ageMultipliers.map((t: any) => `  * ${t.minYears}+ years: ${(t.multiplier as number) > 0 ? '+' : ''}${t.multiplier}x`).join('\n')}\n`
          : ''
      }${
        valuationParameters.customValuationRules?.length > 0 
          ? `- Custom Valuation Rules:\n${valuationParameters.customValuationRules.map((r: string) => `  * ${r}`).join('\n')}`
          : ''
      }`
    : '';

  const defaultSystemPrompt = `
    Review these business profiles for "Owner Fatigue" and "Exit Propensity".
    Use Google Search and Google Maps to find recent news, digital activity, reviews, nearby competitors, and changes in ownership for these businesses to get the most up-to-date information.
    
    Rank them 1-10 on 'exitPropensityScore' based on:
    - Business Age (older = higher score)
    - Agent Type (individual = higher score)
    - Permit Volume Drop (30%+ drop = higher score)
    - Digital Presence (stagnant/old posts = higher score)
    - Review Velocity (declining = higher score)
    - Recent News/Activity (e.g., recent lawsuits, retirement announcements, or lack of recent activity)
    - Local Competition (increasing competition = higher score)
    - Customer Sentiment (declining reviews on Google Maps = higher score)

    For each lead, provide:
    1. exitPropensityScore (1-10)
    2. aiThesis (A concise, senior PE associate level thesis, incorporating any recent findings from search and maps. If the lead has provided revenue, EBITDA, or profit margin data, use it to justify your thesis. Explicitly mention how you applied the custom valuation parameters if applicable.)
    3. valuationEstimate (Estimated business value in USD. If the lead has provided revenue, EBITDA, or profit margin data, use it as the primary basis for valuation. Apply the provided EBITDA multiples and valuation parameters (revenue tiers, margin adjustments, location/age multipliers) to this data. If data is missing, estimate it from search and maps findings.)
    4. permitAnalysis (A brief analysis of the business permit data. Specifically, look at 'permitVolume2023_2025', 'permitVolume2026', and 'permitDrop'. If the 'permitDrop' is over 30%, flag the lead as 'high-risk' or indicating significant owner fatigue. Explain the implications of this drop for the business's operational health.)
  `;

  const systemInstruction = (customSystemPrompt || defaultSystemPrompt) + `
    Return a JSON array of objects with 'id', 'exitPropensityScore', 'aiThesis', 'valuationEstimate', and 'permitAnalysis'.
    IMPORTANT: Return ONLY the JSON array, no other text.
  `;

  const prompt = `
    ${feedbackContext}
    ${multiplesContext}
    ${paramsContext}

    Data:
    ${JSON.stringify(leads)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        thinkingConfig: useThinkingMode ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
        toolConfig: userLocation ? {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          }
        } : undefined
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    // Extract JSON from response (it might be wrapped in markdown or have extra text)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const results = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    
    // Extract grounding sources
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { results, groundingSources };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateSubjectLines = async (lead: Lead): Promise<string[]> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate 3 distinct, high-converting email subject lines for an outreach email to a business owner.
    The goal is a business acquisition conversation.
    
    Lead Context:
    - Business Name: ${lead.name}
    - Industry: ${lead.industry}
    - AI Thesis: ${lead.aiThesis}
    
    Guidelines:
    - Keep them professional but intriguing.
    - One should be direct (e.g., "Acquisition inquiry for ${lead.name}").
    - One should be value-driven (e.g., "Future of ${lead.name}").
    - One should be personalized based on the thesis.
    
    Return a JSON array of 3 strings.
    IMPORTANT: Return ONLY the JSON array, no other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Subject Line Error:", error);
    throw error;
  }
};

export const searchBusinessesByCity = async (city: string): Promise<Partial<Lead>[]> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Find a list of 10-15 traditional, established businesses in ${city} that might be candidates for acquisition.
    Focus on industries like Manufacturing, HVAC, Plumbing, Landscaping, Tool & Die, or local service businesses.
    Use Google Search and Google Maps to find real, active businesses.
    
    For each business, provide:
    1. name (Business Name)
    2. industry (e.g., Manufacturing, HVAC, etc.)
    3. location (City, State)
    4. registrationDate (Estimate based on web presence, format YYYY-MM-DD)
    5. agentName (Owner or manager name if available)
    6. isCorporateAgent (boolean, true if it's a large corporation, false if it's a local/family business)
    7. lastDigitalPostDate (Date of last social media post or news, format YYYY-MM-DD)
    8. reviewVelocity (Estimate 0.1 to 5.0 reviews per month)
    9. permitVolume2023_2025 (Estimate total permits in last 3 years, 0-100)
    10. permitVolume2026 (Estimate permits in current year, 0-20)
    11. permitDrop (Percentage drop from previous years, 0-100)
    
    Return a JSON array of objects with these fields.
    IMPORTANT: Return ONLY the JSON array, no other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const results = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    
    return results;
  } catch (error) {
    console.error("Gemini City Search Error:", error);
    throw error;
  }
};

export const generateOutreachLetter = async (
  lead: Lead, 
  templateType: string = 'direct_acquisition'
): Promise<{ subject: string; letterBody: string }> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are a professional Private Equity Principal writing a personal, confidential outreach letter to a business owner.
    
    Business Details:
    - Business Name: ${lead.name}
    - Industry: ${lead.industry}
    - Location: ${lead.location}
    - Owner/Agent Name: ${lead.agentName || 'Business Owner'}
    - Permit Volume Drop: ${lead.permitDrop}%
    - Valuation Estimate: $${(lead.valuationEstimate || 0).toLocaleString()}
    - AI Thesis: ${lead.aiThesis || 'Established local business with growth potential'}
    - Template Strategy: ${templateType} (options: direct_acquisition, confidential_inquiry, strategic_partnership)

    Draft a personalized, high-converting outreach letter (and subject line) to the owner.
    Keep the tone respectful, appreciative of their legacy, highly professional, and low-pressure.
    Acknowledge their work in ${lead.industry} in ${lead.location}. Do NOT sound like spam or generic template.
    
    Return a JSON object with two fields:
    - "subject": A compelling subject line
    - "letterBody": The full body text of the letter/email (formatted cleanly with line breaks)

    IMPORTANT: Return ONLY the JSON object, no other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Letter Generation Error:", error);
    throw error;
  }
};

export interface ICMemoData {
  dealSummary: string;
  executiveSummary: string;
  investmentHighlights: string[];
  keyRisks: { risk: string; mitigation: string }[];
  financialOverview: {
    estimatedRevenue: string;
    estimatedEbitda: string;
    impliedMultiple: string;
    valuationRange: string;
  };
  dealStructure: {
    recommendedPrice: string;
    upfrontCash: string;
    sellerNote: string;
    earnout: string;
  };
  nextSteps: string[];
}

export const generateICMemo = async (lead: Lead): Promise<ICMemoData> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are a Senior Principal at a top Private Equity firm preparing a 1-Page Investment Committee (IC) Deal Teaser & Executive Memo for an acquisition target.

    Business Details:
    - Name: ${lead.name}
    - Industry: ${lead.industry}
    - Location: ${lead.location}
    - Owner/Agent: ${lead.agentName || 'Individual Owner'}
    - Registration Date: ${lead.registrationDate}
    - Permit Volume Drop: ${lead.permitDrop}%
    - Exit Propensity Score: ${lead.exitPropensityScore || 'N/A'}/10
    - Valuation Estimate: $${(lead.valuationEstimate || 0).toLocaleString()}
    - Revenue: ${lead.revenue ? `$${lead.revenue.toLocaleString()}` : 'Estimated from market benchmarks'}
    - EBITDA: ${lead.ebitda ? `$${lead.ebitda.toLocaleString()}` : 'Estimated from market benchmarks'}
    - Existing AI Thesis: ${lead.aiThesis || 'Established local business candidate for acquisition'}
    - Permit Analysis: ${lead.permitAnalysis || 'Standard permit activity'}

    Generate a highly analytical, professional 1-Page Investment Committee Teaser Memo.
    
    Return a JSON object with the following fields:
    - "dealSummary": A 2-sentence high-level summary of the opportunity.
    - "executiveSummary": A 1-paragraph investment rationale explaining why this target represents a strong buyout opportunity (incorporating owner fatigue, permit drop, and market position).
    - "investmentHighlights": Array of 4 concise bullet points detailing key growth levers & value creation opportunities.
    - "keyRisks": Array of 3 objects with "risk" and "mitigation" fields (e.g. key person dependency, permit volume drop, digital stagnation).
    - "financialOverview": Object with fields "estimatedRevenue", "estimatedEbitda", "impliedMultiple", "valuationRange".
    - "dealStructure": Object with fields "recommendedPrice", "upfrontCash", "sellerNote", "earnout".
    - "nextSteps": Array of 3 immediate diligence & outreach steps.

    IMPORTANT: Return ONLY the JSON object, no other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini IC Memo Error:", error);
    throw error;
  }
};

export interface LOITerms {
  purchasePrice: number;
  upfrontCash: number;
  sellerNote: number;
  earnoutAmount: number;
  rolloverEquityPercent: number;
  workingCapitalPeg: number;
  exclusivityDays: number;
}

export const generateLOIDocument = async (
  lead: Lead, 
  terms: LOITerms
): Promise<{ title: string; loiBody: string }> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are a Private Equity Partner drafting a formal non-binding Letter of Intent (LOI) to acquire a business.

    Target Details:
    - Business Name: ${lead.name}
    - Industry: ${lead.industry}
    - Location: ${lead.location}
    - Seller/Owner Name: ${lead.agentName || 'Business Owner'}

    Proposed Acquisition Terms:
    - Total Purchase Price: $${terms.purchasePrice.toLocaleString()}
    - Upfront Cash at Closing: $${terms.upfrontCash.toLocaleString()}
    - Seller Financing Note: $${terms.sellerNote.toLocaleString()}
    - Contingent Earnout: $${terms.earnoutAmount.toLocaleString()}
    - Rollover Equity Retention: ${terms.rolloverEquityPercent}%
    - Working Capital Peg: $${terms.workingCapitalPeg.toLocaleString()}
    - Exclusivity Period: ${terms.exclusivityDays} Days

    Draft a formal, professional non-binding Letter of Intent (LOI). Include standard M&A legal structure clauses:
    1. Purchase Price & Consideration Breakdown
    2. Net Working Capital Adjustment
    3. Due Diligence Access & Quality of Earnings (QofE)
    4. Exclusivity & Confidentiality
    5. Conditions Precedent to Closing
    6. Formal Signature Blocks for Buyer & Seller

    Return a JSON object with:
    - "title": A formal document title (e.g. "LETTER OF INTENT: ACQUISITION OF ${lead.name.toUpperCase()}")
    - "loiBody": The complete text of the LOI in clean Markdown format with numbered clauses.

    IMPORTANT: Return ONLY the JSON object, no other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini LOI Generation Error:", error);
    throw error;
  }
};

export interface ExtractedFinancials {
  revenue: number;
  costOfGoods?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  netIncome: number;
  ebitda: number;
  profitMargin: number;
  suggestedAddBacks: { name: string; amount: number; rationale: string }[];
  confidenceScore: number;
}

export const parseFinancialDocument = async (
  fileBase64: string,
  mimeType: string
): Promise<ExtractedFinancials> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are a Certified M&A Quality of Earnings (QofE) Auditor and Senior Financial Analyst.
    Analyze the attached P&L statement, Tax Return, or Financial Document image/file.

    Extract the following financial metrics:
    1. revenue (Total Gross Revenue / Sales in USD, number)
    2. costOfGoods (Cost of Goods Sold if present, number)
    3. grossProfit (Gross Profit if present, number)
    4. operatingExpenses (Total Operating Expenses if present, number)
    5. netIncome (Net Income / Profit in USD, number)
    6. ebitda (Earnings Before Interest, Taxes, Depreciation, Amortization in USD, number)
    7. profitMargin (Net Profit Margin %, number)
    8. suggestedAddBacks (Array of objects with "name", "amount", and "rationale" for owner discretionary expenses e.g. owner salary, personal auto, non-recurring fees)
    9. confidenceScore (0-100 score indicating document readability & extraction confidence)

    Return a JSON object with these fields.
    IMPORTANT: Return ONLY the JSON object, no other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            data: fileBase64,
            mimeType: mimeType
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Financial Document Parsing Error:", error);
    throw error;
  }
};

export interface DigitalHealthScan {
  domainStatus: string;
  googleProfileStatus: string;
  sslStatus: string;
  ownerVerifiedEmail?: string;
  ownerVerifiedPhone?: string;
  digitalFatigueScore: number;
  summary: string;
}

export const scanDigitalHealthSignals = async (lead: Lead): Promise<DigitalHealthScan> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Conduct a real-time digital health & owner contact audit for the following business target:
    - Name: ${lead.name}
    - Industry: ${lead.industry}
    - Location: ${lead.location}
    - Owner/Agent: ${lead.agentName || 'Owner'}

    Use Google Search and Google Maps tools to find:
    1. Official website domain status & expiration signals
    2. Google Business Profile claim status (Claimed vs Unclaimed)
    3. Website SSL & mobile responsiveness signals
    4. Owner contact info (verifiable owner email & phone number)
    5. Digital fatigue score (1-10 rating, where 10 = severe digital stagnation)

    Return a JSON object with:
    - "domainStatus": e.g. "Active (Expiring in 60 days - High Stagnation Risk)"
    - "googleProfileStatus": e.g. "Unclaimed Business Profile"
    - "sslStatus": e.g. "Missing SSL / Outdated Legacy Website"
    - "ownerVerifiedEmail": e.g. "owner@businessname.com" or null
    - "ownerVerifiedPhone": e.g. "(555) 234-5678" or null
    - "digitalFatigueScore": number 1-10
    - "summary": 2-sentence summary of digital presence & contact findings.

    IMPORTANT: Return ONLY the JSON object, no other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    return result;
  } catch (error) {
    console.error("Gemini Digital Health Scan Error:", error);
    throw error;
  }
};

export interface OutreachSequence {
  touch1_DirectMail: { subject: string; body: string };
  touch2_ColdEmail: { subject: string; body: string };
  touch3_PhoneScript: { subject: string; body: string };
}

export const generateOutreachSequence = async (lead: Lead): Promise<OutreachSequence> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are an M&A Deal Sourcing Lead drafting a 30-day 3-touch outreach sequence to a business owner.

    Target Details:
    - Business: ${lead.name}
    - Industry: ${lead.industry}
    - Location: ${lead.location}
    - Owner Name: ${lead.agentName || 'Business Owner'}

    Generate a 3-touch multi-channel sequence:
    - "touch1_DirectMail": Direct mail physical letter (Warm, respectful, confidential succession offer).
    - "touch2_ColdEmail": Cold email sent 7 days later (Referencing the direct mail, concise, high response rate).
    - "touch3_PhoneScript": Phone call script & voicemail drop for 14 days later (Natural, low-pressure, conversational).

    Return a JSON object with:
    - touch1_DirectMail: { subject: string, body: string }
    - touch2_ColdEmail: { subject: string, body: string }
    - touch3_PhoneScript: { subject: string, body: string }

    IMPORTANT: Return ONLY the JSON object, no other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Outreach Sequence Error:", error);
    throw error;
  }
};




