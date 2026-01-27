export interface ISecureStorageService {
  encrypt(data: string, pin: string): Promise<string>;
  decrypt(encryptedData: string, pin: string): Promise<string>;
}

export class SecureStorageService implements ISecureStorageService {
  private readonly SALT_LENGTH = 16;
  private readonly IV_LENGTH = 12;
  private readonly KEY_LENGTH = 256;
  private readonly PBKDF2_ITERATIONS = 100000;

  async encrypt(data: string, pin: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const key = await this.deriveKey(pin, salt);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );

    const encryptedBytes = new Uint8Array(encryptedData);
    const result = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(encryptedBytes, salt.length + iv.length);

    return Buffer.from(result).toString('hex');
  }

  async decrypt(encryptedHexString: string, pin: string): Promise<string> {
    const encryptedDataBytes = Buffer.from(encryptedHexString, 'hex');

    const salt = encryptedDataBytes.slice(0, this.SALT_LENGTH);
    const iv = encryptedDataBytes.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
    const data = encryptedDataBytes.slice(this.SALT_LENGTH + this.IV_LENGTH);

    const key = await this.deriveKey(pin, salt);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedData);
  }

  private async deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }
}
