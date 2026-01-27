import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { ISecureStorageService } from '../services/secure-storage';
import { mnemonicToSeedSync } from '@scure/bip39';

const bip32 = BIP32Factory(ecc);


export class SecureWallet {
  constructor(
    private encryptedMnemonic: string,
    private secureStorage: ISecureStorageService
  ) {}

  async getAddress(index: number, pin: string): Promise<string> {
    const mnemonic = await this.secureStorage.decrypt(this.encryptedMnemonic, pin);
    const seed = mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);
    const path = `m/84'/0'/0'/0/${index}`;
    const child = root.derivePath(path);
    const { address } = bitcoin.payments.p2wpkh({ pubkey: child.publicKey });
    return address!;
  }
}
