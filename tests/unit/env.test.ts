import test from "node:test";
import assert from "node:assert";
import { validateEnvironment, getSafeDiagnostics, ConfigurationError } from "../../src/config/env.ts";

test("Env: Default environment resolves to valid Pharos Pacific Mainnet configuration", () => {
  const resolved = validateEnvironment({});
  assert.strictEqual(resolved.chainId, 1672);
  assert.strictEqual(resolved.rpcUrl, "https://rpc.pharos.xyz");
  assert.strictEqual(resolved.rpcTimeoutMs, 30000);
  assert.strictEqual(resolved.port, 3000);
});

test("Env: Accepts custom valid PHAROS_RPC_URL", () => {
  const resolved = validateEnvironment({
    PHAROS_RPC_URL: "https://custom-rpc.pharos.xyz",
  });
  assert.strictEqual(resolved.rpcUrl, "https://custom-rpc.pharos.xyz");
});

test("Env: Rejects invalid or non-HTTP PHAROS_RPC_URL", () => {
  assert.throws(
    () => validateEnvironment({ PHAROS_RPC_URL: "ftp://invalid-url" }),
    ConfigurationError
  );
  assert.throws(
    () => validateEnvironment({ PHAROS_RPC_URL: "not-a-url" }),
    ConfigurationError
  );
});

test("Env: Rejects unsupported Chain ID (Must be 1672)", () => {
  // Ethereum Mainnet (1) should be rejected
  assert.throws(
    () => validateEnvironment({ PHAROS_CHAIN_ID: "1" }),
    (err: unknown) => {
      assert.ok(err instanceof ConfigurationError);
      assert.ok(err.message.includes("PHAROS_CHAIN_ID must be 1672"));
      return true;
    }
  );

  // Testnet ID (9999) should be rejected
  assert.throws(
    () => validateEnvironment({ PHAROS_CHAIN_ID: "9999" }),
    ConfigurationError
  );

  // Non-integer should be rejected
  assert.throws(
    () => validateEnvironment({ PHAROS_CHAIN_ID: "mainnet" }),
    ConfigurationError
  );
});

test("Env: Rejects invalid RPC timeout or port", () => {
  assert.throws(
    () => validateEnvironment({ PHAROS_RPC_TIMEOUT_MS: "-500" }),
    ConfigurationError
  );
  assert.throws(
    () => validateEnvironment({ PORT: "99999" }),
    ConfigurationError
  );
});

test("Env: getSafeDiagnostics reports valid status without leaking secrets", () => {
  const diag = getSafeDiagnostics({});
  assert.strictEqual(diag.status, "VALID");
  assert.strictEqual(diag.chainId, 1672);
  assert.strictEqual(diag.networkName, "Pharos Pacific Mainnet");
  assert.strictEqual(diag.rpcUrl, "https://rpc.pharos.xyz");
});

test("Env: getSafeDiagnostics captures errors safely when invalid", () => {
  const diag = getSafeDiagnostics({ PHAROS_CHAIN_ID: "56" });
  assert.strictEqual(diag.status, "INVALID");
  assert.ok(diag.errors && diag.errors.length > 0);
  assert.ok(diag.errors[0].includes("1672"));
});
