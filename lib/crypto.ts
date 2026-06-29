import "server-only";
import crypto from "node:crypto";

/**
 * AES-256-GCM encryption for secrets at rest (API keys). The key comes from a
 * server-only ENCRYPTION_KEY env var (32 bytes, base64). Ciphertext format is
 * "iv.tag.data", all base64. Plaintext never leaves the server. See
 * docs/EBY-DATA-SECURITY-AND-PRIVACY.md.
 */
const ALGO = "aes-256-gcm";

function key(): Buffer {
  const b64 = process.env.ENCRYPTION_KEY;
  if (!b64) throw new Error("ENCRYPTION_KEY is not set. Ask the admin to configure it before connecting keys.");
  const k = Buffer.from(b64, "base64");
  if (k.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes encoded as base64.");
  return k;
}

export function encryptionAvailable(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decryptSecret(blob: string): string {
  const [ivB, tagB, dataB] = blob.split(".");
  if (!ivB || !tagB || !dataB) throw new Error("Malformed ciphertext.");
  const decipher = crypto.createDecipheriv(ALGO, key(), Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
}
