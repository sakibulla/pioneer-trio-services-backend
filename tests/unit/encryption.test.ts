import { encryptString, decryptString, encryptBuffer, decryptBuffer } from '../../src/utils/encryption';

describe('Encryption Utility (AES-256-GCM)', () => {
  it('should encrypt and decrypt a string accurately', () => {
    const originalText = 'Sensitive Passport EA0987654 for Client Rafiqul';
    const encrypted = encryptString(originalText);

    expect(encrypted).not.toEqual(originalText);
    expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext

    const decrypted = decryptString(encrypted);
    expect(decrypted).toEqual(originalText);
  });

  it('should encrypt and decrypt binary buffers with authenticated tag', () => {
    const buffer = Buffer.from('Binary PDF stream payload content', 'utf-8');
    const { iv, tag, encryptedData } = encryptBuffer(buffer);

    expect(encryptedData).toBeDefined();
    expect(iv).toHaveLength(32); // 16 bytes hex
    expect(tag).toHaveLength(32); // 16 bytes hex

    const decrypted = decryptBuffer(encryptedData, iv, tag);
    expect(decrypted.toString('utf-8')).toEqual('Binary PDF stream payload content');
  });

  it('should fail decryption if tag or data is tampered with', () => {
    const text = 'Tamper test string';
    const encrypted = encryptString(text);
    const [iv, tag, data] = encrypted.split(':');

    // Tamper with ciphertext
    const tamperedData = Buffer.from('TamperedData').toString('base64');
    const tamperedPayload = `${iv}:${tag}:${tamperedData}`;

    expect(() => {
      decryptString(tamperedPayload);
    }).toThrow();
  });
});
