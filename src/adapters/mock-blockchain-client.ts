import { BlockchainClient } from '../core/ports';
import {
  Address,
  Asset,
  TransactionID,
  Balance,
  Transaction,
  FeeEstimates,
  UTXO,
} from '../core/domain';

export class MockBlockchainClient implements BlockchainClient {
  async getBalance(address: Address, asset: Asset): Promise<Balance> {
    // Return a mock balance for testing purposes.
    return {
      asset,
      amount: { asset, value: '1.23' },
    };
  }

  async getTransaction(transactionID: TransactionID): Promise<Transaction> {
    // Return a mock transaction for testing purposes.
    const mockAsset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    return {
      id: transactionID,
      from: 'mock-from-address',
      to: 'mock-to-address',
      asset: mockAsset,
      amount: { asset: mockAsset, value: '0.1' },
      fee: { asset: mockAsset, value: '0.0001' },
      timestamp: Date.now(),
      psbt: 'cHNidP8BAg==', // Add the required psbt property
    };
  }

  async broadcastTransaction(
    _signedTransaction: any
  ): Promise<TransactionID> {
    // Return a mock transaction ID for testing purposes.
    return 'mock-transaction-id';
  }

  async getRawTransaction(_transactionID: TransactionID): Promise<string> {
    return '01000000000000000000'; // Mock raw transaction
  }

  async getFeeEstimates(): Promise<FeeEstimates> {
    // Return mock fee estimates for testing purposes.
    return {
      slow: 1,
      medium: 2,
      fast: 3,
    };
  }

  async getUTXOs(_address: Address): Promise<UTXO[]> {
    // Return mock UTXOs for testing purposes.
    return [
      {
        txid: 'mock-txid-1',
        vout: 0,
        value: BigInt(100000),
      },
      {
        txid: 'mock-txid-2',
        vout: 1,
        value: BigInt(200000),
      },
    ];
  }

  async getTransactionHistory(_address: Address): Promise<Transaction[]> {
    // Return a mock transaction history for testing purposes.
    const mockAsset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    return [
      {
        id: 'mock-txid-1',
        from: 'mock-from-address-1',
        to: 'mock-to-address-1',
        asset: mockAsset,
        amount: { asset: mockAsset, value: '0.1' },
        fee: { asset: mockAsset, value: '0.0001' },
        timestamp: Date.now(),
        psbt: 'cHNidP8BAg==',
      },
      {
        id: 'mock-txid-2',
        from: 'mock-from-address-2',
        to: 'mock-to-address-2',
        asset: mockAsset,
        amount: { asset: mockAsset, value: '0.2' },
        fee: { asset: mockAsset, value: '0.0002' },
        timestamp: Date.now(),
        psbt: 'cHNidP8BAg==',
      },
    ];
  }
}
