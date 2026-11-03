# PHAROS TASK 14 — GATE 3: API REPORT
## Server-Side REST Route Specifications & Verification

- **Target Network:** Pharos Pacific Mainnet (Chain ID `1672`, `0x688`)
- **Base URL:** `http://localhost:3000`
- **Security:** Read-Only, Keyless, Input-Validated, Zero Gas

---

## 1. Route Reference

### A. Health & Network Check
- **Endpoint:** `GET /api/health`
- **Description:** Verifies RPC connectivity, connected chain ID (asserts 1672), and current block height.
- **Sample Response:**
```json
{
  "status": "ok",
  "network": "Pharos Pacific Mainnet",
  "chainId": 1672,
  "blockHeight": 22008620,
  "readOnly": true,
  "primaryRpc": "https://rpc.pharos.xyz",
  "contracts": {
    "MULTICALL3": "0xcA11bde05977b3631167028862bE2a173976CA11",
    "WPROS": "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0",
    "FAROO_STPROS": "0x6b0A44c64190279f7034b77c13a566E914FE5Ec4",
    "PERMIT2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    "CANONICAL_DEPLOYER": "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2"
  }
}
```

---

### B. Portfolio Query
- **Endpoint:** `GET /api/portfolio?address={0xAddress}&block={optionalBlock}`
- **Description:** Validates address format, performs block-pinned reads across Native PROS, WPROS Vault, and Faroo stPROS, and returns full accounting and provenance.
- **Query Parameters:**
  - `address` (required): 40-character hexadecimal EVM address.
  - `block` (optional): Pinned integer block number.
- **Sample Request:** `GET /api/portfolio?address=0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2`
- **Sample Response:**
```json
{
  "walletAddress": "0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2",
  "observedBlockNumber": 22008552,
  "observedAtUtc": "2026-11-03T11:24:14.921Z",
  "positions": [
    {
      "protocolId": "native-pros",
      "protocolName": "Native PROS Account",
      "assetSymbol": "PROS",
      "assetName": "Pharos Native Token",
      "rawAmount": "0",
      "formattedAmount": "0",
      "decimals": 18,
      "locationType": "LIQUID_WALLET",
      "underlyingAssetSymbol": "PROS",
      "underlyingEquivalentRatio": "1.0",
      "provenance": {
        "chainId": 1672,
        "networkName": "Pharos Pacific Mainnet",
        "sourceContract": "NATIVE_CONSENSUS_BALANCE",
        "sourceContractName": "Layer-1 Consensus State",
        "methodCalled": "eth_getBalance(address)",
        "selector": "consensus_state",
        "blockNumber": 22008552,
        "observedAtUtc": "2026-11-03T11:24:14.920Z",
        "rawHex": "0x0"
      }
    },
    {
      "protocolId": "canonical-wrapped-pros",
      "protocolName": "Canonical Wrapped PROS Vault",
      "assetSymbol": "WPROS",
      "assetName": "Wrapped PROS",
      "rawAmount": "0",
      "formattedAmount": "0",
      "decimals": 18,
      "locationType": "CANONICAL_WRAPPING_VAULT",
      "underlyingAssetSymbol": "PROS",
      "underlyingEquivalentRatio": "1.0",
      "provenance": {
        "chainId": 1672,
        "networkName": "Pharos Pacific Mainnet",
        "sourceContract": "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0",
        "sourceContractName": "WPROS",
        "methodCalled": "balanceOf(address)",
        "selector": "0x70a08231",
        "blockNumber": 22008552,
        "observedAtUtc": "2026-11-03T11:24:14.921Z",
        "rawHex": "0x0000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "protocolId": "faroo-liquid-staking",
      "protocolName": "Faroo Liquid Staking Vault",
      "assetSymbol": "stPROS",
      "assetName": "Faroo Staked PROS",
      "rawAmount": "0",
      "formattedAmount": "0",
      "decimals": 18,
      "locationType": "LIQUID_STAKING_VAULT",
      "underlyingAssetSymbol": "PROS",
      "underlyingEquivalentRatio": "Variable (Liquid Staking Exchange Rate)",
      "provenance": {
        "chainId": 1672,
        "networkName": "Pharos Pacific Mainnet",
        "sourceContract": "0x6b0A44c64190279f7034b77c13a566E914FE5Ec4",
        "sourceContractName": "Faroo stPROS",
        "methodCalled": "balanceOf(address)",
        "selector": "0x70a08231",
        "blockNumber": 22008552,
        "observedAtUtc": "2026-11-03T11:24:14.921Z",
        "rawHex": "0x0000000000000000000000000000000000000000000000000000000000000000"
      }
    }
  ],
  "accounting": {
    "liquidNativePros": "0",
    "wrappedVaultPros": "0",
    "stakedVaultProsShares": "0",
    "totalProsExposure": "0",
    "totalPositionsCount": 0,
    "explanation": "Liquid PROS, wrapped WPROS, and staked stPROS are stored as distinct asset categories. Total PROS exposure sums equivalent values without conflating vault shares with wallet cash."
  },
  "unavailableOrUnindexed": {
    "historicalYield": "Historical yield and APY require an indexed archive event log. Live queries report real-time current balances and vault reserves with verifiable block provenance.",
    "unsupportedProtocols": [
      "Harbor Protocol (Pre-launch / No mainnet contract)",
      "Uniswap / SushiSwap / Curve (Not deployed on Pharos Pacific Mainnet)"
    ]
  }
}
```

