import { TransactionServiceImpl } from './transaction-service';
import { BlockchainClient } from './ports';
import { Account, Asset, Amount, UTXO, DraftTransaction } from './domain';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

describe('TransactionServiceImpl', () => {
  let transactionService: TransactionServiceImpl;
  let blockchainClient: jest.Mocked<BlockchainClient>;
  let sourceAccount: Account;

  beforeEach(() => {
    blockchainClient = {
      getUTXOs: jest.fn(),
      broadcastTransaction: jest.fn(),
      getTransaction: jest.fn(),
      getFeeEstimates: jest.fn(),
      getBalance: jest.fn(),
    };
    transactionService = new TransactionServiceImpl(
      blockchainClient,
      bitcoin.networks.bitcoin
    );
    const seed = Buffer.alloc(32);
    seed.fill(1);
    const root = bip32.fromSeed(seed);
    const childNode = root.derivePath("m/84'/0'/0'");
    sourceAccount = new Account('test-id', 'test-account', childNode);
  });

  it('should create, sign, and broadcast a transaction', async () => {
    const utxos: UTXO[] = [
      {
        txid: '2bfe332213e449a5653c153b68f64584284b1836107538a715a38a37f5d60882',
        vout: 0,
        value: 100000n,
      },
    ];
    blockchainClient.getUTXOs.mockResolvedValue(utxos);
    const broadcastedTxId =
      'a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4';
    blockchainClient.broadcastTransaction.mockResolvedValue(broadcastedTxId);

    const destinationAddress = sourceAccount.address;
    const asset: Asset = {
      symbol: 'BTC',
      name: 'Bitcoin',
      decimals: 8,
    };
    const amount: Amount = {
      value: '50000',
      asset,
    };
    const feeRate = 10; // sat/vB

    const draftTx = await transactionService.createTransaction(
      sourceAccount,
      destinationAddress,
      asset,
      amount,
      feeRate
    );
    expect(draftTx.psbt).toBeDefined();

    const signedTx = await transactionService.signTransaction(draftTx, sourceAccount);
    expect(signedTx.psbt).not.toEqual(draftTx.psbt); // Ensure the PSBT was modified

    // Finalize and extract the transaction for verification
    const psbt = bitcoin.Psbt.fromBase64(signedTx.psbt, {
      network: bitcoin.networks.bitcoin,
    });
    psbt.finalizeAllInputs();
    const finalTx = psbt.extractTransaction();
    const finalTxHex = finalTx.toHex();

    expect(finalTxHex).toBeDefined();

    const txid = await transactionService.broadcastTransaction(signedTx);

    expect(txid).toEqual(broadcastedTxId);
    expect(blockchainClient.getUTXOs).toHaveBeenCalledWith(
      sourceAccount.address
    );
    expect(blockchainClient.broadcastTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        getId: expect.any(Function),
      })
    );
  });
});
