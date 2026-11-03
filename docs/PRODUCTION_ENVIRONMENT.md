# Pharos Portfolio Assistant — Production Environment Configuration Guide

## Overview

The Pharos Portfolio Assistant is a **100% read-only, keyless** multi-protocol DeFi analytics agent for **Pharos Pacific Mainnet (Chain ID 1672)**.

The application requires **zero private keys, zero wallet mnemonics, and zero paid API credentials**. All environment variables configure network RPC routing, timeouts, and chain assertion.

---

## 1. Environment Variable Reference Matrix

| Variable Name | Purpose | Required | Scope | Environment | Safe Default | Secret? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PHAROS_RPC_URL` | Upstream JSON-RPC 2.0 endpoint for Pharos Pacific Mainnet | No (Has safe default) | Server-only | Production, Preview, Dev | `https://rpc.pharos.xyz` | **No** (Public endpoint) |
| `PHAROS_CHAIN_ID` | Asserts target network Chain ID. **Must equal 1672.** | No (Defaults to 1672) | Server-only | Production, Preview, Dev | `1672` | **No** (Public chain ID) |
| `PHAROS_RPC_TIMEOUT_MS` | Max latency threshold for upstream EVM RPC calls | No (Has safe default) | Server-only | Production, Preview, Dev | `30000` (30 seconds) | **No** (Numeric timeout) |
| `PORT` | Local TCP port binding for standalone server | No (Has safe default) | Local-only | Local Development only | `3000` | **No** (Port number) |
| `NODE_ENV` | Node.js execution environment | Recommended | Server-only | Production, Preview, Dev | `production` | **No** (Standard flag) |

---

## 2. Security Safeguards

1. **Zero Key Storage:** The application codebase contains no logic for signing transactions or storing private keys.
2. **Chain ID Enforcement:** The environment validator (`src/config/env.ts`) strictly asserts that `PHAROS_CHAIN_ID` is `1672`. Any attempt to configure another chain (e.g., Ethereum Mainnet `1` or testnets) throws a fatal `ConfigurationError` and aborts execution, preventing accidental cross-chain confusion.
3. **No Browser Secret Exposure:** No environment variable is prefixed with `NEXT_PUBLIC_` or embedded into client-side bundles. All RPC communication originates from serverless functions.
4. **Endpoint Sanitization:** The RPC client strictly allowlists read-only methods (`eth_call`, `eth_getBalance`, `eth_blockNumber`, `eth_getCode`) and rejects any write methods (`eth_sendTransaction`, `sign`).

---

## 3. Step-by-Step Vercel Configuration Instructions

When deploying the project to Vercel in future release gates, follow these exact steps:

### Step 1: Open Project in Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Select your `pharos-portfolio-assistant` project.

### Step 2: Open Environment Variables Settings
1. Click the **Settings** tab in the top navigation bar.
2. In the left sidebar, click **Environment Variables**.

### Step 3: Add Variables
Add the following key-value pairs:

#### Variable 1: Primary RPC URL
- **Key:** `PHAROS_RPC_URL`
- **Value:** `https://rpc.pharos.xyz`
- **Target Environments:** Check all boxes:
  - [x] Production
  - [x] Preview
  - [x] Development

#### Variable 2: Target Chain ID
- **Key:** `PHAROS_CHAIN_ID`
- **Value:** `1672`
- **Target Environments:**
  - [x] Production
  - [x] Preview
  - [x] Development

#### Variable 3: RPC Timeout Threshold
- **Key:** `PHAROS_RPC_TIMEOUT_MS`
- **Value:** `30000`
- **Target Environments:**
  - [x] Production
  - [x] Preview
  - [x] Development

### Step 4: Save & Trigger Redeployment
1. Click **Save** for each variable.
2. Navigate to the **Deployments** tab.
3. Click the three dots (`...`) on the latest deployment and select **Redeploy** (or push a new commit) to apply the environment configuration.

### Step 5: Verification of Live Environment
After deployment, confirm network health by visiting your production URL:
```
https://<your-vercel-domain>.vercel.app/api/health
```
Expected response:
```json
{
  "status": "ok",
  "network": "Pharos Pacific Mainnet",
  "chainId": 1672,
  "blockHeight": 22008...,
  "readOnly": true
}
```
If `chainId` is `1672` and `status` is `"ok"`, the production environment is verified and operational.
