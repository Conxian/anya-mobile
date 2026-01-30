import { BitcoinWallet, createWallet } from './wallet';
import { SecureStorageService } from '../services/secure-storage';
import { Crypto } from '@peculiar/webcrypto';

// Set up webcrypto environment
global.crypto = new Crypto();
// Mock the Worker class
class MockWorker {
  onmessage: (event: any) => void = () => {};
  onerror: (error: any) => void = () => {};
  postMessage(message: any) {
    this.onmessage({
      data: {
        status: 'success',
        address: 'mock-address',
        mnemonic:
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      },
    });
  }
  terminate() {}
}
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
