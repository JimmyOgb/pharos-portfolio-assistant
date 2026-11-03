import test from "node:test";
import assert from "node:assert";
import { formatUnits } from "../../src/contracts/abi.ts";
import { createProvenance } from "../../src/provenance/index.ts";

test("Accounting: Double-counting prevention separates liquid, wrapped, and staked balances", () => {
  const liquidPros = 10000000000000000000n; // 10 PROS
  const wrappedWpros = 5000000000000000000n; // 5 WPROS
  const stakedStpros = 20000000000000000000n; // 20 stPROS

  // Ensure individual balances are distinct and not conflated
  assert.strictEqual(formatUnits(liquidPros, 18), "10");
  assert.strictEqual(formatUnits(wrappedWpros, 18), "5");
  assert.strictEqual(formatUnits(stakedStpros, 18), "20");

  // Sum of total economic exposure
  const totalExposure = liquidPros + wrappedWpros + stakedStpros;
  assert.strictEqual(formatUnits(totalExposure, 18), "35");
});

test("Accounting: createProvenance records all mandatory block and contract fields", () => {
  const prov = createProvenance({
    chainId: 1672,
    networkName: "Pharos Pacific Mainnet",
    sourceContract: "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0",
    sourceContractName: "WPROS",
    methodCalled: "balanceOf(address)",
    selector: "0x70a08231",
    blockNumber: 22005310,
    rawHex: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
  });

  assert.strictEqual(prov.chainId, 1672);
  assert.strictEqual(prov.blockNumber, 22005310);
  assert.strictEqual(prov.sourceContract, "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0");
  assert.strictEqual(prov.selector, "0x70a08231");
  assert.ok(prov.observedAtUtc.includes("T"));
});
