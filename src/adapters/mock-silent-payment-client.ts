import { SilentPaymentService } from '../core/ports';
import {
  Account,
  SilentPaymentAddress,
  Transaction,
} from '../core/domain';

export class MockSilentPaymentClient implements SilentPaymentService {
  async generateAddress(_account: Account): Promise<SilentPaymentAddress> {
    // Mocking a Silent Payment address (BIP 352)
    return `sp1qq${Math.random().toString(16).substring(2)}v9pkf9hpxsqv5hpxsqv5hpxsqv5hpxsqv5hpxsqv5hpxsqv5hpxsqv5hpxsqv5hpxsq`;
  }

  async scanForPayments(_account: Account): Promise<Transaction[]> {
    return []; // Return empty history for now
  }
}
