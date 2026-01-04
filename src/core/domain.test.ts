import { Wallet, Account, Transaction, Asset, Amount } from './domain';

describe('Domain Objects', () => {
  it('should be possible to create a Wallet', () => {
    const asset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    const account: Account = {
      id: 'acc_1',
      name: 'My Bitcoin Account',
      address: 'bc1q...',
      privateKey: '...',
      publicKey: '...',
    };
    const wallet: Wallet = {
      id: 'wallet_1',
      masterPrivateKey: '...',
      accounts: [account],
    };
    expect(wallet.id).toBe('wallet_1');
    expect(wallet.accounts.length).toBe(1);
  });

  it('should be possible to create a Transaction', () => {
    const asset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    const amount: Amount = { value: '0.5', asset };
    const transaction: Transaction = {
      id: 'tx_1',
      from: 'bc1q...',
      to: 'bc1p...',
      asset: asset,
      amount: amount,
      fee: { value: '0.0001', asset },
      timestamp: Date.now(),
    };
    expect(transaction.id).toBe('tx_1');
    expect(transaction.amount.value).toBe('0.5');
  });
});
