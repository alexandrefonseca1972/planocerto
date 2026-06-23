import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "middleware:auth" });

export interface AuthResult {
  user: { id: string } | null;
  response: NextResponse;
  supabase: ReturnType<typeof createServerClient<Database>>;
}

export async function checkAuth(
  request: NextRequest,
  requestHeaders?: Record<string, string>
): Promise<AuthResult> {
  // Reconstrói o NextResponse preservando os headers extras (ex.: x-nonce e
  // Content-Security-Policy) no request que segue para o SSR. Lê request.headers
  // a cada chamada para capturar cookies atualizados pelo Supabase em setAll.
  const buildResponse = () => {
    if (!requestHeaders) return NextResponse.next({ request });
    const headers = new Headers(request.headers);
    for (const [key, value] of Object.entries(requestHeaders)) {
      headers.set(key, value);
    }
    return NextResponse.next({ request: { headers } });
  };

  let supabaseResponse = buildResponse();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = buildResponse();
          cookiesToSet.forEach(({ name, value, options }) => {
            if (options) {
              const { expires, maxAge, ...rest } = options;
              void expires;
              void maxAge;
              supabaseResponse.cookies.set(name, value, rest);
            } else {
              supabaseResponse.cookies.set(name, value);
            }
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    // Requisições anônimas (sem sessão) lançam AuthSessionMissingError — caso
    // esperado em rotas públicas, então registramos apenas em debug. Demais
    // erros (token inválido, falha de rede com o Supabase) seguem em warn.
    const isMissingSession =
      userError.name === "AuthSessionMissingError" ||
      userError.message === "Auth session missing!";

    if (isMissingSession) {
      log.debug({ error: userError.message }, "Requisição sem sessão de autenticação");
    } else {
      log.warn({ error: userError.message }, "Erro ao verificar autenticação");
    }
  }

  return { user: user ?? null, response: supabaseResponse, supabase };
}
