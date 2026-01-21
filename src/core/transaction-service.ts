import { TransactionService, BlockchainClient } from './ports';
import {
  Account,
  Address,
  Asset,
  Amount,
  Transaction,
  TransactionID,
  PrivateKey,
  UTXO,
} from './domain';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

export class TransactionServiceImpl implements TransactionService {
  constructor(private readonly blockchainClient: BlockchainClient) {}

  async createTransaction(
    sourceAccount: Account,
    destinationAddress: Address,
    asset: Asset,
    amount: Amount,
    feeRate: number // in sat/vB
  ): Promise<Transaction> {
    const utxos = await this.blockchainClient.getUTXOs(sourceAccount.address);
    const { inputs, fee } = this.selectUTXOs(
      utxos,
      parseInt(amount.value, 10),
      feeRate
    );

    const psbt = new bitcoin.Psbt();
    for (const input of inputs) {
      psbt.addInput({
        hash: input.txid,
        index: input.vout,
        nonWitnessUtxo: Buffer.from(input.nonWitnessUtxo as string, 'hex'),
      });
    }

    psbt.addOutput({
      address: destinationAddress,
      value: parseInt(amount.value, 10),
    });

    const totalInputValue = inputs.reduce((sum, i) => sum + i.value, 0);
    const change = totalInputValue - parseInt(amount.value, 10) - fee;
    if (change > 0) {
      psbt.addOutput({
        address: sourceAccount.address,
        value: change,
      });
    }

    return {
      psbt: psbt.toBase64(),
      from: sourceAccount.address,
      to: destinationAddress,
      asset,
      amount,
    };
  }

  private selectUTXOs(
    utxos: UTXO[],
    targetAmount: number,
    feeRate: number
  ): { inputs: UTXO[]; fee: number } {
    // Basic coin selection: use the smallest UTXOs that can cover the amount + fee.
    // WARNING: This is a naive implementation and not suitable for production.
    const sortedUtxos = [...utxos].sort((a, b) => a.value - b.value);
    const selectedInputs: UTXO[] = [];
    let totalValue = 0;
    let estimatedFee = 0;

    for (const utxo of sortedUtxos) {
      if (totalValue >= targetAmount + estimatedFee) {
        break;
      }
      selectedInputs.push(utxo);
      totalValue += utxo.value;
      // Estimate the fee based on the number of inputs and outputs.
      // 1 input, 2 outputs is a common transaction structure.
      estimatedFee = (148 * selectedInputs.length + 34 * 2) * feeRate;
    }

    if (totalValue < targetAmount + estimatedFee) {
      throw new Error('Insufficient funds');
    }

    return { inputs: selectedInputs, fee: Math.ceil(estimatedFee) };
  }

  async signTransaction(
    transaction: Transaction,
    privateKey: PrivateKey
  ): Promise<Transaction> {
    if (!transaction.psbt) {
      throw new Error('PSBT not found in transaction');
    }

    const psbt = bitcoin.Psbt.fromBase64(transaction.psbt);
    const keyPair = bip32.fromWIF(privateKey);
    psbt.signAllInputs(keyPair);

    return { ...transaction, psbt: psbt.toBase64() };
  }

  async broadcastTransaction(
    signedTransaction: Transaction
  ): Promise<TransactionID> {
    if (!signedTransaction.psbt) {
      throw new Error('PSBT not found in transaction');
    }

    const psbt = bitcoin.Psbt.fromBase64(signedTransaction.psbt);
    psbt.finalizeAllInputs();

    const tx = psbt.extractTransaction();
    return this.blockchainClient.broadcastTransaction(tx);
  }

  async getTransactionHistory(account: Account): Promise<Transaction[]> {
    throw new Error('Method not implemented.');
  }
}
