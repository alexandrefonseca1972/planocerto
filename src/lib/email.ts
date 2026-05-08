import { Resend } from "resend";
import { getOptionalEnvVar } from "@/lib/env";

const apiKey = getOptionalEnvVar("RESEND_API_KEY");
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = `PlanoCerto <${process.env.NEXT_PUBLIC_SITE_URL ? `notifications@${new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname}` : "no-reply@planocerto.app"}>`;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://planocerto.app";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!to || !resend) return false;
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] Send error:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Error:", error);
    return false;
  }
}

export function itemCreatedEmail(item: { number: string; action: string; responsible: string; planTitle: string }): { subject: string; html: string } {
  return {
    subject: `Nova ação: ${item.number} — ${planTitle(item.planTitle)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e4e4e7;border-radius:8px">
        <h2 style="color:#18181b;margin:0 0 16px">Nova ação criada</h2>
        <p style="color:#52525b;margin:0 0 12px">Uma nova ação foi adicionada ao plano <strong>${item.planTitle}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Número</td><td style="padding:8px;border:1px solid #e4e4e7">${item.number}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Ação</td><td style="padding:8px;border:1px solid #e4e4e7">${item.action}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Responsável</td><td style="padding:8px;border:1px solid #e4e4e7">${item.responsible || "—"}</td></tr>
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
        <p style="color:#52525b;margin:0 0 12px">Uma ação do plano <strong>${item.planTitle}</strong> foi concluída.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Número</td><td style="padding:8px;border:1px solid #e4e4e7">${item.number}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Ação</td><td style="padding:8px;border:1px solid #e4e4e7">${item.action}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e4e4e7;font-weight:600;background:#f4f4f5">Responsável</td><td style="padding:8px;border:1px solid #e4e4e7">${item.responsible || "—"}</td></tr>
        </table>
        <a href="${siteUrl}/planos" style="display:inline-block;background:#059669;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Ver no PlanoCerto</a>
        <p style="color:#a1a1aa;font-size:12px;margin:20px 0 0">PlanoCerto</p>
      </div>`,
  };
}

function planTitle(title: string): string {
  return title.length > 50 ? title.slice(0, 47) + "..." : title;
}
