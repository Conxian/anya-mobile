import { Wallet, Account, Transaction, Asset, Amount } from './domain';
import { mock, MockProxy } from 'jest-mock-extended';
import { BIP32Interface } from 'bip32';
import { BitcoinWallet } from './wallet';

describe('Domain Objects', () => {
  let mockNode: MockProxy<BIP32Interface>;
  let mockBitcoinWallet: MockProxy<BitcoinWallet>;

  beforeEach(() => {
    mockNode = mock<BIP32Interface>();
    mockBitcoinWallet = mock<BitcoinWallet>();
    // Mock the necessary properties on the node for the Account class getters
    mockNode.publicKey = Buffer.from(
      '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
      'hex'
    );
  });

  it('should be possible to create a Wallet', () => {
    const account = new Account('acc_1', 'My Bitcoin Account', mockNode);

    const wallet: Wallet = {
      id: 'wallet_1',
      bitcoinWallet: mockBitcoinWallet,
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
      psbt: 'cHNidP8BAg==', // Add the required psbt property
    };
    expect(transaction.id).toBe('tx_1');
    expect(transaction.amount.value).toBe('0.5');
  });
});
