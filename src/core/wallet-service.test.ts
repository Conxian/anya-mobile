import { WalletServiceImpl } from './wallet-service';
import * as bip39 from 'bip39';

describe('WalletServiceImpl', () => {
  let walletService: WalletServiceImpl;

  beforeEach(() => {
    walletService = new WalletServiceImpl();
  });

  it('should create a new Bitcoin wallet and return the mnemonic', async () => {
    const { wallet, mnemonic } = await walletService.createWallet('strong-password');

    expect(wallet).toBeDefined();
    expect(wallet.id).toBe('wallet-1');
    expect(wallet.masterPrivateKey).toMatch(/^[1-9A-HJ-NP-Za-km-z]{80,112}$/);
    expect(wallet.accounts).toEqual([]);

    expect(mnemonic).toBeDefined();
    expect(bip39.validateMnemonic(mnemonic)).toBe(true);
  });

  it('should load a wallet from a mnemonic', async () => {
    const { wallet: createdWallet, mnemonic } = await walletService.createWallet('strong-password');
    const loadedWallet = await walletService.loadWalletFromMnemonic(mnemonic, 'strong-password');

    expect(loadedWallet.id).toEqual(createdWallet.id);
    expect(loadedWallet.masterPrivateKey).toEqual(createdWallet.masterPrivateKey);
  });
});
