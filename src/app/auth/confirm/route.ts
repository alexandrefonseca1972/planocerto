import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/dashboard";

    if (token_hash && type) {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      }
    }

    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set(
      "message",
      "Erro ao confirmar email. O link pode ter expirado. Solicite um novo."
    );
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[confirm] Erro:", error);
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set(
      "message",
      "Serviço indisponível. Tente novamente em alguns instantes."
    );
    return NextResponse.redirect(redirectUrl);
  }
}
