import { WalletServiceImpl } from './wallet-service';
import { AccountService } from './ports';
import { mock, MockProxy } from 'jest-mock-extended';

describe('WalletServiceImpl', () => {
  let walletService: WalletServiceImpl;
  let accountService: MockProxy<AccountService>;

  beforeEach(() => {
    accountService = mock<AccountService>();
    walletService = new WalletServiceImpl(accountService);
  });

  it('should create a new wallet', async () => {
    const { wallet, mnemonic } = await walletService.createWallet('password');
    expect(wallet).toBeDefined();
    expect(mnemonic).toBeDefined();
    expect(accountService.createAccount).toHaveBeenCalledWith(wallet, 'Default Account');
  });

  it('should load a wallet from mnemonic', async () => {
    const { mnemonic } = await walletService.createWallet('password');
    const wallet = await walletService.loadWalletFromMnemonic(mnemonic, 'password');
    expect(wallet).toBeDefined();
    expect(accountService.createAccount).toHaveBeenCalledWith(wallet, 'Default Account');
  });
});
