import { StateChainService } from '../core/ports';
import {
  Account,
  Amount,
  StateChainCoin,
  PublicKey,
  TransactionID,
  Address,
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
    _coin: StateChainCoin,
    _recipientPublicKey: PublicKey
  ): Promise<TransactionID> {
    return `sc-transfer-${Math.random().toString(16).substring(2)}`;
  }

  async withdraw(
    _coin: StateChainCoin,
    _destinationAddress: Address
  ): Promise<TransactionID> {
    return `sc-withdraw-${Math.random().toString(16).substring(2)}`;
  }

  async getBalance(_account: Account): Promise<Balance> {
    const asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    return {
      asset,
      amount: { asset, value: '0.25' }, // Mock balance
    };
  }
}
