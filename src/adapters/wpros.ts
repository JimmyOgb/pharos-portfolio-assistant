/**
 * Canonical Wrapped PROS (WPROS) Protocol Adapter
 * Contract Address: 0x52C48d4213107b20bC583832b0d951FB9CA8F0B0
 * Decimals: 18, 1:1 Wrapping Vault
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

export class WprosAdapter implements ProtocolAdapter {
  public readonly metadata: ProtocolMetadata = {
    id: "canonical-wrapped-pros",
    name: "Canonical Wrapped PROS Vault",
    category: "WRAPPED_VAULT",
    contractAddress: CANONICAL_CONTRACTS.WPROS,
    underlyingTokenSymbol: "PROS",
    description: "Official canonical WPROS wrapping vault on Pharos Pacific Mainnet",
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
      sourceContractName: "WPROS",
      methodCalled: "balanceOf(address)",
      selector: SELECTORS.balanceOf,
      blockNumber,
      rawHex,
    });

    return {
      protocolId: this.metadata.id,
      protocolName: this.metadata.name,
      assetSymbol: "WPROS",
      assetName: "Wrapped PROS",
      rawAmount,
      formattedAmount: formatUnits(rawAmount, 18),
      decimals: 18,
      locationType: "CANONICAL_WRAPPING_VAULT",
      underlyingAssetSymbol: "PROS",
      underlyingEquivalentRatio: "1.0",
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
      sourceContractName: "WPROS",
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
