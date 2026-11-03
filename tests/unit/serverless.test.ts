import test from "node:test";
import assert from "node:assert";
import { EventEmitter } from "node:events";
import { IncomingMessage, ServerResponse } from "node:http";

import healthHandler from "../../api/health.js";
import protocolsHandler from "../../api/protocols.js";
import portfolioHandler from "../../api/portfolio.js";
import askHandler from "../../api/ask.js";
import catchAllHandler from "../../api/index.js";

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

test("Serverless: api/protocols.ts handler returns 200 with supported protocols", async () => {
  const { req, res, getStatusCode, getBody } = createMockReqRes("GET", "/api/protocols");
  await protocolsHandler(req, res);

  assert.strictEqual(getStatusCode(), 200);
  const data = getBody();
  assert.strictEqual(data.chainId, 1672);
  assert.strictEqual(data.supportedProtocols.length, 3);
});

test("Serverless: api/portfolio.ts handler rejects missing address with 400", async () => {
  const { req, res, getStatusCode, getBody } = createMockReqRes("GET", "/api/portfolio");
  await portfolioHandler(req, res);

  assert.strictEqual(getStatusCode(), 400);
  assert.ok(getBody().error.includes("Missing required query parameter"));
});

test("Serverless: api/ask.ts handler rejects empty query with 400", async () => {
  const { req, res, getStatusCode, getBody, sendBody } = createMockReqRes(
    "POST",
    "/api/ask",
    JSON.stringify({ address: "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2", query: "   " })
  );

  const promise = askHandler(req, res);
  sendBody();
  await promise;

  assert.strictEqual(getStatusCode(), 400);
  assert.ok(getBody().error.includes("empty"));
});

test("Serverless: api/index.ts catch-all handler returns 404 for unknown endpoints", async () => {
  const { req, res, getStatusCode, getBody } = createMockReqRes("GET", "/api/unknown-endpoint");
  await catchAllHandler(req, res);

  assert.strictEqual(getStatusCode(), 404);
  assert.ok(getBody().error.includes("not found"));
});
