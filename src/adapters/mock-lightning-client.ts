import { LightningService, FeeRate } from '../core/ports';
import {
  Account,
  Amount,
  LightningInvoice,
  Balance,
  TransactionID,
  LightningChannel,
} from '../core/domain';

export class MockLightningClient implements LightningService {
  private invoices: Map<string, LightningInvoice> = new Map();

  async createInvoice(
    _account: Account,
    amount: Amount,
    description: string
  ): Promise<LightningInvoice> {
    const paymentHash = Math.random().toString(16).substring(2);
    const invoice: LightningInvoice = {
      id: `ln-inv-${paymentHash}`,
      paymentHash,
      serialized: `lnbc${amount.value}n1...mock...`,
      amount,
      description,
      expiry: 3600,
      timestamp: Date.now(),
    };
    this.invoices.set(paymentHash, invoice);
    return invoice;
  }

  async payInvoice(_account: Account, _invoice: string): Promise<TransactionID> {
    return `ln-pay-${Math.random().toString(16).substring(2)}`;
  }

  async getInvoiceStatus(
    _paymentHash: string
  ): Promise<'pending' | 'paid' | 'expired'> {
    return 'paid';
  }

  async getBalance(_account: Account): Promise<Balance> {
    return {
      asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      amount: {
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        value: '0.1',
      },
    };
  }

  async getTransactionHistory(_account: Account): Promise<any[]> {
    return [];
  }

  async openChannel(
    _account: Account,
    _peerId: string,
    _amount: Amount
  ): Promise<string> {
    return `chan-${Math.random().toString(16).substring(2)}`;
  }

  async closeChannel(channelId: string): Promise<void> {
    console.log(`Closing channel ${channelId}`);
  }

  async listChannels(_account: Account): Promise<LightningChannel[]> {
    return [
      {
        id: 'mock-chan-1',
        peerId: 'peer-1',
        capacity: {
          asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
          value: '1000000',
        },
        localBalance: {
          asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
          value: '500000',
        },
        remoteBalance: {
          asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
          value: '500000',
        },
        isActive: true,
        isPublic: true,
      },
    ];
  }

  async getNodeInfo(): Promise<{ nodePubkey: string; alias?: string }> {
    return {
      nodePubkey: '02abc123...',
      alias: 'Mock Lightning Node',
    };
  }

  async listPayments(_account: Account): Promise<any[]> {
    return [];
  }

  async estimateFee(amount: Amount, _speed: FeeRate): Promise<Amount> {
    return {
      asset: amount.asset,
      value: '1000', // 1000 sats fixed mock fee
    };
  }
}
