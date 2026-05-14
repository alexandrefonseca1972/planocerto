import { z } from "zod";
import { env } from "@/lib/env";

const WhatsAppAlertSchema = z.object({
  phone: z.string().regex(/^55\d{10,11}$/),
  entityName: z.string().min(1).max(100),
  severity: z.enum(["low", "medium", "high", "critical"]),
  insightText: z.string().min(10).max(500),
  publicationDate: z.string(),
});

export type WhatsAppAlertData = z.infer<typeof WhatsAppAlertSchema>;

export async function sendWhatsAppAlert(data: WhatsAppAlertData): Promise<void> {
  const validated = WhatsAppAlertSchema.parse(data);

  const severityEmoji = {
    low: "🔵",
    medium: "🟡",
    high: "🟠",
    critical: "🔴",
  }[validated.severity];

  const message = [
    `${severityEmoji} *Alerta Monitor 360°*`,
    ``,
    `*Entidade:* ${validated.entityName}`,
    `*Data DO:* ${validated.publicationDate}`,
    ``,
    validated.insightText,
  ].join("\n");

  const url = `https://api.z-api.io/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_TOKEN}/send-text`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": env.ZAPI_CLIENT_TOKEN,
    },
    body: JSON.stringify({ phone: validated.phone, message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Z-API error ${response.status}: ${errorText}`);
  }
}