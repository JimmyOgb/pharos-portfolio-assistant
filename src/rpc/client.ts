/**
 * Real Read-Only EVM RPC Client for Pharos Pacific Mainnet (Chain ID 1672)
 * Strictly enforces read-only operations, validates addresses, and attaches block numbers.
 * Resilient retry mechanism with exponential backoff for network stability.
 */

import { NETWORK_CONFIG, SAFETY_CONFIG } from "../config/index.ts";

export class RpcError extends Error {
  public readonly code?: number;
  public readonly data?: unknown;

  constructor(message: string, code?: number, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "RpcError";
  }
}

export class SafetyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafetyViolationError";
  }
}

export class RpcClient {
  private primaryUrl: string;
  private timeoutMs: number;

  constructor(
    primaryUrl: string = NETWORK_CONFIG.rpcUrls.primary,
    timeoutMs: number = SAFETY_CONFIG.maxTimeoutMs
  ) {
    this.primaryUrl = primaryUrl;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Validate that an address is a valid 40-hex-character EVM address
   */
  public static validateAddress(address: string): string {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new SafetyViolationError(`Invalid EVM address format: '${address}'`);
    }
    return address.toLowerCase();
  }

  /**
   * Enforce read-only safety guard: reject write-capable methods
   */
  public static validateMethod(method: string): void {
    if ((SAFETY_CONFIG.disallowedWriteMethods as readonly string[]).includes(method)) {
      throw new SafetyViolationError(
        `SAFETY REJECTION: Method '${method}' is write-capable. State modifications and gas expenditure are prohibited.`
      );
    }
  }

  /**
   * Execute raw JSON-RPC 2.0 call with retry and backoff
   */
  public async call<T = unknown>(
    method: string,
    params: unknown[] = [],
    retries: number = 2
  ): Promise<T> {
    RpcClient.validateMethod(method);

    const payload = {
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1000000),
      method,
      params,
    };

    let lastError: unknown;
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
            "User-Agent": "PharosPortfolioAssistant/1.0",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new RpcError(`HTTP ${response.status} from ${this.primaryUrl}`);
        }

        const data = (await response.json()) as {
          result?: T;
          error?: { code: number; message: string; data?: unknown };
        };

        if (data.error) {
          throw new RpcError(data.error.message, data.error.code, data.error.data);
        }

        if (data.result === undefined) {
          throw new RpcError(`Malformed JSON-RPC response from ${this.primaryUrl}: missing result`);
        }

        return data.result;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err instanceof SafetyViolationError) {
          throw err;
        }
      }
    }

    throw new RpcError(
      `RPC call '${method}' failed on ${this.primaryUrl}: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }

  /**
   * Verify connected network matches Pharos Pacific Mainnet (1672)
   */
  public async verifyChainId(): Promise<number> {
    const hexChainId = await this.call<string>("eth_chainId");
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
  public async getBlockNumber(): Promise<number> {
    const hexBlock = await this.call<string>("eth_blockNumber");
    return Number(BigInt(hexBlock));
  }

  /**
   * Get native PROS balance of address in wei (BigInt) at a specific block
   */
  public async getBalance(address: string, blockTag: string | number = "latest"): Promise<bigint> {
    const validAddr = RpcClient.validateAddress(address);
    const tag = typeof blockTag === "number" ? `0x${blockTag.toString(16)}` : blockTag;
    const hexBal = await this.call<string>("eth_getBalance", [validAddr, tag]);
    return BigInt(hexBal);
  }

  /**
   * Get contract bytecode at an address
   */
  public async getCode(address: string, blockTag: string | number = "latest"): Promise<string> {
    const validAddr = RpcClient.validateAddress(address);
    const tag = typeof blockTag === "number" ? `0x${blockTag.toString(16)}` : blockTag;
    return this.call<string>("eth_getCode", [validAddr, tag]);
  }

  /**
   * Execute read-only eth_call to a contract
   */
  public async ethCall(
    to: string,
    data: string,
    blockTag: string | number = "latest"
  ): Promise<string> {
    const validTo = RpcClient.validateAddress(to);
    const tag = typeof blockTag === "number" ? `0x${blockTag.toString(16)}` : blockTag;
    return this.call<string>("eth_call", [
      {
        to: validTo,
        data,
      },
      tag,
    ]);
  }
}
