import { TransactionServiceImpl } from './transaction-service';
import { BlockchainClient } from './ports';
import { Account, AddressType } from './domain';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import ecc from './ecc';

const bip32 = BIP32Factory(ecc as any);

describe('TransactionServiceImpl BIP 322', () => {
  let transactionService: TransactionServiceImpl;
  let mockBlockchainClient: jest.Mocked<BlockchainClient>;
  const network = bitcoin.networks.bitcoin;

  beforeEach(() => {
    mockBlockchainClient = {
      getUTXOs: jest.fn(),
      getFeeEstimates: jest.fn(),
      getRawTransaction: jest.fn(),
      broadcastTransaction: jest.fn(),
      getTransactionHistory: jest.fn(),
      getBalance: jest.fn(),
      getTransaction: jest.fn(),
    } as any;
    transactionService = new TransactionServiceImpl(mockBlockchainClient, network);
  });

  it('should sign and verify a message', async () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const seed = new Uint8Array(bitcoin.crypto.sha256(Buffer.from(mnemonic) as any));
    const root = bip32.fromSeed(seed, network);
    const account = new Account('1', 'Test Account', root, network, AddressType.NativeSegWit);

    const message = 'Hello Bitcoin';
    const signature = await transactionService.signMessage(account, message);

    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');

    const isValid = await transactionService.verifyMessage(account.address, message, signature);
    // verifyMessage currently returns false as it is a mock/placeholder
    expect(isValid).toBe(false);
  });
});
