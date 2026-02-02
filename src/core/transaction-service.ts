import { TransactionService, BlockchainClient, FeeRate } from './ports';
import {
  Account,
  Address,
  Asset,
  Amount,
  Transaction,
  TransactionID,
  UTXO,
  DraftTransaction,
  AddressType,
} from './domain';
import * as bitcoin from 'bitcoinjs-lib';

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
    const paymentScript = bitcoin.address.toOutputScript(
      sourceAccount.address,
      this.network
    );

    for (const input of inputs) {
      const inputData: any = {
        hash: input.txid,
        index: input.vout,
      };

      if (sourceAccount.addressType === AddressType.Legacy) {
        // Legacy (P2PKH) requires the full previous transaction to be provided as nonWitnessUtxo.
        const rawTxHex = await this.blockchainClient.getRawTransaction(input.txid);
        inputData.nonWitnessUtxo = Buffer.from(rawTxHex, 'hex');
      } else {
        inputData.witnessUtxo = {
          script: paymentScript,
          value: input.value,
        };
      }

      if (sourceAccount.addressType === AddressType.Taproot) {
        inputData.tapInternalKey = Buffer.from(
          sourceAccount.getSigner().publicKey.slice(1, 33)
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

    if (account.addressType === AddressType.Taproot) {
      // For Taproot Keypath spending, we need to tweak the signer
      const internalPubkey = Buffer.from(signer.publicKey.slice(1, 33));
      const tweakedSigner = signer.tweak(
        bitcoin.crypto.taggedHash('TapTweak', internalPubkey as any)
      );

      for (let i = 0; i < psbt.inputCount; i++) {
        psbt.signInput(i, tweakedSigner);
      }
    } else {
      psbt.signAllInputs(signer);
    }

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
