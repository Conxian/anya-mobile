import { MessagingServiceImpl } from './messaging-service';
import { Account } from './domain';
import * as secp256k1 from 'secp256k1';
import { randomBytes } from 'crypto';

const generateTestAccount = (id: string, name: string): Account => {
  let privateKey;
  do {
    privateKey = randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privateKey));
  const publicKey = secp256k1.publicKeyCreate(privateKey);

  return {
    id,
    name,
    address: `${name}-address`,
    privateKey: privateKey.toString('hex'),
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
