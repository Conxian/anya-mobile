import { EcashService } from '../core/ports';
import {
  Account,
  Amount,
  Balance,
  EcashMint,
  EcashToken,
  TransactionID,
} from '../core/domain';

export class MockEcashClient implements EcashService {
  async mint(mint: EcashMint, amount: Amount): Promise<EcashToken> {
    return {
      mint,
      amount,
      serialized: `cashuA${Math.random().toString(16).substring(2)}`,
    };
  }

  async melt(_token: EcashToken, _invoice: string): Promise<TransactionID> {
    return `melt-${Math.random().toString(16).substring(2)}`;
  }

  async send(
    token: EcashToken,
    amount: Amount
  ): Promise<{ sent: EcashToken; change: EcashToken }> {
    return {
      sent: {
        mint: token.mint,
        amount,
        serialized: `sent-${Math.random().toString(16).substring(2)}`,
      },
      change: {
        mint: token.mint,
        amount: {
          ...token.amount,
          value: (BigInt(token.amount.value) - BigInt(amount.value)).toString(),
        },
        serialized: `change-${Math.random().toString(16).substring(2)}`,
      },
    };
  }

  async getBalance(_account: Account): Promise<Balance> {
    return {
      asset: { symbol: "BTC", name: "Bitcoin", decimals: 8 },
      amount: { value: "0.005", asset: { symbol: "BTC", name: "Bitcoin", decimals: 8 } }
    };
  }

  async receive(token: EcashToken): Promise<Balance> {
    return {
      asset: token.amount.asset,
      amount: token.amount,
    };
  }
}
