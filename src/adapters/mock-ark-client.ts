import { ArkService } from '../core/ports';
import {
  Account,
  Amount,
  ArkASP,
  ArkVTXO,
  Balance,
  PublicKey,
  TransactionID,
  Address,
} from '../core/domain';

export class MockArkClient implements ArkService {
  async lift(
    _account: Account,
    _amount: Amount,
    _asp: ArkASP
  ): Promise<TransactionID> {
    return `ark-lift-${Math.random().toString(16).substring(2)}`;
  }

  async settle(
    _vtxo: ArkVTXO,
    _destinationAddress: Address
  ): Promise<TransactionID> {
    return `ark-settle-${Math.random().toString(16).substring(2)}`;
  }

  async transfer(
    _vtxo: ArkVTXO,
    _recipientPublicKey: PublicKey
  ): Promise<TransactionID> {
    return `ark-transfer-${Math.random().toString(16).substring(2)}`;
  }

  async getVTXOs(_account: Account): Promise<ArkVTXO[]> {
    const asp: ArkASP = {
      id: 'mock-asp-1',
      url: 'https://mock-asp.ark',
      pubkey: '02abc...',
    };
    return [
      {
        id: 'vtxo-1',
        amount: {
          value: '500000',
          asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        },
        asp,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
    ];
  }

  async getBalance(_account: Account): Promise<Balance> {
    return {
      asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      amount: {
        value: '500000',
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      },
    };
  }

  async getTransactionHistory(_account: Account): Promise<any[]> {
    return [];
  }
}
