/**
 * Cryptographic & On-Chain Provenance Data Models
 * Every returned financial figure must explicitly record its source contract and block.
 */

export interface SourceProvenance {
  chainId: number;
  networkName: string;
  sourceContract: string;
  sourceContractName: string;
  methodCalled: string;
  selector: string;
  blockNumber: number;
  observedAtUtc: string;
  rawHex: string;
}

export type AssetLocationType =
  | "LIQUID_WALLET"
  | "CANONICAL_WRAPPING_VAULT"
  | "LIQUID_STAKING_VAULT";

export interface AssetPosition {
  protocolId: string;
  protocolName: string;
  assetSymbol: string;
  assetName: string;
  rawAmount: bigint;
  formattedAmount: string;
  decimals: number;
  locationType: AssetLocationType;
  underlyingAssetSymbol: string;
  underlyingEquivalentRatio: string;
  provenance: SourceProvenance;
}

export interface PortfolioSummary {
  walletAddress: string;
  observedBlockNumber: number;
  observedAtUtc: string;
  positions: AssetPosition[];
  accounting: {
    liquidNativePros: string;
    wrappedVaultPros: string;
    stakedVaultProsShares: string;
    totalProsExposure: string;
    totalPositionsCount: number;
    explanation: string;
  };
  unavailableOrUnindexed: {
    historicalLifetimeRewards: boolean;
    fiatUsdValuation: boolean;
    explanation: string;
  };
}

export function createProvenance(params: {
  chainId: number;
  networkName: string;
  sourceContract: string;
  sourceContractName: string;
  methodCalled: string;
  selector: string;
  blockNumber: number;
  rawHex: string;
}): SourceProvenance {
  return {
    chainId: params.chainId,
    networkName: params.networkName,
    sourceContract: params.sourceContract,
    sourceContractName: params.sourceContractName,
    methodCalled: params.methodCalled,
    selector: params.selector,
    blockNumber: params.blockNumber,
    observedAtUtc: new Date().toISOString(),
    rawHex: params.rawHex,
  };
}
