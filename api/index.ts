/**
 * Vercel Serverless Function: Catch-All Entrypoint (/api/*)
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createServerContext, handleApiRequest, sendJson } from "../src/server/router.ts";

const ctx = createServerContext();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const handled = await handleApiRequest(req, res, ctx);
  if (!handled) {
    sendJson(res, 404, { error: `Endpoint not found: ${req.url}` });
  }
}
