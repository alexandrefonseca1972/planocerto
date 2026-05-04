"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_MIMES = [
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "image/svg+xml",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadAttachment(itemId: string, file: File): Promise<{ message: string; success?: boolean }> {
  try {
    if (!file || !file.size) return { message: "Arquivo inválido." };
    if (!ALLOWED_MIMES.includes(file.type)) return { message: "Tipo de arquivo não permitido." };
    if (file.size > MAX_SIZE) return { message: "Arquivo deve ter no máximo 10MB." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    // Verify user can access this item
    const { data: item } = await supabase.from("action_items").select("plan_id").eq("id", itemId).single();
    if (!item) return { message: "Item não encontrado." };

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${itemId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("plan-attachments")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("[uploadAttachment] Storage error:", uploadError.message);
      return { message: "Erro ao enviar arquivo." };
    }

    const { error: dbError } = await supabase.from("plan_attachments").insert({
      item_id: itemId,
      filename: safeName,
      storage_path: storagePath,
      size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    });

    if (dbError) {
      console.error("[uploadAttachment] DB error:", dbError.message);
      return { message: "Erro ao registrar arquivo." };
    }

    revalidatePath("/planos");
    return { success: true, message: "Arquivo enviado!" };
  } catch (error) {
    console.error("[uploadAttachment] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function deleteAttachment(attachmentId: string): Promise<{ message: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const { data: attachment } = await supabase.from("plan_attachments").select("storage_path, uploaded_by").eq("id", attachmentId).single();

    if (!attachment) return { message: "Anexo não encontrado." };

    // Delete from storage
    await supabase.storage.from("plan-attachments").remove([attachment.storage_path as string]);

    // Delete from database
    await supabase.from("plan_attachments").delete().eq("id", attachmentId);

    revalidatePath("/planos");
    return { success: true, message: "Anexo removido." };
  } catch (error) {
    console.error("[deleteAttachment] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function getAttachments(itemId: string): Promise<{ id: string; filename: string; storage_path: string; size: number; mime_type: string; uploaded_by: string; created_at: string }[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("plan_attachments").select("*").eq("item_id", itemId).order("created_at", { ascending: false });
    return (data || []) as { id: string; filename: string; storage_path: string; size: number; mime_type: string; uploaded_by: string; created_at: string }[];
  } catch (error) {
    console.error("[getAttachments] Error:", error);
    return [];
  }
}

export async function getAttachmentUrl(storagePath: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("plan-attachments").createSignedUrl(storagePath, 300);
    return data?.signedUrl || null;
  } catch {
    return null;
  }
}
