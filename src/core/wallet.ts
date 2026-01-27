import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);

// ⚡ Bolt: Implemented lazy initialization for wallet properties.
// The cryptographic operations to derive the master private key and address
// are expensive and can block the main thread, especially on slower devices.
// By deferring these operations until the properties are first accessed,
// we ensure the initial wallet creation is instantaneous, improving UI responsiveness.
// The derived values are then cached for subsequent access.
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

      if (!address) {
        throw new Error('Failed to derive address');
      }
      this._p2wpkhAddress = address;
    }
    return this._p2wpkhAddress;
  }

  toJSON() {
    return {
      mnemonic: this.mnemonic,
      masterPrivateKey: this._masterPrivateKey,
      p2wpkhAddress: this._p2wpkhAddress,
    };
  }
}

export async function createWallet(): Promise<BitcoinWallet> {
  const mnemonic = generateMnemonic(wordlist);
  return new BitcoinWallet(mnemonic);
}
