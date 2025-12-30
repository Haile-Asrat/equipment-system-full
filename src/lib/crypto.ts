import crypto from 'crypto';
const keyHex = process.env.LOG_ENCRYPTION_KEY || '';
const key = Buffer.from(keyHex, 'hex');
if (key.length !== 32) {
  // In dev create a dummy key to avoid crash; in prod set proper key
  console.warn('LOG_ENCRYPTION_KEY not 32 bytes; logs will not be encrypted securely.');
}
export function encrypt(text: string) {
  if (!key || key.length !== 32) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('hex');
}
export function decrypt(hex: string) {
  if (!key || key.length !== 32) return hex;
  try {
    const b = Buffer.from(hex, 'hex');
    // If the hex string is too short, it's likely not encrypted
    if (b.length < 32) return hex;
    const iv = b.slice(0,16);
    const tag = b.slice(16,32);
    const data = b.slice(32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]);
    return out.toString('utf8');
  } catch (e) {
    // If decryption fails, return original (might be unencrypted)
    return hex;
  }
}
