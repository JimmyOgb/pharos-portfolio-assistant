# PHAROS TASK 14 — GATE 5A: PREFLIGHT REPORT
## Vercel Packaging & Production Environment Preflight Verification

- **Project:** Pharos Portfolio Assistant
- **Task Slug:** `portfolio-assistant`
- **Network:** Pharos Pacific Mainnet (Chain ID `1672`, `0x688`)
- **Workspace:** `C:\Users\NO GO NO\PharosBuild\skills\pharos-portfolio-assistant`
- **Date:** 2026-11-03
- **Gate:** Gate 5A (Vercel-Compatible Packaging & Production Environment Configuration)

---

## 1. Baseline & Workspace Inspection

1. **Workspace Path:**
   - Verified path: `C:\Users\NO GO NO\PharosBuild\skills\pharos-portfolio-assistant`
   - Active and isolated.
2. **Gate 4 Audit Baseline:**
   - Confirmed existence of all 9 Gate 4 audit reports in `docs/audit/gate-4/`:
     - `PHAROS_TASK14_GATE4_INTEGRITY_REPORT.md`
     - `PHAROS_TASK14_GATE4_PROTOCOL_ELIGIBILITY.md`
     - `PHAROS_TASK14_GATE4_STPROS_VALUATION.md`
     - `PHAROS_TASK14_GATE4_ACCOUNTING_AUDIT.md`
     - `PHAROS_TASK14_GATE4_API_SECURITY_AUDIT.md`
     - `PHAROS_TASK14_GATE4_PROVENANCE_AUDIT.md`
     - `PHAROS_TASK14_GATE4_QUESTION_ACCEPTANCE.md`
     - `PHAROS_TASK14_GATE4_PRODUCTION_READINESS.md`
     - `PHAROS_TASK14_GATE4_FINAL_FINDINGS.md`
3. **Repository State & Isolation:**
   - Confirmed `.git` does not exist (`Test-Path ".git"` returned `False`).
   - Confirmed all 10 protected skill workspaces and Task 13 (`pharos-docs-chain-agent`) remain completely untouched.
4. **Current Source Hash Baseline (SHA-256):**
   - Verified and recorded initial hashes for all 18 source files in `src/`.

---

## 2. Server Architecture & Vercel Packaging Gap

### Current Local Implementation:
- Uses a persistent Node.js `node:http` server via `createAppServer()` in `src/server/index.ts`.
- Serves static assets from `src/ui/` and routes API requests via `handleApiRequest(req, res, ctx)` in `src/server/router.ts`.

### Vercel Serverless Requirements:
1. **Serverless Functions in `api/`:**
   - Vercel automatically deploys files in the root `api/` directory as serverless functions.
   - Handlers receive standard `(req: IncomingMessage, res: ServerResponse)` objects.
   - Entrypoints required:
     - `api/health.ts` $\to$ `/api/health`
     - `api/portfolio.ts` $\to$ `/api/portfolio`
     - `api/ask.ts` $\to$ `/api/ask`
     - `api/protocols.ts` $\to$ `/api/protocols`
     - `api/index.ts` $\to$ Catch-all router fallback
2. **Static Asset Directory (`public/`):**
   - Vercel serves static assets from a root `public/` directory with global CDN caching.
   - We will provide `public/` with `index.html`, `styles.css`, and `app.js` while maintaining `src/ui/` for local running.
3. **`vercel.json` Configuration:**
   - Routing rewrites to ensure clean static asset delivery and serverless API proxying.
4. **Local Development Preservation:**
   - `npm run serve` and `node --experimental-strip-types src/server/index.ts` will remain fully functional and independent of Vercel.

---

## 3. Environment Variable Strategy

### Identified Configuration Needs:
1. `PHAROS_RPC_URL` — Primary Pacific Mainnet RPC (Default: `https://rpc.pharos.xyz`).
2. `PHAROS_CHAIN_ID` — Target chain identifier (Default / Strict Constraint: `1672`).
3. `PHAROS_RPC_TIMEOUT_MS` — Upstream timeout in milliseconds (Default: `30000`).
4. `PORT` — Local server port binding (Default: `3000`).

### Production Safety Requirements:
- A dedicated validator (`src/config/env.ts`) will enforce that if `PHAROS_CHAIN_ID` is defined, it **must** equal `1672` (rejecting misconfiguration).
- The validator will ensure `PHAROS_RPC_URL` is a valid HTTP/HTTPS URL.
- Zero secrets or credentials will be logged or exposed to the client.
- `.env.example` will be provided with safe production defaults.

---

## 4. Preflight Conclusion

The preflight inspection is complete. System is ready to proceed with Vercel serverless adaptation and environment configuration.
