import { UnifiedBalanceService } from './unified-balance-service';
import { BlockchainClient, LightningService, SidechainService, EcashService, StateChainService } from './ports';
import { mock, MockProxy } from 'jest-mock-extended';
import { Account, Asset, AddressType } from './domain';
import * as bitcoin from 'bitcoinjs-lib';

describe('UnifiedBalanceService', () => {
  let balanceService: UnifiedBalanceService;
  let l1Client: MockProxy<BlockchainClient>;
  let l2Client: MockProxy<LightningService>;
  let sidechainClient: MockProxy<SidechainService>;
  let ecashClient: MockProxy<EcashService>;
  let stateChainClient: MockProxy<StateChainService>;
  let account: Account;
  const btcAsset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };

  beforeEach(() => {
    l1Client = mock<BlockchainClient>();
    l2Client = mock<LightningService>();
    sidechainClient = mock<SidechainService>();
    ecashClient = mock<EcashService>();
    stateChainClient = mock<StateChainService>();
    balanceService = new UnifiedBalanceService(
      l1Client,
      l2Client,
      sidechainClient,
      ecashClient,
      stateChainClient
    );

    account = new Account('test', 'Test', null as any, bitcoin.networks.bitcoin, AddressType.NativeSegWit);
    // Mock address getter
    Object.defineProperty(account, 'address', { get: () => 'bc1qtest' });
  });

  it('should aggregate balances from all 5 layers in parallel', async () => {
    l1Client.getBalance.mockResolvedValue({
      asset: btcAsset,
      amount: { asset: btcAsset, value: '1.5' },
    });
    l2Client.getBalance.mockResolvedValue({
      asset: btcAsset,
      amount: { asset: btcAsset, value: '0.5' },
    });
    sidechainClient.getBalance.mockResolvedValue({
      asset: btcAsset,
      amount: { asset: btcAsset, value: '1.0' },
    });
    ecashClient.getBalance.mockResolvedValue({
      asset: btcAsset,
      amount: { asset: btcAsset, value: '0.25' },
    });
    stateChainClient.getBalance.mockResolvedValue({
      asset: btcAsset,
      amount: { asset: btcAsset, value: '0.75' },
    });

    const unifiedBalance = await balanceService.getUnifiedBalance(account, btcAsset);

    expect(unifiedBalance.l1.amount.value).toBe('1.5');
    expect(unifiedBalance.l2.amount.value).toBe('0.5');
    expect(unifiedBalance.sidechain.amount.value).toBe('1.0');
    expect(unifiedBalance.ecash.amount.value).toBe('0.25');
    expect(unifiedBalance.statechain.amount.value).toBe('0.75');

    // Total = 1.5 + 0.5 + 1.0 + 0.25 + 0.75 = 4.0 BTC = 400,000,000 sats
    expect(unifiedBalance.total).toBe(400_000_000n);
  });
});
