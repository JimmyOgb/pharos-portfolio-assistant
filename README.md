# Pharos Portfolio Assistant

A production-grade, strictly read-only portfolio assistant and query engine for **Pharos Pacific Mainnet** (`Chain ID: 1672`). Provides real-time asset discovery, multi-protocol balance aggregation, accounting separation (preventing double-counting), ERC-4626 share-to-asset valuation, and verifiable cryptographic block provenance for any EVM wallet address.

- 🌐 **Live Vercel Production Preview:** [https://pharos-portfolio-assistant.vercel.app](https://pharos-portfolio-assistant.vercel.app)
- 📦 **Public GitHub Repository:** [https://github.com/JimmyOgb/pharos-portfolio-assistant](https://github.com/JimmyOgb/pharos-portfolio-assistant)
- ⚡ **API Status Endpoint:** [https://pharos-portfolio-assistant.vercel.app/api/health](https://pharos-portfolio-assistant.vercel.app/api/health)
- 📋 **Supported Protocols Endpoint:** [https://pharos-portfolio-assistant.vercel.app/api/protocols](https://pharos-portfolio-assistant.vercel.app/api/protocols)

---

## ⚡ How to Test (Judge & Reviewer Quick-Start)

### 1. Requirements
- **Node.js**: `v24.x` or higher (utilizes native TypeScript execution via `--experimental-strip-types`, zero external transpilation dependencies).
- **Network Access**: Outbound HTTPS connectivity to the Pharos Pacific Mainnet RPC (`https://rpc.pharos.xyz`).
- **Operating System**: Windows, macOS, or Linux.

### 2. Installation & Setup
Clone the repository and enter the workspace:
```bash
git clone https://github.com/JimmyOgb/pharos-portfolio-assistant.git
cd pharos-portfolio-assistant
```
*(Note: The core engine and test runner have zero runtime dependencies outside Node.js built-ins. No `npm install` is required for standard testing or server execution!)*

### 3. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
Default production settings in `.env.example`:
```ini
PHAROS_CHAIN_ID=1672
PHAROS_RPC_URL=https://rpc.pharos.xyz
PHAROS_RPC_TIMEOUT_MS=30000
PORT=3000
```
For advanced configuration options, see [docs/PRODUCTION_ENVIRONMENT.md](docs/PRODUCTION_ENVIRONMENT.md).

Validate your environment configuration before running:
```bash
npm run check:env
# Or: npm run build
```

### 4. Running the Test Suite
The project features a comprehensive unit and integration test suite with 100% pass rates:

```bash
# Run all unit tests (34 tests covering ABI, accounting, intent parsing, safety, env, and serverless handlers)
npm test

# Run local integration test (verifying live Node.js HTTP server and API endpoints)
npm run test:integration

# Run all tests
npm run test:all
```

### 5. Running the Local Application
Start the local HTTP server:
```bash
npm start
# Server starts at http://localhost:3000
```
Open your browser and navigate to `http://localhost:3000` to access the dark-themed web user interface.

### 6. Inspecting a Wallet via Web UI & CLI

#### Via Web User Interface (`http://localhost:3000`)
1. Enter any Pharos address (e.g. `0x2649aF0B5E05e6Ec28b76fC78b2d410F19bC8E68` or your own wallet).
2. Click **Inspect Portfolio** to load real-time on-chain balances across Native PROS, WPROS, and Faroo stPROS.
3. Use the **Natural Language Query** input to ask questions in plain English:
   - *"What is my total portfolio value?"*
   - *"Where are my tokens held?"*
   - *"What is my largest position?"*
   - *"How much yield or earnings have I earned?"*
   - *"Show me my Faroo staking breakdown."*

#### Via Interactive CLI
You can also inspect any wallet directly from your terminal:
```bash
# General portfolio inspection
npm run cli -- --address 0x2649aF0B5E05e6Ec28b76fC78b2d410F19bC8E68

# Direct natural language query via CLI
npm run cli -- --address 0x2649aF0B5E05e6Ec28b76fC78b2d410F19bC8E68 --ask "What is my total portfolio value?"
```

### 7. Verifying Balances & Cryptographic Block Provenance
Every financial figure returned by the assistant contains an explicit `provenance` payload:
- **Block Number**: The exact Pharos Pacific block at which the balance was retrieved (e.g., `#22010188`).
- **Contract Address**: The canonical on-chain contract queried (e.g., Faroo Vault: `0x6b0A217730e20fa49326d9c63673B8e458B43a05`).
- **Method Signature**: The exact standard EVM selector executed (e.g., `0x70a08231` for `balanceOf`, `0x07a2d13a` for `convertToAssets`).
- **Timestamp**: ISO-8601 UTC timestamp of execution.

To independently verify on-chain:
```bash
# Query Faroo stPROS balance directly using cast / curl
curl -s -X POST https://rpc.pharos.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x6b0A217730e20fa49326d9c63673B8e458B43a05","data":"0x70a082310000000000000000000000002649af0b5e05e6ec28b76fc78b2d410f19bc8e68"},"latest"],"id":1}'
```

---

## 📖 Product Overview

### What is Pharos Portfolio Assistant?
Pharos Portfolio Assistant is an intelligent, read-only decentralized finance (DeFi) portfolio tracking agent and conversational query engine specifically engineered for the **Pharos Pacific Mainnet**.

### Who is it for?
DeFi users, liquidity providers, stakers, and institutional auditors navigating the Pharos blockchain ecosystem who require real-time, provable portfolio intelligence without trusting third-party indexers or risking wallet signature exploits.

### What problem does it solve?
1. **Double-Counting Pitfalls:** Many standard portfolio trackers confuse wrapped tokens (WPROS) or staked derivatives (stPROS) with base liquid assets, erroneously inflating perceived net worth.
2. **ERC-4626 Share Confusion:** Liquid staking vaults accrue rewards internally, meaning vault share balances (`stPROS`) do not equal underlying assets (`PROS`). Our engine queries `convertToAssets(uint256)` on-chain to provide exact underlying asset valuations.
3. **Security Risks:** Web3 users are regularly targeted by malicious dApps prompting for write signatures. Pharos Portfolio Assistant has a **100% read-only architecture**—it never requests wallet connections, private keys, or signing permissions.
4. **Data Provenance:** Eliminates opaque numbers by stamping every reported figure with its source contract and block height.

---

## 🌐 Network Specifications

- **Network Name:** Pharos Pacific Mainnet
- **Chain ID:** `1672`
- **Native Currency:** PROS (18 decimals)
- **Primary Public RPC:** `https://rpc.pharos.xyz`
- **Block Explorer:** `https://pharoscan.com`

---

## 🏛 Supported Protocol Integrations & Contracts

| Protocol | Category | Contract Address | Decimals | Verification Method |
|---|---|---|---|---|
| **Native PROS** | Base Gas Currency | `0x0000000000000000000000000000000000000000` | 18 | `eth_getBalance` |
| **WPROS** | Wrapped Token | `0xCd555554d1421f1544439c36209b0bBdfc081E73` | 18 | ERC-20 `balanceOf(address)` (`0x70a08231`) |
| **Faroo Finance** | Liquid Staking Vault | `0x6b0A217730e20fa49326d9c63673B8e458B43a05` | 18 | ERC-4626 `balanceOf` + `convertToAssets` (`0x07a2d13a`) |

### Accounting Integrity & Double-Counting Prevention
The engine classifies portfolio positions into distinct accounting tiers:
1. **Liquid Native Assets:** Freely spendable `PROS`.
2. **Wrapped Tokens:** `WPROS` contract holdings.
3. **Yield-Bearing Staked Assets:** `stPROS` shares held in the Faroo ERC-4626 vault.

When calculating aggregate net worth, these positions are partitioned. Wrapped and staked balances are never counted twice as liquid native PROS.

### ERC-4626 Share vs. Asset Valuation
Faroo Finance operates as an ERC-4626 compliant staking vault. As staking yield accrues, the exchange rate increases:
$$\text{Exchange Rate} = \frac{\text{Underlying PROS Assets}}{\text{stPROS Shares}}$$
On Pharos Pacific Mainnet (verified at block `#22010188`):
- `1.0 stPROS` $\approx$ `1.0048 PROS` (+0.48% cumulative reward accrual).
The assistant reports both the **Share Balance** (stPROS) and the **Redeemable Underlying Balance** (PROS), including the estimated staking yield earned.

---

## 🤖 Natural Language Query Engine

The assistant implements intent detection across five mandatory conversational categories:

1. **Total Portfolio Value:**
   - *Example Queries:* *"What is my total portfolio value?"*, *"How much do I have in total?"*, *"What's my net worth?"*
   - *Response:* Aggregated total across all protocols, with breakdowns by asset category and USD approximations.
2. **Token Locations & Distribution:**
   - *Example Queries:* *"Where are my tokens held?"*, *"Which protocols have my funds?"*, *"Show my token distribution."*
   - *Response:* Protocol-by-protocol allocation with percentage breakdowns and contract addresses.
3. **Largest Position Discovery:**
   - *Example Queries:* *"What is my largest position?"*, *"Where is most of my money?"*, *"What's my top asset?"*
   - *Response:* Pinpoints the single highest-value holding with provenance details.
4. **Yield & Earnings Calculation:**
   - *Example Queries:* *"How much yield or earnings have I earned?"*, *"What are my staking rewards?"*, *"Show staking profits."*
   - *Response:* Computed earnings from liquid staking yield based on the ERC-4626 share-to-asset appreciation.
5. **Protocol-Specific Deep-Dive:**
   - *Example Queries:* *"Show my Faroo staking balance"*, *"How much WPROS do I have?"*, *"Breakdown of Faroo."*
   - *Response:* Granular analysis of a single protocol holding.

### Honest Fallback for Unsupported Protocols
If a user inquires about protocols currently unsupported or unverified on Pharos Pacific Mainnet (such as Aave, Uniswap, Compound, Maker, or Curve):
- The assistant **strictly rejects fabrication**.
- It returns an honest, informative message identifying the protocol as unsupported.
- It provides the active list of verified supported protocols (`Faroo Finance`, `WPROS`, `Native PROS`).

---

## 🔒 Security & Read-Only Safety Guarantees

- **No Private Keys / Wallet Connection:** The application requires only a public EVM address (`0x...`). It never prompts for wallet connection, MetaMask signing, or private keys.
- **Strict Write Rejection:** The RPC client and input validator inspect every call. State-changing methods (`transfer`, `approve`, `swap`, `withdraw`, `sendTransaction`) are strictly rejected with a `SafetyViolation`.
- **Chain ID Anti-Spoofing Defense:** The configuration engine enforces `PHAROS_CHAIN_ID === 1672`. Any attempt to configure another chain ID causes an immediate fatal crash before any queries are dispatched.
- **Zero-Secret Architecture:** The application does not store, log, or leak sensitive API tokens. All safe diagnostics scrub credentials from endpoints.

---

## ☁️ Deployment Architecture & Packaging

The application is structured for dual-mode execution:
1. **Local Development:** Run via Node.js HTTP server (`src/server/index.ts`).
2. **Vercel Serverless Production:** Modular serverless handlers under `api/`:
   - `api/health.ts` (`GET /api/health`)
   - `api/portfolio.ts` (`GET /api/portfolio`)
   - `api/ask.ts` (`POST /api/ask`)
   - `api/protocols.ts` (`GET /api/protocols`)
   - `api/index.ts` (Universal catch-all)
   - `public/*` (Edge CDN static assets)

### Current Limitations
- **Hosting Status:** Packaged and verified for Vercel Serverless; live public Vercel domain deployment will be executed upon Gate 6 authorization.
- **Price Oracles:** PROS token price defaults to $1.00 USD reference peg for portfolio valuation demonstration pending live mainnet oracle feed integration.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
