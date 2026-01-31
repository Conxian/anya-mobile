import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { ISecureStorageService } from '../services/secure-storage';

const bip32 = BIP32Factory(ecc);

// ⚡ Bolt: Centralized worker management.
// The CryptoWorkerClient manages a single, shared Web Worker instance for all
// cryptographic operations. By reusing the worker instead of spawning and
// terminating one for every request, we eliminate significant overhead and
// enable efficient result caching within the worker.
export class CryptoWorkerClient {
  private static instance: Worker | null = null;
  private static pendingRequests = new Map<
    number,
    { resolve: (val: any) => void; reject: (err: Error) => void }
  >();
  private static nextRequestId = 0;

  private static getInstance(): Worker {
    if (!this.instance) {
      // The worker script is bundled by esbuild into public/crypto-worker.js
      this.instance = new Worker('crypto-worker.js', { type: 'module' });
      this.instance.onmessage = (event) => {
        const { requestId, status, payload, error } = event.data;
        const handlers = this.pendingRequests.get(requestId);
        if (handlers) {
          if (status === 'success') {
            handlers.resolve(payload);
          } else {
            handlers.reject(new Error(error || 'Worker operation failed'));
          }
          this.pendingRequests.delete(requestId);
        }
      };
      this.instance.onerror = (error) => {
        console.error('Crypto worker error:', error);
        for (const handlers of this.pendingRequests.values()) {
          handlers.reject(new Error('Crypto worker crashed'));
        }
        this.pendingRequests.clear();
        this.instance = null;
      };
    }
    return this.instance;
  }

  static call<T>(type: string, payload: any): Promise<T> {
    const requestId = this.nextRequestId++;
    const worker = this.getInstance();
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      worker.postMessage({ type, payload, requestId });
    });
  }
}

export class SecureWallet {
  constructor(
    private encryptedMnemonic: string,
    private secureStorage: ISecureStorageService
  ) {}

  async getAddress(index: number, pin: string): Promise<string> {
    const response = await CryptoWorkerClient.call<{ address: string }>(
      'getAddress',
      {
        encryptedMnemonic: this.encryptedMnemonic,
        pin,
        index,
      }
    );
    return response.address;
  }

  async getNode(index: number, pin: string): Promise<BIP32Interface> {
    const response = await CryptoWorkerClient.call<{
      node: {
        publicKey: ArrayBuffer;
        privateKey: ArrayBuffer;
        chainCode: ArrayBuffer;
      };
    }>('getNode', {
      encryptedMnemonic: this.encryptedMnemonic,
      pin,
      index,
    });

    const { privateKey, chainCode } = response.node;
    return bip32.fromPrivateKey(
      Buffer.from(privateKey),
      Buffer.from(chainCode),
      bitcoin.networks.bitcoin
    );
  }
}
