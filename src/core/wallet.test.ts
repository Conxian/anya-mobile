import { createWallet } from './wallet';

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
