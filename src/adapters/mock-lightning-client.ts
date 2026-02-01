import { LightningService } from '../core/ports';
import { LightningInvoice } from '../core/domain';

export class MockLightningClient implements LightningService {
  async createInvoice(amountSats: bigint, memo?: string): Promise<LightningInvoice> {
    return {
      bolt11: 'lnbc1...',
      amountSats,
      expiry: 3600,
      memo,
      paymentHash: 'mock-payment-hash',
    };
  }

  async payInvoice(bolt11: string): Promise<void> {
    console.log(`Paying lightning invoice: ${bolt11}`);
  }

  async getBalance(): Promise<bigint> {
    return BigInt(1000000); // 1M sats
  }
}
