import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);

export interface BitcoinWallet {
  mnemonic: string;
  masterPrivateKey: string;
  p2wpkhAddress: string;
}

export async function createWallet(): Promise<BitcoinWallet> {
  const mnemonic = generateMnemonic(wordlist);
  // ⚡ Bolt: Replace deprecated `bip39` with audited `@scure/bip39` library.
  // This improves security and maintainability.
  const seed = await mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);

  // Derive the P2WPKH address (SegWit)
  const path = "m/84'/0'/0'/0/0"; // BIP84 for P2WPKH
  const child = root.derivePath(path);
  const { address } = bitcoin.payments.p2wpkh({ pubkey: child.publicKey });

  if (!address) {
    throw new Error('Failed to derive address');
  }

  return {
    mnemonic,
    masterPrivateKey: root.toBase58(),
    p2wpkhAddress: address,
  };
}
