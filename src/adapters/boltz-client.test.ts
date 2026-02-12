import { BoltzClient } from './boltz-client';
import { Account, AddressType } from '../core/domain';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import ecc from '../core/ecc';

const bip32 = BIP32Factory(ecc as any);

describe('BoltzClient', () => {
  let boltzClient: BoltzClient;
  const network = bitcoin.networks.bitcoin;

  beforeEach(() => {
    boltzClient = new BoltzClient(network);
  });

  it('should create a submarine swap script', async () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const seed = bitcoin.crypto.sha256(new Uint8Array(Buffer.from(mnemonic) as any));
    const root = bip32.fromSeed(new Uint8Array(seed as any));
    const account = new Account('1', 'Test', root, network, AddressType.NativeSegWit);

    const result = await boltzClient.createSubmarineSwap(account, 'lnbc1...', 'bc1q...');

    expect(result.address).toBeDefined();
    expect(result.address.startsWith('3')).toBe(true); // P2SH address starts with 3
    expect(result.redeemScript).toBeDefined();
  });

  it('should create a reverse swap script', async () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const seed = bitcoin.crypto.sha256(new Uint8Array(Buffer.from(mnemonic) as any));
    const root = bip32.fromSeed(new Uint8Array(seed as any));
    const account = new Account('1', 'Test', root, network, AddressType.NativeSegWit);

    const result = await boltzClient.createReverseSwap(account, { value: '1000', asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 } }, 'bc1q...');

    expect(result.invoice).toBeDefined();
    expect(result.lockupAddress).toBeDefined();
    expect(result.lockupAddress.startsWith('3')).toBe(true);
    expect(result.redeemScript).toBeDefined();
  });
});
