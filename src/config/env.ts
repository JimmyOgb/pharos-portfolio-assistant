/**
 * Production Environment Configuration & Validation for Pharos Portfolio Assistant
 * Strictly asserts Pharos Pacific Mainnet (Chain ID 1672) and validates all endpoints.
 * Never leaks secret values or credentials.
 */

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export interface ResolvedEnvironment {
  rpcUrl: string;
  chainId: number;
  rpcTimeoutMs: number;
  port: number;
  isProduction: boolean;
}

export interface SafeDiagnostics {
  status: "VALID" | "INVALID";
  chainId: number;
  networkName: string;
  rpcUrl: string;
  rpcTimeoutMs: number;
  port: number;
  nodeVersion: string;
  isProduction: boolean;
  errors?: string[];
}

export function validateEnvironment(env: Record<string, string | undefined> = process.env): ResolvedEnvironment {
  const errors: string[] = [];

  // 1. Validate RPC URL
  const rpcUrl = env.PHAROS_RPC_URL?.trim() || "https://rpc.pharos.xyz";
  try {
    const parsed = new URL(rpcUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      errors.push(`PHAROS_RPC_URL must use http or https protocol. Got: '${parsed.protocol}'`);
    }
  } catch {
    errors.push(`PHAROS_RPC_URL is not a valid URL: '${rpcUrl}'`);
  }

  // 2. Validate Chain ID (Must be 1672 for Pharos Pacific Mainnet)
  let chainId = 1672;
  if (env.PHAROS_CHAIN_ID) {
    const parsedId = parseInt(env.PHAROS_CHAIN_ID, 10);
    if (isNaN(parsedId)) {
      errors.push(`PHAROS_CHAIN_ID must be an integer. Got: '${env.PHAROS_CHAIN_ID}'`);
    } else if (parsedId !== 1672) {
      errors.push(
        `CRITICAL: PHAROS_CHAIN_ID must be 1672 for Pharos Pacific Mainnet. Unsupported Chain ID: ${parsedId}`
      );
    } else {
      chainId = parsedId;
    }
  }

  // 3. Validate RPC Timeout
  let rpcTimeoutMs = 30000;
  if (env.PHAROS_RPC_TIMEOUT_MS) {
    const parsedTimeout = parseInt(env.PHAROS_RPC_TIMEOUT_MS, 10);
    if (isNaN(parsedTimeout) || parsedTimeout <= 0) {
      errors.push(`PHAROS_RPC_TIMEOUT_MS must be a positive integer. Got: '${env.PHAROS_RPC_TIMEOUT_MS}'`);
    } else {
      rpcTimeoutMs = parsedTimeout;
    }
  }

  // 4. Validate Port
  let port = 3000;
  if (env.PORT) {
    const parsedPort = parseInt(env.PORT, 10);
    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      errors.push(`PORT must be a valid port number between 1 and 65535. Got: '${env.PORT}'`);
    } else {
      port = parsedPort;
    }
  }

  if (errors.length > 0) {
    throw new ConfigurationError(`Environment Configuration Failure:\n- ${errors.join("\n- ")}`);
  }

  const isProduction = env.NODE_ENV === "production" || env.VERCEL_ENV === "production";

  return {
    rpcUrl,
    chainId,
    rpcTimeoutMs,
    port,
    isProduction,
  };
}

/**
 * Produce safe diagnostics without exposing sensitive internal values or tokens
 */
export function getSafeDiagnostics(env: Record<string, string | undefined> = process.env): SafeDiagnostics {
  try {
    const resolved = validateEnvironment(env);
    return {
      status: "VALID",
      chainId: resolved.chainId,
      networkName: "Pharos Pacific Mainnet",
      rpcUrl: resolved.rpcUrl,
      rpcTimeoutMs: resolved.rpcTimeoutMs,
      port: resolved.port,
      nodeVersion: process.version,
      isProduction: resolved.isProduction,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errors = errorMessage.split("\n- ").filter((s) => !s.startsWith("Environment Configuration Failure"));
    return {
      status: "INVALID",
      chainId: 1672,
      networkName: "Pharos Pacific Mainnet",
      rpcUrl: env.PHAROS_RPC_URL || "https://rpc.pharos.xyz",
      rpcTimeoutMs: 30000,
      port: 3000,
      nodeVersion: process.version,
      isProduction: env.NODE_ENV === "production",
      errors: errors.length > 0 ? errors : [errorMessage],
    };
  }
}
