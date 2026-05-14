import { NextRequest, NextResponse } from "next/server";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  req: NextRequest,
  options: { limit: number; windowMs: number }
) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (entry.count >= options.limit) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em breve." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) },
      }
    );
  }

  entry.count++;
  return null;
}