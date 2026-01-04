import { WalletService } from '../core/ports';
import { Wallet, WalletStatus } from '../core/domain';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

export class WalletServiceImpl implements WalletService {
  async createWallet(passphrase: string): Promise<{ wallet: Wallet; mnemonic: string }> {
    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
    const root = bip32.fromSeed(seed);

    const wallet: Wallet = {
      id: 'wallet-1',
      masterPrivateKey: root.toBase58(),
      accounts: [],
    };

    return { wallet, mnemonic };
  }

  async loadWalletFromMnemonic(mnemonic: string, passphrase?: string): Promise<Wallet> {
    const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
    const root = bip32.fromSeed(seed);

    return {
      id: 'wallet-1',
      masterPrivateKey: root.toBase58(),
      accounts: [],
    };
  }

  // The service is now stateless, so lock/unlock/status are managed by the client.
  // These methods are kept for interface compatibility but should be deprecated.
  async lockWallet(): Promise<void> {
    console.warn('WalletService is stateless. Lock is managed by the client.');
  }

  async unlockWallet(passphrase: string): Promise<void> {
    console.warn('WalletService is stateless. Unlock is managed by the client.');
  }

  async getWalletStatus(): Promise<WalletStatus> {
    console.warn('WalletService is stateless. Status is managed by the client.');
    return WalletStatus.Unlocked; // Represents an operational, stateless service
  }
}
