import { BlockchainClient } from '../core/ports';
import {
  Address,
  Asset,
  TransactionID,
  Balance,
  Transaction,
  FeeEstimates,
} from '../core/domain';
import axios from 'axios';

const BASE_URL = 'https://blockstream.info/api';

export class BlockstreamClient implements BlockchainClient {
  async getBalance(address: Address, asset: Asset): Promise<Balance> {
    const response = await axios.get(`${BASE_URL}/address/${address}`);
    const utxos = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
    return {
      asset,
      amount: { asset, value: (utxos / 1e8).toString() },
    };
  }

  async getTransaction(transactionID: TransactionID): Promise<Transaction> {
    const response = await axios.get(`${BASE_URL}/tx/${transactionID}`);
    const tx = response.data;

    const totalInputValue = tx.vin.reduce((sum: number, input: any) => sum + input.prevout.value, 0);
    const totalOutputValue = tx.vout.reduce((sum: number, output: any) => sum + output.value, 0);

    const fromAddress = tx.vin[0]?.prevout.scriptpubkey_address || 'unknown';
    const toAddress = tx.vout[0]?.scriptpubkey_address || 'unknown';

    return {
      id: tx.txid,
      from: fromAddress,
      to: toAddress,
      asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      amount: { asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 }, value: (totalOutputValue / 1e8).toString() },
      fee: { asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 }, value: ((totalInputValue - totalOutputValue) / 1e8).toString() },
      timestamp: tx.status.block_time,
    };
  }

  async broadcastTransaction(signedTransaction: any): Promise<TransactionID> {
    const response = await axios.post(`${BASE_URL}/tx`, signedTransaction.toHex());
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
}
