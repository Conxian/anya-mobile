import { MessagingService } from './ports';
import {
  Account,
  Message,
  DecryptedMessage,
  PublicKey,
} from './domain';
import * as secp256k1 from 'secp256k1';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

export class MessagingServiceImpl implements MessagingService {
  async sendMessage(
    senderAccount: Account,
    recipientPublicKey: PublicKey,
    plaintext: string
  ): Promise<Message> {
    const privateKey = Buffer.from(senderAccount.privateKey, 'hex');
    const recipientPubKey = Buffer.from(recipientPublicKey, 'hex');

    const ephemeralPrivateKey = this.generatePrivateKey();
    const ephemeralPublicKey = secp256k1.publicKeyCreate(ephemeralPrivateKey);

    const sharedSecret = Buffer.from(secp256k1.ecdh(recipientPubKey, ephemeralPrivateKey));

    const iv = randomBytes(16);
    const ciphertext = this.encrypt(plaintext, sharedSecret, iv);

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

    const sharedSecret = Buffer.from(secp256k1.ecdh(senderPublicKey, privateKey));

    const [ivHex, ciphertext] = message.ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const plaintext = this.decrypt(ciphertext, sharedSecret, iv);

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
    let privateKey;
    do {
      privateKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));
    return privateKey;
  }

  private encrypt(text: string, key: Buffer, iv: Buffer): string {
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(text: string, key: Buffer, iv: Buffer): string {
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
