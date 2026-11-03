/**
 * Native PROS Balance Adapter
 * Reads un-wrapped, liquid native PROS from the user's Externally Owned Account (EOA).
 */

import { RpcClient } from "../rpc/client.ts";
import { NETWORK_CONFIG } from "../config/index.ts";
import { formatUnits } from "../contracts/abi.ts";
import { createProvenance } from "../provenance/index.ts";
import type { AssetPosition } from "../provenance/index.ts";

export class NativeProsAdapter {
  private rpc: RpcClient;

  constructor(rpc: RpcClient) {
    this.rpc = rpc;
  }

  public async getPosition(walletAddress: string, blockNumber: number): Promise<AssetPosition> {
    const rawBalance = await this.rpc.getBalance(walletAddress, blockNumber);
    const rawHex = `0x${rawBalance.toString(16)}`;

    const provenance = createProvenance({
      chainId: NETWORK_CONFIG.chainId,
      networkName: NETWORK_CONFIG.name,
      sourceContract: "NATIVE_CONSENSUS_BALANCE",
      sourceContractName: "Pharos Layer-1 State",
      methodCalled: "eth_getBalance(address, blockNumber)",
      selector: "eth_getBalance",
      blockNumber,
      rawHex,
    });

    return {
      protocolId: "native-pros-wallet",
      protocolName: "Pharos Native Account",
      assetSymbol: "PROS",
      assetName: "Native PROS",
      rawAmount: rawBalance,
      formattedAmount: formatUnits(rawBalance, 18),
      decimals: 18,
      locationType: "LIQUID_WALLET",
      underlyingAssetSymbol: "PROS",
      underlyingEquivalentRatio: "1.0",
      provenance,
    };
  }
}
