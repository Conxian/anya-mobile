import { SwapService } from '../core/ports';
import {
  Account,
  Address,
  Amount,
} from '../core/domain';
// @ts-ignore - boltz-core types might be slightly different in this env
import { swapScript, reverseSwapScript } from 'boltz-core';
import * as bitcoin from 'bitcoinjs-lib';

/**
 * ⚡ Bolt: BoltzClient implements the SwapService port using boltz-core.
 * It provides realistic implementation of Submarine and Reverse Swaps
 * by utilizing the Boltz SDK to construct the necessary Bitcoin scripts.
 */
export class BoltzClient implements SwapService {
  constructor(private readonly network: bitcoin.Network = bitcoin.networks.bitcoin) {}

  async createSubmarineSwap(
    account: Account,
    _invoice: string,
    _refundAddress: Address
  ): Promise<{
    address: Address;
    redeemScript: string;
    expectedAmount: Amount;
  }> {
    /**
     * ⚡ Bolt: Realistic swap script construction using boltz-core.
     *
     * TODO: Integrate with real Boltz API.
     * In a production environment, preimageHash and claimPublicKey are fetched
     * from the Boltz backend via a POST /swap request.
     */
    const dummyPreimageHash = bitcoin.crypto.sha256(new Uint8Array(Buffer.from('submarine-swap-preimage') as any));
    const boltzClaimPublicKey = Buffer.from('030101010101010101010101010101010101010101010101010101010101010101', 'hex'); // 33-byte mock key

    const refundPublicKey = account.getSigner().publicKey;
    const timeout = 500000; // Block height timeout

    const script = swapScript(
      Buffer.from(dummyPreimageHash),
      boltzClaimPublicKey,
      Buffer.from(refundPublicKey),
      timeout
    );

    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: new Uint8Array(script) as any, network: this.network },
      network: this.network,
    });

    return {
      address: p2sh.address!,
      redeemScript: script.toString('hex'),
      expectedAmount: {
        value: '100000',
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
      },
    };
  }

  async createReverseSwap(
    account: Account,
    _amount: Amount,
    _onchainAddress: Address
  ): Promise<{
    invoice: string;
    lockupAddress: Address;
    redeemScript: string;
  }> {
    /**
     * ⚡ Bolt: Reverse swap logic using boltz-core.
     *
     * TODO: Integrate with real Boltz API.
     * In a production environment, the lockup address and invoice are fetched
     * from Boltz backend via a POST /reverseswap request.
     */
    const dummyPreimageHash = bitcoin.crypto.sha256(new Uint8Array(Buffer.from('reverse-swap-preimage') as any));
    const boltzRefundPublicKey = Buffer.from('020202020202020202020202020202020202020202020202020202020202020202', 'hex'); // 33-byte mock key
    const claimPublicKey = account.getSigner().publicKey;
    const timeout = 500100;

    const script = reverseSwapScript(
      Buffer.from(dummyPreimageHash),
      Buffer.from(claimPublicKey),
      boltzRefundPublicKey,
      timeout
    );

    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: new Uint8Array(script) as any, network: this.network },
      network: this.network,
    });

    return {
      invoice: 'lnbc1_reverse_swap_invoice_mock',
      lockupAddress: p2sh.address!,
      redeemScript: script.toString('hex'),
    };
  }
}
