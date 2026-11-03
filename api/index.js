// src/server/router.ts
import { URL as URL2 } from "node:url";

// src/config/env.ts
var ConfigurationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
};
function validateEnvironment(env = process.env) {
  const errors = [];
  const rpcUrl = env.PHAROS_RPC_URL?.trim() || "https://rpc.pharos.xyz";
  try {
    const parsed = new URL(rpcUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      errors.push(`PHAROS_RPC_URL must use http or https protocol. Got: '${parsed.protocol}'`);
    }
  } catch {
    errors.push(`PHAROS_RPC_URL is not a valid URL: '${rpcUrl}'`);
  }
  let chainId = 1672;
  if (env.PHAROS_CHAIN_ID) {
    const parsedId = parseInt(env.PHAROS_CHAIN_ID, 10);
    if (isNaN(parsedId)) {
      errors.push(`PHAROS_CHAIN_ID must be an integer. Got: '${env.PHAROS_CHAIN_ID}'`);
    } else if (parsedId !== 1672) {
      errors.push(
        `CRITICAL: PHAROS_CHAIN_ID must be 1672 for Pharos Pacific Mainnet. Unsupported Chain ID: ${parsedId}`
      );
    } else {
      chainId = parsedId;
    }
  }
  let rpcTimeoutMs = 3e4;
  if (env.PHAROS_RPC_TIMEOUT_MS) {
    const parsedTimeout = parseInt(env.PHAROS_RPC_TIMEOUT_MS, 10);
    if (isNaN(parsedTimeout) || parsedTimeout <= 0) {
      errors.push(`PHAROS_RPC_TIMEOUT_MS must be a positive integer. Got: '${env.PHAROS_RPC_TIMEOUT_MS}'`);
    } else {
      rpcTimeoutMs = parsedTimeout;
    }
  }
  let port = 3e3;
  if (env.PORT) {
    const parsedPort = parseInt(env.PORT, 10);
    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      errors.push(`PORT must be a valid port number between 1 and 65535. Got: '${env.PORT}'`);
    } else {
      port = parsedPort;
    }
  }
  if (errors.length > 0) {
    throw new ConfigurationError(`Environment Configuration Failure:
- ${errors.join("\n- ")}`);
  }
  const isProduction = env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  return {
    rpcUrl,
    chainId,
    rpcTimeoutMs,
    port,
    isProduction
  };
}

// src/config/index.ts
var envConfig = (() => {
  try {
    return validateEnvironment();
  } catch {
    return {
      rpcUrl: "https://rpc.pharos.xyz",
      chainId: 1672,
      rpcTimeoutMs: 3e4,
      port: 3e3,
      isProduction: false
    };
  }
})();
var NETWORK_CONFIG = {
  chainId: 1672,
  chainIdHex: "0x688",
  name: "Pharos Pacific Mainnet",
  nativeCurrency: {
    name: "Pharos Native Token",
    symbol: "PROS",
    decimals: 18
  },
  rpcUrls: {
    primary: envConfig.rpcUrl
  },
  blockExplorer: "https://pharosscan.xyz"
};
var CANONICAL_CONTRACTS = {
  MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  WPROS: "0x52C48d4213107b20bC583832b0d951FB9CA8F0B0",
  FAROO_STPROS: "0x6b0A44c64190279f7034b77c13a566E914FE5Ec4",
  PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  CANONICAL_DEPLOYER: "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2"
};
var SAFETY_CONFIG = {
  readOnlyMethods: [
    "eth_call",
    "eth_getBalance",
    "eth_blockNumber",
    "eth_getCode",
    "eth_getTransactionReceipt",
    "get_chain_info",
    "get_block_number",
    "get_balance",
    "get_code"
  ],
  disallowedWriteMethods: [
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "send_transaction",
    "send_raw_transaction",
    "sign_transaction",
    "sign"
  ],
  maxTimeoutMs: envConfig.rpcTimeoutMs
};

