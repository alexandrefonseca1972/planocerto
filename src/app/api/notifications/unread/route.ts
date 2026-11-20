import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const headers = { "Cache-Control": "no-store" };

// Substitui o polling via Server Action (despacho sequencial atrasava /planos).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401, headers });

  const { data, error } = await supabase.rpc("unread_notifications_count");
  if (error) return NextResponse.json({ count: 0 }, { status: 500, headers });
  return NextResponse.json({ count: data ?? 0 }, { headers });
}