---

### C. Natural-Language Question Answering
- **Endpoint:** `POST /api/ask`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "address": "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2",
  "query": "Where is my money held?",
  "block": 22008552
}
```
- **Sample Response:**
```json
{
  "query": "Where is my money held?",
  "intent": "TOKEN_LOCATIONS",
  "confidence": 0.9,
  "walletAddress": "0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2",
  "blockNumber": 22008552,
  "answerText": "📍 **Token Locations & Protocol Allocations for 0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2:**\n- **PROS (Pharos Native Token):** 0 PROS held at `LIQUID_WALLET` (Layer-1 Consensus State - NATIVE_CONSENSUS_BALANCE)\n- **WPROS (Wrapped PROS):** 0 WPROS held at `CANONICAL_WRAPPING_VAULT` (WPROS - 0x52C48d4213107b20bC583832b0d951FB9CA8F0B0)\n- **stPROS (Faroo Staked PROS):** 0 stPROS held at `LIQUID_STAKING_VAULT` (Faroo stPROS - 0x6b0A44c64190279f7034b77c13a566E914FE5Ec4)\n\n*Verified at Pacific Mainnet block #22008552.*",
  "provenanceList": [
    {
      "target": "PROS",
      "contractAddress": "NATIVE_CONSENSUS_BALANCE",
      "method": "eth_getBalance(address)",
      "blockNumber": 22008552
    },
    {
      "target": "WPROS",
      "contractAddress": "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0",
      "method": "balanceOf(address)",
      "blockNumber": 22008552
    },
    {
      "target": "stPROS",
      "contractAddress": "0x6b0A44c64190279f7034b77c13a566E914FE5Ec4",
      "method": "balanceOf(address)",
      "blockNumber": 22008552
    }
  ]
}
```

---

### D. Protocol Metadata
- **Endpoint:** `GET /api/protocols`
- **Description:** Returns the active supported and unsupported protocols with rationale.
- **Status:** 200 OK.

---

## 2. Input Validation & Error Handling

| Scenario | HTTP Status | Response Payload |
| :--- | :--- | :--- |
| Missing `address` parameter on `/api/portfolio` | 400 Bad Request | `{"error": "Missing required query parameter: 'address'..."}` |
| Invalid 0x address format (e.g. `0x123`) | 400 Bad Request | `{"error": "Invalid EVM address format: '0x123'", "type": "SafetyViolation"}` |
| Empty query string on `/api/ask` | 400 Bad Request | `{"error": "Query string cannot be empty."}` |
| Write method or state mutation attempted | 400 Bad Request | `{"error": "SAFETY REJECTION...", "type": "SafetyViolation"}` |
| Disallowed / nonexistent endpoint | 404 Not Found | `{"error": "Not Found: /path"}` |
| Network / upstream RPC error | 500 / 502 | Clean JSON error string without leaking internals |