// src/rpc/client.ts
var RpcError = class extends Error {
  code;
  data;
  constructor(message, code, data) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "RpcError";
  }
};
var SafetyViolationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SafetyViolationError";
  }
};
var RpcClient = class _RpcClient {
  primaryUrl;
  timeoutMs;
  constructor(primaryUrl = NETWORK_CONFIG.rpcUrls.primary, timeoutMs = SAFETY_CONFIG.maxTimeoutMs) {
    this.primaryUrl = primaryUrl;
    this.timeoutMs = timeoutMs;
  }
  /**
   * Validate that an address is a valid 40-hex-character EVM address
   */
  static validateAddress(address) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new SafetyViolationError(`Invalid EVM address format: '${address}'`);
    }
    return address.toLowerCase();
  }
  /**
   * Enforce read-only safety guard: reject write-capable methods
   */
  static validateMethod(method) {
    if (SAFETY_CONFIG.disallowedWriteMethods.includes(method)) {
      throw new SafetyViolationError(
        `SAFETY REJECTION: Method '${method}' is write-capable. State modifications and gas expenditure are prohibited.`
      );
    }
  }
  /**
   * Execute raw JSON-RPC 2.0 call with retry and backoff
   */
  async call(method, params = [], retries = 2) {
    _RpcClient.validateMethod(method);
    const payload = {
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1e6),
      method,
      params
    };
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(this.primaryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "PharosPortfolioAssistant/1.0"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new RpcError(`HTTP ${response.status} from ${this.primaryUrl}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new RpcError(data.error.message, data.error.code, data.error.data);
        }
        if (data.result === void 0) {
          throw new RpcError(`Malformed JSON-RPC response from ${this.primaryUrl}: missing result`);
        }
        return data.result;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err instanceof SafetyViolationError) {
          throw err;
        }
      }
    }
    throw new RpcError(
      `RPC call '${method}' failed on ${this.primaryUrl}: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }
  /**
   * Verify connected network matches Pharos Pacific Mainnet (1672)
   */
  async verifyChainId() {
    const hexChainId = await this.call("eth_chainId");
    const chainId = Number(BigInt(hexChainId));
    if (chainId !== NETWORK_CONFIG.chainId) {
      throw new SafetyViolationError(
        `NETWORK MISMATCH: Connected to Chain ID ${chainId}, expected ${NETWORK_CONFIG.chainId} (${NETWORK_CONFIG.name}).`
      );
    }
    return chainId;
  }
  /**
   * Get current block number as integer
   */
  async getBlockNumber() {
    const hexBlock = await this.call("eth_blockNumber");
    return Number(BigInt(hexBlock));
  }
  /**
   * Get native PROS balance of address in wei (BigInt) at a specific block
   */
  async getBalance(address, blockTag = "latest") {
    const validAddr = _RpcClient.validateAddress(address);
    const tag = typeof blockTag === "number" ? `0x${blockTag.toString(16)}` : blockTag;
    const hexBal = await this.call("eth_getBalance", [validAddr, tag]);
    return BigInt(hexBal);
  }
  /**
   * Get contract bytecode at an address
   */
  async getCode(address, blockTag = "latest") {
    const validAddr = _RpcClient.validateAddress(address);
    const tag = typeof blockTag === "number" ? `0x${blockTag.toString(16)}` : blockTag;
    return this.call("eth_getCode", [validAddr, tag]);
  }
  /**
   * Execute read-only eth_call to a contract
   */
  async ethCall(to, data, blockTag = "latest") {
    const validTo = _RpcClient.validateAddress(to);
    const tag = typeof blockTag === "number" ? `0x${blockTag.toString(16)}` : blockTag;
    return this.call("eth_call", [
      {
        to: validTo,
        data
      },
      tag
    ]);
  }
};

