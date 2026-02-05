import {
  Account,
  Asset,
  UnifiedBalance,
} from './domain';
import {
  AccountService,
  LightningService,
  SidechainService,
  StateChainService,
} from './ports';

export class UnifiedBalanceService {
  constructor(
    private accountService: AccountService,
    private lightningService: LightningService,
    private sidechainService: SidechainService,
    private stateChainService?: StateChainService
  ) {}

  /**
   * ⚡ Bolt: Parallel fetching of balances from all layers to minimize UI latency.
   * 💡 What: Aggregates Bitcoin balances from L1, L2, Sidechains, and State Chains.
   * 🎯 Why: Provides a holistic view of the user's Bitcoin wealth, a hallmark of a "best-in-class" wallet.
   */
  async getUnifiedBalance(account: Account): Promise<UnifiedBalance> {
    const btcAsset: Asset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };

    // Fetch balances in parallel
    const [l1Balance, l2Balance, liquidBalance] = await Promise.all([
      this.accountService.getAccountBalance(account, btcAsset),
      this.lightningService.getBalance(account),
      this.sidechainService.getBalance(account, btcAsset),
    ]);

    // Calculate total using BigInt to avoid floating point errors.
    // ⚡ Bolt: Using satoshis (BigInt) for all financial calculations to ensure precision.
    const toSats = (val: string, decimals: number): bigint => {
      const [integral, fractional = ''] = val.split('.');
      const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
      return BigInt(integral + paddedFractional);
    };

    const totalSats =
      toSats(l1Balance.amount.value, btcAsset.decimals) +
      toSats(l2Balance.amount.value, btcAsset.decimals) +
      toSats(liquidBalance.amount.value, btcAsset.decimals);

    const integralStr = (totalSats / BigInt(10 ** btcAsset.decimals)).toString();
    const fractionalStr = (totalSats % BigInt(10 ** btcAsset.decimals)).toString().padStart(btcAsset.decimals, '0');
    const totalValue = `${integralStr}.${fractionalStr}`;

    return {
      total: { asset: btcAsset, value: totalValue },
      layers: {
        l1: l1Balance,
        l2: l2Balance,
        sidechains: [liquidBalance],
        statechains: [], // To be implemented with Mercury Layer
      },
    };
  }
}
