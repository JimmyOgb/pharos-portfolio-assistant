/**
 * Local HTTP Web Server for Pharos Portfolio Assistant
 * Serves the REST API routes and the interactive single-page dashboard.
 * Zero external npm dependencies.
 */

import { createServer, IncomingMessage, ServerResponse, Server } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServerContext, handleApiRequest, sendJson } from "./router.ts";
import type { ServerContext } from "./router.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UI_DIR = join(__dirname, "..", "ui");

export function createAppServer(ctx?: ServerContext): Server {
  const context = ctx ?? createServerContext();

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // 1. Route to API handlers
      const handled = await handleApiRequest(req, res, context);
      if (handled) return;

      // 2. Route to Static UI Files
      const url = req.url?.split("?")[0] ?? "/";

      if (url === "/" || url === "/index.html") {
        const filePath = join(UI_DIR, "index.html");
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, "utf-8");
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(content);
          return;
        }
      }

      if (url === "/styles.css") {
        const filePath = join(UI_DIR, "styles.css");
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, "utf-8");
          res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
          res.end(content);
          return;
        }
      }

      if (url === "/app.js") {
        const filePath = join(UI_DIR, "app.js");
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, "utf-8");
          res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
          res.end(content);
          return;
        }
      }

      // 404 Not Found
      sendJson(res, 404, { error: `Not Found: ${url}` });
    } catch (err: unknown) {
      sendJson(res, 500, {
        error: `Internal Server Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  });
}

// Start server if run directly
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  const port = parseInt(process.env.PORT ?? "3000", 10);
  const server = createAppServer();

  server.listen(port, () => {
    console.log(`================================================================================`);
    console.log(`     PHAROS PORTFOLIO ASSISTANT — LOCAL UI & API (CHAIN ID 1672)               `);
    console.log(`================================================================================`);
    console.log(` Server running at: http://localhost:${port}`);
    console.log(` Health check:     http://localhost:${port}/api/health`);
    console.log(` Protocols info:   http://localhost:${port}/api/protocols`);
    console.log(` Portfolio query:  http://localhost:${port}/api/portfolio?address=0x13b0...`);
    console.log(` Mode:             Read-Only / Zero Gas / $0.00 Cost`);
    console.log(`================================================================================`);
  });
}