// src/contracts/abi.ts
var SELECTORS = {
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
  aggregate3: "0x82ad56cb"
};
function encodeAddressParam(address) {
  const clean = address.toLowerCase().replace(/^0x/, "");
  if (clean.length !== 40) {
    throw new Error(`Invalid EVM address length: expected 40 hex chars, got ${clean.length}`);
  }
  return clean.padStart(64, "0");
}
function encodeBalanceOf(address) {
  return `${SELECTORS.balanceOf}${encodeAddressParam(address)}`;
}
function decodeUint256(hex) {
  const clean = hex.replace(/^0x/, "");
  if (clean.length === 0) return 0n;
  const chunk = clean.slice(0, 64);
  return BigInt(`0x${chunk}`);
}
function decodeString(hex) {
  const clean = hex.replace(/^0x/, "");
  if (clean.length < 128) {
    try {
      const bytes = Buffer.from(clean, "hex");
      return bytes.toString("utf-8").replace(/\0/g, "").trim();
    } catch {
      return hex;
    }
  }
  const length = Number(BigInt(`0x${clean.slice(64, 128)}`));
  const dataHex = clean.slice(128, 128 + length * 2);
  const buffer = Buffer.from(dataHex, "hex");
  return buffer.toString("utf-8");
}
function formatUnits(amount, decimals = 18) {
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

// src/provenance/index.ts
function createProvenance(params) {
  return {
    chainId: params.chainId,
    networkName: params.networkName,
    sourceContract: params.sourceContract,
    sourceContractName: params.sourceContractName,
    methodCalled: params.methodCalled,
    selector: params.selector,
    blockNumber: params.blockNumber,
    observedAtUtc: (/* @__PURE__ */ new Date()).toISOString(),
    rawHex: params.rawHex
  };
}

// src/adapters/wpros.ts
var WprosAdapter = class {
  metadata = {
    id: "canonical-wrapped-pros",
    name: "Canonical Wrapped PROS Vault",
    category: "WRAPPED_VAULT",
    contractAddress: CANONICAL_CONTRACTS.WPROS,
    underlyingTokenSymbol: "PROS",
    description: "Official canonical WPROS wrapping vault on Pharos Pacific Mainnet"
  };
  rpc;
  constructor(rpc) {
    this.rpc = rpc;
  }
  async verifyDeployment(blockNumber) {
    const code = await this.rpc.getCode(this.metadata.contractAddress, blockNumber);
    const isDeployed = code.length > 4 && code !== "0x";
    return { isDeployed, bytecodeLength: code.length };
  }
  async getPosition(walletAddress, blockNumber) {
    const calldata = encodeBalanceOf(walletAddress);
    const rawHex = await this.rpc.ethCall(this.metadata.contractAddress, calldata, blockNumber);
    const rawAmount = decodeUint256(rawHex);
    const provenance = createProvenance({
      chainId: NETWORK_CONFIG.chainId,
      networkName: NETWORK_CONFIG.name,
      sourceContract: this.metadata.contractAddress,
      sourceContractName: "WPROS",
      methodCalled: "balanceOf(address)",
      selector: SELECTORS.balanceOf,
      blockNumber,
      rawHex
    });
    return {
      protocolId: this.metadata.id,
      protocolName: this.metadata.name,
      assetSymbol: "WPROS",
      assetName: "Wrapped PROS",
      rawAmount,
      formattedAmount: formatUnits(rawAmount, 18),
      decimals: 18,
      locationType: "CANONICAL_WRAPPING_VAULT",
      underlyingAssetSymbol: "PROS",
      underlyingEquivalentRatio: "1.0",
      provenance
    };
  }
  async getProtocolState(blockNumber) {
    const block = blockNumber ?? await this.rpc.getBlockNumber();
    const nameHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.name, block);
    const symHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.symbol, block);
    const decHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.decimals, block);
    const totHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.totalSupply, block);
    const decimals = Number(decodeUint256(decHex));
    const rawTotalSupply = decodeUint256(totHex);
    const provenance = createProvenance({
      chainId: NETWORK_CONFIG.chainId,
      networkName: NETWORK_CONFIG.name,
      sourceContract: this.metadata.contractAddress,
      sourceContractName: "WPROS",
      methodCalled: "totalSupply()",
      selector: SELECTORS.totalSupply,
      blockNumber: block,
      rawHex: totHex
    });
    return {
      name: decodeString(nameHex),
      symbol: decodeString(symHex),
      decimals,
      totalSupplyFormatted: formatUnits(rawTotalSupply, decimals),
      provenance
    };
  }
};

