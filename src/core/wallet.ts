import * as bip39 from 'bip39';
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
  const mnemonic = bip39.generateMnemonic();
  // ⚡ Bolt: Use asynchronous seed generation to avoid blocking the main thread.
  // The synchronous version can cause UI freezes on slower devices.
  const seed = await bip39.mnemonicToSeed(mnemonic);
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
