import { AccountService, BlockchainClient } from './ports';
import { Wallet, Account, Asset, Balance, Address } from './domain';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);

export class AccountServiceImpl implements AccountService {
  constructor(private readonly blockchainClient: BlockchainClient) {}

  async getAccounts(wallet: Wallet): Promise<Account[]> {
    return wallet.accounts;
  }

  async createAccount(wallet: Wallet, name: string): Promise<Account> {
    const root = bip32.fromBase58(wallet.masterPrivateKey);
    const accountIndex = wallet.accounts.length;
    // Using BIP84 derivation path for native SegWit (P2WPKH)
    const derivationPath = `m/84'/0'/${accountIndex}'/0/0`;
    const childNode = root.derivePath(derivationPath);

    if (!childNode.privateKey) {
      throw new Error('Could not derive private key');
    }

    const address = this.getAddress(childNode);

    const newAccount: Account = {
      id: `account-${accountIndex}`,
      name,
      address,
      privateKey: childNode.toWIF(),
      publicKey: Buffer.from(childNode.publicKey).toString('hex'),
    };

    wallet.accounts.push(newAccount);
    // Note: This implementation modifies the wallet object directly.
    // In a real application, we might want to return a new wallet object
    // to maintain immutability.
    return newAccount;
  }

  async getAccountBalance(account: Account, asset: Asset): Promise<Balance> {
    return this.blockchainClient.getBalance(account.address, asset);
  }

  private getAddress(node: BIP32Interface): Address {
    // P2WPKH (native SegWit)
    const { address } = bitcoin.payments.p2wpkh({ pubkey: node.publicKey });
    if (!address) {
      throw new Error('Could not generate address');
    }
    return address;
  }
}
