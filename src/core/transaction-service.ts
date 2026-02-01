import { TransactionService, BlockchainClient, FeeRate } from './ports';
import {
  Account,
  Address,
  Asset,
  Amount,
  Transaction,
  TransactionID,
  PrivateKey,
  UTXO,
  DraftTransaction,
  AddressType,
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
    feeRate: FeeRate
  ): Promise<DraftTransaction> {
    const [utxos, feeEstimates] = await Promise.all([
      this.blockchainClient.getUTXOs(sourceAccount.address),
      this.blockchainClient.getFeeEstimates(),
    ]);
    const satoshiFeeRate = feeEstimates[feeRate];

    const { inputs, fee } = this.selectUTXOs(
      utxos,
      BigInt(amount.value),
      satoshiFeeRate
    );

    const psbt = new bitcoin.Psbt({ network: this.network });

    // Dynamically handle different address types (Legacy, SegWit, Taproot)
    const script = bitcoin.address.toOutputScript(
      sourceAccount.address,
      this.network
    );

    for (const input of inputs) {
      const inputData: any = {
        hash: input.txid,
        index: input.vout,
      };

      // For SegWit and Taproot, we use witnessUtxo.
      // For Legacy, bitcoinjs-lib's PSBT requires nonWitnessUtxo.
      if (
        sourceAccount.addressType === AddressType.NativeSegWit ||
        sourceAccount.addressType === AddressType.Taproot
      ) {
        inputData.witnessUtxo = {
          script: script,
          value: input.value,
        };
      } else if (sourceAccount.addressType === AddressType.Legacy) {
        // TODO: Fetch full raw transaction for nonWitnessUtxo to support Legacy (P2PKH) properly.
        // For now, we throw a descriptive error to avoid creating invalid PSBTs.
        throw new Error(
          'Legacy (P2PKH) transaction construction is not yet fully implemented (requires nonWitnessUtxo).'
        );
      }

      psbt.addInput(inputData);
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
    // "Largest-First" coin selection: Prioritize larger UTXOs to minimize the number of inputs.
    // This is a simple and effective strategy, but may not be optimal for privacy or minimizing chain fees in all cases.
    const sortedUtxos = [...utxos].sort((a, b) => (b.value > a.value ? 1 : -1));

    const selectedInputs: UTXO[] = [];
    let totalValue = 0n;
    const baseTxVsize = 11; // Base transaction virtual size
    const outputVsize = 31; // P2WPKH output virtual size
    const inputVsize = 68;  // P2WPKH input virtual size

    for (const utxo of sortedUtxos) {
      selectedInputs.push(utxo);
      totalValue += utxo.value;

      const estimatedVsize = baseTxVsize + (selectedInputs.length * inputVsize) + (2 * outputVsize); // 2 outputs: payment and change
      const estimatedFee = BigInt(Math.ceil(estimatedVsize * feeRate));

      if (totalValue >= targetAmount + estimatedFee) {
        // We have enough to cover the amount and the fee
        return { inputs: selectedInputs, fee: Number(estimatedFee) };
      }
    }

    // If we get here, we don't have enough funds
    const finalEstimatedVsize = baseTxVsize + (selectedInputs.length * inputVsize) + (2 * outputVsize);
    const finalEstimatedFee = BigInt(Math.ceil(finalEstimatedVsize * feeRate));
    if (totalValue < targetAmount + finalEstimatedFee) {
        throw new Error('Insufficient funds to cover the transaction amount and network fee.');
    }

    return { inputs: selectedInputs, fee: Number(finalEstimatedFee) };
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
    // The blockchain client expects a `Transaction` object, but we have a `bitcoinjs-lib` `Transaction`.
    // We can't create a full `Transaction` object here, so we'll cast it to `any`.
    // This is a known issue that needs to be addressed in a larger refactoring.
    return this.blockchainClient.broadcastTransaction(tx as any);
  }

  async getTransactionHistory(account: Account): Promise<Transaction[]> {
    return this.blockchainClient.getTransactionHistory(account.address);
  }
}
