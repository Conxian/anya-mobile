import { FilePersistence } from './file-persistence';
import { Wallet, Account } from '../core/domain';
import { promises as fs } from 'fs';
import * as path from 'path';

const TEST_DATA_DIR = './test-data';
const WALLET_FILE = 'wallet.json';

describe('FilePersistence', () => {
  beforeEach(async () => {
    // Create a clean test directory before each test.
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up the test directory after each test.
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  it('should save and load a wallet', async () => {
    const persistence = new FilePersistence(TEST_DATA_DIR);
    const account: Account = {
      id: 'acc_1',
      name: 'Test Account',
      address: 'test-address',
      privateKey: 'test-private-key',
      publicKey: 'test-public-key',
    };
    const wallet: Wallet = {
      id: 'wallet_1',
      masterPrivateKey: 'test-seed',
      accounts: [account],
    };

    await persistence.saveWallet(wallet);
    const loadedWallet = await persistence.loadWallet();

    expect(loadedWallet).toEqual(wallet);
  });

  it('should throw an error if the wallet file does not exist', async () => {
    const persistence = new FilePersistence(TEST_DATA_DIR);
    await expect(persistence.loadWallet()).rejects.toThrow(
      'Wallet file not found.'
    );
  });
});
