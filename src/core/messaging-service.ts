import { MessagingService } from './ports';
import { Account, Message, DecryptedMessage, PublicKey } from './domain';
import { getSharedSecret, getPublicKey, utils } from '@noble/secp256k1';
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'crypto';

export class MessagingServiceImpl implements MessagingService {
  async sendMessage(
    senderAccount: Account,
    recipientPublicKey: PublicKey,
    plaintext: string
  ): Promise<Message> {
    const recipientPubKey = Buffer.from(recipientPublicKey, 'hex');

    const ephemeralPrivateKey = this.generatePrivateKey();
    const ephemeralPublicKey = getPublicKey(ephemeralPrivateKey as any, true);

    const sharedSecret = getSharedSecret(
      ephemeralPrivateKey as any,
      recipientPubKey as any,
      true
    );
    const hashedSharedSecret = createHash('sha256')
      .update(sharedSecret.slice(1))
      .digest();

    const iv = randomBytes(16);
    const ciphertext = this.encrypt(plaintext, hashedSharedSecret, iv);

    // In a real implementation, the message would be attached to a transaction.
    // Here, we simulate this with a mock transaction ID.
    const message: Message = {
      id: `msg-${randomBytes(16).toString('hex')}`,
      senderPublicKey: Buffer.from(ephemeralPublicKey).toString('hex'),
      recipientPublicKey,
      ciphertext: `${iv.toString('hex')}:${ciphertext}`,
      timestamp: Date.now(),
    };

    return message;
  }

  async readMessage(
    recipientAccount: Account,
    message: Message
  ): Promise<DecryptedMessage> {
    const privateKey = Buffer.from(recipientAccount.privateKey, 'hex');
    const senderPublicKey = Buffer.from(message.senderPublicKey, 'hex');

    const sharedSecret = getSharedSecret(privateKey as any, senderPublicKey as any, true);
    const hashedSharedSecret = createHash('sha256')
      .update(sharedSecret.slice(1))
      .digest();

    const [ivHex, ciphertext] = message.ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const plaintext = this.decrypt(ciphertext, hashedSharedSecret, iv);

    return {
      id: message.id,
      senderPublicKey: message.senderPublicKey,
      recipientPublicKey: recipientAccount.publicKey,
      plaintext,
      timestamp: message.timestamp,
    };
  }

  async getMessageHistory(account: Account): Promise<Message[]> {
    // This is a mock implementation. In a real wallet, you would fetch
    // the message history from a persistent storage.
    return [];
  }

  private generatePrivateKey(): Buffer {
    return Buffer.from(utils.randomPrivateKey());
  }

  private encrypt(text: string, key: Buffer, iv: Buffer): string {
    const cipher = createCipheriv('aes-256-cbc', key as any, iv as any);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(text: string, key: Buffer, iv: Buffer): string {
    const decipher = createDecipheriv('aes-256-cbc', key as any, iv as any);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
