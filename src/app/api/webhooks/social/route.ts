import { NextRequest, NextResponse } from "next/server";
import { SocialSignalSchema } from "@/lib/validation/schemas";
import { correlate } from "@/lib/correlation/engine";
import { env } from "@/lib/env";
import crypto from "crypto";

function verifySignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", env.WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = SocialSignalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload inválido", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  correlate(parsed.data).catch((err) => {
    console.error("Correlation failed:", err);
  });

  return NextResponse.json({ ok: true, received: true });
}