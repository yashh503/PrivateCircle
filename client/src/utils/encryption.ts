class SimpleEncryption {
  private key: string;

  constructor(key?: string) {
    this.key = key || this.generateKey();
  }

  private generateKey(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  encrypt(text: string): string {
    try {
      const key = this.key;
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        const keyChar = key[i % key.length];
        const encryptedChar = String.fromCharCode(
          text.charCodeAt(i) ^ keyChar.charCodeAt(0)
        );
        encrypted += encryptedChar;
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      return text;
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const encrypted = atob(encryptedText);
      const key = this.key;
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = key[i % key.length];
        const decryptedChar = String.fromCharCode(
          encrypted.charCodeAt(i) ^ keyChar.charCodeAt(0)
        );
        decrypted += decryptedChar;
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText;
    }
  }

  getKey(): string {
    return this.key;
  }

  setKey(key: string): void {
    this.key = key;
  }
}

// ---------------- FIX HERE -----------------
// ALL users (sender and receiver, any browser) MUST use this key!
const STATIC_ROOM_KEY = 'superSecretRoomKey123!';

// Make sure the same key is always used for encryption & decryption
export const encryption = new SimpleEncryption(STATIC_ROOM_KEY);
