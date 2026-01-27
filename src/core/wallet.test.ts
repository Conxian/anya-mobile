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
    const wallet = await createWallet();

    // Check that mnemonic exists and is a non-empty string
    expect(wallet).toHaveProperty('mnemonic');
    expect(typeof wallet.mnemonic).toBe('string');
    expect(wallet.mnemonic.length).toBeGreaterThan(0);

    // Check the async properties
    const masterPrivateKey = await wallet.getMasterPrivateKey();
    const p2wpkhAddress = await wallet.getP2wpkhAddress();

    // Check that the properties have the correct types
    expect(typeof masterPrivateKey).toBe('string');
    expect(typeof p2wpkhAddress).toBe('string');

    // Check that the properties are not empty
    expect(masterPrivateKey.length).toBeGreaterThan(0);
    expect(p2wpkhAddress.length).toBeGreaterThan(0);
  });
});
