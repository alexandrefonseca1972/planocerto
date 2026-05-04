const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

let validated = false;

export function getEnvVar(name: string): string {
  if (!validated && typeof window === "undefined") {
    for (const key of REQUIRED_ENV_VARS) {
      if (!process.env[key]) {
        throw new Error(
          `Variável de ambiente obrigatória ausente: ${key}. Configure-a no arquivo .env.local.`
        );
      }
    }
    validated = true;
  }

  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente "${name}" não encontrada. Verifique o arquivo .env.local.`
    );
  }
  return value;
}

export function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name];
}
