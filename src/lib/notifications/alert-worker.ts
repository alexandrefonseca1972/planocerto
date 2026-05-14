import { createAdminClient } from "@/lib/supabase/admin";
import { sendAlertEmail } from "./email";
import { sendWhatsAppAlert } from "./whatsapp";
import pino from "pino";

const logger = pino({ name: "alert-worker" });
const BATCH_SIZE = 50;

export async function processUnsentAlerts(): Promise<void> {
  const supabase = createAdminClient();

  const { data: correlations, error } = await supabase
    .from("entity_correlations")
    .select(`
      id, insight_text, severity, social_signal,
      monitored_entity_id,
      do_publications!inner (title, edition_date, original_url)
    `)
    .eq("alert_sent", false)
    .in("severity", ["medium", "high", "critical"])
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw error;
  if (!correlations?.length) return;

  for (const correlation of correlations) {
    try {
      const pub = (correlation as any).do_publications;

      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("email, whatsapp_phone, channels")
        .eq("entity_id", correlation.monitored_entity_id)
        .single() as { data: { email: string; whatsapp_phone: string; channels: string[] } | null };

      if (!prefs) continue;

      const channels: string[] = prefs.channels ?? ["email"];

      if (channels.includes("email") && prefs.email) {
        await sendAlertEmail({
          to: prefs.email,
          entityName: (correlation.social_signal as any)?.entity_name ?? "Entidade",
          severity: correlation.severity as any,
          insightText: correlation.insight_text ?? "",
          publicationDate: pub.edition_date,
          publicationUrl: pub.original_url ?? undefined,
          publicationTitle: pub.title ?? undefined,
        });
      }

      if (channels.includes("whatsapp") && prefs.whatsapp_phone) {
        await sendWhatsAppAlert({
          phone: prefs.whatsapp_phone,
          entityName: (correlation.social_signal as any)?.entity_name ?? "Entidade",
          severity: correlation.severity as any,
          insightText: (correlation.insight_text ?? "").slice(0, 400),
          publicationDate: pub.edition_date,
        });
      }

      await supabase
        .from("entity_correlations")
        .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
        .eq("id", correlation.id);

      logger.info({ correlationId: correlation.id }, "Alerta enviado");
    } catch (err) {
      logger.error({ err, correlationId: correlation.id }, "Falha ao enviar alerta");
    }
  }
}