import { LiquidBlockchainClient } from './liquid-client';
import { Account, Asset } from '../core/domain';
import * as liquid from 'liquidjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

describe('LiquidBlockchainClient', () => {
  let liquidClient: LiquidBlockchainClient;
  let mockAccount: Account;
  const btcAsset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };

  beforeEach(() => {
    liquidClient = new LiquidBlockchainClient(liquid.networks.liquid);
    const seed = Uint8Array.from(Buffer.alloc(32, 1));
    const node = bip32.fromSeed(seed);
    // Use standard bitcoin networks for mock account as domain expects it,
    // but the adapter will handle liquid specific logic.
    mockAccount = new Account('acc-1', 'Test Account', node);
  });

  it('should issue a new asset', async () => {
    const asset = await liquidClient.issueAsset(mockAccount, 'Test Asset', 'TST', 1000n);
    expect(asset.name).toBe('Test Asset');
    expect(asset.symbol).toBe('TST');
    expect(asset.isConfidential).toBe(true);
    expect(asset.assetId).toBeDefined();
  });

  it('should return a balance for an asset', async () => {
    const balance = await liquidClient.getBalance(mockAccount, btcAsset);
    expect(balance.asset).toEqual(btcAsset);
    expect(balance.amount.value).toBe('0.0');
  });

  it('should initiate an asset transfer', async () => {
    const asset = {
      name: 'Test',
      symbol: 'TST',
      decimals: 8,
      assetId: '123',
      isConfidential: true
    };
    const txid = await liquidClient.transferAsset(
      mockAccount,
      'vj6v...',
      asset,
      { asset, value: '10' }
    );
    expect(txid).toMatch(/^liquid-tx-/);
  });
});
