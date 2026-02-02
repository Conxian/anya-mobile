import { BlockchainClient } from '../core/ports';
import {
  Address,
  Asset,
  TransactionID,
  Balance,
  Transaction,
  FeeEstimates,
  UTXO,
} from '../core/domain';
import axios from 'axios';

const BASE_URL = 'https://blockstream.info/api';
const SATOSHIS_PER_BTC = 1e8;

export class BlockstreamClient implements BlockchainClient {
  async getBalance(address: Address, asset: Asset): Promise<Balance> {
    const response = await axios.get(`${BASE_URL}/address/${address}`);
    const utxos =
      response.data.chain_stats.funded_txo_sum -
      response.data.chain_stats.spent_txo_sum;
    return {
      asset,
      amount: { asset, value: (utxos / SATOSHIS_PER_BTC).toString() },
    };
  }

  async getTransaction(transactionID: TransactionID): Promise<Transaction> {
    const response = await axios.get(`${BASE_URL}/tx/${transactionID}`);
    const tx = response.data;

    const totalInputValue = tx.vin.reduce(
      (sum: number, input: Vin) => sum + input.prevout.value,
      0
    );
    const totalOutputValue = tx.vout.reduce(
      (sum: number, output: Vout) => sum + output.value,
      0
    );

    const fromAddress = tx.vin[0]?.prevout.scriptpubkey_address || 'unknown';
    const toAddress = tx.vout[0]?.scriptpubkey_address || 'unknown';

    return {
      id: tx.txid,
      from: fromAddress,
      to: toAddress,
      asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      amount: {
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        value: (totalOutputValue / SATOSHIS_PER_BTC).toString(),
      },
      fee: {
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        value: ((totalInputValue - totalOutputValue) / SATOSHIS_PER_BTC).toString(),
      },
      timestamp: tx.status.block_time,
      psbt: '', // This client does not provide PSBTs.
    };
  }

  async broadcastTransaction(signedTransaction: any): Promise<TransactionID> {
    const response = await axios.post(
      `${BASE_URL}/tx`,
      signedTransaction.toHex()
    );
    return response.data;
  }

  async getRawTransaction(transactionID: TransactionID): Promise<string> {
    const response = await axios.get(`${BASE_URL}/tx/${transactionID}/hex`);
    return response.data;
  }

  async getFeeEstimates(): Promise<FeeEstimates> {
    const response = await axios.get(`${BASE_URL}/fee-estimates`);
    const fees = response.data;
    // Blockstream returns fee estimates in sats/vB. We'll ceil to the nearest integer for safety.
    return {
      slow: Math.ceil(fees['6']),
      medium: Math.ceil(fees['3']),
      fast: Math.ceil(fees['1']),
    };
  }

  async getUTXOs(address: Address): Promise<UTXO[]> {
    const response = await axios.get(`${BASE_URL}/address/${address}/utxo`);
    return response.data.map((utxo: { txid: string, vout: number, value: number }) => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: BigInt(utxo.value),
    }));
  }

  async getTransactionHistory(address: Address): Promise<Transaction[]> {
    // Note: This implementation has limitations for complex transactions.
    // It assumes that in a "send" transaction, the first output not matching the user's address
    // is the recipient. This may not be accurate for transactions with multiple recipients (batch payments)
    // or complex scripts. For a production-grade wallet, a more sophisticated transaction parsing
    // mechanism would be required.
    const response = await axios.get<BlockstreamTx[]>(`${BASE_URL}/address/${address}/txs`);
    const txs = response.data;

    return txs.map((tx) => {
      // ⚡ Bolt: Single-pass transaction parsing.
      // We calculate valueIn and valueOut in a single iteration over vout and vin,
      // while simultaneously identifying the recipient or sender address.
      // This avoids multiple iterations (filter + reduce + find) and
      // eliminates intermediate array allocations, significantly improving
      // performance for accounts with large transaction histories.
      let valueIn = 0;
      let recipientOutput: Vout | undefined;
      for (const vout of tx.vout) {
        if (vout.scriptpubkey_address === address) {
          valueIn += vout.value;
        } else if (!recipientOutput) {
          recipientOutput = vout;
        }
      }

      let valueOut = 0;
      let senderInput: Vin | undefined;
      for (const vin of tx.vin) {
        if (vin.prevout?.scriptpubkey_address === address) {
          valueOut += vin.prevout.value;
        } else if (!senderInput) {
          senderInput = vin;
        }
      }

      const netValue = valueIn - valueOut;
      const isSend = netValue < 0;

      let fromAddress = 'unknown';
      let toAddress = 'unknown';
      let amountValue = Math.abs(netValue);

      if (isSend) {
        fromAddress = address;
        toAddress = recipientOutput?.scriptpubkey_address || 'unknown';
        if (recipientOutput) {
          amountValue = recipientOutput.value;
        }
      } else {
        toAddress = address;
        fromAddress = senderInput?.prevout?.scriptpubkey_address || 'coinbase';
      }

      const asset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
      return {
        id: tx.txid,
        from: fromAddress,
        to: toAddress,
        asset,
        amount: {
          asset,
          value: (amountValue / SATOSHIS_PER_BTC).toString(),
        },
        fee: {
          asset,
          value: (tx.fee / SATOSHIS_PER_BTC).toString(),
        },
        timestamp: tx.status.block_time,
        psbt: '', // This client does not provide PSBTs.
      };
    });
  }
}

// --- Blockstream API Interfaces ---

interface Vin {
  txid: string;
  vout: number;
  prevout: {
    scriptpubkey_address: string;
    value: number;
  };
  scriptsig: string;
  witness: string[];
  is_coinbase: boolean;
  sequence: number;
}

interface Vout {
  scriptpubkey_address: string;
  value: number;
}

interface TxStatus {
  confirmed: boolean;
  block_height: number;
  block_hash: string;
  block_time: number;
}

interface BlockstreamTx {
  txid: string;
  version: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  size: number;
  weight: number;
  fee: number;
  status: TxStatus;
}
