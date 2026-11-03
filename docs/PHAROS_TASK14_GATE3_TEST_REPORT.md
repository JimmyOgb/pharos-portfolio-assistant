# PHAROS TASK 14 — GATE 3: TEST REPORT
## Comprehensive Unit, Safety, Local Server & Live Mainnet Test Verification

- **Workspace:** `C:\Users\NO GO NO\PharosBuild\skills\pharos-portfolio-assistant`
- **Execution Date:** 2026-11-03
- **Test Framework:** Node.js native test runner (`node:test`, `node:assert`)
- **Total Test Suites:** 7 files
- **Unit & Local Tests:** 24 / 24 Passed (100%)
- **Live Mainnet Integration Tests:** 6 / 6 Passed (100%)
- **Overall Result:** **ALL TESTS PASSING (0 FAILURES)**

---

## 1. Unit Test Suite Results (`tests/unit/`)

Command:
```bash
node --test --experimental-strip-types tests/unit/*.test.ts
```

| Suite | Test Name | Duration | Status |
| :--- | :--- | :--- | :--- |
| `abi.test.ts` | encodeAddressParam correctly pads 40-char hex to 64 chars | 3.32 ms | **PASS** |
| `abi.test.ts` | encodeAddressParam rejects invalid address lengths | 1.21 ms | **PASS** |
| `abi.test.ts` | encodeBalanceOf produces 0x70a08231 + 64-char address | 0.75 ms | **PASS** |
| `abi.test.ts` | decodeUint256 converts 32-byte hex to BigInt | 0.37 ms | **PASS** |
| `abi.test.ts` | formatUnits handles 18 decimals accurately without floating point loss | 0.55 ms | **PASS** |
| `abi.test.ts` | parseUnits parses decimal strings to exact BigInt | 0.55 ms | **PASS** |
| `accounting.test.ts` | Double-counting prevention separates liquid, wrapped, and staked balances | 1.98 ms | **PASS** |
| `accounting.test.ts` | createProvenance records all mandatory block and contract fields | 4.94 ms | **PASS** |
| `api.test.ts` | GET /api/protocols returns supported and unsupported protocol metadata | 3.23 ms | **PASS** |
| `api.test.ts` | GET /api/portfolio rejects missing address parameter with 400 | 0.62 ms | **PASS** |
| `api.test.ts` | GET /api/portfolio rejects invalid EVM address with 400 SafetyViolation | 1.54 ms | **PASS** |
| `api.test.ts` | POST /api/ask rejects missing body or empty query with 400 | 1.50 ms | **PASS** |
| `api.test.ts` | OPTIONS preflight returns 204 with CORS headers | 2.09 ms | **PASS** |
| `intent.test.ts` | Question 1 (Total Portfolio Value) patterns | 2.56 ms | **PASS** |
| `intent.test.ts` | Question 2 (Token Locations) patterns | 0.40 ms | **PASS** |
| `intent.test.ts` | Question 3 (Largest Position) patterns | 0.31 ms | **PASS** |
| `intent.test.ts` | Question 4 (Earnings and Yield) patterns | 0.35 ms | **PASS** |
| `intent.test.ts` | Question 5 (Protocol-Specific Breakdown) patterns | 0.38 ms | **PASS** |
| `intent.test.ts` | Honest fallback rejects unsupported protocols (Req 04) | 0.52 ms | **PASS** |
| `safety.test.ts` | Address validator accepts valid 40-hex lowercase and checksum addresses | 1.72 ms | **PASS** |
| `safety.test.ts` | Address validator rejects malformed addresses and private keys | 1.15 ms | **PASS** |
| `safety.test.ts` | Method validator rejects write-capable operations | 0.52 ms | **PASS** |
| `safety.test.ts` | Method validator permits read-only operations | 0.70 ms | **PASS** |

---

## 2. Local Server Integration Test (`tests/integration/server.test.ts`)

Command:
```bash
node --test --experimental-strip-types tests/integration/server.test.ts
```

| Suite | Test Name | Duration | Status |
| :--- | :--- | :--- | :--- |
| `server.test.ts` | Serves HTML, CSS, JS, and API routes on local ephemeral port | 100.80 ms | **PASS** |

---

## 3. Live Pacific Mainnet Integration Tests (`tests/integration/`)

Commands:
```bash
node --test --experimental-strip-types tests/integration/live_rpc.test.ts
node --test --experimental-strip-types tests/integration/api_live.test.ts
```

| Suite | Test Name | Duration | Status |
| :--- | :--- | :--- | :--- |
| `live_rpc.test.ts` | Verify Pacific Mainnet Chain ID (1672) | 8,172.92 ms | **PASS** |
| `live_rpc.test.ts` | Verify Latest Block Height on Pacific Mainnet (>22M) | 7,899.34 ms | **PASS** |
| `live_rpc.test.ts` | Verify WPROS Deployed Bytecode and Metadata | 52,979.02 ms | **PASS** |
| `live_rpc.test.ts` | Verify Faroo stPROS Deployed Bytecode and Metadata | 45,281.99 ms | **PASS** |
| `live_rpc.test.ts` | Full Block-Pinned Assistant Query for Canonical Deployer | 28,790.75 ms | **PASS** |
| `api_live.test.ts` | Full End-to-End Suite against Pharos Pacific Mainnet (Health, Portfolio & 6 Question Intents) | 36,367.57 ms | **PASS** |

---

## 4. Test Summary Statistics

- **Total Test Assertions:** > 60 assertions
- **Overall Pass Rate:** 100.0%
- **Failures / Crashes:** 0
- **Skipped / Cancelled:** 0
- **Verdict:** **FULL PASS**
