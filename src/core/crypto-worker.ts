// ⚡ Bolt: This worker offloads expensive, CPU-intensive cryptographic operations
// from the main UI thread. It now handles both `mnemonicToSeed` for wallet
// creation and the entire `getAddress` flow, including decryption, seed
// generation, and key derivation. This ensures the UI remains responsive.

import { Buffer } from 'buffer';
(self as any).Buffer = Buffer;
import { generateMnemonic, mnemonicToSeed, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, BIP32Interface } from 'bip32';
import ecc from './ecc';

const bip32 = BIP32Factory(ecc as any);

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

let lastEncryptedMnemonic: string | null = null;
let lastPin: string | null = null;
let lastMnemonic: string | null = null;
let lastSeed: Uint8Array | null = null;
let lastRoot: BIP32Interface | null = null;
let lastChainNode: BIP32Interface | null = null;
let lastPathPrefix: string | null = null;

let lastPlainMnemonic: string | null = null;
let lastPassphrase: string | null = null;
let lastSeedFromMnemonic: Uint8Array | null = null;

interface DerivationPayload {
  encryptedMnemonic: string;
  pin: string;
  index: number;
  path?: string;
  addressType?: string;
}

interface MnemonicToSeedPayload {
  mnemonic: string;
  passphrase?: string;
}

self.onmessage = async (
  event: MessageEvent<{ type: string; payload: any; requestId: number }>
) => {
  const { type, payload, requestId } = event.data;
  console.log(`Worker received ${type} (request ${requestId})`);
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
      self.postMessage({ requestId, status: 'success', payload: { seed } });
    } else if (type === 'getAddress' || type === 'getNode') {
      const { encryptedMnemonic, pin, index, path, addressType } = payload as DerivationPayload;

      let root;
      if (
        encryptedMnemonic === lastEncryptedMnemonic &&
        pin === lastPin &&
        lastRoot
      ) {
        root = lastRoot;
      } else {
        const mnemonic = await decrypt(encryptedMnemonic, pin);
        const seed = mnemonicToSeedSync(mnemonic);
        lastEncryptedMnemonic = encryptedMnemonic;
        lastPin = pin;
        lastMnemonic = mnemonic;
        lastSeed = seed;
        root = bip32.fromSeed(Uint8Array.from(seed));
        lastRoot = root;
        lastChainNode = null;
        lastPathPrefix = null;
      }

      const pathPrefix = path || `m/84'/0'/0'/0`;
      let chainNode;
      if (lastChainNode && lastPathPrefix === pathPrefix) {
        chainNode = lastChainNode;
      } else {
        chainNode = root.derivePath(pathPrefix);
        lastChainNode = chainNode;
        lastPathPrefix = pathPrefix;
      }

      const child = chainNode.derive(index);

      if (type === 'getAddress') {
        let result;
        if (addressType === 'P2PKH') {
          result = bitcoin.payments.p2pkh({ pubkey: child.publicKey });
        } else if (addressType === 'P2TR') {
          const internalPubkey = Uint8Array.from(child.publicKey.slice(1, 33));
          result = bitcoin.payments.p2tr({ internalPubkey });
        } else {
          result = bitcoin.payments.p2wpkh({ pubkey: child.publicKey });
        }
        self.postMessage({ requestId, status: 'success', payload: { address: result.address } });
      } else if (type === 'getNode') {
        if (!child.privateKey) {
          throw new Error('Could not derive private key');
        }
        self.postMessage({
          requestId,
          status: 'success',
          payload: {
            node: {
              publicKey: new Uint8Array(child.publicKey).buffer,
              privateKey: new Uint8Array(child.privateKey).buffer,
              chainCode: new Uint8Array(child.chainCode).buffer,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error(`Worker error in ${type}:`, error);
    self.postMessage({
      requestId,
      status: 'error',
      error: (error as Error).message,
    });
  }
};
