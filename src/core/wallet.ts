import { SecureWallet, CryptoWorkerClient } from './secure-bitcoin-lib';
import { ISecureStorageService } from '../services/secure-storage';

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
// task. It now uses the shared CryptoWorkerClient for better efficiency.
async function generateMnemonicAsync(): Promise<string> {
  const response = await CryptoWorkerClient.call<{ mnemonic: string }>(
    'generateMnemonic',
    {}
  );
  return response.mnemonic;
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
