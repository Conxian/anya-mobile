import { UnifiedBalanceService } from './unified-balance-service';
import { Account, Asset, Balance } from './domain';
import {
  AccountService,
  LightningService,
  SidechainService,
} from './ports';
import { mock, MockProxy } from 'jest-mock-extended';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);

describe('UnifiedBalanceService', () => {
  let unifiedBalanceService: UnifiedBalanceService;
  let accountService: MockProxy<AccountService>;
  let lightningService: MockProxy<LightningService>;
  let sidechainService: MockProxy<SidechainService>;
  let mockAccount: Account;
  const btcAsset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };

  beforeEach(() => {
    accountService = mock<AccountService>();
    lightningService = mock<LightningService>();
    sidechainService = mock<SidechainService>();
    unifiedBalanceService = new UnifiedBalanceService(
      accountService,
      lightningService,
      sidechainService
    );

    const seed = Uint8Array.from(Buffer.alloc(32, 1));
    const node = bip32.fromSeed(seed);
    mockAccount = new Account('acc-1', 'Test Account', node, bitcoin.networks.bitcoin);
  });

  it('should aggregate balances from all layers', async () => {
    const l1Balance: Balance = {
      asset: btcAsset,
      amount: { asset: btcAsset, value: '1.5' },
    };
    const l2Balance: Balance = {
      asset: btcAsset,
      amount: { asset: btcAsset, value: '0.5' },
    };
    const liquidBalance: Balance = {
      asset: btcAsset,
      amount: { asset: btcAsset, value: '2.0' },
    };

    accountService.getAccountBalance.mockResolvedValue(l1Balance);
    lightningService.getBalance.mockResolvedValue(l2Balance);
    sidechainService.getBalance.mockResolvedValue(liquidBalance);

    const unifiedBalance = await unifiedBalanceService.getUnifiedBalance(mockAccount);

    expect(unifiedBalance.total.value).toBe('4.00000000');
    expect(unifiedBalance.layers.l1).toEqual(l1Balance);
    expect(unifiedBalance.layers.l2).toEqual(l2Balance);
    expect(unifiedBalance.layers.sidechains).toContainEqual(liquidBalance);
  });

  it('should handle zero balances correctly', async () => {
    const zeroBalance: Balance = {
      asset: btcAsset,
      amount: { asset: btcAsset, value: '0.0' },
    };

    accountService.getAccountBalance.mockResolvedValue(zeroBalance);
    lightningService.getBalance.mockResolvedValue(zeroBalance);
    sidechainService.getBalance.mockResolvedValue(zeroBalance);

    const unifiedBalance = await unifiedBalanceService.getUnifiedBalance(mockAccount);

    expect(unifiedBalance.total.value).toBe('0.00000000');
  });
});
