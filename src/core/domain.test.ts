import { Wallet, Account, Transaction, Asset, Amount, AddressType } from './domain';
import { mock, MockProxy } from 'jest-mock-extended';
import { BIP32Interface } from 'bip32';
import { BitcoinWallet } from './wallet';
import * as bitcoin from 'bitcoinjs-lib';

describe('Domain Objects', () => {
  let mockNode: MockProxy<BIP32Interface>;
  let mockBitcoinWallet: MockProxy<BitcoinWallet>;

  beforeEach(() => {
    mockNode = mock<BIP32Interface>();
    mockBitcoinWallet = mock<BitcoinWallet>();
    // Mock the necessary properties on the node for the Account class getters
    mockNode.publicKey = Uint8Array.from(Buffer.from(
      '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
      'hex'
    ));
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

  it('should generate a native SegWit (P2WPKH) address for the specified network', () => {
    const mainnetAccount = new Account('acc_1', 'My Bitcoin Account', mockNode, bitcoin.networks.bitcoin, AddressType.NativeSegWit);
    expect(mainnetAccount.address).toBe(
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
    );

    const testnetAccount = new Account('acc_2', 'My Testnet Account', mockNode, bitcoin.networks.testnet, AddressType.NativeSegWit);
    expect(testnetAccount.address).toBe(
      'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'
    );
  });

  it('should generate a Legacy (P2PKH) address for the specified network', () => {
    const mainnetAccount = new Account('acc_1', 'My Bitcoin Account', mockNode, bitcoin.networks.bitcoin, AddressType.Legacy);
    expect(mainnetAccount.address).toBe(
      '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH'
    );

    const testnetAccount = new Account('acc_2', 'My Testnet Account', mockNode, bitcoin.networks.testnet, AddressType.Legacy);
    expect(testnetAccount.address).toBe(
      'mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r'
    );
  });

  it('should generate a Taproot (P2TR) address for the specified network', () => {
    const mainnetAccount = new Account('acc_1', 'My Bitcoin Account', mockNode, bitcoin.networks.bitcoin, AddressType.Taproot);
    expect(mainnetAccount.address).toBe(
      'bc1pmfr3p9j00pfxjh0zmgp99y8zftmd3s5pmedqhyptwy6lm87hf5sspknck9'
    );

    const testnetAccount = new Account('acc_2', 'My Testnet Account', mockNode, bitcoin.networks.testnet, AddressType.Taproot);
    expect(testnetAccount.address).toBe(
      'tb1pmfr3p9j00pfxjh0zmgp99y8zftmd3s5pmedqhyptwy6lm87hf5ssk79hv2'
    );
  });
});
