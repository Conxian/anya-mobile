import {
  Wallet,
  Account,
  Transaction,
  Asset,
  Amount,
  Address,
  TransactionID,
  Balance,
  StakingOption,
  StakingPosition,
  FeeEstimates,
  Price,
  WalletStatus,
  PrivateKey,
  Message,
  DecryptedMessage,
  PublicKey,
  UTXO,
} from './domain';

// --- Driving Ports ---

export interface WalletService {
  createWallet(
    passphrase: string
  ): Promise<{ wallet: Wallet; mnemonic: string }>;
  loadWalletFromMnemonic(
    mnemonic: string,
    passphrase?: string
  ): Promise<Wallet>;
  lockWallet(): Promise<void>;
  unlockWallet(passphrase: string): Promise<void>;
  getWalletStatus(): Promise<WalletStatus>;
}

export interface AccountService {
  getAccounts(wallet: Wallet): Promise<Account[]>;
  createAccount(wallet: Wallet, name: string): Promise<Account>;
  getAccountBalance(account: Account, asset: Asset): Promise<Balance>;
}

export interface TransactionService {
  createTransaction(
    sourceAccount: Account,
    destinationAddress: Address,
    asset: Asset,
    amount: Amount
  ): Promise<Transaction>;
  signTransaction(
    transaction: Transaction,
    privateKey: PrivateKey
  ): Promise<Transaction>;
  broadcastTransaction(signedTransaction: Transaction): Promise<TransactionID>;
  getTransactionHistory(account: Account): Promise<Transaction[]>;
}

export interface StakingService {
  getStakingOptions(asset: Asset): Promise<StakingOption[]>;
  stake(
    account: Account,
    option: StakingOption,
    amount: Amount
  ): Promise<StakingPosition>;
  unstake(position: StakingPosition): Promise<Transaction>;
  getStakingPositions(account: Account): Promise<StakingPosition[]>;
}

export interface MessagingService {
  sendMessage(
    senderAccount: Account,
    recipientPublicKey: PublicKey,
    plaintext: string
  ): Promise<Message>;
  readMessage(
    recipientAccount: Account,
    message: Message
  ): Promise<DecryptedMessage>;
  getMessageHistory(account: Account): Promise<Message[]>;
}

// --- Driven Ports ---

export interface BlockchainClient {
  getBalance(address: Address, asset: Asset): Promise<Balance>;
  getTransaction(transactionID: TransactionID): Promise<Transaction>;
  broadcastTransaction(signedTransaction: Transaction): Promise<TransactionID>;
  getFeeEstimates(): Promise<FeeEstimates>;
  getUTXOs(address: Address): Promise<UTXO[]>;
}

export interface OracleClient {
  getPrice(asset: Asset, currency: string): Promise<Price>;
}

export interface Persistence {
  saveWallet(wallet: Wallet): Promise<void>;
  loadWallet(): Promise<Wallet>;
}
