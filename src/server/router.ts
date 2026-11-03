/**
 * Server-Side API Router for Pharos Portfolio Assistant
 * Strictly enforces read-only operations, validates addresses, and attaches block numbers.
 * Zero private keys, zero write capabilities.
 */

import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { RpcClient, SafetyViolationError } from "../rpc/client.ts";
import { PortfolioAccountingEngine } from "../portfolio/accounting.ts";
import { PortfolioAssistantEngine } from "../assistant/engine.ts";
import { CANONICAL_CONTRACTS, NETWORK_CONFIG } from "../config/index.ts";

export interface ServerContext {
  rpc: RpcClient;
  accounting: PortfolioAccountingEngine;
  assistant: PortfolioAssistantEngine;
}

export function createServerContext(): ServerContext {
  const rpc = new RpcClient();
  const accounting = new PortfolioAccountingEngine(rpc);
  const assistant = new PortfolioAssistantEngine(accounting);
  return { rpc, accounting, assistant };
}

export async function parseJsonBody<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1048576) {
        // 1MB limit
        reject(new Error("Request payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(body) as T);
      } catch (err) {
        reject(new Error("Invalid JSON in request body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const payload = JSON.stringify(
    data,
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: ServerContext
): Promise<boolean> {
  const parsedUrl = new URL(req.url ?? "/", "http://localhost");
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase();

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return true;
  }

  // 1. GET /api/health
  if (pathname === "/api/health" && method === "GET") {
    try {
      const blockHeight = await ctx.rpc.getBlockNumber();
      sendJson(res, 200, {
        status: "ok",
        network: NETWORK_CONFIG.name,
        chainId: NETWORK_CONFIG.chainId,
        blockHeight,
        readOnly: true,
        primaryRpc: NETWORK_CONFIG.rpcUrls.primary,
        contracts: CANONICAL_CONTRACTS,
      });
    } catch (err: unknown) {
      sendJson(res, 502, {
        status: "degraded",
        network: NETWORK_CONFIG.name,
        chainId: NETWORK_CONFIG.chainId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return true;
  }

  // 2. GET /api/portfolio
  if (pathname === "/api/portfolio" && method === "GET") {
    const address = parsedUrl.searchParams.get("address");
    const blockParam = parsedUrl.searchParams.get("block");

    if (!address) {
      sendJson(res, 400, {
        error: "Missing required query parameter: 'address'. Example: /api/portfolio?address=0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2",
      });
      return true;
    }

    try {
      const validAddress = RpcClient.validateAddress(address);
      const pinBlock = blockParam ? parseInt(blockParam, 10) : undefined;
      const portfolio = await ctx.accounting.getPortfolio(validAddress, pinBlock);
      sendJson(res, 200, portfolio);
    } catch (err: unknown) {
      if (err instanceof SafetyViolationError) {
        sendJson(res, 400, { error: err.message, type: "SafetyViolation" });
      } else {
        sendJson(res, 500, {
          error: `Failed to fetch portfolio: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }
    return true;
  }

  // 3. POST /api/ask
  if (pathname === "/api/ask" && method === "POST") {
    try {
      const body = await parseJsonBody<{ address?: string; query?: string; block?: number }>(req);

      if (!body.address || !body.query) {
        sendJson(res, 400, {
          error: "Missing required fields in request body: 'address' and 'query' are mandatory.",
        });
        return true;
      }

      const validAddress = RpcClient.validateAddress(body.address);
      const trimmedQuery = body.query.trim();

      if (trimmedQuery.length === 0) {
        sendJson(res, 400, { error: "Query string cannot be empty." });
        return true;
      }

      const response = await ctx.assistant.answerQuestion(validAddress, trimmedQuery, body.block);
      sendJson(res, 200, response);
    } catch (err: unknown) {
      if (err instanceof SafetyViolationError) {
        sendJson(res, 400, { error: err.message, type: "SafetyViolation" });
      } else {
        sendJson(res, 500, {
          error: `Assistant query failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }
    return true;
  }

  // 4. GET /api/protocols
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
          verified: true,
        },
        {
          id: "canonical-wrapped-pros",
          name: "Canonical Wrapped PROS Vault",
          category: "WRAPPED_VAULT",
          contractAddress: CANONICAL_CONTRACTS.WPROS,
          underlyingToken: "PROS",
          decimals: 18,
          status: "ACTIVE",
          verified: true,
        },
        {
          id: "faroo-liquid-staking",
          name: "Faroo Liquid Staking Vault",
          category: "LIQUID_STAKING",
          contractAddress: CANONICAL_CONTRACTS.FAROO_STPROS,
          underlyingToken: "PROS",
          decimals: 18,
          status: "ACTIVE",
          verified: true,
        },
      ],
      unsupportedProtocols: [
        {
          name: "Harbor Protocol",
          reason: "Pre-launch development / No verified deployment on Pacific Mainnet (1672)",
          status: "PRE_LAUNCH",
        },
        {
          name: "Aave / Compound",
          reason: "Not deployed on Pharos Pacific Mainnet",
          status: "UNAVAILABLE",
        },
        {
          name: "Uniswap / SushiSwap / Curve",
          reason: "Not deployed on Pharos Pacific Mainnet",
          status: "UNAVAILABLE",
        },
      ],
    });
    return true;
  }

  // Not an API route
  return false;
}
