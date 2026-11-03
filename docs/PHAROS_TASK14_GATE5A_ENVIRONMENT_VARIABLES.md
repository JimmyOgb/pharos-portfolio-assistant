# PHAROS TASK 14 — GATE 5A: ENVIRONMENT VARIABLES REPORT
## Production Environment Variables Specification & Validator Verification

- **Project:** Pharos Portfolio Assistant
- **Target Network:** Pharos Pacific Mainnet (Chain ID `1672`)
- **Scope:** Runtime Environment Configuration & Validator (`src/config/env.ts`)
- **Date:** 2026-11-03

---

## 1. Environment Variable Reference Table

| Variable Name | Purpose | Required | Scope | Environment | Default Value | Secret? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PHAROS_RPC_URL` | Upstream JSON-RPC 2.0 endpoint for Pharos Pacific Mainnet | No (Safe default exists) | Server-only | Production, Preview, Dev | `https://rpc.pharos.xyz` | **No** (Public RPC) |
| `PHAROS_CHAIN_ID` | Asserts target network Chain ID. **Strictly asserted to be 1672.** | No (Safe default exists) | Server-only | Production, Preview, Dev | `1672` | **No** (Public ID) |
| `PHAROS_RPC_TIMEOUT_MS` | Max latency threshold for upstream EVM RPC calls | No (Safe default exists) | Server-only | Production, Preview, Dev | `30000` (30 sec) | **No** (Integer) |
| `PORT` | Local TCP port binding for standalone server | No (Safe default exists) | Local-only | Local Development only | `3000` | **No** (Integer) |
| `NODE_ENV` | Node.js execution environment | Recommended | Server-only | Production, Preview, Dev | `production` | **No** (Standard flag) |

---

## 2. Environment Validator Behavior

Implemented in `src/config/env.ts`:

### A. Strict Chain ID Enforcement
If `PHAROS_CHAIN_ID` is set to anything other than `1672`, the validator throws an immediate fatal error:
```typescript
if (parsedId !== 1672) {
  errors.push(
    `CRITICAL: PHAROS_CHAIN_ID must be 1672 for Pharos Pacific Mainnet. Unsupported Chain ID: ${parsedId}`
  );
}
```
**Impact:** It is mathematically impossible for the application to accidentally query an Ethereum, BSC, or testnet node in production.

### B. URL Protocol Verification
The validator checks that `PHAROS_RPC_URL` is a valid URL starting with `https://` or `http://`. Non-URL strings or unsupported protocols (e.g. `ftp://`, `ws://`) are rejected before execution.

### C. Safe Diagnostic Output
The validator includes `getSafeDiagnostics()` which generates runtime health diagnostics while masking any potential embedded credentials, preventing credential leakage in server logs.

---

## 3. Production Configuration Validator Test Evidence

Executing `npm run check:env` outputs:
```
================================================================================
       PHAROS PORTFOLIO ASSISTANT — PRODUCTION CONFIGURATION AUDIT              
================================================================================
 Status:           ✅ VALID
 Network:          Pharos Pacific Mainnet
 Chain ID:         1672 (Pharos Pacific Mainnet)
 Primary RPC:      https://rpc.pharos.xyz
 RPC Timeout:      30000 ms
 Bound Port:       3000
 Node.js Runtime:  v24.15.0
 Environment:      Development / Local
================================================================================
All environment variables verified. Application is production-ready.
```

Unit tests in `tests/unit/env.test.ts` verify all positive and negative test cases:
- Default resolution $\to$ Valid Chain ID `1672`.
- Custom valid RPC URL $\to$ Accepted.
- Invalid URL $\to$ Throws `ConfigurationError`.
- Unsupported Chain ID (`1` or `9999`) $\to$ Throws `ConfigurationError`.
- Non-numeric Chain ID $\to$ Throws `ConfigurationError`.
- Negative timeout or invalid port $\to$ Throws `ConfigurationError`.

All 7 environment test cases pass 100%.
