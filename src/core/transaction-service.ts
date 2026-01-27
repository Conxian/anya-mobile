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
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

export class TransactionServiceImpl implements TransactionService {
  constructor(
    private readonly blockchainClient: BlockchainClient,
    private readonly network: bitcoin.Network
  ) {}

  async createTransaction(
    sourceAccount: Account,
    destinationAddress: Address,
    asset: Asset,
    amount: Amount,
    feeRate: number // in sat/vB
  ): Promise<DraftTransaction> {
    const utxos = await this.blockchainClient.getUTXOs(sourceAccount.address);
    const { inputs, fee } = this.selectUTXOs(
      utxos,
      BigInt(amount.value),
      feeRate
    );

    const psbt = new bitcoin.Psbt({ network: this.network });
    const { output } = bitcoin.payments.p2wpkh({
      pubkey: sourceAccount.getSigner().publicKey,
      network: this.network,
    });
    for (const input of inputs) {
      psbt.addInput({
        hash: input.txid,
        index: input.vout,
        witnessUtxo: {
          script: output!,
          value: input.value,
        },
      });
    }

    psbt.addOutput({
      address: destinationAddress,
      value: BigInt(amount.value),
    });

    const totalInputValue = inputs.reduce((sum, i) => sum + i.value, 0n);
    const change = totalInputValue - BigInt(amount.value) - BigInt(fee);
    if (change > 0) {
      psbt.addOutput({
        address: sourceAccount.address,
        value: BigInt(change),
      });
    }

    return {
      psbt: psbt.toBase64(),
      from: sourceAccount.address,
      to: destinationAddress,
      asset,
      amount,
      fee: {
        value: fee.toString(),
        asset,
      },
    };
  }

  private selectUTXOs(
    utxos: UTXO[],
    targetAmount: bigint,
    feeRate: number
  ): { inputs: UTXO[]; fee: number } {
    // Naive coin selection: use the largest UTXOs available to cover the target amount.
    // WARNING: This is not a robust coin selection algorithm and is not suitable for production.
    const sortedUtxos = [...utxos].sort((a, b) => (a.value > b.value ? -1 : 1));
    const selectedInputs: UTXO[] = [];
    let totalValue = 0n;
    let estimatedFee = 0;

    for (const utxo of sortedUtxos) {
      if (totalValue >= targetAmount + BigInt(estimatedFee)) {
        break;
      }
      selectedInputs.push(utxo);
      totalValue += utxo.value;
      // Estimate the fee based on the number of inputs and outputs for a P2WPKH transaction.
      const baseTxVsize = 11; // ~11 vbytes for version, locktime, input/output counts
      const inputVsize = 68; // ~68 vbytes for a P2WPKH input
      const outputVsize = 31; // ~31 vbytes for a P2WPKH output
      const estimatedVsize =
        baseTxVsize + selectedInputs.length * inputVsize + 2 * outputVsize;
      estimatedFee = estimatedVsize * feeRate;
    }

    if (totalValue < targetAmount + BigInt(estimatedFee)) {
      throw new Error('Insufficient funds');
    }

    return { inputs: selectedInputs, fee: Math.ceil(estimatedFee) };
  }

  async signTransaction(
    transaction: DraftTransaction,
    account: Account
  ): Promise<DraftTransaction> {
    const psbt = bitcoin.Psbt.fromBase64(transaction.psbt, {
      network: this.network,
    });
    const signer = account.getSigner();
    psbt.signAllInputs(signer);

    return { ...transaction, psbt: psbt.toBase64() };
  }

  async broadcastTransaction(
    signedTransaction: DraftTransaction
  ): Promise<TransactionID> {

    const psbt = bitcoin.Psbt.fromBase64(signedTransaction.psbt, {
      network: this.network,
    });
    psbt.finalizeAllInputs();

    const tx = psbt.extractTransaction();
    return this.blockchainClient.broadcastTransaction(tx);
  }

  async getTransactionHistory(account: Account): Promise<Transaction[]> {
    throw new Error('Method not implemented.');
  }
}
