import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { ISecureStorageService } from '../services/secure-storage';

const bip32 = BIP32Factory(ecc);

export class SecureWallet {
  constructor(
    private encryptedMnemonic: string,
    private secureStorage: ISecureStorageService
  ) {}

  getAddress(index: number, pin: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const worker = new Worker('crypto-worker.js', { type: 'module' });
      worker.onmessage = (
        event: MessageEvent<{ status: string; address?: string; error?: string }>
      ) => {
        if (event.data.status === 'success' && event.data.address) {
          resolve(event.data.address);
        } else {
          reject(new Error(event.data.error || 'Worker failed to derive address'));
        }
        worker.terminate();
      };
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
      worker.postMessage({
        type: 'getAddress',
        payload: {
          encryptedMnemonic: this.encryptedMnemonic,
          pin,
          index,
        },
      });
    });
  }

  getNode(index: number, pin: string): Promise<BIP32Interface> {
    return new Promise((resolve, reject) => {
      const worker = new Worker('crypto-worker.js', { type: 'module' });
      worker.onmessage = (
        event: MessageEvent<{
          status: string;
          node?: {
            publicKey: ArrayBuffer;
            privateKey: ArrayBuffer;
            chainCode: ArrayBuffer;
          };
          error?: string;
        }>
      ) => {
        if (event.data.status === 'success' && event.data.node) {
          const { privateKey, chainCode } = event.data.node;
          const node = bip32.fromPrivateKey(
            Buffer.from(privateKey),
            Buffer.from(chainCode),
            bitcoin.networks.bitcoin
          );
          resolve(node);
        } else {
          reject(new Error(event.data.error || 'Worker failed to derive node'));
        }
        worker.terminate();
      };
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
      worker.postMessage({
        type: 'getNode',
        payload: {
          encryptedMnemonic: this.encryptedMnemonic,
          pin,
          index,
        },
      });
    });
  }
}
