import { AwsClient } from "aws4fetch";
import { env } from "@/lib/env";

// Anexos no Cloudflare R2 (API S3). Bucket privado: só o servidor grava e
// apaga; o download sai por URL assinada de curta duração, forçando
// download (Content-Disposition: attachment), nunca exibição inline.
// Chave no bucket: `<area>/<storage_path>`, com storage_path igual ao gravado
// em plan_attachments / conta_attachments.

export type R2Area = "plan-attachments" | "contas-anexos";

let client: AwsClient | null = null;

function r2(): AwsClient {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new Error("R2 não configurado (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).");
  }
  client ??= new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  return client;
}

export function r2ObjectUrl(area: R2Area, path: string): string {
  const key = [area, ...path.split("/")].map(encodeURIComponent).join("/");
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`;
}

export async function r2Put(area: R2Area, path: string, file: File): Promise<boolean> {
  // Assina e envia o buffer à parte: via r2().fetch o corpo vira stream do
  // Request e, no runtime do Next, sai sem Content-Length — o R2 responde
  // 411 MissingContentLength para arquivos maiores.
  const body = new Uint8Array(await file.arrayBuffer());
  const signed = await r2().sign(r2ObjectUrl(area, path), {
    method: "PUT",
    body,
    headers: { "Content-Type": file.type },
  });
  const res = await fetch(signed.url, { method: "PUT", headers: signed.headers, body });
  if (!res.ok) {
    console.error(`[r2Put] ${res.status} ${area}/${path}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.ok;
}

/** R2 responde 204 também para objeto inexistente. */
export async function r2Delete(area: R2Area, path: string): Promise<boolean> {
  const res = await r2().fetch(r2ObjectUrl(area, path), { method: "DELETE" });
  return res.ok;
}

export async function r2SignedDownloadUrl(
  area: R2Area,
  path: string,
  filename: string,
  expiresSeconds = 300,
): Promise<string> {
  const url = new URL(r2ObjectUrl(area, path));
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
  url.searchParams.set(
    "response-content-disposition",
    `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
  );
  const signed = await r2().sign(url.toString(), { method: "GET", aws: { signQuery: true } });
  return signed.url;
}
