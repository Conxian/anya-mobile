import { SidechainService } from '../core/ports';
import { Address, Amount, ConfidentialAsset, Balance, TransactionID } from '../core/domain';

export class MockLiquidClient implements SidechainService {
  async transfer(
    to: Address,
    amount: Amount,
    asset: ConfidentialAsset
  ): Promise<TransactionID> {
    console.log(`Transferring ${amount.value} ${asset.symbol} to ${to} on Liquid`);
    return 'mock-liquid-txid';
  }

  async getBalances(): Promise<Balance[]> {
    const lbtc: ConfidentialAsset = {
      symbol: 'L-BTC',
      name: 'Liquid Bitcoin',
      decimals: 8,
      assetHash: '6f02734686445679706d6479747261636b696e675f61737365745f69645f5f5f',
      isBlinded: true,
    };
    return [
      {
        asset: lbtc,
        amount: { asset: lbtc, value: '0.5' },
      },
    ];
  }
}
