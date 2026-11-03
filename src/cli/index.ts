/**
 * Pharos Portfolio Assistant — CLI Inspection Tool
 * Usage: node --experimental-strip-types src/cli/index.ts <walletAddress> [question]
 */

import { RpcClient } from "../rpc/client.ts";
import { PortfolioAccountingEngine } from "../portfolio/accounting.ts";
import { PortfolioAssistantEngine } from "../assistant/engine.ts";
import { CANONICAL_CONTRACTS } from "../config/index.ts";

async function main() {
  const args = process.argv.slice(2);
  const walletAddress = args[0] || CANONICAL_CONTRACTS.CANONICAL_DEPLOYER;
  const question = args.slice(1).join(" ") || "What is my total portfolio balance?";

  console.log("================================================================================");
  console.log("           PHAROS PORTFOLIO ASSISTANT — PACIFIC MAINNET (CHAIN ID 1672)         ");
  console.log("================================================================================\n");

  const rpc = new RpcClient();

  try {
    console.log("1. Verifying Network Health & Chain ID...");
    const chainId = await rpc.verifyChainId();
    const latestBlock = await rpc.getBlockNumber();
    console.log(`   Connected to Chain ID ${chainId} (Latest Block: #${latestBlock})\n`);

    console.log(`2. Target Wallet Address: ${walletAddress}`);
    console.log(`3. User Query: "${question}"\n`);

    const accounting = new PortfolioAccountingEngine(rpc);
    const assistant = new PortfolioAssistantEngine(accounting);

    console.log("4. Fetching Block-Pinned On-Chain Portfolio & Processing Intent...");
    const response = await assistant.answerQuestion(walletAddress, question);

    console.log("\n--------------------------------------------------------------------------------");
    console.log("ASSISTANT RESPONSE:");
    console.log("--------------------------------------------------------------------------------");
    console.log(response.answerText);
    console.log("--------------------------------------------------------------------------------\n");

    console.log("PROVENANCE EVIDENCE:");
    for (const prov of response.provenanceList) {
      console.log(`- Asset: ${prov.target} | Contract: ${prov.contractAddress} | Block: #${prov.blockNumber}`);
    }
    console.log("\nDone.");
  } catch (err: unknown) {
    console.error("Error executing Portfolio Assistant query:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
