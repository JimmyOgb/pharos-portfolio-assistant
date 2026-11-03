/**
 * Protocol Adapter Interfaces
 */

import type { AssetPosition, SourceProvenance } from "../provenance/index.ts";

export interface ProtocolMetadata {
  id: string;
  name: string;
  category: "LIQUID_STAKING" | "CANONICAL_WRAPPER" | "LENDING" | "VAULT";
  contractAddress: string;
  underlyingTokenSymbol: string;
  isIndependentProtocol: boolean;
  officialDocsUrl: string;
}

export interface ProtocolAdapter {
  readonly metadata: ProtocolMetadata;

  /**
   * Verify on-chain deployment & bytecode
   */
  verifyDeployment(blockNumber?: number): Promise<{ isDeployed: boolean; bytecodeLength: number }>;

  /**
   * Read wallet's position in this protocol at a pinned block
   */
  getPosition(walletAddress: string, blockNumber: number): Promise<AssetPosition>;

  /**
   * Read protocol-level metrics (totalSupply, name, symbol, decimals)
   */
  getProtocolState(blockNumber?: number): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupplyFormatted: string;
    provenance: SourceProvenance;
  }>;
}
