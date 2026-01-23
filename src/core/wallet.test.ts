import { createWallet } from './wallet';

describe('Wallet', () => {
  it('should create a new wallet with all the expected properties', async () => {
    const wallet = await createWallet();

    // Check that all properties exist
    expect(wallet).toHaveProperty('mnemonic');
    expect(wallet).toHaveProperty('masterPrivateKey');
    expect(wallet).toHaveProperty('p2wpkhAddress');

    // Check that the properties have the correct types
    expect(typeof wallet.mnemonic).toBe('string');
    expect(typeof wallet.masterPrivateKey).toBe('string');
    expect(typeof wallet.p2wpkhAddress).toBe('string');

    // Check that the properties are not empty
    expect(wallet.mnemonic.length).toBeGreaterThan(0);
    expect(wallet.masterPrivateKey.length).toBeGreaterThan(0);
    expect(wallet.p2wpkhAddress.length).toBeGreaterThan(0);
  });
});
