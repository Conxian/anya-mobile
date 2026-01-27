import { createWallet } from './wallet';
// ⚡ Bolt: Mock the Web Worker for the Node.js test environment.
// The `Worker` class is a browser-specific API and is not available in Node.js,
// which Jest uses to run tests. This mock simulates the behavior of the real
// crypto-worker by performing the `mnemonicToSeed` operation in the same process
// when `postMessage` is called. This allows us to test the `BitcoinWallet` logic
// that depends on the worker without crashing the test runner.
import { mnemonicToSeed } from '@scure/bip39';

class MockWorker {
  onmessage: (event: any) => void = () => {};
  onerror: (error: any) => void = () => {};

  constructor(scriptURL: string) {
    // The constructor is a no-op for the mock.
  }

  postMessage(mnemonic: string) {
    // Simulate the worker's async behavior by calling mnemonicToSeed.
    mnemonicToSeed(mnemonic)
      .then(seed => {
        // When successful, call the onmessage handler with the seed,
        // mimicking the structure of the real worker's message.
        this.onmessage({
          data: { status: 'success', seed },
        });
      })
      .catch(error => {
        // If an error occurs, call the onerror handler.
        this.onerror(error);
      });
  }

  terminate() {
    // The terminate method is a no-op in the mock.
  }
}

// Assign the mock to the global scope before tests run.
global.Worker = MockWorker as any;

describe('Wallet', () => {
  it('should create a new wallet with all the expected properties', async () => {
    const secureStorage = new SecureStorageService();
    const pin = '1234';
    const { wallet, mnemonic } = await createWallet(secureStorage, pin);

    // Check that mnemonic exists and is a non-empty string
    expect(mnemonic).toBeDefined();
    expect(typeof mnemonic).toBe('string');
    expect(mnemonic.length).toBeGreaterThan(0);

    const address = await wallet.getAddress(0, pin);
    expect(typeof address).toBe('string');
    expect(address.length).toBeGreaterThan(0);

    const encryptedMnemonic = wallet.getEncryptedMnemonic();
    expect(typeof encryptedMnemonic).toBe('string');
    expect(encryptedMnemonic.length).toBeGreaterThan(0);
  });
});
