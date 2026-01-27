import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { SecureWallet } from './secure-bitcoin-lib';
import { ISecureStorageService } from '../services/secure-storage';

export class BitcoinWallet {
  private _masterPrivateKey?: string;
  private _p2wpkhAddress?: string;
  private _seed?: Uint8Array;
  private _root?: any;

  constructor(public readonly mnemonic: string) {}

  // ⚡ Bolt: Offloaded seed generation to a Web Worker.
  // The original `mnemonicToSeed` function was a synchronous, CPU-intensive
  // operation that blocked the main thread, causing the UI to freeze.
  // By moving this work to a Web Worker, the main thread remains free to handle
  // user input and other UI updates, resulting in a non-blocking, responsive
  // application. The method now returns a promise that resolves with the seed
  // once the worker completes its task.
  private getSeed(): Promise<Uint8Array> {
    if (this._seed) {
      return Promise.resolve(this._seed);
    }

    return new Promise((resolve, reject) => {
      // ⚡ Bolt: Use `type: 'module'` for ES module support in workers.
      // This is crucial for leveraging modern JavaScript features and imports
      // within the worker script, aligning it with the main application's
      // architecture and simplifying dependency management.
      const worker = new Worker('crypto-worker.js', { type: 'module' });

      worker.onmessage = (
        event: MessageEvent<{ status: string; seed?: Uint8Array; error?: string }>
      ) => {
        if (event.data.status === 'success' && event.data.seed) {
          this._seed = event.data.seed;
          resolve(this._seed);
        } else {
          reject(new Error(event.data.error || 'Worker failed to generate seed'));
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };

      worker.postMessage(this.mnemonic);
    });
  }

  private async getRoot() {
    if (!this._root) {
      const seed = await this.getSeed();
      this._root = bip32.fromSeed(seed);
    }
    return this._root;
  }

  async getMasterPrivateKey(): Promise<string> {
    if (!this._masterPrivateKey) {
      const root = await this.getRoot();
      this._masterPrivateKey = root.toBase58();
    }
    return this._masterPrivateKey;
  }

  async getP2wpkhAddress(): Promise<string> {
    if (!this._p2wpkhAddress) {
      const root = await this.getRoot();
      const path = "m/84'/0'/0'/0/0"; // BIP84 for P2WPKH
      const child = root.derivePath(path);
      const { address } = bitcoin.payments.p2wpkh({ pubkey: child.publicKey });

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
