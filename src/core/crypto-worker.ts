// ⚡ Bolt: This worker offloads expensive, CPU-intensive cryptographic operations
// from the main UI thread. It now handles both `mnemonicToSeed` for wallet
// creation and the entire `getAddress` flow, including decryption, seed
// generation, and key derivation. This ensures the UI remains responsive.

import { mnemonicToSeed, mnemonicToSeedSync } from '@scure/bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

// --- Inlined SecureStorageService Logic ---
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

async function decrypt(encryptedHexString: string, pin: string): Promise<string> {
  const encryptedDataBytes = Buffer.from(encryptedHexString, 'hex');
  const salt = encryptedDataBytes.slice(0, SALT_LENGTH);
  const iv = encryptedDataBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const data = encryptedDataBytes.slice(SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(pin, salt);
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return new TextDecoder().decode(decryptedData);
}

// --- Message Handling ---

interface DerivationPayload {
  encryptedMnemonic: string;
  pin: string;
  index: number;
}

// ⚡ Bolt: Standardized worker communication. All messages now use a
// { type, payload } structure for consistency and clarity. This change
// also allows passing a passphrase for seed generation.
interface MnemonicToSeedPayload {
  mnemonic: string;
  passphrase?: string;
}

self.onmessage = async (event: MessageEvent<{ type: string; payload: any }>) => {
  try {
    const { type, payload } = event.data;

    if (type === 'mnemonicToSeed') {
      const { mnemonic, passphrase } = payload as MnemonicToSeedPayload;
      const seed = await mnemonicToSeed(mnemonic, passphrase);
      self.postMessage({ status: 'success', seed }, [seed.buffer]);
    } else if (type === 'getAddress' || type === 'getNode') {
      const { encryptedMnemonic, pin, index } = payload as DerivationPayload;
      const mnemonic = await decrypt(encryptedMnemonic, pin);
      const seed = mnemonicToSeedSync(mnemonic);
      const root = bip32.fromSeed(seed);
      const path = `m/84'/0'/0'/0/${index}`;
      const child = root.derivePath(path);

      if (type === 'getAddress') {
        const { address } = bitcoin.payments.p2wpkh({
          pubkey: child.publicKey,
        });
        self.postMessage({ status: 'success', address });
      } else if (type === 'getNode') {
        if (!child.privateKey) {
          throw new Error('Could not derive private key');
        }
        self.postMessage({
          status: 'success',
          node: {
            publicKey: child.publicKey.buffer,
            privateKey: child.privateKey.buffer,
            chainCode: child.chainCode.buffer,
          },
        });
      }
    }
  } catch (error) {
    self.postMessage({ status: 'error', error: (error as Error).message });
  }
};
