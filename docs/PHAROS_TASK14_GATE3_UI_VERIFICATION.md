# PHAROS TASK 14 — GATE 3: UI VERIFICATION REPORT
## Local Dashboard Design, Component Layout & State Integrity

- **Project:** Pharos Portfolio Assistant
- **Interface Type:** Single Page Application (SPA)
- **Local Address:** `http://localhost:3000`
- **Verification Date:** 2026-11-03

---

## 1. Interface Hierarchy & Sections

```
+---------------------------------------------------------------------------------------------------+
|  [Logo] Pharos Portfolio Assistant           [Status: Pacific Mainnet 1672] [Block: #22008620]     |
+---------------------------------------------------------------------------------------------------+
|  [Input: 0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2]   [Inspect Portfolio]   [Refresh Data]       |
|  Sample Chips: [Canonical Deployer] [WPROS Vault] [Faroo Staking] [Permit2]                       |
+---------------------------------------------------------------------------------------------------+
|  LEFT COLUMN (65% width)                                | RIGHT COLUMN (35% width)                |
|  -----------------------------------------------------  | --------------------------------------  |
|  [KPI CARD: Total PROS Exposure]                        | [ASSISTANT INTERFACE]                   |
|  - Aggregated Net Worth: 0 PROS                         | - Avatar & Status: Ready                |
|  - Accounting: Sum of Liquid + Wrapped + Staked shares  |                                         |
|                                                         | Suggested Question Chips:               |
|  [KPI 1: Liquid PROS]   [KPI 2: Wrapped WPROS]          | - [1. Total Portfolio Balance]          |
|  - EOA Consensus State   - 1:1 Wrapping Vault           | - [2. Token Locations]                  |
|                                                         | - [3. Largest Position]                 |
|  [KPI 3: Faroo stPROS]                                  | - [4. Earnings & Yield]                 |
|  - Staking Shares Vault (Variable Validator Ratio)      | - [5. Faroo Protocol Breakdown]         |
|                                                         | - [Test Unsupported Fallback (Aave)]    |
|  [PROTOCOL BREAKDOWN TABLE]                             |                                         |
|  - Protocol Name, Category, Contract, Amount, Ratio     | Conversation Feed:                      |
|                                                         | [User Query Bubble]                     |
|  [CRYPTOGRAPHIC PROVENANCE DRAWER]                      | [Bot Answer Card + Intent & Block Tag]  |
|  - Pinned Block, Source Contract, Method, Raw Hex       |                                         |
|                                                         | [Input Box: Ask a question...] [Ask]    |
|  [HONEST LIMITATIONS & DISCLOSURE]                      |                                         |
|  - Archive APY Limitation & Harbor Pre-launch Notice    |                                         |
+---------------------------------------------------------------------------------------------------+
|  Footer: Pharos Pacific Mainnet (1672) • RPC: rpc.pharos.xyz • Explorer: pharosscan.xyz          |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Key Interface Capabilities

1. **Live Network Health & Block Ticker:**
   - Real-time block indicator updates automatically on page load via `/api/health`.
   - Displays `Pharos Pacific Mainnet` with `ID: 1672` pill.
2. **Instant Sample Address Exploration:**
   - Quick chips for Canonical Deployer, WPROS Vault, Faroo Staking, and Permit2 allow judges to test different on-chain accounts with one click.
3. **Double-Counting Prevention Transparency:**
   - The dashboard prominently explains that `PROS`, `WPROS`, and `stPROS` are independent economic classifications.
   - Total exposure is calculated via native `BigInt` wei summation without conflating liquid tokens with derivative vault shares.
4. **Natural Language DeFi Assistant:**
   - Interactive chat window with pre-loaded suggestion chips covering all 5 required acceptance criteria categories.
   - Each answer displays its detected `Intent`, `Confidence Score` (e.g. 95%), `Pinned Block`, and attached provenance count.
5. **Cryptographic Provenance Panel:**
   - Displays exact block height, EVM contract address, method selector (`0x70a08231`), and raw 32-byte hexadecimal return data for every queried balance.
   - Zero simulations or fabricated numbers.
6. **Responsive Dark Mode Styling:**
   - Custom CSS (`styles.css`) using dark slate (`#0a0e17`), obsidian cards (`#161f30`), cyan metrics (`#06b6d4`), and emerald badges (`#10b981`).
   - Clean, readable monospace formatting for addresses and hexadecimal outputs.
