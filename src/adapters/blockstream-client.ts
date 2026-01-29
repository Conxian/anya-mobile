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
      (sum: number, input: any) => sum + input.prevout.value,
      0
    );
    const totalOutputValue = tx.vout.reduce(
      (sum: number, output: any) => sum + output.value,
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
    return response.data.map((utxo: any) => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
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
      const valueIn = tx.vout
        .filter((vout) => vout.scriptpubkey_address === address)
        .reduce((sum, vout) => sum + vout.value, 0);

      const valueOut = tx.vin
        .filter((vin) => vin.prevout?.scriptpubkey_address === address)
        .reduce((sum, vin) => sum + vin.prevout.value, 0);

      const netValue = valueIn - valueOut;
      const isSend = netValue < 0;

      let fromAddress = 'unknown';
      let toAddress = 'unknown';
      let amountValue = Math.abs(netValue);

      if (isSend) {
        fromAddress = address;
        // Find the recipient address (an output that is not our change address)
        const recipientOutput = tx.vout.find(
          (vout) => vout.scriptpubkey_address !== address
        );
        toAddress = recipientOutput?.scriptpubkey_address || 'unknown';
        // For a send, the amount is the value of the non-change output
        if (recipientOutput) {
          amountValue = recipientOutput.value;
        }
      } else {
        toAddress = address;
        // Find the sender address (an input that is not ours)
        const senderInput = tx.vin.find(
          (vin) => vin.prevout?.scriptpubkey_address !== address
        );
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
