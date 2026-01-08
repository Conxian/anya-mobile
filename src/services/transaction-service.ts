import { TransactionService, BlockchainClient } from '../core/ports';
import { Account, Address, Amount, Asset, Transaction, TransactionID, PrivateKey } from '../core/domain';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';

const bip32 = BIP32Factory(ecc);
const network = bitcoin.networks.bitcoin;

export class TransactionServiceImpl implements TransactionService {
  constructor(private blockchainClient: BlockchainClient) {}

  async createTransaction(
    sourceAccount: Account,
    destinationAddress: Address,
    asset: Asset,
    amount: Amount
  ): Promise<Transaction> {
    const psbt = new bitcoin.Psbt({ network });

    const utxos = await this.blockchainClient.getUtxos(sourceAccount.address);
    if (utxos.length === 0) {
      throw new Error('No UTXOs available');
    }

    const feeEstimates = await this.blockchainClient.getFeeEstimates();
    const feeRate = feeEstimates.fast; // Using fast fee rate in sat/vB

    const amountInSats = Math.floor(parseFloat(amount.value) * 1e8);

    const inputs = utxos.map(utxo => ({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: bitcoin.address.toOutputScript(sourceAccount.address, network),
        value: utxo.value,
      },
    }));

    psbt.addInputs(inputs);
    psbt.addOutput({
      address: destinationAddress,
      value: amountInSats,
    });

    const totalInputValue = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

    // Build a dummy transaction to get a more accurate vSize
    const dummyPsbt = new bitcoin.Psbt({ network });
    utxos.forEach(utxo => {
      dummyPsbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(sourceAccount.address, network),
          value: utxo.value,
        },
      });
    });
    dummyPsbt.addOutput({ address: destinationAddress, value: amountInSats });
    dummyPsbt.addOutput({ address: sourceAccount.address, value: 1 }); // Dummy change output
    const dummyTx = dummyPsbt.__CACHE.__TX;
    const txVBytes = dummyTx.virtualSize();

    const fee = Math.ceil(txVBytes * feeRate);

    const changeValue = totalInputValue - amountInSats - fee;
    if (changeValue < 0) {
      throw new Error('Insufficient funds');
    }

    if (changeValue > 546) { // Dust threshold
      psbt.addOutput({
        address: sourceAccount.address,
        value: changeValue,
      });
    }

    const transaction: any = {
      from: sourceAccount.address,
      to: destinationAddress,
      asset,
      amount,
      fee: { asset, value: (fee / 1e8).toString() },
      timestamp: Date.now(),
      psbtBase64: psbt.toBase64(),
    };

    return transaction;
  }

  async signTransaction(
    transaction: Transaction,
    privateKey: PrivateKey
  ): Promise<Transaction> {
    const keyPair = bip32.fromWIF(privateKey, network);
    const psbt = bitcoin.Psbt.fromBase64(transaction.psbtBase64!, { network });
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();
    const signedTx = psbt.extractTransaction();
    transaction.rawHex = signedTx.toHex();
    transaction.id = signedTx.getId();
    return transaction;
  }

  async broadcastTransaction(signedTransaction: Transaction): Promise<TransactionID> {
    return this.blockchainClient.broadcastTransaction(signedTransaction);
  }

  async getTransactionHistory(account: Account): Promise<Transaction[]> {
    return this.blockchainClient.getTransactions(account.address);
  }
}
