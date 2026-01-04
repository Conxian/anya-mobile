import { BlockstreamClient } from './blockstream-client';
import axios from 'axios';
import { Asset } from '../core/domain';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BlockstreamClient', () => {
  let client: BlockstreamClient;
  const asset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };

  beforeEach(() => {
    client = new BlockstreamClient();
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
  });

  it('should get balance for an address', async () => {
    const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
    const response = {
      data: {
        chain_stats: {
          funded_txo_sum: 200000,
          spent_txo_sum: 100000,
        },
      },
    };
    mockedAxios.get.mockResolvedValue(response);
    const balance = await client.getBalance(address, asset);
    expect(balance.amount.value).toBe('0.001');
  });

  it('should correctly parse a multi-input/output transaction', async () => {
    const txid = 'a1b2c3d4';
    const mockTx = {
      data: {
        txid,
        vin: [
          { prevout: { scriptpubkey_address: 'address-from-1', value: 10000 } },
          { prevout: { scriptpubkey_address: 'address-from-2', value: 20000 } },
        ],
        vout: [
          { scriptpubkey_address: 'address-to-1', value: 12000 },
          { scriptpubkey_address: 'address-to-2', value: 17000 },
        ],
        status: { block_time: 123456789 },
      },
    };
    mockedAxios.get.mockResolvedValue(mockTx);

    const tx = await client.getTransaction(txid);

    expect(tx.id).toBe(txid);
    expect(tx.from).toBe('address-from-1');
    expect(tx.to).toBe('address-to-1');
    expect(tx.amount.value).toBe('0.00029'); // 12000 + 17000
    expect(tx.fee.value).toBe('0.00001');   // 30000 - 29000
  });

  it('should broadcast a transaction', async () => {
    const signedTx = { toHex: () => '01000000...' };
    mockedAxios.post.mockResolvedValue({ data: 'mock-txid' });
    const result = await client.broadcastTransaction(signedTx);
    expect(result).toBe('mock-txid');
  });

  it('should return fee estimates in sat/vB', async () => {
    const response = { data: { '1': 20.123, '3': 10.456, '6': 5.789 } };
    mockedAxios.get.mockResolvedValue(response);

    const fees = await client.getFeeEstimates(asset);

    expect(fees.fast.value).toBe('20.123');
    expect(fees.medium.value).toBe('10.456');
    expect(fees.slow.value).toBe('5.789');
  });
});
