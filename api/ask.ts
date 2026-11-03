/**
 * Vercel Serverless Function: POST /api/ask
 * Evaluates natural-language question against on-chain portfolio state.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createServerContext, handleApiRequest } from "../src/server/router.ts";

const ctx = createServerContext();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  req.url = `/api/ask${query}`;
  await handleApiRequest(req, res, ctx);
}
