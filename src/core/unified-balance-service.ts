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

    // ⚡ Bolt: Robust decimal to bigint conversion to avoid floating point precision issues.
    // This replaces a dangerous heuristic-based conversion with a deterministic one.
    const toSats = (val: string, decimals: number = 8): bigint => {
      const [intPart, fragPart = ''] = val.split('.');
      const paddedFrag = fragPart.padEnd(decimals, '0').slice(0, decimals);
      return BigInt(intPart) * BigInt(10 ** decimals) + BigInt(paddedFrag);
    };

    const total = toSats(l1Balance.amount.value) +
                  toSats(l2Balance.amount.value) +
                  toSats(sidechainBalance.amount.value) +
                  toSats(ecashBalance.amount.value) +
                  toSats(statechainBalance.amount.value) +
                  toSats(arkBalance.amount.value);

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
