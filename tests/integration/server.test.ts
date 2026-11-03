import test from "node:test";
import assert from "node:assert";
import { createAppServer } from "../../src/server/index.ts";
import { NETWORK_CONFIG } from "../../src/config/index.ts";

test("Server Integration: Serves HTML, CSS, JS, and API routes on local port", async () => {
  const server = createAppServer();

  // Listen on ephemeral port (0 selects random available OS port)
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addressInfo = server.address();
  assert.ok(addressInfo && typeof addressInfo === "object");
  const port = addressInfo.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. GET / (HTML Dashboard)
    const resHtml = await fetch(`${baseUrl}/`);
    assert.strictEqual(resHtml.status, 200);
    assert.ok(resHtml.headers.get("content-type")?.includes("text/html"));
    const htmlBody = await resHtml.text();
    assert.ok(htmlBody.includes("Pharos Portfolio Assistant"));
    assert.ok(htmlBody.includes("Total PROS Exposure"));
    assert.ok(htmlBody.includes("Canonical Wrapped PROS"));
    assert.ok(htmlBody.includes("Faroo Liquid Staking"));

    // 2. GET /styles.css
    const resCss = await fetch(`${baseUrl}/styles.css`);
    assert.strictEqual(resCss.status, 200);
    assert.ok(resCss.headers.get("content-type")?.includes("text/css"));
    const cssBody = await resCss.text();
    assert.ok(cssBody.includes("--bg-primary"));

    // 3. GET /app.js
    const resJs = await fetch(`${baseUrl}/app.js`);
    assert.strictEqual(resJs.status, 200);
    assert.ok(resJs.headers.get("content-type")?.includes("application/javascript"));
    const jsBody = await resJs.text();
    assert.ok(jsBody.includes("inspectPortfolio"));

    // 4. GET /api/protocols
    const resProto = await fetch(`${baseUrl}/api/protocols`);
    assert.strictEqual(resProto.status, 200);
    const protoData = (await resProto.json()) as { chainId: number; supportedProtocols: unknown[] };
    assert.strictEqual(protoData.chainId, NETWORK_CONFIG.chainId);
    assert.strictEqual(protoData.supportedProtocols.length, 3);

    // 5. GET /404 for unknown path
    const res404 = await fetch(`${baseUrl}/api/nonexistent`);
    assert.strictEqual(res404.status, 404);

  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
