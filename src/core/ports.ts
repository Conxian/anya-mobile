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
  Message,
  DecryptedMessage,
  PublicKey,
  UTXO,
  DraftTransaction,
  LightningInvoice,
  ConfidentialAsset,
  StateChainCoin,
  LightningChannel,
  EcashToken,
  EcashMint,
  SilentPaymentAddress,
  ArkASP,
  ArkVTXO,
  MiniscriptPolicy,
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
  createAccount(wallet: Wallet, name: string, pin: string): Promise<Account>;
  getAccountBalance(account: Account, asset: Asset): Promise<Balance>;
}

export type FeeRate = 'slow' | 'medium' | 'fast';

export interface TransactionService {
  createTransaction(
    sourceAccount: Account,
    destinationAddress: Address,
    asset: Asset,
    amount: Amount,
    feeRate: FeeRate
  ): Promise<DraftTransaction>;
  signTransaction(
    transaction: DraftTransaction,
    account: Account
  ): Promise<DraftTransaction>;
  broadcastTransaction(signedTransaction: DraftTransaction): Promise<TransactionID>;
  getTransactionHistory(account: Account): Promise<Transaction[]>;
  bumpFee(account: Account, transactionID: TransactionID, newFeeRate: FeeRate): Promise<DraftTransaction>;

  // BIP 322: Generic Signed Messages
  signMessage(account: Account, message: string): Promise<string>;
  verifyMessage(address: Address, message: string, signature: string): Promise<boolean>;
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

export interface LightningService {
  createInvoice(account: Account, amount: Amount, description: string): Promise<LightningInvoice>;
  payInvoice(account: Account, invoice: string): Promise<TransactionID>;
  getInvoiceStatus(paymentHash: string): Promise<'pending' | 'paid' | 'expired'>;
  getBalance(account: Account): Promise<Balance>;
  getTransactionHistory(account: Account): Promise<Transaction[]>;

  // Channel Management
  openChannel(account: Account, peerId: string, amount: Amount): Promise<string>;
  closeChannel(channelId: string): Promise<void>;
  listChannels(account: Account): Promise<LightningChannel[]>;

  // Advanced LDK Features
  getNodeInfo(): Promise<{ nodePubkey: string; alias?: string }>;
  listPayments(account: Account): Promise<any[]>;
  estimateFee(amount: Amount, speed: FeeRate): Promise<Amount>;
}

export interface EcashService {
  mint(mint: EcashMint, amount: Amount): Promise<EcashToken>;
  melt(token: EcashToken, invoice: string): Promise<TransactionID>;
  send(token: EcashToken, amount: Amount): Promise<{ sent: EcashToken; change: EcashToken }>;
  receive(token: EcashToken): Promise<Balance>;
  getBalance(account: Account): Promise<Balance>;
  getTransactionHistory(account: Account): Promise<Transaction[]>;
}

export interface SilentPaymentService {
  generateAddress(account: Account): Promise<SilentPaymentAddress>;
  scanForPayments(account: Account): Promise<Transaction[]>;
}

export interface SidechainService {
  issueAsset(account: Account, name: string, symbol: string, amount: bigint): Promise<ConfidentialAsset>;
  transferAsset(
    account: Account,
    destinationAddress: Address,
    asset: ConfidentialAsset,
    amount: Amount
  ): Promise<TransactionID>;
  getBalance(account: Account, asset: Asset): Promise<Balance>;
  getTransactionHistory(account: Account): Promise<Transaction[]>;
}

export interface StateChainService {
  deposit(account: Account, amount: Amount): Promise<StateChainCoin>;
  transfer(coin: StateChainCoin, recipientPublicKey: PublicKey): Promise<TransactionID>;
  withdraw(coin: StateChainCoin, destinationAddress: Address): Promise<TransactionID>;
  getBalance(account: Account): Promise<Balance>;
  getTransactionHistory(account: Account): Promise<Transaction[]>;
}

export interface ArkService {
  lift(account: Account, amount: Amount, asp: ArkASP): Promise<TransactionID>;
  settle(vtxo: ArkVTXO, destinationAddress: Address): Promise<TransactionID>;
  transfer(vtxo: ArkVTXO, recipientPublicKey: PublicKey): Promise<TransactionID>;
  getVTXOs(account: Account): Promise<ArkVTXO[]>;
  getBalance(account: Account): Promise<Balance>;
  getTransactionHistory(account: Account): Promise<Transaction[]>;
}

export interface MiniscriptService {
  compilePolicy(policy: string): Promise<MiniscriptPolicy>;
  analyzePolicy(policy: string): Promise<{
    isMalleable: boolean;
    vsize: number;
    requiredSigs: number;
  }>;
}

// --- Driven Ports ---

export interface BlockchainClient {
  getBalance(address: Address, asset: Asset): Promise<Balance>;
  getTransaction(transactionID: TransactionID): Promise<Transaction>;
  getRawTransaction(transactionID: TransactionID): Promise<string>;
  broadcastTransaction(signedTransaction: any): Promise<TransactionID>;
  getFeeEstimates(): Promise<FeeEstimates>;
  getUTXOs(address: Address): Promise<UTXO[]>;
  getTransactionHistory(address: Address): Promise<Transaction[]>;
}

export interface OracleClient {
  getPrice(asset: Asset, currency: string): Promise<Price>;
}

export interface Persistence {
  saveWallet(wallet: Wallet): Promise<void>;
  loadWallet(): Promise<Wallet>;
}
