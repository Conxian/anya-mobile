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

// ⚡ Bolt: Offload mnemonic generation to the crypto worker.
// This function communicates with the crypto worker to generate a mnemonic
// asynchronously, preventing the UI from freezing during this CPU-intensive
// task. It returns a promise that resolves with the generated mnemonic.
function generateMnemonicAsync(): Promise<string> {
  return new Promise((resolve, reject) => {
    // ⚡ Bolt: Use the existing crypto worker for this new task.
    // This avoids creating multiple workers and keeps related crypto
    // operations centralized.
    const worker = new Worker('crypto-worker.js');

    worker.onmessage = (
      event: MessageEvent<{ status: string; mnemonic?: string; error?: string }>
    ) => {
      if (event.data.status === 'success' && event.data.mnemonic) {
        resolve(event.data.mnemonic);
      } else {
        reject(new Error(event.data.error || 'Failed to generate mnemonic'));
      }
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage({ type: 'generateMnemonic' });
  });
}

export async function createWallet(
  secureStorage: ISecureStorageService,
  pin: string
): Promise<{ wallet: BitcoinWallet; mnemonic: string }> {
  // ⚡ Bolt: Await the asynchronously generated mnemonic.
  // By calling `generateMnemonicAsync`, we ensure the main thread remains
  // unblocked, resulting in a responsive UI during wallet creation.
  const mnemonic = await generateMnemonicAsync();
  const encryptedMnemonic = await secureStorage.encrypt(mnemonic, pin);
  const secureWallet = new SecureWallet(encryptedMnemonic, secureStorage);
  const wallet = new BitcoinWallet(secureWallet, encryptedMnemonic);
  return { wallet, mnemonic };
}
