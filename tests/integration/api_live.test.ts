import test from "node:test";
import assert from "node:assert";
import { createAppServer } from "../../src/server/index.ts";
import { CANONICAL_CONTRACTS, NETWORK_CONFIG } from "../../src/config/index.ts";

test("Live API Integration: Full End-to-End Suite against Pharos Pacific Mainnet", { timeout: 120000 }, async () => {
  const server = createAppServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addressInfo = server.address();
  assert.ok(addressInfo && typeof addressInfo === "object");
  const port = addressInfo.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. GET /api/health
    const resHealth = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(resHealth.status, 200);
    const healthData = (await resHealth.json()) as {
      status: string;
      network: string;
      chainId: number;
      blockHeight: number;
    };
    assert.strictEqual(healthData.status, "ok");
    assert.strictEqual(healthData.chainId, NETWORK_CONFIG.chainId);
    assert.ok(healthData.blockHeight > 22000000);

    // 2. GET /api/portfolio (Canonical Deployer)
    const resPort = await fetch(
      `${baseUrl}/api/portfolio?address=${CANONICAL_CONTRACTS.CANONICAL_DEPLOYER}`
    );
    assert.strictEqual(resPort.status, 200);
    const portData = (await resPort.json()) as {
      walletAddress: string;
      observedBlockNumber: number;
      accounting: {
        liquidNativePros: string;
        wrappedVaultPros: string;
        stakedVaultProsShares: string;
        totalProsExposure: string;
      };
      positions: Array<{
        protocolId: string;
        assetSymbol: string;
        formattedAmount: string;
        provenance: {
          blockNumber: number;
          sourceContract: string;
        };
      }>;
    };

    assert.strictEqual(
      portData.walletAddress,
      CANONICAL_CONTRACTS.CANONICAL_DEPLOYER.toLowerCase()
    );
    assert.ok(portData.observedBlockNumber > 22000000);
    assert.strictEqual(portData.positions.length, 3);

    // Assert each bucket provenance is present
    const nativePos = portData.positions.find((p) => p.assetSymbol === "PROS");
    const wprosPos = portData.positions.find((p) => p.assetSymbol === "WPROS");
    const stprosPos = portData.positions.find((p) => p.assetSymbol === "stPROS");

    assert.ok(nativePos && nativePos.provenance.sourceContract === "NATIVE_CONSENSUS_BALANCE");
    assert.ok(wprosPos && wprosPos.provenance.sourceContract === CANONICAL_CONTRACTS.WPROS);
    assert.ok(stprosPos && stprosPos.provenance.sourceContract === CANONICAL_CONTRACTS.FAROO_STPROS);

    // 3. POST /api/ask — 5 Question Categories + 1 Unsupported
    const questions = [
      {
        q: "What is my total portfolio balance?",
        expectedIntent: "TOTAL_PORTFOLIO_VALUE",
      },
      {
        q: "Where are my tokens held?",
        expectedIntent: "TOKEN_LOCATIONS",
      },
      {
        q: "What's my biggest position?",
        expectedIntent: "LARGEST_POSITION",
      },
      {
        q: "What are my staking earnings and yield?",
        expectedIntent: "EARNINGS_AND_YIELD",
      },
      {
        q: "How much PROS do I have in Faroo?",
        expectedIntent: "PROTOCOL_BREAKDOWN",
      },
      {
        q: "What are my Aave positions?",
        expectedIntent: "UNKNOWN_OR_UNSUPPORTED",
      },
    ];

    for (const item of questions) {
      const resAsk = await fetch(`${baseUrl}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: CANONICAL_CONTRACTS.CANONICAL_DEPLOYER,
          query: item.q,
          block: portData.observedBlockNumber,
        }),
      });

      assert.strictEqual(resAsk.status, 200);
      const askData = (await resAsk.json()) as {
        intent: string;
        confidence: number;
        answerText: string;
        blockNumber: number;
        provenanceList: unknown[];
      };

      assert.strictEqual(
        askData.intent,
        item.expectedIntent,
        `Expected intent '${item.expectedIntent}' for query '${item.q}', got '${askData.intent}'`
      );
      assert.ok(askData.confidence >= 0.5);
      assert.ok(askData.answerText.length > 20);
      assert.strictEqual(askData.blockNumber, portData.observedBlockNumber);
      assert.strictEqual(askData.provenanceList.length, 3);
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
