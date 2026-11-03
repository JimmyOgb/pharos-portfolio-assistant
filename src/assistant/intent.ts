/**
 * Deterministic Intent Parsing for Portfolio Assistant
 * Classifies natural-language questions into the 5 required acceptance criteria categories.
 * Zero paid external LLM dependencies ($0-first).
 */

export const QuestionIntent = {
  TOTAL_PORTFOLIO_VALUE: "TOTAL_PORTFOLIO_VALUE",
  TOKEN_LOCATIONS: "TOKEN_LOCATIONS",
  LARGEST_POSITION: "LARGEST_POSITION",
  EARNINGS_AND_YIELD: "EARNINGS_AND_YIELD",
  PROTOCOL_BREAKDOWN: "PROTOCOL_BREAKDOWN",
  UNKNOWN_OR_UNSUPPORTED: "UNKNOWN_OR_UNSUPPORTED",
} as const;

export type QuestionIntent = (typeof QuestionIntent)[keyof typeof QuestionIntent];

export interface IntentMatch {
  intent: QuestionIntent;
  targetProtocol?: string;
  targetToken?: string;
  confidence: number;
  reason: string;
}

export class IntentParser {
  /**
   * Parse user query into a structured intent
   */
  public static parse(query: string): IntentMatch {
    const q = query.trim().toLowerCase();

    // 1. Check for explicit unsupported protocols first (Req 04: Honest fallback)
    const unsupportedProtocols = [
      "aave",
      "compound",
      "uniswap",
      "sushiswap",
      "curve",
      "lido",
      "rocketpool",
      "maker",
      "ethena",
      "morpho",
    ];
    for (const proto of unsupportedProtocols) {
      if (q.includes(proto)) {
        return {
          intent: QuestionIntent.UNKNOWN_OR_UNSUPPORTED,
          targetProtocol: proto,
          confidence: 1.0,
          reason: `Protocol '${proto}' is not deployed or indexed on Pharos Pacific Mainnet (1672).`,
        };
      }
    }

    // 2. Earnings and Yield (Question 4)
    if (
      q.includes("earn") ||
      q.includes("earning") ||
      q.includes("yield") ||
      q.includes("apy") ||
      q.includes("apr") ||
      q.includes("reward") ||
      q.includes("rewards") ||
      q.includes("staking return")
    ) {
      return {
        intent: QuestionIntent.EARNINGS_AND_YIELD,
        confidence: 0.95,
        reason: "Matched yield/earnings pattern.",
      };
    }

    // 3. Largest Position (Question 3 - prioritized over general location)
    if (
      q.includes("biggest") ||
      q.includes("largest") ||
      q.includes("top position") ||
      q.includes("most of my money") ||
      q.includes("where is most") ||
      q.includes("highest value") ||
      q.includes("main holding") ||
      q.includes("biggest asset")
    ) {
      return {
        intent: QuestionIntent.LARGEST_POSITION,
        confidence: 0.95,
        reason: "Matched largest position pattern.",
      };
    }

    // 4. Token Locations (Question 2)
    if (
      (q.includes("where") &&
        (q.includes("pros") ||
          q.includes("wpros") ||
          q.includes("stpros") ||
          q.includes("token") ||
          q.includes("money") ||
          q.includes("asset"))) ||
      q.includes("where is") ||
      q.includes("location") ||
      q.includes("where are my") ||
      q.includes("where is my")
    ) {
      let targetToken: string | undefined = undefined;
      if (q.includes("wpros")) targetToken = "WPROS";
      else if (q.includes("stpros")) targetToken = "stPROS";
      else if (q.includes("pros")) targetToken = "PROS";

      return {
        intent: QuestionIntent.TOKEN_LOCATIONS,
        targetToken,
        confidence: 0.9,
        reason: "Matched token location pattern.",
      };
    }

    // 5. Protocol-Specific Breakdown (Question 5)
    if (
      q.includes("faroo") ||
      q.includes("stpros") ||
      q.includes("wpros") ||
      q.includes("harbor") ||
      q.includes("breakdown") ||
      q.includes("in the vault") ||
      q.includes("in faroo") ||
      q.includes("in wpros") ||
      q.includes("in harbor")
    ) {
      let targetProtocol = "Faroo Liquid Staking";
      if (q.includes("wpros")) targetProtocol = "Canonical Wrapped PROS Vault";
      if (q.includes("harbor")) targetProtocol = "Harbor Protocol";

      return {
        intent: QuestionIntent.PROTOCOL_BREAKDOWN,
        targetProtocol,
        confidence: 0.9,
        reason: `Matched protocol breakdown for '${targetProtocol}'.`,
      };
    }

    // 6. Total Portfolio Value (Question 1)
    if (
      q.includes("total") ||
      q.includes("portfolio") ||
      q.includes("balance") ||
      q.includes("balances") ||
      q.includes("net worth") ||
      q.includes("how much do i have") ||
      q.includes("what do i have") ||
      q.includes("what do i own") ||
      q.includes("what i own") ||
      q.includes("holdings") ||
      q.includes("all my positions") ||
      q.includes("overview") ||
      q.length === 0
    ) {
      return {
        intent: QuestionIntent.TOTAL_PORTFOLIO_VALUE,
        confidence: 0.85,
        reason: "Matched total portfolio value pattern.",
      };
    }

    return {
      intent: QuestionIntent.UNKNOWN_OR_UNSUPPORTED,
      confidence: 0.5,
      reason: "Query does not match any recognized Pharos DeFi portfolio pattern.",
    };
  }
}
