import test from "node:test";
import assert from "node:assert";
import { RpcClient } from "../../src/rpc/client.ts";
import { WprosAdapter } from "../../src/adapters/wpros.ts";
import { FarooStakingAdapter } from "../../src/adapters/faroo.ts";
import { PortfolioAccountingEngine } from "../../src/portfolio/accounting.ts";
import { PortfolioAssistantEngine } from "../../src/assistant/engine.ts";
import { CANONICAL_CONTRACTS, NETWORK_CONFIG } from "../../src/config/index.ts";

test("Live Integration: Verify Pacific Mainnet Chain ID (1672)", { timeout: 120000 }, async () => {
  const rpc = new RpcClient();
  const chainId = await rpc.verifyChainId();
  assert.strictEqual(chainId, NETWORK_CONFIG.chainId);
});

test("Live Integration: Verify Latest Block Height on Pacific Mainnet", { timeout: 120000 }, async () => {
  const rpc = new RpcClient();
  const blockNum = await rpc.getBlockNumber();
  assert.ok(blockNum > 22000000, `Expected block number > 22M, got ${blockNum}`);
});

test("Live Integration: Verify WPROS Deployed Bytecode and Metadata", { timeout: 120000 }, async () => {
  const rpc = new RpcClient();
  const wpros = new WprosAdapter(rpc);
  const dep = await wpros.verifyDeployment();
  assert.strictEqual(dep.isDeployed, true);
  assert.ok(dep.bytecodeLength > 1000);

  const state = await wpros.getProtocolState();
  assert.strictEqual(state.symbol, "WPROS");
  assert.strictEqual(state.name, "Wrapped PROS");
  assert.strictEqual(state.decimals, 18);
});

test("Live Integration: Verify Faroo stPROS Deployed Bytecode and Metadata", { timeout: 120000 }, async () => {
  const rpc = new RpcClient();
  const faroo = new FarooStakingAdapter(rpc);
  const dep = await faroo.verifyDeployment();
  assert.strictEqual(dep.isDeployed, true);
  assert.ok(dep.bytecodeLength > 1000);

  const state = await faroo.getProtocolState();
  assert.strictEqual(state.symbol, "stPROS");
  assert.strictEqual(state.name, "Faroo Staked PROS");
  assert.strictEqual(state.decimals, 18);
});

test("Live Integration: Full Block-Pinned Assistant Query for Canonical Deployer", { timeout: 120000 }, async () => {
  const rpc = new RpcClient();
  const accounting = new PortfolioAccountingEngine(rpc);
  const assistant = new PortfolioAssistantEngine(accounting);

  const res = await assistant.answerQuestion(
    CANONICAL_CONTRACTS.CANONICAL_DEPLOYER,
    "What is my total portfolio balance?"
  );

  assert.strictEqual(res.walletAddress, CANONICAL_CONTRACTS.CANONICAL_DEPLOYER.toLowerCase());
  assert.ok(res.blockNumber > 22000000);
  assert.ok(res.answerText.includes("Total Portfolio Overview"));
  assert.strictEqual(res.provenanceList.length, 3);
});
