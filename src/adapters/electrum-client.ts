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
// @ts-expect-error - No type definitions for @mempool/electrum-client
import ElectrumClient from '@mempool/electrum-client';
import * as bitcoin from 'bitcoinjs-lib';

const FEE_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export class ElectrumBlockchainClient implements BlockchainClient {
  private client: any;
  private cachedFeeEstimates: FeeEstimates | null = null;
  private lastFeeFetchTime: number = 0;
  private scriptHashCache: Map<string, string> = new Map();

  constructor(
    host: string,
    port: number,
    protocol: 'tcp' | 'tls' = 'tls',
    private readonly network: bitcoin.Network = bitcoin.networks.bitcoin
  ) {
    this.client = new ElectrumClient(port, host, protocol);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  /**
   * ⚡ Bolt: Cache script hashes to avoid redundant address decoding, script
   * generation, and hashing for multiple requests to the same address.
   */
  private addressToScriptHash(address: Address): string {
    const cached = this.scriptHashCache.get(address);
    if (cached) return cached;

    const script = bitcoin.address.toOutputScript(address, this.network);
    const hash = bitcoin.crypto.sha256(script);
    const scriptHash = Buffer.from(hash).reverse().toString('hex');

    this.scriptHashCache.set(address, scriptHash);
    return scriptHash;
  }

  async getBalance(address: Address, asset: Asset): Promise<Balance> {
    const scriptHash = this.addressToScriptHash(address);
    const balance = await this.client.request('blockchain.scripthash.get_balance', [scriptHash]);
    const totalSats = BigInt(balance.confirmed) + BigInt(balance.unconfirmed);

    return {
      asset,
      amount: { asset, value: (Number(totalSats) / 1e8).toString() },
    };
  }

  async getTransaction(transactionID: TransactionID): Promise<Transaction> {
    const hex = await this.getRawTransaction(transactionID);
    // In a real implementation, we would parse the hex.
    return {
      id: transactionID,
      from: 'unknown',
      to: 'unknown',
      asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      amount: {
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        value: '0',
      },
      fee: {
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        value: '0',
      },
      timestamp: Date.now() / 1000,
      psbt: '',
    };
  }

  async getRawTransaction(transactionID: TransactionID): Promise<string> {
    return await this.client.request('blockchain.transaction.get', [transactionID]);
  }

  async broadcastTransaction(signedTransaction: any): Promise<TransactionID> {
    const hex = typeof signedTransaction === 'string' ? signedTransaction : signedTransaction.toHex();
    return await this.client.request('blockchain.transaction.broadcast', [hex]);
  }

  async getFeeEstimates(): Promise<FeeEstimates> {
    const now = Date.now();
    if (
      this.cachedFeeEstimates &&
      now - this.lastFeeFetchTime < FEE_CACHE_TTL_MS
    ) {
      // ⚡ Bolt: Return cached fee estimates to avoid redundant network requests.
      return this.cachedFeeEstimates;
    }

    const [slow, medium, fast] = await Promise.all([
      this.client.request('blockchain.estimatefee', [6]),
      this.client.request('blockchain.estimatefee', [3]),
      this.client.request('blockchain.estimatefee', [1]),
    ]);

    // Electrum returns BTC/kvB, convert to sat/vB
    const toSatsVB = (btcPerKvB: number) => Math.ceil((btcPerKvB * 1e8) / 1000);

    const estimates = {
      slow: toSatsVB(slow),
      medium: toSatsVB(medium),
      fast: toSatsVB(fast),
    };

    this.cachedFeeEstimates = estimates;
    this.lastFeeFetchTime = now;

    return estimates;
  }

  async getUTXOs(address: Address): Promise<UTXO[]> {
    const scriptHash = this.addressToScriptHash(address);
    const utxos = await this.client.request('blockchain.scripthash.listunspent', [scriptHash]);

    return utxos.map((utxo: any) => ({
      txid: utxo.tx_hash,
      vout: utxo.tx_pos,
      value: BigInt(utxo.value),
    }));
  }

  async getTransactionHistory(address: Address): Promise<Transaction[]> {
    const scriptHash = this.addressToScriptHash(address);
    const history = await this.client.request('blockchain.scripthash.get_history', [scriptHash]);

    // In a full implementation, we would fetch and parse each transaction in the history.
    // For now, we return a basic list mapped to Transaction objects.
    return history.map((item: any) => ({
      id: item.tx_hash,
      from: 'unknown',
      to: address,
      asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      amount: {
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        value: '0', // Would need to fetch tx detail to know the amount
      },
      fee: {
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        value: '0',
      },
      timestamp: 0,
      psbt: '',
    }));
  }
}
