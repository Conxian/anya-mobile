import { AccountService, BlockchainClient } from './ports';
import { Wallet, Account, Asset, Balance } from './domain';
import * as bitcoin from 'bitcoinjs-lib';

export class AccountServiceImpl implements AccountService {
  constructor(
    private readonly blockchainClient: BlockchainClient,
    private readonly network: bitcoin.Network = bitcoin.networks.bitcoin
  ) {}

  async getAccounts(wallet: Wallet): Promise<Account[]> {
    return wallet.accounts;
  }

  async createAccount(
    wallet: Wallet,
    name: string,
    pin: string
  ): Promise<Account> {
    const accountIndex = wallet.accounts.length;
    const node = await wallet.bitcoinWallet.secureWallet.getNode(
      accountIndex,
      pin
    );

    const newAccount = new Account(
      `account-${accountIndex}`,
      name,
      node,
      this.network
    );

    wallet.accounts.push(newAccount);
    return newAccount;
  }

  async getAccountBalance(account: Account, asset: Asset): Promise<Balance> {
    return this.blockchainClient.getBalance(account.address, asset);
  }
}
