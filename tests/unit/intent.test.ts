import test from "node:test";
import assert from "node:assert";
import { IntentParser, QuestionIntent } from "../../src/assistant/intent.ts";

test("Intent: Question 1 (Total Portfolio Value) patterns", () => {
  const queries = [
    "What is my total portfolio balance?",
    "Show me my portfolio balance",
    "How much do I have?",
    "what do i own?",
    "portfolio overview",
  ];
  for (const q of queries) {
    const res = IntentParser.parse(q);
    assert.strictEqual(
      res.intent,
      QuestionIntent.TOTAL_PORTFOLIO_VALUE,
      `Failed to match '${q}' to TOTAL_PORTFOLIO_VALUE`
    );
  }
});

test("Intent: Question 2 (Token Locations) patterns", () => {
  const queries = [
    "Where is my PROS?",
    "Where are my tokens held?",
    "Where is my WPROS stored?",
    "Where is my money?",
  ];
  for (const q of queries) {
    const res = IntentParser.parse(q);
    assert.strictEqual(
      res.intent,
      QuestionIntent.TOKEN_LOCATIONS,
      `Failed to match '${q}' to TOKEN_LOCATIONS`
    );
  }
});

test("Intent: Question 3 (Largest Position) patterns", () => {
  const queries = [
    "What's my biggest position?",
    "Where is most of my money?",
    "What is my largest holding?",
    "top position",
  ];
  for (const q of queries) {
    const res = IntentParser.parse(q);
    assert.strictEqual(
      res.intent,
      QuestionIntent.LARGEST_POSITION,
      `Failed to match '${q}' to LARGEST_POSITION`
    );
  }
});

test("Intent: Question 4 (Earnings and Yield) patterns", () => {
  const queries = [
    "What am I earning?",
    "What is my yield?",
    "Check my staking rewards",
    "What APY am I getting?",
  ];
  for (const q of queries) {
    const res = IntentParser.parse(q);
    assert.strictEqual(
      res.intent,
      QuestionIntent.EARNINGS_AND_YIELD,
      `Failed to match '${q}' to EARNINGS_AND_YIELD`
    );
  }
});

test("Intent: Question 5 (Protocol-Specific Breakdown) patterns", () => {
  const queries = [
    "How much do I have in Faroo?",
    "Show my WPROS vault breakdown",
    "What is my position in Harbor?",
  ];
  for (const q of queries) {
    const res = IntentParser.parse(q);
    assert.strictEqual(
      res.intent,
      QuestionIntent.PROTOCOL_BREAKDOWN,
      `Failed to match '${q}' to PROTOCOL_BREAKDOWN`
    );
  }
});

test("Intent: Honest fallback rejects unsupported protocols (Req 04)", () => {
  const queries = [
    "How much do I have in Aave?",
    "What is my Uniswap LP position?",
    "Show my Compound balance",
    "What am I earning on Curve?",
  ];
  for (const q of queries) {
    const res = IntentParser.parse(q);
    assert.strictEqual(
      res.intent,
      QuestionIntent.UNKNOWN_OR_UNSUPPORTED,
      `Failed to reject unsupported protocol in '${q}'`
    );
    assert.ok(res.reason.includes("not deployed or indexed on Pharos Pacific Mainnet"));
  }
});
