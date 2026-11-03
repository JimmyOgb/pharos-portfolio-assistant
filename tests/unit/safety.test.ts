import test from "node:test";
import assert from "node:assert";
import { RpcClient, SafetyViolationError } from "../../src/rpc/client.ts";

test("Safety: Address validator accepts valid 40-hex lowercase and checksum addresses", () => {
  const valid = "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0";
  assert.strictEqual(
    RpcClient.validateAddress(valid),
    "0x52c48d4213107b20bc583832b0d951fb9ca8f0b0"
  );
});

test("Safety: Address validator rejects malformed addresses and private keys", () => {
  // Too short
  assert.throws(() => RpcClient.validateAddress("0x123"), SafetyViolationError);
  // Missing 0x prefix
  assert.throws(
    () => RpcClient.validateAddress("52C48d4213107b20bC583832b0d951FB9CA8F0B0"),
    SafetyViolationError
  );
  // 64-character private key string
  assert.throws(
    () => RpcClient.validateAddress("0x1111111111111111111111111111111111111111111111111111111111111111"),
    SafetyViolationError
  );
});

test("Safety: Method validator rejects write-capable operations", () => {
  const writeMethods = [
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "send_transaction",
    "send_raw_transaction",
    "sign_transaction",
    "sign",
  ];
  for (const m of writeMethods) {
    assert.throws(
      () => RpcClient.validateMethod(m),
      SafetyViolationError,
      `Failed to reject write method '${m}'`
    );
  }
});

test("Safety: Method validator permits read-only operations", () => {
  const readMethods = ["eth_call", "eth_getBalance", "eth_blockNumber", "eth_getCode"];
  for (const m of readMethods) {
    assert.doesNotThrow(() => RpcClient.validateMethod(m));
  }
});
