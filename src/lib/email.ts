import { Resend } from "resend";
import { env } from "@/lib/env";
import { escapeHtml } from "@/lib/escape-html";

const DEFAULT_FROM = env.AUTH_EMAIL_FROM;
const siteUrl = env.NEXT_PUBLIC_SITE_URL || "https://planocerto.app";

// Provedor de envio: Cloudflare Email Service (padrão quando configurado) ou Resend.
const cloudflare =
  env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_EMAIL_TOKEN
    ? { accountId: env.CLOUDFLARE_ACCOUNT_ID, token: env.CLOUDFLARE_EMAIL_TOKEN }
    : null;
const resend =
  !cloudflare && env.RESEND_API_KEY && env.RESEND_API_KEY !== "placeholder-key"
    ? new Resend(env.RESEND_API_KEY)
    : null;

/** "PlanoCerto <acesso@planocerto.app>" → { address, name }; endereço simples → { address }. */
export function parseAddress(value: string): { address: string; name?: string } {
  const m = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!m) return { address: value.trim() };
  const name = m[1].replace(/^"|"$/g, "").trim();
  return name ? { address: m[2].trim(), name } : { address: m[2].trim() };
}

/**
 * Envia pelo Cloudflare Email Service (REST API).
 * https://developers.cloudflare.com/email-service/api/send-emails/rest-api/
 * Sucesso só se o destinatário foi entregue ou enfileirado (não em bounce/supressão).
 */
async function sendViaCloudflare(
  cf: { accountId: string; token: string },
  msg: { from: string; to: string; subject: string; html: string; replyTo?: string },
): Promise<boolean> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/email/sending/send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${cf.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: msg.to,
        from: parseAddress(msg.from),
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
        subject: msg.subject,
        html: msg.html,
      }),
    },
  );
  const body = (await res.json().catch(() => null)) as {
    success?: boolean;
    errors?: { code: number; message: string }[];
    result?: { delivered?: string[]; queued?: string[] };
  } | null;
  if (!res.ok || !body?.success) {
    const err = body?.errors?.map((e) => `${e.code} ${e.message}`).join("; ") || `HTTP ${res.status}`;
    console.error("[email] Cloudflare send error:", err);
    return false;
  }
  const accepted = [...(body.result?.delivered ?? []), ...(body.result?.queued ?? [])];
  if (!accepted.some((a) => a.toLowerCase() === msg.to.toLowerCase())) {
    console.error("[email] Cloudflare: destinatário não aceito (bounce ou supressão)");
    return false;
  }
  return true;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: { from?: string; replyTo?: string }
): Promise<boolean> {
  if (!to) return false;
  const msg = {
    from: options?.from || DEFAULT_FROM,
    to,
    subject,
    html,
    replyTo: options?.replyTo || env.AUTH_EMAIL_REPLY_TO || undefined,
  };
  try {
    if (cloudflare) return await sendViaCloudflare(cloudflare, msg);
    if (!resend) {
      console.error("[email] Nenhum provedor de e-mail configurado (CLOUDFLARE_* ou RESEND_API_KEY).");
      return false;
    }
    const { error } = await resend.emails.send(msg);
    if (error) {
      console.error("[email] Send error:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Error:", error instanceof Error ? error.message : error);
    return false;
  }
}

export function itemCreatedEmail(item: { number: string; action: string; responsible: string; planTitle: string }): { subject: string; html: string } {
  return {
    subject: `Nova ação: ${item.number} — ${planTitle(item.planTitle)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e4e4e7;border-radius:8px">
        <h2 style="color:#18181b;margin:0 0 16px">Nova ação criada</h2>
        <p style="color:#52525b;margin:0 0 12px">Uma nova ação foi adicionada ao plano <strong>${escapeHtml(item.planTitle)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Número</td><td style="padding:8px;border:1px solid #e4e4e7">${escapeHtml(item.number)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Ação</td><td style="padding:8px;border:1px solid #e4e4e7">${escapeHtml(item.action)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Responsável</td><td style="padding:8px;border:1px solid #e4e4e7">${escapeHtml(item.responsible || "—")}</td></tr>
        </table>
        <a href="${siteUrl}/planos" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Ver no PlanoCerto</a>
        <p style="color:#a1a1aa;font-size:12px;margin:20px 0 0">PlanoCerto</p>
      </div>`,
  };
}

export function itemCompletedEmail(item: { number: string; action: string; responsible: string; planTitle: string }): { subject: string; html: string } {
  return {
    subject: `Concluída: ${item.number} — ${planTitle(item.planTitle)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e4e4e7;border-radius:8px">
        <h2 style="color:#059669;margin:0 0 16px">✓ Ação concluída</h2>
        <p style="color:#52525b;margin:0 0 12px">Uma ação do plano <strong>${escapeHtml(item.planTitle)}</strong> foi concluída.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Número</td><td style="padding:8px;border:1px solid #e4e4e7">${escapeHtml(item.number)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Ação</td><td style="padding:8px;border:1px solid #e4e4e7">${escapeHtml(item.action)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Responsável</td><td style="padding:8px;border:1px solid #e4e4e7">${escapeHtml(item.responsible || "—")}</td></tr>
        </table>
        <a href="${siteUrl}/planos" style="display:inline-block;background:#059669;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Ver no PlanoCerto</a>
        <p style="color:#a1a1aa;font-size:12px;margin:20px 0 0">PlanoCerto</p>
      </div>`,
  };
}

function planTitle(title: string): string {
  return title.length > 50 ? title.slice(0, 47) + "..." : title;
}
