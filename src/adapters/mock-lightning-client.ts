import { LightningService } from '../core/ports';
import {
  Account,
  Amount,
  LightningInvoice,
  Balance,
  TransactionID,
} from '../core/domain';

export class MockLightningClient implements LightningService {
  private invoices: Map<string, LightningInvoice> = new Map();

  async createInvoice(
    account: Account,
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

  async payInvoice(account: Account, invoice: string): Promise<TransactionID> {
    return `ln-pay-${Math.random().toString(16).substring(2)}`;
  }

  async getInvoiceStatus(
    paymentHash: string
  ): Promise<'pending' | 'paid' | 'expired'> {
    return 'paid';
  }

  async getBalance(account: Account): Promise<Balance> {
    return {
      asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      amount: {
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        value: '0.1',
      },
    };
  }
}
