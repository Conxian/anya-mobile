import { BitcoinWallet } from './wallet';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Interface } from 'bip32';

export interface Wallet {
  id: string;
  bitcoinWallet: BitcoinWallet;
  accounts: Account[];
}

export class Account {
  id: string;
  name: string;
  private node: BIP32Interface;

  // Caching fields for lazy derivation
  private _address?: Address;
  private _privateKey?: PrivateKey;
  private _publicKey?: PublicKey;

  constructor(id: string, name: string, node: BIP32Interface) {
    this.id = id;
    this.name = name;
    this.node = node;
  }

  get address(): Address {
    if (!this._address) {
      // P2WPKH (native SegWit)
      const { address } = bitcoin.payments.p2wpkh({ pubkey: this.node.publicKey });
      if (!address) {
        throw new Error('Could not generate address');
      }
      this._address = address;
    }
    return this._address;
  }

  get privateKey(): PrivateKey {
    if (!this._privateKey) {
      if (!this.node.privateKey) {
        throw new Error('Could not derive private key');
      }
      this._privateKey = this.node.toWIF();
    }
    return this._privateKey;
  }

  get publicKey(): PublicKey {
    if (!this._publicKey) {
      this._publicKey = Buffer.from(this.node.publicKey).toString('hex');
    }
    return this._publicKey;
  }

  getSigner(): BIP32Interface {
    return this.node;
  }
}

export interface DraftTransaction {
  from: Address;
  to: Address;
  asset: Asset;
  amount: Amount;
  fee: Amount;
  psbt: string;
}

export interface Transaction extends DraftTransaction {
  id: TransactionID;
  timestamp: number;
}

export interface Asset {
  symbol: string;
  name: string;
  decimals: number;
}

export interface Amount {
  value: string;
  asset: Asset;
}

export type Address = string;
export type PrivateKey = string;
export type TransactionID = string;

export interface Balance {
  asset: Asset;
  amount: Amount;
}

export interface StakingOption {
  id: string;
  name: string;
  asset: Asset;
  apy: number;
}

export interface StakingPosition {
  id: string;
  option: StakingOption;
  amount: Amount;
  rewards: Amount;
}

/**
 * Fee estimates in satoshis per virtual byte (sat/vB).
 */
export interface FeeEstimates {
  slow: number;
  medium: number;
  fast: number;
}

export interface Price {
  asset: Asset;
  currency: string;
  value: string;
}

export enum WalletStatus {
  Locked,
  Unlocked,
}

// --- BIP 353: Encrypted Messaging ---

export type PublicKey = string;

export interface Message {
  id: TransactionID; // A message is tied to a transaction
  senderPublicKey: PublicKey;
  recipientPublicKey: PublicKey;
  ciphertext: string; // The encrypted payload
  timestamp: number;
}

export interface DecryptedMessage {
  id: TransactionID;
  senderPublicKey: PublicKey;
  recipientPublicKey: PublicKey;
  plaintext: string;
  timestamp: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: bigint; // in satoshis
}
