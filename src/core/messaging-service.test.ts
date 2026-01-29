import { MessagingServiceImpl } from './messaging-service';
import { Account } from './domain';
import { getPublicKey, utils } from '@noble/secp256k1';
import { mock, MockProxy } from 'jest-mock-extended';
import { BIP32Interface } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';

const generateTestAccount = (id: string, name: string): Account => {
  const privateKey = utils.randomPrivateKey();
  const publicKey = Buffer.from(getPublicKey(privateKey, true));

  const mockNode = mock<BIP32Interface>();
  mockNode.privateKey = Buffer.from(privateKey);
  mockNode.publicKey = publicKey;

  const account = new Account(id, name, mockNode, bitcoin.networks.testnet);

  // Manually override getters to return mock data for this test,
  // as the real getters would involve bitcoinjs-lib.
  Object.defineProperty(account, 'privateKey', {
    get: jest.fn(() => Buffer.from(privateKey).toString('hex')),
  });
  Object.defineProperty(account, 'publicKey', {
    get: jest.fn(() => Buffer.from(publicKey).toString('hex')),
  });

  return account;
};

describe('MessagingServiceImpl', () => {
  let messagingService: MessagingServiceImpl;
  let senderAccount: Account;
  let recipientAccount: Account;

  beforeEach(() => {
    messagingService = new MessagingServiceImpl();
    senderAccount = generateTestAccount('sender-1', 'Sender');
    recipientAccount = generateTestAccount('recipient-1', 'Recipient');
  });

  it('should send and read a message', async () => {
    const plaintext = 'Hello, Bitcoin!';
    const message = await messagingService.sendMessage(
      senderAccount,
      recipientAccount.publicKey,
      plaintext
    );

    expect(message).toBeDefined();

    const decryptedMessage = await messagingService.readMessage(
      recipientAccount,
      message
    );

    expect(decryptedMessage.plaintext).toBe(plaintext);
  });
});
