import { OracleClient } from '../core/ports';
import { Asset, Price } from '../core/domain';

export class MockOracleClient implements OracleClient {
  async getPrice(asset: Asset, currency: string): Promise<Price> {
    // Return a mock price for testing purposes.
    return {
      asset,
      currency,
      value: '50000.00', // e.g., for BTC in USD
    };
  }
}
