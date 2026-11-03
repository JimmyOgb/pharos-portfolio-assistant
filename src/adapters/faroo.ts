/**
 * Faroo Liquid Staking Protocol Adapter
 * Contract Address: 0x6b0A44c64190279f7034b77c13a566E914FE5Ec4 (stPROS)
 * Decimals: 18, Liquid Staking Share
 */

import { RpcClient } from "../rpc/client.ts";
import { CANONICAL_CONTRACTS, NETWORK_CONFIG } from "../config/index.ts";
import {
  encodeBalanceOf,
  decodeUint256,
  decodeString,
  formatUnits,
  SELECTORS,
} from "../contracts/abi.ts";
import { createProvenance } from "../provenance/index.ts";
import type { AssetPosition } from "../provenance/index.ts";
import type { ProtocolAdapter, ProtocolMetadata } from "./types.ts";

export class FarooStakingAdapter implements ProtocolAdapter {
  public readonly metadata: ProtocolMetadata = {
    id: "faroo-liquid-staking",
    name: "Faroo Liquid Staking Vault",
    category: "LIQUID_STAKING",
    contractAddress: CANONICAL_CONTRACTS.FAROO_STPROS,
    underlyingTokenSymbol: "PROS",
    description: "Faroo Liquid Staked PROS (stPROS) token on Pharos Pacific Mainnet",
  };

  private rpc: RpcClient;

  constructor(rpc: RpcClient) {
    this.rpc = rpc;
  }

  public async verifyDeployment(
    blockNumber?: number
  ): Promise<{ isDeployed: boolean; bytecodeLength: number }> {
    const code = await this.rpc.getCode(this.metadata.contractAddress, blockNumber);
    const isDeployed = code.length > 4 && code !== "0x";
    return { isDeployed, bytecodeLength: code.length };
  }

  public async getPosition(walletAddress: string, blockNumber: number): Promise<AssetPosition> {
    const calldata = encodeBalanceOf(walletAddress);
    const rawHex = await this.rpc.ethCall(this.metadata.contractAddress, calldata, blockNumber);
    const rawAmount = decodeUint256(rawHex);

    const provenance = createProvenance({
      chainId: NETWORK_CONFIG.chainId,
      networkName: NETWORK_CONFIG.name,
      sourceContract: this.metadata.contractAddress,
      sourceContractName: "Faroo stPROS",
      methodCalled: "balanceOf(address)",
      selector: SELECTORS.balanceOf,
      blockNumber,
      rawHex,
    });

    return {
      protocolId: this.metadata.id,
      protocolName: this.metadata.name,
      assetSymbol: "stPROS",
      assetName: "Faroo Staked PROS",
      rawAmount,
      formattedAmount: formatUnits(rawAmount, 18),
      decimals: 18,
      locationType: "LIQUID_STAKING_VAULT",
      underlyingAssetSymbol: "PROS",
      underlyingEquivalentRatio: "Variable (Liquid Staking Exchange Rate)",
      provenance,
    };
  }

  public async getProtocolState(blockNumber?: number): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupplyFormatted: string;
    provenance: ReturnType<typeof createProvenance>;
  }> {
    const block = blockNumber ?? (await this.rpc.getBlockNumber());
    const nameHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.name, block);
    const symHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.symbol, block);
    const decHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.decimals, block);
    const totHex = await this.rpc.ethCall(this.metadata.contractAddress, SELECTORS.totalSupply, block);

    const decimals = Number(decodeUint256(decHex));
    const rawTotalSupply = decodeUint256(totHex);

    const provenance = createProvenance({
      chainId: NETWORK_CONFIG.chainId,
      networkName: NETWORK_CONFIG.name,
      sourceContract: this.metadata.contractAddress,
      sourceContractName: "Faroo stPROS",
      methodCalled: "totalSupply()",
      selector: SELECTORS.totalSupply,
      blockNumber: block,
      rawHex: totHex,
    });

    return {
      name: decodeString(nameHex),
      symbol: decodeString(symHex),
      decimals,
      totalSupplyFormatted: formatUnits(rawTotalSupply, decimals),
      provenance,
    };
  }
}
