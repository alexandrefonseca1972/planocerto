import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Cifra a API key do provedor de IA antes de gravar em llm_settings (AES-256-GCM).
 * A chave vem de LLM_KEY_SECRET (.env.local, mín. 32 caracteres; gere com `openssl rand -base64 32`).
 * O tenant entra como dado autenticado (AAD): o valor cifrado de uma empresa não serve para outra.
 * Formato gravado: "enc:v1:" + base64(iv[12] | tag[16] | texto cifrado).
 * Valores antigos sem prefixo continuam legíveis (texto puro) e são cifrados no próximo salvamento.
 */
const PREFIX = "enc:v1:";
const IV_LEN = 12;
const TAG_LEN = 16;

function key(): Buffer {
  if (!env.LLM_KEY_SECRET) throw new Error("LLM_KEY_SECRET não configurada.");
  return createHash("sha256").update(env.LLM_KEY_SECRET).digest();
}

export function isLlmKeyEncryptionConfigured(): boolean {
  return Boolean(env.LLM_KEY_SECRET);
}

export function isEncryptedLlmKey(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

export function encryptLlmKey(plain: string, tenantId: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key(), iv, { authTagLength: TAG_LEN });
  cipher.setAAD(Buffer.from(tenantId, "utf8"));
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptLlmKey(stored: string, tenantId: string): string {
  if (!isEncryptedLlmKey(stored)) return stored; // legado em texto puro
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
  if (raw.length <= IV_LEN + TAG_LEN) throw new Error("Valor cifrado inválido.");
  const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, IV_LEN), { authTagLength: TAG_LEN });
  decipher.setAAD(Buffer.from(tenantId, "utf8"));
  decipher.setAuthTag(raw.subarray(IV_LEN, IV_LEN + TAG_LEN));
  return Buffer.concat([decipher.update(raw.subarray(IV_LEN + TAG_LEN)), decipher.final()]).toString("utf8");
}
