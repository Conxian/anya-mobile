import { AccountService, WalletService } from '../core/ports';
import { Wallet, WalletStatus } from '../core/domain';
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { mock } from 'jest-mock-extended';
import { BitcoinWallet } from './wallet';

const bip32 = BIP32Factory(ecc);

export class WalletServiceImpl implements WalletService {
  constructor(private readonly accountService: AccountService) {}

  async createWallet(
    passphrase: string
  ): Promise<{ wallet: Wallet; mnemonic: string }> {
    const mnemonic = generateMnemonic(wordlist);
    const seed = await mnemonicToSeed(mnemonic, passphrase);
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
    const seed = await mnemonicToSeed(mnemonic, passphrase);
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
}
