/**
 * Pharos Pacific Mainnet Configuration
 * Chain ID: 1672 (0x688)
 */

import { validateEnvironment } from "./env.ts";

export * from "./env.ts";

const envConfig = (() => {
  try {
    return validateEnvironment();
  } catch {
    return {
      rpcUrl: "https://rpc.pharos.xyz",
      chainId: 1672,
      rpcTimeoutMs: 30000,
      port: 3000,
      isProduction: false,
    };
  }
})();

export const NETWORK_CONFIG = {
  chainId: 1672,
  chainIdHex: "0x688",
  name: "Pharos Pacific Mainnet",
  nativeCurrency: {
    name: "Pharos Native Token",
    symbol: "PROS",
    decimals: 18,
  },
  rpcUrls: {
    primary: envConfig.rpcUrl,
  },
  blockExplorer: "https://pharosscan.xyz",
} as const;

export const CANONICAL_CONTRACTS = {
  MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  WPROS: "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0",
  FAROO_STPROS: "0x6b0A44c64190279f7034b77c13a566E914FE5Ec4",
  PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  CANONICAL_DEPLOYER: "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2",
} as const;

export const SAFETY_CONFIG = {
  readOnlyMethods: [
    "eth_call",
    "eth_getBalance",
    "eth_blockNumber",
    "eth_getCode",
    "eth_getTransactionReceipt",
    "get_chain_info",
    "get_block_number",
    "get_balance",
    "get_code",
  ] as const,
  disallowedWriteMethods: [
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "send_transaction",
    "send_raw_transaction",
    "sign_transaction",
    "sign",
  ] as const,
  maxTimeoutMs: envConfig.rpcTimeoutMs,
} as const;
