/**
 * Startup Environment Diagnostic CLI
 * Runs environment validation and reports configuration status.
 */

import { getSafeDiagnostics } from "./env.ts";

const diag = getSafeDiagnostics();

console.log("================================================================================");
console.log("       PHAROS PORTFOLIO ASSISTANT — PRODUCTION CONFIGURATION AUDIT              ");
console.log("================================================================================");
console.log(` Status:           ${diag.status === "VALID" ? "✅ VALID" : "❌ INVALID"}`);
console.log(` Network:          ${diag.networkName}`);
console.log(` Chain ID:         ${diag.chainId} (Pharos Pacific Mainnet)`);
console.log(` Primary RPC:      ${diag.rpcUrl}`);
console.log(` RPC Timeout:      ${diag.rpcTimeoutMs} ms`);
console.log(` Bound Port:       ${diag.port}`);
console.log(` Node.js Runtime:  ${diag.nodeVersion}`);
console.log(` Environment:      ${diag.isProduction ? "Production" : "Development / Local"}`);
console.log("================================================================================");

if (diag.status === "INVALID" && diag.errors) {
  console.error("Configuration Errors:");
  for (const err of diag.errors) {
    console.error(` - ❌ ${err}`);
  }
  process.exit(1);
} else {
  console.log("All environment variables verified. Application is production-ready.");
}
