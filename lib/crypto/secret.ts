import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

/** Used only when NODE_ENV is not production and no env key is set. Never use this on Vercel. */
export const DEV_GITHUB_ENCRYPTION_FALLBACK = "securestack-local-dev-encryption-key";

export function resolveGithubEncryptionSecret(
  env: Partial<NodeJS.ProcessEnv> = process.env,
): string | null {
  const secret = env.GITHUB_TOKEN_ENCRYPTION_KEY?.trim();
  if (secret && secret.length >= 16) return secret;
  if (env.NODE_ENV !== "production") return DEV_GITHUB_ENCRYPTION_FALLBACK;
  return null;
}

function getKey(): Buffer {
  const secret = resolveGithubEncryptionSecret();
  if (!secret) {
    throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY is required (min 16 characters).");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid encrypted payload.");
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
