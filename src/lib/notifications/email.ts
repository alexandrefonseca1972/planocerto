import { Resend } from "resend";
import { z } from "zod";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

const AlertEmailSchema = z.object({
  to: z.string().email(),
  entityName: z.string().min(1).max(300),
  severity: z.enum(["low", "medium", "high", "critical"]),
  insightText: z.string().min(10).max(2000),
  publicationDate: z.string(),
  publicationUrl: z.string().url().optional(),
  publicationTitle: z.string().optional(),
});

export type AlertEmailData = z.infer<typeof AlertEmailSchema>;

export async function sendAlertEmail(data: AlertEmailData): Promise<void> {
  const validated = AlertEmailSchema.parse(data);

  const severityLabel = {
    low: "🔵 Informativo",
    medium: "🟡 Atenção",
    high: "🟠 Importante",
    critical: "🔴 URGENTE",
  }[validated.severity];

  const { error } = await resend.emails.send({
    from: "alertas@seudominio.com.br",
    to: validated.to,
    subject: `${severityLabel} — ${validated.entityName} no Diário Oficial`,
    html: `
      <h2>Alerta de Monitoramento</h2>
      <p><strong>Entidade:</strong> ${validated.entityName}</p>
      <p><strong>Nível:</strong> ${severityLabel}</p>
      <p><strong>Data da publicação:</strong> ${validated.publicationDate}</p>
      ${validated.publicationTitle ? `<p><strong>Ato:</strong> ${validated.publicationTitle}</p>` : ""}
      <hr>
      <p>${validated.insightText.replace(/\n/g, "<br>")}</p>
      ${validated.publicationUrl ? `<p><a href="${validated.publicationUrl}">Ver publicação original</a></p>` : ""}
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}