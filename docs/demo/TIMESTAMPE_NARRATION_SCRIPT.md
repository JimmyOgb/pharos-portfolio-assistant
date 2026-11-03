# Pharos Portfolio Assistant — Timestamped Voiceover Script
## Task 14: Gate 7B Professional Video Voiceover

- **Project:** Pharos Portfolio Assistant
- **Target Network:** Pharos Pacific Mainnet (Chain ID 1672)
- **Production URL:** [https://pharos-portfolio-assistant.vercel.app](https://pharos-portfolio-assistant.vercel.app)
- **GitHub Repository:** [https://github.com/JimmyOgb/pharos-portfolio-assistant](https://github.com/JimmyOgb/pharos-portfolio-assistant)
- **Video Source File:** `C:\Users\NO GO NO\phoros.mp4`
- **Output Video File:** `skills/pharos-portfolio-assistant/demo-output/Pharos_Portfolio_Assistant_Demo_Voiceover.mp4`
- **Total Duration:** 00:01:30.00 (90.00 seconds)
- **Voice Actor:** `en-NG-AbeoNeural` (Microsoft Neural TTS — Natural African-English, Professional Technical Developer Cadence)
- **Speech Rate:** `+6%` (crisp, articulate, moderate pace with deliberate breathing pauses)

---

## Complete Scene-by-Scene Timed Narration

### Segment 1: Product Introduction & Multi-Protocol Overview (00:00 – 00:14)
- **Audio Timecodes:** `00:00.80` $\to$ `00:13.50` (Duration: 12.70s)
- **Pause before next action:** 1.50s
- **Visible On-Screen Actions:**
  - Video opens on the clean, dark-mode dashboard of the Pharos Portfolio Assistant.
  - User scrolls down past top asset cards to reveal the **Protocol Holdings Breakdown** table.
  - Visible rows: Native PROS (`LIQUID_WALLET`, L1 Consensus State, 1.0 basis), Wrapped PROS (`CANONICAL_WRAPPING_VAULT`, contract `0x52C4...F0B0`), and Faroo Staked PROS (`LIQUID_STAKING_VAULT`, contract `0x6b0A...5Ec4`, Variable Liquid Staking Exchange Rate).
  - Bottom panel displays **Cryptographic Provenance & Block Evidence** pinned to block `#22016684`.
- **Spoken Narration:**
  > *"Welcome to the Pharos Portfolio Assistant — a strictly read-only intelligence engine for Pharos Pacific Mainnet. It aggregates liquid holdings, wrapped vaults, and staking positions with cryptographic block provenance."*

---

### Segment 2: Network Verification & Wallet Address Query (00:14 – 00:28)
- **Audio Timecodes:** `00:15.00` $\to$ `00:27.98` (Duration: 12.98s)
- **Pause before next action:** 1.52s
- **Visible On-Screen Actions:**
  - User scrolls back to the top of the interface.
  - Header badges prominently show **Pharos Pacific Mainnet**, **Chain ID 1672**, **Block: #22016684**, and **100% Read-Only / Zero Gas**.
  - User inputs a public EVM wallet address: `0xE4220c4b71877bb94EB173f467ef5c5557017085`.
  - Cursor moves to the right and clicks the blue **Inspect Portfolio** button.
- **Spoken Narration:**
  > *"The header verifies live connectivity to Pacific Mainnet on chain ID 1672. To inspect a portfolio, we enter a public address and query the chain — completely read-only, with zero gas and no wallet connections."*

---

### Segment 3: Real-Time State & Accounting Safeguards (00:28 – 00:43)
- **Audio Timecodes:** `00:29.50` $\to$ `00:43.56` (Duration: 14.06s)
- **Pause before next action:** 0.94s
- **Visible On-Screen Actions:**
  - Cyan loading spinner displays: *"Querying live Pacific Mainnet for 0xE422...7085..."*.
  - MultiCall3 returns verified balances:
    - **Total PROS Exposure:** `1.133836601319873609 PROS`
    - **Liquid Native PROS:** `1.133836601319873609 PROS`
    - **Canonical Wrapped PROS:** `0 WPROS`
    - **Faroo Liquid Staking:** `0 stPROS`
  - Explanatory footnote highlights the separation of liquid cash vs. vault shares.
- **Spoken Narration:**
  > *"MultiCall3 aggregates on-chain state atomically, showing 1.1338 liquid native PROS. Importantly, liquid PROS, wrapped WPROS, and Faroo stPROS shares are strictly separated to prevent double-counting."*

---

### Segment 4: Deterministic Assistant Engine & Intent Classification (00:43 – 00:58)
- **Audio Timecodes:** `00:44.50` $\to$ `00:58.54` (Duration: 14.04s)
- **Pause before next action:** 0.96s
- **Visible On-Screen Actions:**
  - User moves cursor to the **Pharos Portfolio Assistant** interactive right rail.
  - Clicks test preset **1. Total Portfolio Balance**.
  - Message bubble dispatches: *"What is my total portfolio balance?"*.
  - Assistant shows processing status: *"Analyzing on-chain portfolio state against Pacific Mainnet..."*.
  - Deterministic classifier evaluates query: **Intent: TOTAL_PORTFOLIO_VALUE (85% confidence)** at **Block #22016768**.
- **Spoken Narration:**
  > *"On the right, our deterministic assistant engine processes queries. Clicking 'Total Portfolio Balance' triggers the TOTAL_PORTFOLIO_VALUE intent, pinned to Pacific Mainnet block 22,016,768."*

---

### Segment 5: Structured Breakdown & Honest Denomination (00:58 – 00:73)
- **Audio Timecodes:** `00:59.50` $\to$ `00:71.96` (Duration: 12.46s)
- **Pause before next action:** 3.04s
- **Visible On-Screen Actions:**
  - Assistant card formats and displays the verified balance summary:
    - Total Exposure: `1.133836601319873609 PROS`
    - Liquid Native PROS: `1.1338... PROS` (Wallet EOA)
    - Wrapped PROS Vault: `0 WPROS` (Canonical Vault)
    - Faroo Staking Shares: `0 stPROS` (Faroo Protocol Vault)
  - Footnote verifies block `#22016768` and states: *"Denominated strictly in native asset units; no speculative USD fiat conversion applied."*
  - Attached provenances: 3 on-chain contract reads.
  - User scrolls down chat to display full provenance block.
- **Spoken Narration:**
  > *"The assistant returns an exact breakdown across wallet and protocol contracts. All amounts are denominated honestly in native PROS without speculative fiat fabrication, backed by three on-chain contract reads."*

---

### Segment 6: Contract Presets, Architecture & Closing (00:73 – 00:90)
- **Audio Timecodes:** `00:75.00` $\to$ `00:87.02` (Duration: 12.02s)
- **Pause before video conclusion:** 2.98s (Total: 90.00s)
- **Visible On-Screen Actions:**
  - User navigates back up to the sample addresses pill row.
  - Clicks / hovers over canonical contracts: `Canonical Deployer`, `WPROS Vault`, `Faroo Staking`, and `Permit2`.
  - Full screen demonstrates production readiness, zero errors, and clean responsive layout.
- **Spoken Narration:**
  > *"Sample presets allow instant inspection of canonical contracts including Faroo and Permit2. Explore the live application at pharos-portfolio-assistant.vercel.app, and inspect the open-source code on GitHub."*

---

## Synchronization Verification Summary

| Segment | Start Time | Audio Duration | End Time | Next Action Time | Breathing Gap | Status |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | `00:00.80` | 12.70s | `00:13.50` | `00:15.00` | +1.50s | ✅ PERFECT |
| **2** | `00:15.00` | 12.98s | `00:27.98` | `00:29.50` | +1.52s | ✅ PERFECT |
| **3** | `00:29.50` | 14.06s | `00:43.56` | `00:44.50` | +0.94s | ✅ PERFECT |
| **4** | `00:44.50` | 14.04s | `00:58.54` | `00:59.50` | +0.96s | ✅ PERFECT |
| **5** | `00:59.50` | 12.46s | `00:71.96` | `00:75.00` | +3.04s | ✅ PERFECT |
| **6** | `00:75.00` | 12.02s | `00:87.02` | `00:90.00` | +2.98s | ✅ PERFECT |
