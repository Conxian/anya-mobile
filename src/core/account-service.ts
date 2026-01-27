import { AccountService, BlockchainClient } from './ports';
import { Wallet, Account, Asset, Balance } from './domain';

export class AccountServiceImpl implements AccountService {
  constructor(private readonly blockchainClient: BlockchainClient) {}

  async getAccounts(wallet: Wallet): Promise<Account[]> {
    return wallet.accounts;
  }

  async createAccount(
    wallet: Wallet,
    name: string,
    pin: string
  ): Promise<Account> {
    const accountIndex = wallet.accounts.length;
    const address = await wallet.bitcoinWallet.getAddress(accountIndex, pin);

    const newAccount = new Account(`account-${accountIndex}`, name, address);

    wallet.accounts.push(newAccount);
    return newAccount;
  }

  async getAccountBalance(account: Account, asset: Asset): Promise<Balance> {
    return this.blockchainClient.getBalance(account.address, asset);
  }
}
