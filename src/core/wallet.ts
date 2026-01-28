import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { SecureWallet } from './secure-bitcoin-lib';
import { ISecureStorageService } from '../services/secure-storage';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

export class BitcoinWallet {
  private _masterPrivateKey?: string;
  private _p2wpkhAddress?: string;
  private _seed?: Uint8Array;
  private _root?: any;
  public secureWallet: SecureWallet;
  public encryptedMnemonic: string;

  constructor(secureWallet: SecureWallet, encryptedMnemonic: string) {
    this.secureWallet = secureWallet;
    this.encryptedMnemonic = encryptedMnemonic;
  }

  getAddress(index: number, pin: string): Promise<string> {
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
