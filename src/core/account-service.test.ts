import { AccountServiceImpl } from './account-service';
import { Wallet, Account, Asset } from './domain';
import { BlockchainClient } from './ports';
import { mock, MockProxy } from 'jest-mock-extended';
import { SecureStorageService } from '../services/secure-storage';
import { BitcoinWallet } from './wallet';
import { Crypto } from '@peculiar/webcrypto';
import { SecureWallet } from './secure-bitcoin-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

// Set up webcrypto environment
global.crypto = new Crypto();

// Mock the Worker class
class MockWorker {
  onmessage: (event: any) => void = () => {};
  onerror: (error: any) => void = () => {};
  postMessage(message: any) {
    if (message.type === 'getNode') {
      const seed = Buffer.alloc(32);
      seed.fill(1);
      const root = bip32.fromSeed(seed);
      const child = root.derivePath(`m/84'/0'/0'/0/${message.payload.index}`);
      this.onmessage({
        data: {
          status: 'success',
          node: {
            publicKey: child.publicKey.buffer,
            privateKey: child.privateKey!.buffer,
            chainCode: child.chainCode.buffer,
          },
        },
      });
    }
  }
  terminate() {}
}
global.Worker = MockWorker as any;

describe('AccountServiceImpl', () => {
  let accountService: AccountServiceImpl;
  let blockchainClient: MockProxy<BlockchainClient>;
  let wallet: Wallet;
  let secureStorageService: SecureStorageService;
  const pin = '1234';

  beforeEach(async () => {
    blockchainClient = mock<BlockchainClient>();
    secureStorageService = new SecureStorageService();
    accountService = new AccountServiceImpl(blockchainClient);

    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const encryptedMnemonic = await secureStorageService.encrypt(mnemonic, pin);
    const secureWallet = new SecureWallet(encryptedMnemonic, secureStorageService);

    // ⚡ Bolt: Mock the async getAddress method.
    // The refactoring made getAddress asynchronous (using a Web Worker). The test
    // must now mock this method to return a resolved promise with the expected
    // address, preventing the test from trying to spawn a real worker.
    jest
      .spyOn(secureWallet, 'getAddress')
      .mockResolvedValue('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');

    wallet = {
      id: 'wallet-1',
      bitcoinWallet: new BitcoinWallet(secureWallet, encryptedMnemonic),
      accounts: [],
    };
  });

  it('should create a new account and derive the correct address', async () => {
    const newAccount = await accountService.createAccount(
      wallet,
      'New Account',
      pin
    );
    expect(newAccount.name).toBe('New Account');
    expect(wallet.accounts).toHaveLength(1);
    expect(newAccount.address).toBe(
      'bc1qe0g7q5f92pqjy3jfaana4qyzs5y9d2vrdx64ff'
    );
  });

  it('should return all accounts in a wallet', async () => {
    await accountService.createAccount(wallet, 'Account 1', pin);
    await accountService.createAccount(wallet, 'Account 2', pin);
    const accounts = await accountService.getAccounts(wallet);
    expect(accounts).toHaveLength(2);
    expect(accounts[0].name).toBe('Account 1');
    expect(accounts[1].name).toBe('Account 2');
  });

  it('should return the balance for an account', async () => {
    const asset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    const newAccount = await accountService.createAccount(
      wallet,
      'New Account',
      pin
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
