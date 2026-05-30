import pino from "pino";
import pretty from "pino-pretty";

const isDev = process.env.NODE_ENV !== "production";

// O proxy/middleware do Next 16 roda em runtime Node.js, mas é empacotado pelo
// Turbopack. O transport do pino (target: "pino-pretty") usa worker threads
// (thread-stream) que resolvem o módulo por caminho, e essa resolução falha
// dentro do bundle ("unable to determine transport target"). Usamos pino-pretty
// como stream de destino síncrono — sem worker thread — o que funciona tanto no
// bundle do proxy quanto no servidor normal. O Edge runtime não suporta os
// módulos Node do pino-pretty, então lá caímos no JSON puro.
const isEdgeRuntime = process.env.NEXT_RUNTIME === "edge";
const usePretty = isDev && !isEdgeRuntime;

const level = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");

const logger = pino(
  {
    name: "planocerto",
    level,
    redact: {
      paths: [
        "email",
        "password",
        "token",
        "cookie",
        "authorization",
        "apiKey",
        "api_key",
        "secret",
        "RESEND_API_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "OPENROUTER_API_KEY",
        "ZAPI_TOKEN",
        "ZAPI_CLIENT_TOKEN",
      ],
      censor: "[REDACTED]",
    },
  },
  usePretty
    ? pretty({ colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" })
    : undefined,
);

export { logger, pino };
export type Logger = pino.Logger;
