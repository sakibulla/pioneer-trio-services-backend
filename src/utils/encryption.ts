import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Ensure 32-byte binary key
const getMasterKey = (): Buffer => {
  const masterKey = env.ENCRYPTION_MASTER_KEY;
  if (masterKey.length === 64) {
    return Buffer.from(masterKey, 'hex');
  }
  return crypto.createHash('sha256').update(masterKey).digest();
};

export interface EncryptedPayload {
  iv: string; // Hex string
  tag: string; // Hex string
  encryptedData: Buffer;
}

/**
 * Encrypt a buffer or text using AES-256-GCM
 */
export const encryptBuffer = (buffer: Buffer | string): EncryptedPayload => {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, 'utf-8');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);

  const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    encryptedData,
  };
};

/**
 * Decrypt an AES-256-GCM encrypted buffer
 */
export const decryptBuffer = (encryptedData: Buffer, ivHex: string, tagHex: string): Buffer => {
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv);

  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted;
};

/**
 * Encrypt string to combined base64 representation
 */
export const encryptString = (text: string): string => {
  const { iv, tag, encryptedData } = encryptBuffer(text);
  return `${iv}:${tag}:${encryptedData.toString('base64')}`;
};

/**
 * Decrypt combined base64 representation back to string
 */
export const decryptString = (payload: string): string => {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }
  const [iv, tag, base64Data] = parts;
  const encryptedBuffer = Buffer.from(base64Data, 'base64');
  const decrypted = decryptBuffer(encryptedBuffer, iv, tag);
  return decrypted.toString('utf-8');
};
