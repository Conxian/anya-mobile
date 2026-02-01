import { StateChainService } from '../core/ports';
import { StateChainCoin, TransactionID } from '../core/domain';

export class MockStateChainClient implements StateChainService {
  async deposit(amountSats: bigint): Promise<StateChainCoin> {
    return {
      coinId: 'mock-coin-id',
      stateChainId: 'mock-statechain-id',
      amountSats,
      lockTime: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
      address: 'mock-statechain-address',
    };
  }

  async transfer(coin: StateChainCoin, toPublicKey: string): Promise<void> {
    console.log(`Transferring StateChain coin ${coin.coinId} to ${toPublicKey}`);
  }

  async withdraw(coin: StateChainCoin, toAddress: string): Promise<TransactionID> {
    console.log(`Withdrawing StateChain coin ${coin.coinId} to ${toAddress}`);
    return 'mock-withdraw-txid';
  }

  async getCoins(): Promise<StateChainCoin[]> {
    return [
      {
        coinId: 'mock-coin-1',
        stateChainId: 'mock-statechain-1',
        amountSats: BigInt(500000),
        lockTime: Math.floor(Date.now() / 1000) + 86400 * 7,
        address: 'mock-address-1',
      },
    ];
  }
}
