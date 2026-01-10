import { MessagingServiceImpl } from './messaging-service';
import { Account } from './domain';
import { getPublicKey, utils } from '@noble/secp256k1';

const generateTestAccount = (id: string, name: string): Account => {
  const privateKey = utils.randomPrivateKey();
  const publicKey = getPublicKey(privateKey, true);

  return {
    id,
    name,
    address: `${name}-address`,
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex'),
  };
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
