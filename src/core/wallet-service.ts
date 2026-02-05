import { AccountService, WalletService } from '../core/ports';
import { Wallet, WalletStatus } from '../core/domain';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { BIP32Factory } from 'bip32';
import ecc from './ecc';
import { mock } from 'jest-mock-extended';
import { BitcoinWallet } from './wallet';
import { CryptoWorkerClient } from './secure-bitcoin-lib';

const bip32 = BIP32Factory(ecc as any);

export class WalletServiceImpl implements WalletService {
  constructor(private readonly accountService: AccountService) {}

  async createWallet(
    passphrase: string
  ): Promise<{ wallet: Wallet; mnemonic: string }> {
    const mnemonic = generateMnemonic(wordlist);
    const seed = await this.runMnemonicToSeedInWorker(mnemonic, passphrase);
    bip32.fromSeed(seed);

    const wallet: Wallet = {
      id: 'wallet-1',
      bitcoinWallet: mock<BitcoinWallet>(),
      accounts: [],
    };

    // Placeholder pin for now. A more robust solution would handle this differently.
    await this.accountService.createAccount(wallet, 'Default Account', '1234');

    return { wallet, mnemonic };
  }

  async loadWalletFromMnemonic(
    mnemonic: string,
    passphrase?: string
  ): Promise<Wallet> {
    const seed = await this.runMnemonicToSeedInWorker(mnemonic, passphrase);
    bip32.fromSeed(seed);

    const wallet: Wallet = {
      id: 'wallet-1',
      bitcoinWallet: mock<BitcoinWallet>(),
      accounts: [],
    };

    // Create a default account if the wallet is new
    if (wallet.accounts.length === 0) {
      // Placeholder pin for now.
      await this.accountService.createAccount(wallet, 'Default Account', '1234');
    }

    return wallet;
  }

  // The service is now stateless, so lock/unlock/status are managed by the client.
  // These methods are kept for interface compatibility but should be deprecated.
  async lockWallet(): Promise<void> {
    console.warn('WalletService is stateless. Lock is managed by the client.');
  }

  async unlockWallet(passphrase: string): Promise<void> {
    console.warn(
      'WalletService is stateless. Unlock is managed by the client.'
    );
  }

  async getWalletStatus(): Promise<WalletStatus> {
    console.warn(
      'WalletService is stateless. Status is managed by the client.'
    );
    return WalletStatus.Unlocked; // Represents an operational, stateless service
  }

  // ⚡ Bolt: DRY up worker logic.
  // This private helper encapsulates the logic for running the CPU-intensive
  // mnemonicToSeed function in a Web Worker, avoiding code duplication
  // in createWallet and loadWalletFromMnemonic. It now uses the shared
  // CryptoWorkerClient for better performance and caching.
  private async runMnemonicToSeedInWorker(
    mnemonic: string,
    passphrase?: string
  ): Promise<Uint8Array> {
    const response = await CryptoWorkerClient.call<{ seed: Uint8Array }>(
      'mnemonicToSeed',
      { mnemonic, passphrase }
    );
    return response.seed;
  }
}
