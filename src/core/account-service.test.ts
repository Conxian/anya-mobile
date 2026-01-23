import { AccountServiceImpl } from './account-service';
import { Wallet, Account, Asset } from './domain';
import { BlockchainClient } from './ports';
import { mock, MockProxy } from 'jest-mock-extended';
import { mnemonicToSeed } from '@scure/bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

describe('AccountServiceImpl', () => {
  let accountService: AccountServiceImpl;
  let blockchainClient: MockProxy<BlockchainClient>;
  let wallet: Wallet;

  beforeEach(async () => {
    blockchainClient = mock<BlockchainClient>();
    accountService = new AccountServiceImpl(blockchainClient);
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const seed = await mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed);
    wallet = {
      id: 'wallet-1',
      masterPrivateKey: root.toBase58(),
      accounts: [],
    };
  });

  it('should create a new account and derive the correct address', async () => {
    const newAccount = await accountService.createAccount(
      wallet,
      'New Account'
    );
    expect(newAccount.name).toBe('New Account');
    expect(wallet.accounts).toHaveLength(1);
    expect(newAccount.address).toBe(
      'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu'
    );
  });

  it('should return all accounts in a wallet', async () => {
    await accountService.createAccount(wallet, 'Account 1');
    await accountService.createAccount(wallet, 'Account 2');
    const accounts = await accountService.getAccounts(wallet);
    expect(accounts).toHaveLength(2);
    expect(accounts[0].name).toBe('Account 1');
    expect(accounts[1].name).toBe('Account 2');
  });

  it('should return the balance for an account', async () => {
    const asset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    const newAccount = await accountService.createAccount(
      wallet,
      'New Account'
    );
    blockchainClient.getBalance.mockResolvedValue({
      asset,
      amount: { asset, value: '1' },
    });
    const balance = await accountService.getAccountBalance(newAccount, asset);
    expect(balance.amount.value).toBe('1');
    expect(blockchainClient.getBalance).toHaveBeenCalledWith(
      newAccount.address,
      asset
    );
  });
});
