/**
 * Portfolio Assistant Question-Answering Engine
 * Combines IntentParser, PortfolioAccountingEngine, and SourceProvenance
 * to generate verifiable, deterministic answers to the 5 official question types.
 */

import { IntentParser, QuestionIntent } from "./intent.ts";
import { PortfolioAccountingEngine } from "../portfolio/accounting.ts";
import type { PortfolioSummary, AssetPosition } from "../provenance/index.ts";

export interface AssistantResponse {
  query: string;
  intent: QuestionIntent;
  confidence: number;
  walletAddress: string;
  blockNumber: number;
  answerText: string;
  provenanceList: Array<{
    target: string;
    contractAddress: string;
    method: string;
    blockNumber: number;
  }>;
  summary: PortfolioSummary;
}

export class PortfolioAssistantEngine {
  private accounting: PortfolioAccountingEngine;

  constructor(accounting: PortfolioAccountingEngine) {
    this.accounting = accounting;
  }

  /**
   * Process a natural-language question against a real wallet on Pharos Pacific Mainnet
   */
  public async answerQuestion(
    walletAddress: string,
    query: string,
    pinBlockNumber?: number
  ): Promise<AssistantResponse> {
    const summary = await this.accounting.getPortfolio(walletAddress, pinBlockNumber);
    const intentMatch = IntentParser.parse(query);

    let answerText = "";
    const provenanceList = summary.positions.map((p) => ({
      target: p.assetSymbol,
      contractAddress: p.provenance.sourceContract,
      method: p.provenance.methodCalled,
      blockNumber: p.provenance.blockNumber,
    }));

    switch (intentMatch.intent) {
      // -----------------------------------------------------------------------
      // Question Type 1: Total Portfolio Value
      // -----------------------------------------------------------------------
      case QuestionIntent.TOTAL_PORTFOLIO_VALUE: {
        answerText = [
          `📊 **Total Portfolio Overview for ${summary.walletAddress}:**`,
          `- **Total PROS Exposure:** ${summary.accounting.totalProsExposure} PROS`,
          `- **Liquid Native PROS:** ${summary.accounting.liquidNativePros} PROS (Wallet EOA)`,
          `- **Wrapped PROS Vault:** ${summary.accounting.wrappedVaultPros} WPROS (Canonical Vault)`,
          `- **Faroo Staking Shares:** ${summary.accounting.stakedVaultProsShares} stPROS (Faroo Protocol Vault)`,
          `\n*All figures verified on-chain at Pacific Mainnet block #${summary.observedBlockNumber}.*`,
          `*Note: Denominated strictly in native asset units; no speculative USD fiat conversion applied.*`,
        ].join("\n");
        break;
      }

      // -----------------------------------------------------------------------
      // Question Type 2: Token Locations
      // -----------------------------------------------------------------------
      case QuestionIntent.TOKEN_LOCATIONS: {
        const locations = summary.positions.map((p) => {
          return `- **${p.assetSymbol} (${p.assetName}):** ${p.formattedAmount} ${p.assetSymbol} held at \`${p.locationType}\` (${p.provenance.sourceContractName} - ${p.provenance.sourceContract})`;
        });
        answerText = [
          `📍 **Token Locations & Protocol Allocations for ${summary.walletAddress}:**`,
          ...locations,
          `\n*Verified at Pacific Mainnet block #${summary.observedBlockNumber}.*`,
        ].join("\n");
        break;
      }

      // -----------------------------------------------------------------------
      // Question Type 3: Largest Position
      // -----------------------------------------------------------------------
      case QuestionIntent.LARGEST_POSITION: {
        let largest: AssetPosition = summary.positions[0];
        for (const p of summary.positions) {
          if (p.rawAmount > largest.rawAmount) {
            largest = p;
          }
        }

        if (largest.rawAmount === 0n) {
          answerText = `⚖️ **Largest Position:** All tracked asset balances for ${summary.walletAddress} are currently zero (0 PROS) at block #${summary.observedBlockNumber}.`;
        } else {
          answerText = [
            `🏆 **Largest Position for ${summary.walletAddress}:**`,
            `- **Asset:** ${largest.assetName} (${largest.assetSymbol})`,
            `- **Amount:** ${largest.formattedAmount} ${largest.assetSymbol}`,
            `- **Location Category:** \`${largest.locationType}\``,
            `- **Contract:** \`${largest.provenance.sourceContract}\``,
            `\n*Verified on-chain at block #${summary.observedBlockNumber}.*`,
          ].join("\n");
        }
        break;
      }

      // -----------------------------------------------------------------------
      // Question Type 4: Earnings and Yield
      // -----------------------------------------------------------------------
      case QuestionIntent.EARNINGS_AND_YIELD: {
        const farooPos = summary.positions.find((p) => p.protocolId === "faroo-liquid-staking");
        answerText = [
          `📈 **Earnings & Yield Report for ${summary.walletAddress}:**`,
          `- **Faroo Staked Balance:** ${farooPos?.formattedAmount ?? "0"} stPROS`,
          `- **Exchange Rate Appreciation:** stPROS accrues validator rewards through share value growth against native PROS.`,
          `\n⚠️ **Honest Protocol Disclosure:**`,
          `Lifetime yield earnings and historical APY require an indexed archive event log of deposit and withdrawal events.`,
          `Live query confirms current verifiable on-chain share balance at block #${summary.observedBlockNumber}. Speculative APYs are never simulated.`,
        ].join("\n");
        break;
      }

      // -----------------------------------------------------------------------
      // Question Type 5: Protocol-Specific Breakdown
      // -----------------------------------------------------------------------
      case QuestionIntent.PROTOCOL_BREAKDOWN: {
        const protoName = intentMatch.targetProtocol ?? "Faroo Liquid Staking";

        if (protoName.includes("Faroo")) {
          const pos = summary.positions.find((p) => p.protocolId === "faroo-liquid-staking");
          answerText = [
            `🥩 **Faroo Liquid Staking Protocol Breakdown:**`,
            `- **Staked Shares:** ${pos?.formattedAmount ?? "0"} stPROS`,
            `- **Contract:** \`${pos?.provenance.sourceContract}\``,
            `- **Valuation Mechanism:** Variable liquid staking exchange rate backed by active network validator pool.`,
            `\n*Verified at Pacific Mainnet block #${summary.observedBlockNumber}.*`,
          ].join("\n");
        } else if (protoName.includes("Wrapped") || protoName.includes("WPROS")) {
          const pos = summary.positions.find((p) => p.protocolId === "canonical-wrapped-pros");
          answerText = [
            `📦 **Canonical Wrapped PROS (WPROS) Vault Breakdown:**`,
            `- **Wrapped Balance:** ${pos?.formattedAmount ?? "0"} WPROS`,
            `- **Contract:** \`${pos?.provenance.sourceContract}\``,
            `- **Collateralization:** 1:1 backing in canonical wrapping contract.`,
            `\n*Verified at Pacific Mainnet block #${summary.observedBlockNumber}.*`,
          ].join("\n");
        } else if (protoName.includes("Harbor")) {
          answerText = [
            `⚓ **Harbor Protocol Status:**`,
            `- **Notice:** Harbor Protocol is currently in pre-launch development on Pharos Pacific Mainnet.`,
            `- **Contract:** No verified production contract address is indexed on Chain ID 1672.`,
            `- **Balance:** 0 (Pre-launch)`,
          ].join("\n");
        } else {
          answerText = `Information for '${protoName}' is not available on Pharos Pacific Mainnet.`;
        }
        break;
      }

      // -----------------------------------------------------------------------
      // Unsupported / Unknown Protocols (Req 04)
      // -----------------------------------------------------------------------
      case QuestionIntent.UNKNOWN_OR_UNSUPPORTED:
      default: {
        answerText = [
          `⚠️ **Protocol Not Supported or Not Found:**`,
          `- **Reason:** ${intentMatch.reason}`,
          `- **Supported Protocols on Pharos Pacific Mainnet (Chain ID 1672):**`,
          `  1. **Faroo Liquid Staking** (\`stPROS\`) — Contract \`0x6b0A44c64190279f7034b77c13a566E914FE5Ec4\``,
          `  2. **Canonical Wrapped PROS Vault** (\`WPROS\`) — Contract \`0x52C48d4213107b20bC583832b0d951FB9CA8F0B0\``,
          `  3. **Liquid Native Account** (\`PROS\`) — Layer-1 Consensus State`,
          `\nPlease ask about your portfolio balance, token locations, largest holding, yield, or one of the supported protocols.`,
        ].join("\n");
        break;
      }
    }

    return {
      query,
      intent: intentMatch.intent,
      confidence: intentMatch.confidence,
      walletAddress: summary.walletAddress,
      blockNumber: summary.observedBlockNumber,
      answerText,
      provenanceList,
      summary,
    };
  }
}
