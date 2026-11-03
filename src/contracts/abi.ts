/**
 * EVM ABI Selectors and Encoders / Decoders
 * Decimal-safe arithmetic using native BigInt (zero floating-point precision loss).
 */

export const SELECTORS = {
  // ERC-20 standard
  balanceOf: "0x70a08231",
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",

  // MultiCall3 standard
  getEthBalance: "0x4d2301cc",
  getBlockNumber: "0x42cbb15c",
  getCurrentBlockTimestamp: "0x0f28c97d",
  aggregate3: "0x82ad56cb",
} as const;

/**
 * Encode address parameter (32-byte left-padded hex)
 */
export function encodeAddressParam(address: string): string {
  const clean = address.toLowerCase().replace(/^0x/, "");
  if (clean.length !== 40) {
    throw new Error(`Invalid EVM address length: expected 40 hex chars, got ${clean.length}`);
  }
  return clean.padStart(64, "0");
}

/**
 * Encode balanceOf(address) calldata
 */
export function encodeBalanceOf(address: string): string {
  return `${SELECTORS.balanceOf}${encodeAddressParam(address)}`;
}

/**
 * Encode MultiCall3.getEthBalance(address) calldata
 */
export function encodeGetEthBalance(address: string): string {
  return `${SELECTORS.getEthBalance}${encodeAddressParam(address)}`;
}

/**
 * Decode 32-byte ABI-encoded uint256 to BigInt
 */
export function decodeUint256(hex: string): bigint {
  const clean = hex.replace(/^0x/, "");
  if (clean.length === 0) return 0n;
  const chunk = clean.slice(0, 64);
  return BigInt(`0x${chunk}`);
}

/**
 * Decode ABI-encoded dynamic string (offset, length, utf-8 bytes)
 */
export function decodeString(hex: string): string {
  const clean = hex.replace(/^0x/, "");
  if (clean.length < 128) {
    // Attempt raw ascii decode for short non-standard returns
    try {
      const bytes = Buffer.from(clean, "hex");
      return bytes.toString("utf-8").replace(/\0/g, "").trim();
    } catch {
      return hex;
    }
  }

  // Standard ABI string: 32 bytes offset, 32 bytes length, then data
  const length = Number(BigInt(`0x${clean.slice(64, 128)}`));
  const dataHex = clean.slice(128, 128 + length * 2);
  const buffer = Buffer.from(dataHex, "hex");
  return buffer.toString("utf-8");
}

/**
 * Format raw bigint wei amount to decimal string (e.g. 18 decimals)
 */
export function formatUnits(amount: bigint, decimals: number = 18): string {
  const isNegative = amount < 0n;
  const absAmount = isNegative ? -amount : amount;

  const divisor = 10n ** BigInt(decimals);
  const integerPart = absAmount / divisor;
  const fractionPart = absAmount % divisor;

  if (fractionPart === 0n) {
    return `${isNegative ? "-" : ""}${integerPart.toString()}`;
  }

  const fractionStr = fractionPart.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${isNegative ? "-" : ""}${integerPart.toString()}.${fractionStr}`;
}

/**
 * Parse human decimal string to raw bigint wei amount
 */
export function parseUnits(amountStr: string, decimals: number = 18): bigint {
  const trimmed = amountStr.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid numeric string: '${amountStr}'`);
  }

  const isNegative = trimmed.startsWith("-");
  const clean = isNegative ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ""] = clean.split(".");

  if (fracPart.length > decimals) {
    throw new Error(`Fractional part exceeds ${decimals} decimal places`);
  }

  const paddedFrac = fracPart.padEnd(decimals, "0");
  const baseInt = BigInt(intPart) * (10n ** BigInt(decimals));
  const fracInt = BigInt(paddedFrac);
  const total = baseInt + fracInt;

  return isNegative ? -total : total;
}
