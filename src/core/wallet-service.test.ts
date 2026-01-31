import { WalletServiceImpl } from './wallet-service';
import { AccountService } from './ports';
import { mock, MockProxy } from 'jest-mock-extended';
import { mnemonicToSeedSync } from '@scure/bip39';

// ⚡ Bolt: Mock the Web Worker for the Jest environment.
// The `Worker` class is a browser API and does not exist in the Node.js
// environment where Jest runs its tests. This mock simulates the behavior of
// the crypto worker by intercepting the `postMessage` call and immediately
// returning a valid seed using the synchronous `mnemonicToSeedSync` function.
// This allows the `WalletServiceImpl` to be tested without modification.
const mockWorker = {
  onmessage: (data: any) => {},
  postMessage: jest.fn(
    (message: {
      type: string;
      payload: { mnemonic: string; passphrase?: string };
      requestId: number;
    }) => {
      const { type, payload, requestId } = message;
      if (type === 'mnemonicToSeed') {
        const { mnemonic, passphrase } = payload;
        const seed = mnemonicToSeedSync(mnemonic, passphrase);
        // Directly invoke onmessage to simulate the worker's response
        mockWorker.onmessage({
          data: { requestId, status: 'success', payload: { seed } },
        });
      }
    }
  ),
  terminate: jest.fn(),
};
global.Worker = jest.fn(() => mockWorker) as any;

describe('WalletServiceImpl', () => {
  let walletService: WalletServiceImpl;
  let accountService: MockProxy<AccountService>;

  beforeEach(() => {
    accountService = mock<AccountService>();
    walletService = new WalletServiceImpl(accountService);
    // Clear mocks before each test to ensure isolation
    (global.Worker as jest.Mock).mockClear();
    mockWorker.postMessage.mockClear();
    mockWorker.terminate.mockClear();
  });

  it('should create a new wallet', async () => {
    const { wallet, mnemonic } = await walletService.createWallet('password');
    expect(wallet).toBeDefined();
    expect(mnemonic).toBeDefined();
    expect(accountService.createAccount).toHaveBeenCalledWith(
      wallet,
      'Default Account',
      '1234'
    );
  });

  it('should load a wallet from mnemonic', async () => {
    const { mnemonic } = await walletService.createWallet('password');
    const wallet = await walletService.loadWalletFromMnemonic(
      mnemonic,
      'password'
    );
    expect(wallet).toBeDefined();
    expect(accountService.createAccount).toHaveBeenCalledWith(
      wallet,
      'Default Account',
      '1234'
    );
  });
});
