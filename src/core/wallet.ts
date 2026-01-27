import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { SecureWallet } from './secure-bitcoin-lib';
import { ISecureStorageService } from '../services/secure-storage';

export class BitcoinWallet {
  constructor(
    public readonly secureWallet: SecureWallet,
    private encryptedMnemonic: string
  ) {}

  async getAddress(index: number, pin: string): Promise<string> {
    return this.secureWallet.getAddress(index, pin);
  }

  getEncryptedMnemonic(): string {
    return this.encryptedMnemonic;
  }
}

export async function createWallet(
  secureStorage: ISecureStorageService,
  pin: string
): Promise<{ wallet: BitcoinWallet; mnemonic: string }> {
  const mnemonic = generateMnemonic(wordlist);
  const encryptedMnemonic = await secureStorage.encrypt(mnemonic, pin);
  const secureWallet = new SecureWallet(encryptedMnemonic, secureStorage);
  const wallet = new BitcoinWallet(secureWallet, encryptedMnemonic);
  return { wallet, mnemonic };
}