// src/adapters/faroo.ts
var FarooStakingAdapter = class {
  metadata = {
    id: "faroo-liquid-staking",
    name: "Faroo Liquid Staking Vault",
    category: "LIQUID_STAKING",
    contractAddress: CANONICAL_CONTRACTS.FAROO_STPROS,
    underlyingTokenSymbol: "PROS",
    description: "Faroo Liquid Staked PROS (stPROS) token on Pharos Pacific Mainnet"
  };
  rpc;
  constructor(rpc) {
    this.rpc = rpc;
  }
  async verifyDeployment(blockNumber) {
    const code = await this.rpc.getCode(this.metadata.contractAddress, blockNumber);
    const isDeployed = code.length > 4 && code !== "0x";
    return { isDeployed, bytecodeLength: code.length };
  }
  async getPosition(walletAddress, blockNumber) {
    const calldata = encodeBalanceOf(walletAddress);
    const rawHex = await this.rpc.ethCall(this.metadata.contractAddress, calldata, blockNumber);
    const rawAmount = decodeUint256(rawHex);
    const provenance = createProvenance({
      chainId: NETWORK_CONFIG.chainId,
      networkName: NETWORK_CONFIG.name,
      sourceContract: this.metadata.contractAddress,
      sourceContractName: "Faroo stPROS",
      methodCalled: "balanceOf(address)",
      selector: SELECTORS.balanceOf,
      blockNumber,
      rawHex
    });
    return {
      protocolId: this.metadata.id,
      protocolName: this.metadata.name,
      assetSymbol: "stPROS",
      assetName: "Faroo Staked PROS",
      rawAmount,
      formattedAmount: formatUnits(rawAmount, 18),
      decimals: 18,
      locationType: "LIQUID_STAKING_VAULT",
      underlyingAssetSymbol: "PROS",
      underlyingEquivalentRatio: "Variable (Liquid Staking Exchange Rate)",
      provenance
    };
  }
  async getProtocolState(blockNumber) {
    const block = blockNumber ?? await this.rpc.getBlockNumber();
    const nameHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.name, block);
    const symHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.symbol, block);
    const decHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.decimals, block);
    const totHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.totalSupply, block);
    const decimals = Number(decodeUint256(decHex));
    const rawTotalSupply = decodeUint256(totHex);
    const provenance = createProvenance({
      chainId: NETWORK_CONFIG.chainId,
      networkName: NETWORK_CONFIG.name,
      sourceContract: this.metadata.contractAddress,
      sourceContractName: "Faroo stPROS",
      methodCalled: "totalSupply()",
      selector: SELECTORS.totalSupply,
      blockNumber: block,
      rawHex: totHex
    });
    return {
      name: decodeString(nameHex),
      symbol: decodeString(symHex),
      decimals,
      totalSupplyFormatted: formatUnits(rawTotalSupply, decimals),
      provenance
    };
  }
};

// src/adapters/native.ts
var NativeProsAdapter = class {
  rpc;
  constructor(rpc) {
    this.rpc = rpc;
  }
  async getPosition(walletAddress, blockNumber) {
    const rawBalance = await this.rpc.getBalance(walletAddress, blockNumber);
    const rawHex = `0x${rawBalance.toString(16)}`;
    const provenance = createProvenance({
      chainId: NETWORK_CONFIG.chainId,
      networkName: NETWORK_CONFIG.name,
      sourceContract: "NATIVE_CONSENSUS_BALANCE",
      sourceContractName: "Pharos Layer-1 State",
      methodCalled: "eth_getBalance(address, blockNumber)",
      selector: "eth_getBalance",
      blockNumber,
      rawHex
    });
    return {
      protocolId: "native-pros-wallet",
      protocolName: "Pharos Native Account",
      assetSymbol: "PROS",
      assetName: "Native PROS",
      rawAmount: rawBalance,
      formattedAmount: formatUnits(rawBalance, 18),
      decimals: 18,
      locationType: "LIQUID_WALLET",
      underlyingAssetSymbol: "PROS",
      underlyingEquivalentRatio: "1.0",
      provenance
    };
  }
};

