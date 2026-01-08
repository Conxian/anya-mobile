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

}
