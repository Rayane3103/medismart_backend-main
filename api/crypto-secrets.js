// AES-256-GCM encryption for AI provider API keys (new `ai:apikey:*` records
// only). Master key comes from AI_SECRETS_KEY env var (32 bytes, base64 or
// hex or plain passphrase - hashed to 32 bytes either way).
//
// NOTE: this is a genuinely new capability. The pre-existing named-key
// feature (`api_key:{id}`, Groq/Gemini) stores its secret in plaintext in
// Redis and is intentionally left untouched by this module.

import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function masterKey() {
  const raw = String(process.env.AI_SECRETS_KEY || "").trim();
  if (!raw) {
    throw new Error(
      "AI_SECRETS_KEY non configurée. Ajoutez une valeur secrète (32+ caractères) "
      + "aux variables d'environnement du déploiement pour chiffrer les clés API IA."
    );
  }
  // Hash whatever shape the operator provided (passphrase/hex/base64) down to
  // exactly 32 bytes, so any reasonably-random input is a valid AES-256 key.
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plainText) {
  const key = masterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText || ""), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    enc_data: encrypted.toString("base64"),
    enc_iv: iv.toString("base64"),
    enc_tag: tag.toString("base64"),
  };
}

export function decryptSecret({ enc_data, enc_iv, enc_tag }) {
  if (!enc_data || !enc_iv || !enc_tag) return "";
  try {
    const key = masterKey();
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(enc_iv, "base64"));
    decipher.setAuthTag(Buffer.from(enc_tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(enc_data, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}

export function secretsConfigured() {
  return Boolean(String(process.env.AI_SECRETS_KEY || "").trim());
}

// Masks a decrypted secret for display (never send the full value back).
export function maskSecret(plainText) {
  const clean = String(plainText || "");
  if (clean.length <= 4) return clean ? "****" : "";
  return `${"*".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}
