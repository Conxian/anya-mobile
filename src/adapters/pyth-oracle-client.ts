import { OracleClient } from '../core/ports';
import { Asset, Price } from '../core/domain';
import { HermesClient } from '@pythnetwork/hermes-client';

const HERMES_URL = 'https://hermes.pyth.network';

export class PythOracleClient implements OracleClient {
  private hermesClient: HermesClient;

  constructor() {
    this.hermesClient = new HermesClient(HERMES_URL);
  }

  async getPrice(asset: Asset, currency: string): Promise<Price> {
    const priceIds = [this.getPythPriceId(asset, currency)];
    const priceUpdates = await this.hermesClient.getLatestPriceUpdates(priceIds);

    if (!priceUpdates || priceUpdates.length === 0) {
      throw new Error(`Price not found for ${asset.symbol}/${currency}`);
    }

    const priceUpdate: any = priceUpdates[0];
    const price = priceUpdate.price;

    if (!price || typeof price.price !== 'string' || typeof price.expo !== 'number') {
      throw new Error(`Price data not found for ${asset.symbol}/${currency}`);
    }

    const priceValue = Number(price.price) * (10 ** price.expo);

    return {
      asset,
      currency,
      value: priceValue.toString(),
    };
  }

  private getPythPriceId(asset: Asset, currency: string): string {
    const mapping: { [key: string]: string } = {
      'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    };

    const key = `${asset.symbol.toUpperCase()}/${currency.toUpperCase()}`;
    const priceId = mapping[key];

    if (!priceId) {
      throw new Error(`Price ID not found for ${key}`);
    }

    return priceId;
  }
}
