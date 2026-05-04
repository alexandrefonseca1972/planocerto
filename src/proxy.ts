import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getEnvVar } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
      getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[proxy] Erro ao obter usuário:", userError.message);
    }

    const { pathname } = request.nextUrl;
    const isAuthPage =
      pathname.startsWith("/auth") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register");
    const isProtectedPage =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/admin");

    if (user && !userError && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!user && isProtectedPage) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    return supabaseResponse;
  } catch (error) {
    console.error("[proxy] Erro crítico no middleware:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
