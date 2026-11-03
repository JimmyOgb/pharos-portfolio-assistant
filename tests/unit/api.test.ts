import test from "node:test";
import assert from "node:assert";
import { EventEmitter } from "node:events";
import { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "../../src/server/router.ts";
import type { ServerContext } from "../../src/server/router.ts";
import { RpcClient } from "../../src/rpc/client.ts";
import { PortfolioAccountingEngine } from "../../src/portfolio/accounting.ts";
import { PortfolioAssistantEngine } from "../../src/assistant/engine.ts";
import { NETWORK_CONFIG } from "../../src/config/index.ts";

function createMockReqRes(method: string, url: string, body?: string) {
  const req = new EventEmitter() as unknown as IncomingMessage;
  req.method = method;
  req.url = url;

  let statusCode = 200;
  let headers: Record<string, string> = {};
  let responseData = "";

  const res = {
    writeHead: (code: number, h?: Record<string, string>) => {
      statusCode = code;
      if (h) headers = { ...headers, ...h };
    },
    end: (chunk?: string) => {
      if (chunk) responseData += chunk;
    },
  } as unknown as ServerResponse;

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getHeaders: () => headers,
    getBody: () => (responseData ? JSON.parse(responseData) : null),
    sendBody: () => {
      if (body !== undefined) {
        req.emit("data", Buffer.from(body));
      }
      req.emit("end");
    },
  };
}

test("API: GET /api/protocols returns supported and unsupported protocol metadata", async () => {
  const rpc = new RpcClient();
  const accounting = new PortfolioAccountingEngine(rpc);
  const assistant = new PortfolioAssistantEngine(accounting);
  const ctx: ServerContext = { rpc, accounting, assistant };

  const { req, res, getStatusCode, getBody } = createMockReqRes("GET", "/api/protocols");
  const handled = await handleApiRequest(req, res, ctx);

  assert.strictEqual(handled, true);
  assert.strictEqual(getStatusCode(), 200);

  const data = getBody();
  assert.strictEqual(data.chainId, NETWORK_CONFIG.chainId);
  assert.strictEqual(data.supportedProtocols.length, 3);
  assert.ok(data.supportedProtocols.some((p: { id: string }) => p.id === "canonical-wrapped-pros"));
  assert.ok(data.supportedProtocols.some((p: { id: string }) => p.id === "faroo-liquid-staking"));
  assert.ok(data.unsupportedProtocols.some((p: { name: string }) => p.name.includes("Harbor")));
  assert.ok(data.unsupportedProtocols.some((p: { name: string }) => p.name.includes("Aave")));
});

test("API: GET /api/portfolio rejects missing address parameter with 400", async () => {
  const rpc = new RpcClient();
  const accounting = new PortfolioAccountingEngine(rpc);
  const assistant = new PortfolioAssistantEngine(accounting);
  const ctx: ServerContext = { rpc, accounting, assistant };

  const { req, res, getStatusCode, getBody } = createMockReqRes("GET", "/api/portfolio");
  const handled = await handleApiRequest(req, res, ctx);

  assert.strictEqual(handled, true);
  assert.strictEqual(getStatusCode(), 400);
  assert.ok(getBody().error.includes("Missing required query parameter"));
});

test("API: GET /api/portfolio rejects invalid EVM address with 400 SafetyViolation", async () => {
  const rpc = new RpcClient();
  const accounting = new PortfolioAccountingEngine(rpc);
  const assistant = new PortfolioAssistantEngine(accounting);
  const ctx: ServerContext = { rpc, accounting, assistant };

  const { req, res, getStatusCode, getBody } = createMockReqRes(
    "GET",
    "/api/portfolio?address=0xinvalidaddress"
  );
  const handled = await handleApiRequest(req, res, ctx);

  assert.strictEqual(handled, true);
  assert.strictEqual(getStatusCode(), 400);
  assert.strictEqual(getBody().type, "SafetyViolation");
});

test("API: POST /api/ask rejects missing body or empty query with 400", async () => {
  const rpc = new RpcClient();
  const accounting = new PortfolioAccountingEngine(rpc);
  const assistant = new PortfolioAssistantEngine(accounting);
  const ctx: ServerContext = { rpc, accounting, assistant };

  const { req, res, getStatusCode, getBody, sendBody } = createMockReqRes(
    "POST",
    "/api/ask",
    JSON.stringify({ address: "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2", query: "   " })
  );

  const handlePromise = handleApiRequest(req, res, ctx);
  sendBody();
  const handled = await handlePromise;

  assert.strictEqual(handled, true);
  assert.strictEqual(getStatusCode(), 400);
  assert.ok(getBody().error.includes("empty"));
});

test("API: OPTIONS preflight returns 204 with CORS headers", async () => {
  const rpc = new RpcClient();
  const accounting = new PortfolioAccountingEngine(rpc);
  const assistant = new PortfolioAssistantEngine(accounting);
  const ctx: ServerContext = { rpc, accounting, assistant };

  const { req, res, getStatusCode, getHeaders } = createMockReqRes("OPTIONS", "/api/portfolio");
  const handled = await handleApiRequest(req, res, ctx);

  assert.strictEqual(handled, true);
  assert.strictEqual(getStatusCode(), 204);
  assert.strictEqual(getHeaders()["Access-Control-Allow-Origin"], "*");
});
