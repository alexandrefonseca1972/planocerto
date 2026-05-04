"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/app/actions/admin";

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

    const { data: profile } = await supabase.from("profiles").select("active_tenant_id").eq("id", user.id).maybeSingle();
    const tenantId = profile?.active_tenant_id;

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
    const notifications = await getNotifications();
    return notifications.filter(n => !n.read).length;
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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const type = formData.get("type") as string || "info";
    const targetType = formData.get("target_type") as string || "all";
    const targetId = formData.get("target_id") as string || null;
    const isFixed = formData.get("is_fixed") === "true";
    const expiresAt = formData.get("expires_at") as string || null;

    if (!title) return { message: "Título obrigatório." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("notifications").insert({
      title, message, type,
      target_type: targetType, target_id: targetId || null,
      is_fixed: isFixed, expires_at: expiresAt || null,
      created_by: user?.id,
    });

    revalidatePath("/admin/notifications");
    return { success: true, message: "Notificação criada!" };
  } catch (error) { console.error("[createNotification] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function deleteNotification(
  _prev: NotificationFormState, formData: FormData
): Promise<NotificationFormState> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };
    const id = formData.get("notificationId") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    await supabase.from("notifications").delete().eq("id", id);
    revalidatePath("/admin/notifications");
    return { success: true, message: "Notificação excluída!" };
  } catch (error) { console.error("[deleteNotification] Error:", error); return { message: "Serviço indisponível." }; }
}
