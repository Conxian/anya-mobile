import { MockBlockchainClient } from './mock-blockchain-client';
import { Asset } from '../core/domain';

describe('MockBlockchainClient', () => {
  let client: MockBlockchainClient;
  const mockAsset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };

  beforeEach(() => {
    client = new MockBlockchainClient();
  });

  it('should return a mock balance', async () => {
    const balance = await client.getBalance('test-address', mockAsset);
    expect(balance.asset).toEqual(mockAsset);
    expect(balance.amount.value).toBe('1.23');
  });

  it('should return a mock transaction', async () => {
    const transaction = await client.getTransaction('test-tx-id');
    expect(transaction.id).toBe('test-tx-id');
    expect(transaction.asset.symbol).toBe('BTC');
  });

  it('should return a mock transaction ID', async () => {
    const mockTransaction: any = {}; // We don't need a full transaction object for the mock.
    const txId = await client.broadcastTransaction(mockTransaction);
    expect(txId).toBe('mock-transaction-id');
  });

  it('should return mock fee estimates', async () => {
    const fees = await client.getFeeEstimates();
    expect(fees.slow).toBe(1);
    expect(fees.medium).toBe(2);
    expect(fees.fast).toBe(3);
  });
});
