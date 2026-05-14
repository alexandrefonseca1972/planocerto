import { z } from "zod";
import pRetry from "p-retry";
import { env } from "@/lib/env";

const InLabsArticleSchema = z.object({
  id: z.string(),
  titulo: z.string().optional(),
  conteudo: z.string().min(1),
  orgao: z.string().optional(),
  secao: z.string().optional(),
  edicao: z.string().optional(),
  dataDO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  urlOrigem: z.string().url().optional(),
});

export type InLabsArticle = z.infer<typeof InLabsArticleSchema>;

const InLabsResponseSchema = z.object({
  items: z.array(InLabsArticleSchema),
  totalItems: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const res = await fetch("https://inlabs.in.gov.br/logar.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: env.INLABS_USERNAME,
      password: env.INLABS_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`InLabs auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,
  };

  return cachedToken.value;
}

export async function fetchDOUByDate(
  date: string,
  page = 1
): Promise<z.infer<typeof InLabsResponseSchema>> {
  return pRetry(
    async () => {
      const token = await getToken();
      const url = new URL("https://inlabs.in.gov.br/index.php");
      url.searchParams.set("date", date);
      url.searchParams.set("page", String(page));
      url.searchParams.set("size", "50");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        cachedToken = null;
        throw new Error("Token expirado — retry");
      }

      if (!res.ok) {
        throw new Error(`InLabs request failed: ${res.status}`);
      }

      const json = await res.json();
      return InLabsResponseSchema.parse(json);
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      onFailedAttempt: (error: Error & { attemptNumber?: number }) => {
        console.warn(`InLabs tentativa ${error.attemptNumber} falhou: ${error.message}`);
      },
    }
  );
}