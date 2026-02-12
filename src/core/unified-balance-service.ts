import { BlockchainClient, LightningService, SidechainService, EcashService, StateChainService, ArkService } from './ports';
import { Account, Asset, Balance } from './domain';

export class UnifiedBalanceService {
  constructor(
    private readonly l1Client: BlockchainClient,
    private readonly l2Client: LightningService,
    private readonly sidechainClient: SidechainService,
    private readonly ecashClient: EcashService,
    private readonly stateChainClient: StateChainService,
    private readonly arkClient: ArkService
  ) {}

  /**
   * ⚡ Bolt: Fetch balances across all layers in parallel to minimize UI latency.
   * This approach avoids sequential network requests, reducing the total time to
   * display a consolidated view of the user's wealth across L1, L2, Sidechains,
   * Ecash, State Chains, and Ark.
   */
  /**
   * ⚡ Bolt: Static helper for robust decimal to bigint conversion.
   * Moved out of `getUnifiedBalance` to avoid re-allocation on every call.
   * Uses BigInt powers (10n ** BigInt(decimals)) for exactness and performance.
   */
  private static toSats(val: string, decimals: number = 8): bigint {
    const isNegative = val.startsWith('-');
    const absoluteVal = isNegative ? val.slice(1) : val;
    const [intPart, fragPart = ''] = absoluteVal.split('.');
    const paddedFrag = fragPart.padEnd(decimals, '0').slice(0, decimals);
    // Handle cases where intPart might be empty or "." (e.g., ".123")
    const intBig = intPart === '' ? 0n : BigInt(intPart);
    const totalSats = intBig * 10n ** BigInt(decimals) + BigInt(paddedFrag);
    return isNegative ? -totalSats : totalSats;
  }

  async getUnifiedBalance(account: Account, asset: Asset): Promise<{
    l1: Balance;
    l2: Balance;
    sidechain: Balance;
    ecash: Balance;
    statechain: Balance;
    ark: Balance;
    total: bigint;
  }> {
    const [l1Balance, l2Balance, sidechainBalance, ecashBalance, statechainBalance, arkBalance] = await Promise.all([
      this.l1Client.getBalance(account.address, asset),
      this.l2Client.getBalance(account),
      this.sidechainClient.getBalance(account, asset),
      this.ecashClient.getBalance(account),
      this.stateChainClient.getBalance(account),
      this.arkClient.getBalance(account),
    ]);

    const total = UnifiedBalanceService.toSats(l1Balance.amount.value) +
                  UnifiedBalanceService.toSats(l2Balance.amount.value) +
                  UnifiedBalanceService.toSats(sidechainBalance.amount.value) +
                  UnifiedBalanceService.toSats(ecashBalance.amount.value) +
                  UnifiedBalanceService.toSats(statechainBalance.amount.value) +
                  UnifiedBalanceService.toSats(arkBalance.amount.value);

    return {
      l1: l1Balance,
      l2: l2Balance,
      sidechain: sidechainBalance,
      ecash: ecashBalance,
      statechain: statechainBalance,
      ark: arkBalance,
      total,
    };
  }
}