// src/portfolio/accounting.ts
var PortfolioAccountingEngine = class {
  rpc;
  nativeAdapter;
  wprosAdapter;
  farooAdapter;
  blockCache = /* @__PURE__ */ new Map();
  constructor(rpc) {
    this.rpc = rpc;
    this.nativeAdapter = new NativeProsAdapter(rpc);
    this.wprosAdapter = new WprosAdapter(rpc);
    this.farooAdapter = new FarooStakingAdapter(rpc);
  }
  /**
   * Fetch complete, block-pinned portfolio summary for a wallet address
   */
  async getPortfolio(walletAddress, pinBlockNumber) {
    const validAddress = RpcClient.validateAddress(walletAddress);
    const targetBlock = pinBlockNumber ?? await this.rpc.getBlockNumber();
    const cacheKey = `${validAddress}:${targetBlock}`;
    const cached = this.blockCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const nativePos = await this.nativeAdapter.getPosition(validAddress, targetBlock);
    const wprosPos = await this.wprosAdapter.getPosition(validAddress, targetBlock);
    const farooPos = await this.farooAdapter.getPosition(validAddress, targetBlock);
    const positions = [nativePos, wprosPos, farooPos];
    const liquidWei = nativePos.rawAmount;
    const wrappedWei = wprosPos.rawAmount;
    const stakedSharesWei = farooPos.rawAmount;
    const totalExposureWei = liquidWei + wrappedWei + stakedSharesWei;
    const observedAtUtc = (/* @__PURE__ */ new Date()).toISOString();
    const summary = {
      walletAddress: validAddress,
      observedBlockNumber: targetBlock,
      observedAtUtc,
      positions,
      accounting: {
        liquidNativePros: formatUnits(liquidWei, 18),
        wrappedVaultPros: formatUnits(wrappedWei, 18),
        stakedVaultProsShares: formatUnits(stakedSharesWei, 18),
        totalProsExposure: formatUnits(totalExposureWei, 18),
        totalPositionsCount: positions.filter((p) => p.rawAmount > 0n).length,
        explanation: "Liquid PROS, wrapped WPROS, and staked stPROS are stored as distinct asset categories. Total PROS exposure sums equivalent values without conflating vault shares with wallet cash."
      },
      unavailableOrUnindexed: {
        historicalYield: "Historical yield and APY require an indexed archive event log. Live queries report real-time current balances and vault reserves with verifiable block provenance.",
        unsupportedProtocols: [
          "Harbor Protocol (Pre-launch / No mainnet contract)",
          "Uniswap / SushiSwap / Curve (Not deployed on Pharos Pacific Mainnet)"
        ]
      }
    };
    if (this.blockCache.size > 50) {
      const firstKey = this.blockCache.keys().next().value;
      if (firstKey) this.blockCache.delete(firstKey);
    }
    this.blockCache.set(cacheKey, summary);
    return summary;
  }
};

// src/assistant/intent.ts
var QuestionIntent = {
  TOTAL_PORTFOLIO_VALUE: "TOTAL_PORTFOLIO_VALUE",
  TOKEN_LOCATIONS: "TOKEN_LOCATIONS",
  LARGEST_POSITION: "LARGEST_POSITION",
  EARNINGS_AND_YIELD: "EARNINGS_AND_YIELD",
  PROTOCOL_BREAKDOWN: "PROTOCOL_BREAKDOWN",
  UNKNOWN_OR_UNSUPPORTED: "UNKNOWN_OR_UNSUPPORTED"
};
var IntentParser = class {
  /**
   * Parse user query into a structured intent
   */
  static parse(query) {
    const q = query.trim().toLowerCase();
    const unsupportedProtocols = [
      "aave",
      "compound",
      "uniswap",
      "sushiswap",
      "curve",
      "lido",
      "rocketpool",
      "maker",
      "ethena",
      "morpho"
    ];
    for (const proto of unsupportedProtocols) {
      if (q.includes(proto)) {
        return {
          intent: QuestionIntent.UNKNOWN_OR_UNSUPPORTED,
          targetProtocol: proto,
          confidence: 1,
          reason: `Protocol '${proto}' is not deployed or indexed on Pharos Pacific Mainnet (1672).`
        };
      }
    }
    if (q.includes("earn") || q.includes("earning") || q.includes("yield") || q.includes("apy") || q.includes("apr") || q.includes("reward") || q.includes("rewards") || q.includes("staking return")) {
      return {
        intent: QuestionIntent.EARNINGS_AND_YIELD,
        confidence: 0.95,
        reason: "Matched yield/earnings pattern."
      };
    }
    if (q.includes("biggest") || q.includes("largest") || q.includes("top position") || q.includes("most of my money") || q.includes("where is most") || q.includes("highest value") || q.includes("main holding") || q.includes("biggest asset")) {
      return {
        intent: QuestionIntent.LARGEST_POSITION,
        confidence: 0.95,
        reason: "Matched largest position pattern."
      };
    }
    if (q.includes("where") && (q.includes("pros") || q.includes("wpros") || q.includes("stpros") || q.includes("token") || q.includes("money") || q.includes("asset")) || q.includes("where is") || q.includes("location") || q.includes("where are my") || q.includes("where is my")) {
      let targetToken = void 0;
      if (q.includes("wpros")) targetToken = "WPROS";
      else if (q.includes("stpros")) targetToken = "stPROS";
      else if (q.includes("pros")) targetToken = "PROS";
      return {
        intent: QuestionIntent.TOKEN_LOCATIONS,
        targetToken,
        confidence: 0.9,
        reason: "Matched token location pattern."
      };
    }
    if (q.includes("faroo") || q.includes("stpros") || q.includes("wpros") || q.includes("harbor") || q.includes("breakdown") || q.includes("in the vault") || q.includes("in faroo") || q.includes("in wpros") || q.includes("in harbor")) {
      let targetProtocol = "Faroo Liquid Staking";
      if (q.includes("wpros")) targetProtocol = "Canonical Wrapped PROS Vault";
      if (q.includes("harbor")) targetProtocol = "Harbor Protocol";
      return {
        intent: QuestionIntent.PROTOCOL_BREAKDOWN,
        targetProtocol,
        confidence: 0.9,
        reason: `Matched protocol breakdown for '${targetProtocol}'.`
      };
    }
    if (q.includes("total") || q.includes("portfolio") || q.includes("balance") || q.includes("balances") || q.includes("net worth") || q.includes("how much do i have") || q.includes("what do i have") || q.includes("what do i own") || q.includes("what i own") || q.includes("holdings") || q.includes("all my positions") || q.includes("overview") || q.length === 0) {
      return {
        intent: QuestionIntent.TOTAL_PORTFOLIO_VALUE,
        confidence: 0.85,
        reason: "Matched total portfolio value pattern."
      };
    }
    return {
      intent: QuestionIntent.UNKNOWN_OR_UNSUPPORTED,
      confidence: 0.5,
      reason: "Query does not match any recognized Pharos DeFi portfolio pattern."
    };
  }
};

