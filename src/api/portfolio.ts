/**
 * Vercel Serverless Function: GET /api/portfolio
 * Returns block-pinned portfolio summary and cryptographic provenance.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createServerContext, handleApiRequest } from "../server/router.ts";

const ctx = createServerContext();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  req.url = `/api/portfolio${query}`;
  await handleApiRequest(req, res, ctx);
}
