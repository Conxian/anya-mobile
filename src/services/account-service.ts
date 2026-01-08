import { AccountService, BlockchainClient } from '../core/ports';
import { Account, Wallet } from '../core/domain';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);

export class AccountServiceImpl implements AccountService {
  constructor(private blockchainClient: BlockchainClient) {}

  async getAccounts(wallet: Wallet): Promise<Account[]> {
    return wallet.accounts;
  }

  async createAccount(wallet: Wallet, name: string): Promise<{ newAccount: Account; updatedWallet: Wallet }> {
    const accountIndex = wallet.accounts.length;
    const root = bip32.fromBase58(wallet.masterPrivateKey);

    const path = `m/84'/0'/0'/0/${accountIndex}`;
    const child = root.derivePath(path);

    const { address } = bitcoin.payments.p2wpkh({ pubkey: child.publicKey });

    if (!address) {
      throw new Error('Failed to generate address');
    }

    const newAccount: Account = {
      id: `account-${accountIndex}`,
      name,
      address: address,
      privateKey: child.toWIF(),
      publicKey: child.publicKey.toString('hex'),
    };

    const updatedWallet = {
      ...wallet,
      accounts: [...wallet.accounts, newAccount],
    };

    return { newAccount, updatedWallet };
  }

  async getAccountBalance(account: Account, asset: import("../core/domain").Asset): Promise<import("../core/domain").Balance> {
    return this.blockchainClient.getBalance(account.address, asset);
  }
}
