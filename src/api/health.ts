/**
 * Vercel Serverless Function: GET /api/health
 * Verifies RPC connectivity, connected chain ID (1672), and block height.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createServerContext, handleApiRequest } from "../server/router.ts";

const ctx = createServerContext();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  req.url = `/api/health${query}`;
  await handleApiRequest(req, res, ctx);
}
