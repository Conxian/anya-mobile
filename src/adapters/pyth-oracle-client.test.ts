import { PythOracleClient } from './pyth-oracle-client';
import { HermesClient } from '@pythnetwork/hermes-client';
import { Asset } from '../core/domain';

jest.mock('@pythnetwork/hermes-client');

const MockedHermesClient = HermesClient as jest.MockedClass<
  typeof HermesClient
>;

describe('PythOracleClient', () => {
  let client: PythOracleClient;
  const btc: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };

  beforeEach(() => {
    MockedHermesClient.mockClear();
    client = new PythOracleClient();
  });

  it('should get the price for BTC/USD', async () => {
    const mockPriceUpdates = [
      {
        price: { price: '5000000000000', expo: -8, conf: '100' },
      },
    ];

    (
      MockedHermesClient.prototype.getLatestPriceUpdates as jest.Mock
    ).mockResolvedValue(mockPriceUpdates);

    const price = await client.getPrice(btc, 'USD');

    expect(price.value).toBe('50000');
    expect(
      MockedHermesClient.prototype.getLatestPriceUpdates
    ).toHaveBeenCalledWith([
      '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    ]);
  });

  it('should throw an error for an unsupported asset', async () => {
    const unsupportedAsset: Asset = {
      symbol: 'XYZ',
      name: 'Unsupported',
      decimals: 8,
    };
    await expect(client.getPrice(unsupportedAsset, 'USD')).rejects.toThrow(
      'Price ID not found for XYZ/USD'
    );
  });
});
