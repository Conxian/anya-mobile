import { BitcoinWallet } from './wallet';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Interface } from 'bip32';
import ecc from './ecc';

// Initialize ECC library for Taproot support
bitcoin.initEccLib(ecc as any);

export interface Wallet {
  id: string;
  bitcoinWallet: BitcoinWallet;
  accounts: Account[];
}

export enum AddressType {
  Legacy = 'P2PKH',
  NativeSegWit = 'P2WPKH',
  Taproot = 'P2TR',
}

export class Account {
  id: string;
  name: string;
  private node: BIP32Interface;
  private network: bitcoin.Network;
  public readonly addressType: AddressType;

  // Caching fields for lazy derivation
  private _address?: Address;
  private _privateKey?: PrivateKey;
  private _publicKey?: PublicKey;

  constructor(
    id: string,
    name: string,
    node: BIP32Interface,
    network: bitcoin.Network = bitcoin.networks.bitcoin,
    addressType: AddressType = AddressType.NativeSegWit
  ) {
    this.id = id;
    this.name = name;
    this.node = node;
    this.network = network;
    this.addressType = addressType;
  }

  get address(): Address {
    if (!this._address) {
      let result;
      switch (this.addressType) {
        case AddressType.Legacy:
          result = bitcoin.payments.p2pkh({
            pubkey: this.node.publicKey,
            network: this.network,
          });
          break;
        case AddressType.NativeSegWit:
          result = bitcoin.payments.p2wpkh({
            pubkey: this.node.publicKey,
            network: this.network,
          });
          break;
        case AddressType.Taproot: {
          // X-only pubkey for Taproot
          const internalPubkey = Uint8Array.from(this.node.publicKey.slice(1, 33));
          result = bitcoin.payments.p2tr({
            internalPubkey,
            network: this.network,
          });
          break;
        }
        default:
          throw new Error(`Unsupported address type: ${this.addressType}`);
      }

      if (!result || !result.address) {
        throw new Error(`Could not generate ${this.addressType} address`);
      }
      this._address = result.address;
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
  sequence?: number; // Optional sequence number for RBF support
}

// --- Layer 2 & Sidechains ---

export interface LightningInvoice {
  id: string;
  paymentHash: string;
  serialized: string; // BOLT11
  amount: Amount;
  description: string;
  expiry: number;
  timestamp: number;
}

export interface ConfidentialAsset extends Asset {
  assetId: string; // hex string of the asset tag
  isConfidential: boolean;
}

export interface StateChainCoin {
  id: string;
  amount: Amount;
  stateChainId: string;
  lockTime: number;
  isSpent: boolean;
}

export interface LightningChannel {
  id: string;
  peerId: string;
  capacity: Amount;
  localBalance: Amount;
  remoteBalance: Amount;
  isActive: boolean;
  isPublic: boolean;
}

export interface EcashMint {
  url: string;
  alias: string;
}

export interface EcashToken {
  mint: EcashMint;
  amount: Amount;
  serialized: string;
}

export type SilentPaymentAddress = string;
