import { MockOracleClient } from './mock-oracle-client';
import { Asset } from '../core/domain';

describe('MockOracleClient', () => {
  it('should return a mock price', async () => {
    const client = new MockOracleClient();
    const asset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    const price = await client.getPrice(asset, 'USD');

    expect(price).toEqual({
      asset,
      currency: 'USD',
      value: '50000.00',
    });
  });
});
