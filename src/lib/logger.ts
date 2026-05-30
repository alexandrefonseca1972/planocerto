import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const level = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");

const logger = pino({
  name: "planocerto",
  level,
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }
    : {}),
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
});

export { logger, pino };
export type Logger = pino.Logger;
