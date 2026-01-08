export interface Wallet {
  id: string;
  masterPrivateKey: string;
  accounts: Account[];
}

export interface Account {
  id: string;
  name: string;
  address: Address;
  privateKey: PrivateKey;
  publicKey: PublicKey;
}

export interface Transaction {
  id: TransactionID;
  from: Address;
  to: Address;
  asset: Asset;
  amount: Amount;
  fee: Amount;
  timestamp: number;
  rawHex?: string;
  psbtBase64?: string;
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

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
}

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
