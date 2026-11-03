import test from "node:test";
import assert from "node:assert";
import {
  encodeAddressParam,
  encodeBalanceOf,
  decodeUint256,
  decodeString,
  formatUnits,
  parseUnits,
  SELECTORS,
} from "../../src/contracts/abi.ts";

test("ABI: encodeAddressParam correctly pads 40-char hex to 64 chars", () => {
  const addr = "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0";
  const padded = encodeAddressParam(addr);
  assert.strictEqual(padded.length, 64);
  assert.strictEqual(padded, "00000000000000000000000052c48d4213107b20bc583832b0d951fb9ca8f0b0");
});

test("ABI: encodeAddressParam rejects invalid address lengths", () => {
  assert.throws(() => encodeAddressParam("0x123"), /Invalid EVM address length/);
});

test("ABI: encodeBalanceOf produces 0x70a08231 + 64-char address", () => {
  const addr = "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2";
  const calldata = encodeBalanceOf(addr);
  assert.strictEqual(calldata.length, 10 + 64);
  assert.ok(calldata.startsWith(SELECTORS.balanceOf));
});

test("ABI: decodeUint256 converts 32-byte hex to BigInt", () => {
  const hex = "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"; // 1e18
  const val = decodeUint256(hex);
  assert.strictEqual(val, 1000000000000000000n);
});

test("ABI: formatUnits handles 18 decimals accurately without floating point loss", () => {
  const oneEth = 1000000000000000000n;
  assert.strictEqual(formatUnits(oneEth, 18), "1");

  const fractional = 1500000000000000000n;
  assert.strictEqual(formatUnits(fractional, 18), "1.5");

  const tiny = 12345n;
  assert.strictEqual(formatUnits(tiny, 18), "0.000000000000012345");
});

test("ABI: parseUnits parses decimal strings to exact BigInt", () => {
  assert.strictEqual(parseUnits("1.5", 18), 1500000000000000000n);
  assert.strictEqual(parseUnits("0.0001", 18), 100000000000000n);
  assert.strictEqual(parseUnits("100", 18), 100000000000000000000n);
});
