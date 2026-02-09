import { StateChainService } from '../core/ports';
import {
  Account,
  Amount,
  StateChainCoin,
  PublicKey,
  TransactionID,
  Address,
  Balance,
} from '../core/domain';

export class MockStateChainClient implements StateChainService {
  async deposit(account: Account, amount: Amount): Promise<StateChainCoin> {
    return {
      id: `coin-${Math.random().toString(16).substring(2)}`,
      amount,
      stateChainId: 'mock-statechain-1',
      lockTime: Math.floor(Date.now() / 1000) + 86400,
      isSpent: false,
    };
  }

  async transfer(
    coin: StateChainCoin,
    recipientPublicKey: PublicKey
  ): Promise<TransactionID> {
    return `sc-transfer-${Math.random().toString(16).substring(2)}`;
  }

  async withdraw(
    coin: StateChainCoin,
    destinationAddress: Address
  ): Promise<TransactionID> {
    return `sc-withdraw-${Math.random().toString(16).substring(2)}`;
  }

  async getBalance(_account: Account): Promise<Balance> {
    return {
      asset: { symbol: "BTC", name: "Bitcoin", decimals: 8 },
      amount: { value: "0.012", asset: { symbol: "BTC", name: "Bitcoin", decimals: 8 } }
    };
  }
}
