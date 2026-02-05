import { FilePersistence } from './file-persistence';
import { promises as fs } from 'fs';

const TEST_DATA_DIR = './test-data';

describe('FilePersistence', () => {
  beforeEach(async () => {
    // Create a clean test directory before each test.
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up the test directory after each test.
    // ⚡ Bolt: Using any cast for 'rm' as it might be missing in some node type definitions despite being present at runtime.
    await (fs as any).rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  it('should save and load a wallet', async () => {
    const persistence = new FilePersistence(TEST_DATA_DIR);

    // Create a simplified, serializable wallet object for testing.
    const walletToSave = {
      id: 'wallet_1',
      bitcoinWallet: {}, // Empty object for the mock
      accounts: [{ id: 'acc_1', name: 'Test Account' }],
    };

    await persistence.saveWallet(walletToSave as any);
    const loadedWallet = await persistence.loadWallet();

    // We can't do a deep equal because the loaded wallet will be a plain object,
    // not an instance of the Wallet class with mock objects.
    expect(loadedWallet.id).toEqual(walletToSave.id);
    expect(loadedWallet.accounts[0].id).toEqual(walletToSave.accounts[0].id);
  });

  it('should throw an error if the wallet file does not exist', async () => {
    const persistence = new FilePersistence(TEST_DATA_DIR);
    await expect(persistence.loadWallet()).rejects.toThrow(
      'Wallet file not found.'
    );
  });
});
