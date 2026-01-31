// ⚡ Bolt: This worker offloads expensive, CPU-intensive cryptographic operations
// from the main UI thread. It now handles both `mnemonicToSeed` for wallet
// creation and the entire `getAddress` flow, including decryption, seed
// generation, and key derivation. This ensures the UI remains responsive.

import { generateMnemonic, mnemonicToSeed, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
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

// ⚡ Bolt: Efficient Result Caching.
// Caching the results of expensive PBKDF2 derivations (decrypting the
// mnemonic and generating the seed) dramatically improves performance for
// subsequent operations. 100,000 PBKDF2 iterations are now only performed once.
let lastEncryptedMnemonic: string | null = null;
let lastPin: string | null = null;
let lastMnemonic: string | null = null;
let lastSeed: Uint8Array | null = null;

let lastPlainMnemonic: string | null = null;
let lastPassphrase: string | null = null;
let lastSeedFromMnemonic: Uint8Array | null = null;

interface DerivationPayload {
  encryptedMnemonic: string;
  pin: string;
  index: number;
}

interface MnemonicToSeedPayload {
  mnemonic: string;
  passphrase?: string;
}

self.onmessage = async (
  event: MessageEvent<{ type: string; payload: any; requestId: number }>
) => {
  const { type, payload, requestId } = event.data;
  try {
    if (type === 'generateMnemonic') {
      const mnemonic = generateMnemonic(wordlist);
      self.postMessage({ requestId, status: 'success', payload: { mnemonic } });
    } else if (type === 'mnemonicToSeed') {
      const { mnemonic, passphrase } = payload as MnemonicToSeedPayload;

      let seed: Uint8Array;
      if (mnemonic === lastPlainMnemonic && passphrase === lastPassphrase && lastSeedFromMnemonic) {
        seed = lastSeedFromMnemonic;
      } else {
        seed = await mnemonicToSeed(mnemonic, passphrase);
        lastPlainMnemonic = mnemonic;
        lastPassphrase = passphrase || null;
        lastSeedFromMnemonic = seed;
      }
      // Note: We don't transfer the buffer if we're caching it
      self.postMessage({ requestId, status: 'success', payload: { seed } });
    } else if (type === 'getAddress' || type === 'getNode') {
      const { encryptedMnemonic, pin, index } = payload as DerivationPayload;

      let mnemonic: string;
      let seed: Uint8Array;

      if (
        encryptedMnemonic === lastEncryptedMnemonic &&
        pin === lastPin &&
        lastMnemonic &&
        lastSeed
      ) {
        mnemonic = lastMnemonic;
        seed = lastSeed;
      } else {
        mnemonic = await decrypt(encryptedMnemonic, pin);
        seed = mnemonicToSeedSync(mnemonic);
        lastEncryptedMnemonic = encryptedMnemonic;
        lastPin = pin;
        lastMnemonic = mnemonic;
        lastSeed = seed;
      }

      const root = bip32.fromSeed(Buffer.from(seed));
      const path = `m/84'/0'/0'/0/${index}`;
      const child = root.derivePath(path);

      if (type === 'getAddress') {
        const { address } = bitcoin.payments.p2wpkh({
          pubkey: child.publicKey,
        });
        self.postMessage({ requestId, status: 'success', payload: { address } });
      } else if (type === 'getNode') {
        if (!child.privateKey) {
          throw new Error('Could not derive private key');
        }
        self.postMessage({
          requestId,
          status: 'success',
          payload: {
            node: {
              publicKey: child.publicKey.buffer,
              privateKey: child.privateKey.buffer,
              chainCode: child.chainCode.buffer,
            },
          },
        });
      }
    }
  } catch (error) {
    self.postMessage({
      requestId,
      status: 'error',
      error: (error as Error).message,
    });
  }
};
