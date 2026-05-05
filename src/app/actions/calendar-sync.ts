"use server";

import { createClient } from "@/lib/supabase/server";
import { createGoogleEvent, updateGoogleEvent } from "@/lib/calendar/google";
import { getOptionalEnvVar } from "@/lib/env";

export async function connectGoogleCalendar(code: string): Promise<{ message: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const clientId = getOptionalEnvVar("GOOGLE_CLIENT_ID");
    const clientSecret = getOptionalEnvVar("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return { message: "Configuração do Google Calendar não encontrada." };

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "https://planocerto.ruphus.app"}/profile`,
      }),
    });

    if (!res.ok) return { message: "Falha ao conectar com Google Calendar." };

    const tokens = await res.json();
    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null;

    await supabase.from("calendar_tokens").upsert({
      user_id: user.id, provider: "google",
      access_token: tokens.access_token, refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return { success: true, message: "Google Calendar conectado!" };
  } catch (error) {
    console.error("[connectGoogleCalendar] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function disconnectCalendar(): Promise<{ message: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    await supabase.from("calendar_tokens").delete().eq("user_id", user.id);
    await supabase.from("calendar_sync").delete().eq("user_id", user.id);

    return { success: true, message: "Calendário desconectado." };
  } catch (error) {
    console.error("[disconnectCalendar] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function getCalendarStatus(): Promise<{ connected: boolean; provider?: string; syncCount: number }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { connected: false, syncCount: 0 };

    const { data: token } = await supabase.from("calendar_tokens").select("provider").eq("user_id", user.id).maybeSingle();
    const { count } = await supabase.from("calendar_sync").select("*", { count: "exact", head: true }).eq("user_id", user.id);

    return {
      connected: !!token,
      provider: token?.provider,
      syncCount: count || 0,
    };
  } catch {
    return { connected: false, syncCount: 0 };
  }
}

export async function syncItemToCalendar(
  itemId: string, planId: string, number: string, action: string,
  responsible: string, plannedStart: string | null, plannedEnd: string | null, status: number,
): Promise<void> {
  try {
    if (!responsible) return;
    const supabase = await createClient();

    const { data: plan } = await supabase.from("action_plans").select("title").eq("id", planId).single();
    if (!plan) return;

    const { data: profiles } = await supabase.from("profiles").select("id, email").eq("name", responsible).limit(1);
    const userId = profiles?.[0]?.id;
    if (!userId) return;

    const { data: token } = await supabase.from("calendar_tokens").select("access_token, refresh_token").eq("user_id", userId).maybeSingle();
    if (!token?.access_token) return;

    const { data: existing } = await supabase.from("calendar_sync").select("calendar_event_id, provider").eq("item_id", itemId).eq("user_id", userId).maybeSingle();

    const startDate = plannedStart ? new Date(plannedStart + "T00:00:00") : new Date();
    const endDate = plannedEnd ? new Date(plannedEnd + "T23:59:59") : new Date(startDate.getTime() + 3600000);
    const tz = "America/Sao_Paulo";

    const event = {
      summary: `[${number}] ${action}`,
      description: `Plano: ${plan.title}\nStatus: ${["", "Não Iniciada", "Pendente", "Atrasada", "Em Andamento", "Concluída"][status]}`,
      start: { dateTime: startDate.toISOString(), timeZone: tz },
      end: { dateTime: endDate.toISOString(), timeZone: tz },
    };

    if (existing?.calendar_event_id) {
      await updateGoogleEvent(token.access_token, existing.calendar_event_id, event);
      await supabase.from("calendar_sync").update({ last_synced_at: new Date().toISOString() }).eq("item_id", itemId).eq("user_id", userId);
    } else {
      const eventId = await createGoogleEvent(token.access_token, event);
      if (eventId) {
        await supabase.from("calendar_sync").insert({ item_id: itemId, user_id: userId, provider: "google", calendar_event_id: eventId });
      }
    }
  } catch (error) {
    console.error("[syncItemToCalendar] Error:", error);
  }
}

export async function getGoogleAuthUrl(): Promise<string> {
  const clientId = getOptionalEnvVar("GOOGLE_CLIENT_ID");
  if (!clientId) return "";
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL || "https://planocerto.ruphus.app";
  const scope = "https://www.googleapis.com/auth/calendar.events";
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri + "/profile")}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
}