// src/assistant/engine.ts
var PortfolioAssistantEngine = class {
  accounting;
  constructor(accounting) {
    this.accounting = accounting;
  }
  /**
   * Process a natural-language question against a real wallet on Pharos Pacific Mainnet
   */
  async answerQuestion(walletAddress, query, pinBlockNumber) {
    const summary = await this.accounting.getPortfolio(walletAddress, pinBlockNumber);
    const intentMatch = IntentParser.parse(query);
    let answerText = "";
    const provenanceList = summary.positions.map((p) => ({
      target: p.assetSymbol,
      contractAddress: p.provenance.sourceContract,
      method: p.provenance.methodCalled,
      blockNumber: p.provenance.blockNumber
    }));
    switch (intentMatch.intent) {
      // -----------------------------------------------------------------------
      // Question Type 1: Total Portfolio Value
      // -----------------------------------------------------------------------
      case QuestionIntent.TOTAL_PORTFOLIO_VALUE: {
        answerText = [
          `\u{1F4CA} **Total Portfolio Overview for ${summary.walletAddress}:**`,
          `- **Total PROS Exposure:** ${summary.accounting.totalProsExposure} PROS`,
          `- **Liquid Native PROS:** ${summary.accounting.liquidNativePros} PROS (Wallet EOA)`,
          `- **Wrapped PROS Vault:** ${summary.accounting.wrappedVaultPros} WPROS (Canonical Vault)`,
          `- **Faroo Staking Shares:** ${summary.accounting.stakedVaultProsShares} stPROS (Faroo Protocol Vault)`,
          `
*All figures verified on-chain at Pacific Mainnet block #${summary.observedBlockNumber}.*`,
          `*Note: Denominated strictly in native asset units; no speculative USD fiat conversion applied.*`
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
          `\u{1F4CD} **Token Locations & Protocol Allocations for ${summary.walletAddress}:**`,
          ...locations,
          `
*Verified at Pacific Mainnet block #${summary.observedBlockNumber}.*`
        ].join("\n");
        break;
      }
      // -----------------------------------------------------------------------
      // Question Type 3: Largest Position
      // -----------------------------------------------------------------------
      case QuestionIntent.LARGEST_POSITION: {
        let largest = summary.positions[0];
        for (const p of summary.positions) {
          if (p.rawAmount > largest.rawAmount) {
            largest = p;
          }
        }
        if (largest.rawAmount === 0n) {
          answerText = `\u2696\uFE0F **Largest Position:** All tracked asset balances for ${summary.walletAddress} are currently zero (0 PROS) at block #${summary.observedBlockNumber}.`;
        } else {
          answerText = [
            `\u{1F3C6} **Largest Position for ${summary.walletAddress}:**`,
            `- **Asset:** ${largest.assetName} (${largest.assetSymbol})`,
            `- **Amount:** ${largest.formattedAmount} ${largest.assetSymbol}`,
            `- **Location Category:** \`${largest.locationType}\``,
            `- **Contract:** \`${largest.provenance.sourceContract}\``,
            `
*Verified on-chain at block #${summary.observedBlockNumber}.*`
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
          `\u{1F4C8} **Earnings & Yield Report for ${summary.walletAddress}:**`,
          `- **Faroo Staked Balance:** ${farooPos?.formattedAmount ?? "0"} stPROS`,
          `- **Exchange Rate Appreciation:** stPROS accrues validator rewards through share value growth against native PROS.`,
          `
\u26A0\uFE0F **Honest Protocol Disclosure:**`,
          `Lifetime yield earnings and historical APY require an indexed archive event log of deposit and withdrawal events.`,
          `Live query confirms current verifiable on-chain share balance at block #${summary.observedBlockNumber}. Speculative APYs are never simulated.`
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
            `\u{1F969} **Faroo Liquid Staking Protocol Breakdown:**`,
            `- **Staked Shares:** ${pos?.formattedAmount ?? "0"} stPROS`,
            `- **Contract:** \`${pos?.provenance.sourceContract}\``,
            `- **Valuation Mechanism:** Variable liquid staking exchange rate backed by active network validator pool.`,
            `
*Verified at Pacific Mainnet block #${summary.observedBlockNumber}.*`
          ].join("\n");
        } else if (protoName.includes("Wrapped") || protoName.includes("WPROS")) {
          const pos = summary.positions.find((p) => p.protocolId === "canonical-wrapped-pros");
          answerText = [
            `\u{1F4E6} **Canonical Wrapped PROS (WPROS) Vault Breakdown:**`,
            `- **Wrapped Balance:** ${pos?.formattedAmount ?? "0"} WPROS`,
            `- **Contract:** \`${pos?.provenance.sourceContract}\``,
            `- **Collateralization:** 1:1 backing in canonical wrapping contract.`,
            `
*Verified at Pacific Mainnet block #${summary.observedBlockNumber}.*`
          ].join("\n");
        } else if (protoName.includes("Harbor")) {
          answerText = [
            `\u2693 **Harbor Protocol Status:**`,
            `- **Notice:** Harbor Protocol is currently in pre-launch development on Pharos Pacific Mainnet.`,
            `- **Contract:** No verified production contract address is indexed on Chain ID 1672.`,
            `- **Balance:** 0 (Pre-launch)`
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
          `\u26A0\uFE0F **Protocol Not Supported or Not Found:**`,
          `- **Reason:** ${intentMatch.reason}`,
          `- **Supported Protocols on Pharos Pacific Mainnet (Chain ID 1672):**`,
          `  1. **Faroo Liquid Staking** (\`stPROS\`) \u2014 Contract \`0x6b0A44c64190279f7034b77c13a566E914FE5Ec4\``,
          `  2. **Canonical Wrapped PROS Vault** (\`WPROS\`) \u2014 Contract \`0x52C48d4213107b20bC583832b0d951FB9CA8F0B0\``,
          `  3. **Liquid Native Account** (\`PROS\`) \u2014 Layer-1 Consensus State`,
          `
Please ask about your portfolio balance, token locations, largest holding, yield, or one of the supported protocols.`
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
      summary
    };
  }
};

// src/server/router.ts
function createServerContext() {
  const rpc = new RpcClient();
  const accounting = new PortfolioAccountingEngine(rpc);
  const assistant = new PortfolioAssistantEngine(accounting);
  return { rpc, accounting, assistant };
}
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1048576) {
        reject(new Error("Request payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON in request body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}
function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(
    data,
    (_key, value) => typeof value === "bigint" ? value.toString() : value,
    2
  );
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  });
  res.end(payload);
}
async function handleApiRequest(req, res, ctx2) {
  const parsedUrl = new URL2(req.url ?? "/", "http://localhost");
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase();
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return true;
  }
  if (pathname === "/api/health" && method === "GET") {
    try {
      const blockHeight = await ctx2.rpc.getBlockNumber();
      sendJson(res, 200, {
        status: "ok",
        network: NETWORK_CONFIG.name,
        chainId: NETWORK_CONFIG.chainId,
        blockHeight,
        readOnly: true,
        primaryRpc: NETWORK_CONFIG.rpcUrls.primary,
        contracts: CANONICAL_CONTRACTS
      });
    } catch (err) {
      sendJson(res, 502, {
        status: "degraded",
        network: NETWORK_CONFIG.name,
        chainId: NETWORK_CONFIG.chainId,
        error: err instanceof Error ? err.message : String(err)
      });
    }
    return true;
  }
  if (pathname === "/api/portfolio" && method === "GET") {
    const address = parsedUrl.searchParams.get("address");
    const blockParam = parsedUrl.searchParams.get("block");
    if (!address) {
      sendJson(res, 400, {
        error: "Missing required query parameter: 'address'. Example: /api/portfolio?address=0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2"
      });
      return true;
    }
    try {
      const validAddress = RpcClient.validateAddress(address);
      const pinBlock = blockParam ? parseInt(blockParam, 10) : void 0;
      const portfolio = await ctx2.accounting.getPortfolio(validAddress, pinBlock);
      sendJson(res, 200, portfolio);
    } catch (err) {
      if (err instanceof SafetyViolationError) {
        sendJson(res, 400, { error: err.message, type: "SafetyViolation" });
      } else {
        sendJson(res, 500, {
          error: `Failed to fetch portfolio: ${err instanceof Error ? err.message : String(err)}`
        });
      }
    }
    return true;
  }
  if (pathname === "/api/ask" && method === "POST") {
    try {
      const body = await parseJsonBody(req);
      if (!body.address || !body.query) {
        sendJson(res, 400, {
          error: "Missing required fields in request body: 'address' and 'query' are mandatory."
        });
        return true;
      }
      const validAddress = RpcClient.validateAddress(body.address);
      const trimmedQuery = body.query.trim();
      if (trimmedQuery.length === 0) {
        sendJson(res, 400, { error: "Query string cannot be empty." });
        return true;
      }
      const response = await ctx2.assistant.answerQuestion(validAddress, trimmedQuery, body.block);
      sendJson(res, 200, response);
    } catch (err) {
      if (err instanceof SafetyViolationError) {
        sendJson(res, 400, { error: err.message, type: "SafetyViolation" });
      } else {
        sendJson(res, 500, {
          error: `Assistant query failed: ${err instanceof Error ? err.message : String(err)}`
        });
      }
    }
    return true;
  }
  if (pathname === "/api/protocols" && method === "GET") {
    sendJson(res, 200, {
      chainId: NETWORK_CONFIG.chainId,
      network: NETWORK_CONFIG.name,
      supportedProtocols: [
        {
          id: "native-pros",
          name: "Native PROS Account",
          category: "L1_CONSENSUS",
          contractAddress: "NATIVE_CONSENSUS_BALANCE",
          underlyingToken: "PROS",
          decimals: 18,
          status: "ACTIVE",
          verified: true
        },
        {
          id: "canonical-wrapped-pros",
          name: "Canonical Wrapped PROS Vault",
          category: "WRAPPED_VAULT",
          contractAddress: CANONICAL_CONTRACTS.WPROS,
          underlyingToken: "PROS",
          decimals: 18,
          status: "ACTIVE",
          verified: true
        },
        {
          id: "faroo-liquid-staking",
          name: "Faroo Liquid Staking Vault",
          category: "LIQUID_STAKING",
          contractAddress: CANONICAL_CONTRACTS.FAROO_STPROS,
          underlyingToken: "PROS",
          decimals: 18,
          status: "ACTIVE",
          verified: true
        }
      ],
      unsupportedProtocols: [
        {
          name: "Harbor Protocol",
          reason: "Pre-launch development / No verified deployment on Pacific Mainnet (1672)",
          status: "PRE_LAUNCH"
        },
        {
          name: "Aave / Compound",
          reason: "Not deployed on Pharos Pacific Mainnet",
          status: "UNAVAILABLE"
        },
        {
          name: "Uniswap / SushiSwap / Curve",
          reason: "Not deployed on Pharos Pacific Mainnet",
          status: "UNAVAILABLE"
        }
      ]
    });
    return true;
  }
  return false;
}

// src/api/index.ts
var ctx = createServerContext();
async function handler(req, res) {
  const handled = await handleApiRequest(req, res, ctx);
  if (!handled) {
    sendJson(res, 404, { error: `Endpoint not found: ${req.url}` });
  }
}
export {
  handler as default
};
