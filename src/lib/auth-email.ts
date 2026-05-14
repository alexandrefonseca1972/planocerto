import { env } from "@/lib/env";

const brandName = "PlanoCerto";
const siteUrl = env.NEXT_PUBLIC_SITE_URL;
const brand = {
  page: "#f4f4f5",
  card: "#ffffff",
  border: "#e4e4e7",
  text: "#18181b",
  muted: "#52525b",
  brand: "#013759",
  brandDark: "#012d4a",
  accent: "#33afab",
  accentSoft: "#e8f7f6",
};

type AuthEmailKind = "recovery" | "magic_link";

function renderLayout(title: string, eyebrow: string, intro: string, ctaLabel: string, ctaHref: string) {
  return `
    <div style="margin:0;padding:24px 12px;background-color:${brand.page};font-family:Arial,Helvetica,sans-serif;color:${brand.text};">
      <div style="max-width:600px;margin:0 auto;background-color:${brand.card};border-radius:20px;overflow:hidden;border:1px solid ${brand.border};">
        <div style="padding:28px 32px 22px;background:${brand.brand};color:#ffffff;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${siteUrl}/icon.svg" alt="${brandName}" width="36" height="36" style="display:block;height:36px;width:36px;border-radius:8px;" />
            <div>
              <div style="font-size:19px;font-weight:700;line-height:1.1;letter-spacing:-0.02em;">${brandName}</div>
              <div style="margin-top:4px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.84;">${eyebrow}</div>
            </div>
          </div>
          <h1 style="margin:20px 0 0;font-size:28px;line-height:1.2;">${title}</h1>
        </div>
        <div style="padding:32px;">
          <div style="display:inline-block;margin:0 0 18px;padding:6px 10px;border-radius:999px;background:${brand.accentSoft};color:${brand.brand};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
            ${brandName}
          </div>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${brand.text};">Olá,</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:${brand.muted};">${intro}</p>
          <p style="margin:0 0 28px;">
            <a href="${ctaHref}" style="display:inline-block;background-color:${brand.brand};color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">
              ${ctaLabel}
            </a>
          </p>
          <div style="margin:0 0 24px;padding:16px 18px;border:1px solid ${brand.border};border-radius:14px;background:#fafafa;">
            <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:${brand.muted};">Se o botão não funcionar, use este link:</p>
            <p style="margin:0;font-size:14px;line-height:1.7;word-break:break-all;">
              <a href="${ctaHref}" style="color:${brand.brandDark};text-decoration:none;">${ctaHref}</a>
            </p>
          </div>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${brand.muted};">
            Se você não solicitou esta ação, ignore este email.
          </p>
          <div style="padding-top:20px;border-top:1px solid ${brand.border};font-size:12px;line-height:1.7;color:#71717a;">
            ${brandName} · Gestão com método, clareza e acompanhamento.
          </div>
        </div>
      </div>
    </div>
  `;
}

export function buildAuthEmail(kind: AuthEmailKind, actionLink: string, email: string) {
  if (kind === "recovery") {
    return {
      subject: "Redefina sua senha do PlanoCerto",
      html: renderLayout(
        "Redefina sua senha",
        "Recuperação de acesso",
        `Recebemos uma solicitação para redefinir a senha da conta <strong>${email}</strong>.`,
        "Criar nova senha",
        actionLink
      ),
    };
  }

  return {
    subject: "Seu link de acesso ao PlanoCerto",
    html: renderLayout(
      "Seu link de acesso",
      "Acesso seguro",
      "Clique no botão abaixo para entrar no <strong>PlanoCerto</strong> com segurança.",
      "Entrar agora",
      actionLink
    ),
  };
}
