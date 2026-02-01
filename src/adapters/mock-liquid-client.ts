import { SidechainService } from '../core/ports';
import {
  Account,
  Address,
  ConfidentialAsset,
  Amount,
  TransactionID,
  Balance,
  Asset,
} from '../core/domain';

export class MockLiquidClient implements SidechainService {
  async issueAsset(
    account: Account,
    name: string,
    symbol: string,
    amount: bigint
  ): Promise<ConfidentialAsset> {
    return {
      name,
      symbol,
      decimals: 8,
      assetId: Math.random().toString(16).substring(2).padStart(64, '0'),
      isConfidential: true,
    };
  }

  async transferAsset(
    account: Account,
    destinationAddress: Address,
    asset: ConfidentialAsset,
    amount: Amount
  ): Promise<TransactionID> {
    return `liquid-tx-${Math.random().toString(16).substring(2)}`;
  }

  async getBalance(account: Account, asset: Asset): Promise<Balance> {
    return {
      asset,
      amount: { asset, value: '1000' },
    };
  }
}
