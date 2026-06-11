"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { getCurrentTenantId } from "@/app/actions/_helpers";
import { sanitizeText } from "@/lib/validation/sanitize";

const createNotificationSchema = z.object({
  title: z.string().min(1, "Título obrigatório.").max(200),
  message: z.string().max(2000).default(""),
  type: z.enum(["info", "warning", "error", "success"]).default("info"),
  target_type: z.enum(["all", "user", "tenant"]).default("all"),
  target_id: z.string().uuid("ID de destino inválido.").nullable().optional(),
  is_fixed: z.boolean().default(false),
  expires_at: z.string().datetime({ local: true, message: "Data de expiração inválida." }).nullable().optional(),
});

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  target_type: string;
  is_fixed: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  read: boolean;
}

export interface NotificationFormState {
  message?: string; errors?: Record<string, string[]>; success?: boolean;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const tenantId = await getCurrentTenantId();

    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .or(`target_type.eq.all,target_id.eq.${user.id},target_id.eq.${tenantId || ""}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!notifications?.length) return [];

    const { data: reads } = await supabase.from("notification_reads").select("notification_id").eq("user_id", user.id);
    const readIds = new Set((reads || []).map(r => r.notification_id));

    return notifications
      .filter(n => !n.expires_at || new Date(n.expires_at) > new Date())
      .map(n => ({ ...n, read: readIds.has(n.id) })) as NotificationItem[];
  } catch (error) { console.error("[getNotifications] Error:", error); return []; }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const tenantId = await getCurrentTenantId();

    // Fetch only IDs of active notifications targeted to this user
    const { data: notificationIds } = await supabase
      .from("notifications")
      .select("id, expires_at")
      .or(`target_type.eq.all,target_id.eq.${user.id},target_id.eq.${tenantId || ""}`)
      .limit(500);

    if (!notificationIds?.length) return 0;

    const now = new Date();
    const activeIds = notificationIds
      .filter(n => !n.expires_at || new Date(n.expires_at) > now)
      .map(n => n.id);

    if (!activeIds.length) return 0;

    // Get read notification IDs
    const { data: reads } = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", user.id)
      .in("notification_id", activeIds);

    const readIds = new Set((reads || []).map(r => r.notification_id));
    return activeIds.filter(id => !readIds.has(id)).length;
  } catch (error) { console.error("[getUnreadCount] Error:", error); return 0; }
}

export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notification_reads").upsert({ notification_id: notificationId, user_id: user.id }, { onConflict: "notification_id, user_id" });
  } catch (error) { console.error("[markAsRead] Error:", error); }
}

export async function createNotification(
  _prev: NotificationFormState, formData: FormData
): Promise<NotificationFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.NOTIFICATIONS_CREATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };

    const raw = {
      title: sanitizeText(formData.get("title")),
      message: sanitizeText(formData.get("message")),
      type: formData.get("type") || "info",
      target_type: formData.get("target_type") || "all",
      target_id: formData.get("target_id") || null,
      is_fixed: formData.get("is_fixed") === "true",
      expires_at: formData.get("expires_at") || null,
    };

    const validated = createNotificationSchema.safeParse(raw);
    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const first = Object.values(fieldErrors).flat()[0];
      return { message: first ?? "Verifique os campos e tente novamente.", errors: fieldErrors };
    }

    const { title, message, type, target_type, target_id, is_fixed, expires_at } = validated.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("notifications").insert({
      title, message, type,
      target_type, target_id: target_id ?? null,
      is_fixed, expires_at: expires_at ?? null,
      created_by: user?.id,
    });

    if (error) {
      console.error("[createNotification] Erro ao inserir:", error.message);
      return { message: "Erro ao criar notificação. Tente novamente." };
    }

    revalidatePath("/admin/notifications");
    return { success: true, message: "Notificação criada!" };
  } catch (error) { console.error("[createNotification] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function deleteNotification(
  _prev: NotificationFormState, formData: FormData
): Promise<NotificationFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.NOTIFICATIONS_DELETE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    const id = formData.get("notificationId") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    await supabase.from("notifications").delete().eq("id", id);
    revalidatePath("/admin/notifications");
    return { success: true, message: "Notificação excluída!" };
  } catch (error) { console.error("[deleteNotification] Error:", error); return { message: "Serviço indisponível." }; }
}
