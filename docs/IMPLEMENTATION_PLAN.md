# Plano de Implementação — Monitor 360°
> Monitoramento de redes sociais + Diário Oficial com correlação inteligente  
> Stack: Next.js · Supabase · OpenRouter · Apify · Resend · Z-API  
> Versão: 1.0 — Maio 2026

---

## Sumário

1. [Princípios gerais](#1-princípios-gerais)
2. [Stack e pré-requisitos](#2-stack-e-pré-requisitos)
3. [Fase 0 — Setup e configuração](#fase-0--setup-e-configuração)
4. [Fase 1 — Schema do banco de dados](#fase-1--schema-do-banco-de-dados)
5. [Fase 2 — Ingestão do Diário Oficial](#fase-2--ingestão-do-diário-oficial)
6. [Fase 3 — Extração de entidades com LLM](#fase-3--extração-de-entidades-com-llm)
7. [Fase 4 — Full-text search nativo](#fase-4--full-text-search-nativo)
8. [Fase 5 — Motor de correlação](#fase-5--motor-de-correlação)
9. [Fase 6 — API routes no Next.js](#fase-6--api-routes-no-nextjs)
10. [Fase 7 — Alertas e notificações](#fase-7--alertas-e-notificações)
11. [Fase 8 — Interface do usuário](#fase-8--interface-do-usuário)
12. [Estratégia de testes](#12-estratégia-de-testes)
13. [Padrões de código](#13-padrões-de-código)
14. [Checklist por fase](#14-checklist-por-fase)

---

## 1. Princípios gerais

### Regra de ouro
> **Após cada fase: revisar → corrigir → testar → só então avançar.**  
> Nunca iniciar a próxima fase com testes falhando.

### Ciclo de implementação obrigatório

```
implementar → lint → testes unitários → testes de integração
     ↓
  revisar código (legibilidade, edge cases, segurança)
     ↓
  corrigir problemas encontrados
     ↓
  rodar suite completa de testes
     ↓
  commit + tag da fase
     ↓
  avançar para próxima fase
```

### Contratos de qualidade

- Todo input externo (API, usuário, webhook) deve ser validado com Zod antes de processar
- Toda função assíncrona deve ter tratamento de erro explícito
- Dados sensíveis (CPF, CNPJ, nomes) devem ser sanitizados antes de gravar no banco
- Nenhum segredo pode aparecer em logs ou mensagens de erro para o cliente
- Cobertura mínima de testes: 80% nas funções críticas (ingestão, correlação, alertas)

---

## 2. Stack e pré-requisitos

### Dependências principais

```bash
# Framework e banco
next@15
@supabase/supabase-js@2
@supabase/ssr

# Validação e sanitização
zod
dompurify       # sanitização de HTML
validator       # validação de e-mail, URL, CNPJ

# Testes
vitest
@testing-library/react
@testing-library/jest-dom
supertest       # testes de API routes

# Qualidade de código
eslint
prettier
husky           # git hooks
lint-staged

# Utilitários
date-fns
p-retry         # retry automático com backoff
pino            # logging estruturado
```

### Variáveis de ambiente obrigatórias

```bash
# .env.local — nunca commitar

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # apenas server-side

# OpenRouter
OPENROUTER_API_KEY=

# Apify
APIFY_API_KEY=

# Resend
RESEND_API_KEY=

# Z-API
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=
ZAPI_CLIENT_TOKEN=

# InLabs (Imprensa Nacional)
INLABS_USERNAME=
INLABS_PASSWORD=

# Segurança
WEBHOOK_SECRET=                  # validar webhooks recebidos
CRON_SECRET=                     # proteger endpoints de cron
```

### Validação das variáveis no startup

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  APIFY_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  ZAPI_INSTANCE_ID: z.string().min(1),
  ZAPI_TOKEN: z.string().min(1),
  ZAPI_CLIENT_TOKEN: z.string().min(1),
  INLABS_USERNAME: z.string().min(1),
  INLABS_PASSWORD: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(32),
})

export const env = envSchema.parse(process.env)
```

---

## Fase 0 — Setup e configuração

### 0.1 Estrutura de pastas

```
/
├── app/
│   ├── api/
│   │   ├── do/
│   │   │   ├── search/route.ts
│   │   │   └── ingest/route.ts
│   │   ├── correlations/route.ts
│   │   ├── alerts/route.ts
│   │   └── webhooks/
│   │       ├── social/route.ts
│   │       └── zapi/route.ts
│   └── (dashboard)/
├── lib/
│   ├── env.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── inlabs/
│   │   ├── client.ts
│   │   └── parser.ts
│   ├── llm/
│   │   ├── client.ts
│   │   ├── extract-entities.ts
│   │   └── generate-insight.ts
│   ├── notifications/
│   │   ├── email.ts
│   │   └── whatsapp.ts
│   └── validation/
│       ├── schemas.ts
│       └── sanitize.ts
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── supabase/
    └── migrations/
```

### 0.2 Configuração do Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', '__tests__/'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
})
```

### 0.3 Husky — bloquear commit com testes falhando

```bash
npx husky init
```

```bash
# .husky/pre-commit
npm run lint
npm run test:unit
```

### Testes da Fase 0

```typescript
// __tests__/unit/env.test.ts
import { describe, it, expect } from 'vitest'

describe('env validation', () => {
  it('deve falhar se SUPABASE_URL for inválida', () => {
    expect(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'nao-e-url'
      require('@/lib/env')
    }).toThrow()
  })
})
```

### ✅ Checklist Fase 0

- [ ] Todas as variáveis de ambiente definidas e validadas
- [ ] Vitest configurado e rodando
- [ ] Husky bloqueando commits com lint ou teste falhando
- [ ] Estrutura de pastas criada
- [ ] `npm run test` passa sem erros

---

## Fase 1 — Schema do banco de dados

### 1.1 Habilitar extensões

```sql
-- supabase/migrations/001_extensions.sql
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists pg_cron;
```

### 1.2 Tabela `do_publications`

```sql
-- supabase/migrations/002_do_publications.sql
create table public.do_publications (
  id            uuid primary key default gen_random_uuid(),
  source        text not null check (source in ('DOU', 'DOE', 'DOM')),
  state         char(2),                    -- UF para DOEs
  city          text,                       -- para DOMs
  edition_date  date not null,
  edition_num   text,
  section       text,                       -- seção 1, 2, 3
  act_type      text,                       -- portaria, contrato, nomeação...
  organ         text,
  title         text,
  content       text not null,
  original_url  text,
  raw_file_path text,                       -- caminho no Supabase Storage
  search_vector tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(unaccent(title), '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(unaccent(content), '')), 'B')
  ) stored,
  extracted_at  timestamptz default now(),
  created_at    timestamptz default now()
);

-- Índices
create index do_publications_search_idx
  on public.do_publications using gin(search_vector);

create index do_publications_trgm_idx
  on public.do_publications using gin(title gin_trgm_ops);

create index do_publications_date_idx
  on public.do_publications (edition_date desc);

create index do_publications_source_idx
  on public.do_publications (source, state, edition_date desc);
```

### 1.3 Tabela `do_entities`

```sql
-- supabase/migrations/003_do_entities.sql
create table public.do_entities (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.do_publications(id) on delete cascade,
  entity_type     text not null check (entity_type in ('person', 'company', 'process')),
  raw_name        text not null,         -- nome exatamente como aparece no DO
  normalized_name text not null,         -- normalizado: uppercase, sem acentos
  document        text,                  -- CPF ou CNPJ quando extraído
  context_snippet text,                  -- trecho onde aparece
  confidence      numeric(3,2) check (confidence between 0 and 1),
  created_at      timestamptz default now()
);

create index do_entities_normalized_idx
  on public.do_entities using gin(normalized_name gin_trgm_ops);

create index do_entities_publication_idx
  on public.do_entities (publication_id);

create index do_entities_document_idx
  on public.do_entities (document)
  where document is not null;
```

### 1.4 Tabela `entity_correlations`

```sql
-- supabase/migrations/004_entity_correlations.sql
create table public.entity_correlations (
  id                  uuid primary key default gen_random_uuid(),
  monitored_entity_id uuid not null,     -- FK para sua tabela de entidades monitoradas
  do_entity_id        uuid not null references public.do_entities(id),
  publication_id      uuid not null references public.do_publications(id),
  correlation_type    text not null check (correlation_type in (
    'social_peak_do_match',              -- pico social + publicação DO
    'do_publication_found',              -- publicação encontrada sem pico
    'narrative_contradiction'            -- discurso vs ato oficial
  )),
  social_signal       jsonb,             -- dados do pico social que originou
  insight_text        text,              -- texto gerado pelo LLM
  severity            text check (severity in ('low', 'medium', 'high', 'critical')),
  alert_sent          boolean default false,
  alert_sent_at       timestamptz,
  created_at          timestamptz default now()
);

create index entity_correlations_entity_idx
  on public.entity_correlations (monitored_entity_id, created_at desc);

create index entity_correlations_unsent_idx
  on public.entity_correlations (alert_sent, created_at)
  where alert_sent = false;
```

### 1.5 Tabela `ingest_runs` (auditoria)

```sql
-- supabase/migrations/005_ingest_runs.sql
create table public.ingest_runs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,
  edition_date    date not null,
  status          text not null check (status in ('running', 'success', 'partial', 'failed')),
  publications_ok integer default 0,
  publications_err integer default 0,
  error_detail    text,
  started_at      timestamptz default now(),
  finished_at     timestamptz,
  unique (source, edition_date)        -- evita re-ingestão da mesma edição
);
```

### 1.6 Row Level Security

```sql
-- supabase/migrations/006_rls.sql
alter table public.do_publications enable row level security;
alter table public.do_entities enable row level security;
alter table public.entity_correlations enable row level security;
alter table public.ingest_runs enable row level security;

-- Leitura pública autenticada para publicações
create policy "authenticated users can read publications"
  on public.do_publications for select
  to authenticated using (true);

-- Correlações: cada usuário vê apenas as suas
create policy "users see own correlations"
  on public.entity_correlations for select
  to authenticated
  using (
    monitored_entity_id in (
      select id from public.monitored_entities
      where user_id = auth.uid()
    )
  );

-- Escrita apenas pelo service role (workers)
create policy "service role full access publications"
  on public.do_publications for all
  to service_role using (true);
```

### Testes da Fase 1

```typescript
// __tests__/integration/schema.test.ts
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

describe('Schema — do_publications', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  it('deve rejeitar source inválido', async () => {
    const { error } = await supabase
      .from('do_publications')
      .insert({ source: 'INVALIDO', edition_date: '2026-01-01', content: 'x' })
    expect(error).not.toBeNull()
    expect(error?.message).toContain('check')
  })

  it('deve aceitar inserção válida e gerar search_vector', async () => {
    const { data, error } = await supabase
      .from('do_publications')
      .insert({
        source: 'DOU',
        edition_date: '2026-01-01',
        title: 'Portaria nº 123',
        content: 'João da Silva nomeado para cargo de diretor',
        section: '2',
      })
      .select('id, search_vector')
      .single()

    expect(error).toBeNull()
    expect(data?.search_vector).not.toBeNull()
  })

  it('unique constraint impede re-ingestão da mesma edição', async () => {
    await supabase.from('ingest_runs').insert({
      source: 'DOU', edition_date: '2026-01-01', status: 'success'
    })
    const { error } = await supabase.from('ingest_runs').insert({
      source: 'DOU', edition_date: '2026-01-01', status: 'running'
    })
    expect(error).not.toBeNull()
  })
})
```

### ✅ Checklist Fase 1

- [ ] Migrations rodando sem erro em ambiente local
- [ ] RLS ativado em todas as tabelas
- [ ] Índices GIN criados e verificados com `EXPLAIN ANALYZE`
- [ ] Testes de schema passando
- [ ] Constraints de check validadas com dados inválidos

---

## Fase 2 — Ingestão do Diário Oficial

### 2.1 Cliente InLabs

```typescript
// lib/inlabs/client.ts
import { z } from 'zod'
import pRetry from 'p-retry'
import { env } from '@/lib/env'

const InLabsArticleSchema = z.object({
  id: z.string(),
  titulo: z.string().optional(),
  conteudo: z.string().min(1),
  orgao: z.string().optional(),
  secao: z.string().optional(),
  edicao: z.string().optional(),
  dataDO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  urlOrigem: z.string().url().optional(),
})

export type InLabsArticle = z.infer<typeof InLabsArticleSchema>

const InLabsResponseSchema = z.object({
  items: z.array(InLabsArticleSchema),
  totalItems: z.number(),
  page: z.number(),
  totalPages: z.number(),
})

let cachedToken: { value: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  const res = await fetch('https://inlabs.in.gov.br/logar.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: env.INLABS_USERNAME,
      password: env.INLABS_PASSWORD,
    }),
  })

  if (!res.ok) {
    throw new Error(`InLabs auth failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  cachedToken = {
    value: data.token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000, // 23h
  }

  return cachedToken.value
}

export async function fetchDOUByDate(
  date: string,
  page = 1
): Promise<z.infer<typeof InLabsResponseSchema>> {
  return pRetry(
    async () => {
      const token = await getToken()
      const url = new URL('https://inlabs.in.gov.br/index.php')
      url.searchParams.set('date', date)
      url.searchParams.set('page', String(page))
      url.searchParams.set('size', '50')

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        cachedToken = null // forçar re-autenticação
        throw new Error('Token expirado — retry')
      }

      if (!res.ok) {
        throw new Error(`InLabs request failed: ${res.status}`)
      }

      const json = await res.json()
      return InLabsResponseSchema.parse(json)
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      onFailedAttempt: (error) => {
        console.warn(`InLabs tentativa ${error.attemptNumber} falhou: ${error.message}`)
      },
    }
  )
}
```

### 2.2 Sanitização do conteúdo

```typescript
// lib/validation/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

/**
 * Remove HTML, scripts e caracteres de controle do texto.
 * Preserva estrutura básica de texto do Diário Oficial.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return ''

  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // controle
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normaliza nome para comparação: uppercase, sem acentos, sem pontuação.
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Valida e formata CNPJ removendo formatação.
 */
export function sanitizeCNPJ(cnpj: string): string | null {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return null
  return digits
}

/**
 * Valida e formata CPF removendo formatação.
 */
export function sanitizeCPF(cpf: string): string | null {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return null
  return digits
}
```

### 2.3 Worker de ingestão

```typescript
// lib/inlabs/ingest-worker.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchDOUByDate } from './client'
import { sanitizeText } from '@/lib/validation/sanitize'
import pino from 'pino'

const logger = pino({ name: 'ingest-worker' })

interface IngestResult {
  date: string
  inserted: number
  skipped: number
  errors: number
}

export async function ingestDOUForDate(date: string): Promise<IngestResult> {
  const supabase = createAdminClient()
  const result: IngestResult = { date, inserted: 0, skipped: 0, errors: 0 }

  // Verificar se já foi ingerido
  const { data: existing } = await supabase
    .from('ingest_runs')
    .select('status')
    .eq('source', 'DOU')
    .eq('edition_date', date)
    .single()

  if (existing?.status === 'success') {
    logger.info({ date }, 'Edição já ingerida com sucesso — pulando')
    return { ...result, skipped: 1 }
  }

  // Registrar início
  await supabase.from('ingest_runs').upsert({
    source: 'DOU',
    edition_date: date,
    status: 'running',
    started_at: new Date().toISOString(),
  })

  let page = 1
  let totalPages = 1

  try {
    do {
      const response = await fetchDOUByDate(date, page)
      totalPages = response.totalPages

      for (const article of response.items) {
        try {
          const sanitized = {
            source: 'DOU' as const,
            edition_date: article.dataDO,
            edition_num: article.edicao ?? null,
            section: sanitizeText(article.secao ?? ''),
            organ: sanitizeText(article.orgao ?? ''),
            title: sanitizeText(article.titulo ?? ''),
            content: sanitizeText(article.conteudo),
            original_url: article.urlOrigem ?? null,
          }

          // Validação final antes de gravar
          if (!sanitized.content || sanitized.content.length < 10) {
            logger.warn({ id: article.id }, 'Conteúdo vazio — ignorando')
            result.skipped++
            continue
          }

          const { error } = await supabase
            .from('do_publications')
            .upsert(sanitized, { onConflict: 'source,edition_date,title' })

          if (error) {
            logger.error({ error, articleId: article.id }, 'Erro ao inserir publicação')
            result.errors++
          } else {
            result.inserted++
          }
        } catch (err) {
          logger.error({ err, articleId: article.id }, 'Erro ao processar artigo')
          result.errors++
        }
      }

      page++
    } while (page <= totalPages)

    await supabase
      .from('ingest_runs')
      .update({
        status: result.errors === 0 ? 'success' : 'partial',
        publications_ok: result.inserted,
        publications_err: result.errors,
        finished_at: new Date().toISOString(),
      })
      .eq('source', 'DOU')
      .eq('edition_date', date)

    logger.info(result, 'Ingestão concluída')
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'

    await supabase
      .from('ingest_runs')
      .update({
        status: 'failed',
        error_detail: message,
        finished_at: new Date().toISOString(),
      })
      .eq('source', 'DOU')
      .eq('edition_date', date)

    logger.error({ err }, 'Ingestão falhou')
    throw err
  }
}
```

### 2.4 Endpoint de cron (Next.js)

```typescript
// app/api/do/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ingestDOUForDate } from '@/lib/inlabs/ingest-worker'
import { env } from '@/lib/env'
import { z } from 'zod'
import { format, subDays } from 'date-fns'

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  secret: z.string(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = QuerySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Autenticação do cron
  if (parsed.data.secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const date = parsed.data.date ?? format(subDays(new Date(), 1), 'yyyy-MM-dd')

  try {
    const result = await ingestDOUForDate(date)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

### 2.5 Agendamento via pg_cron

```sql
-- Executa a ingestão todo dia às 06:00 horário de Brasília (09:00 UTC)
select cron.schedule(
  'ingest-dou-daily',
  '0 9 * * *',
  $$
  select net.http_post(
    url := current_setting('app.site_url') || '/api/do/ingest',
    body := json_build_object(
      'secret', current_setting('app.cron_secret')
    )::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  )
  $$
);
```

### Testes da Fase 2

```typescript
// __tests__/unit/sanitize.test.ts
import { describe, it, expect } from 'vitest'
import { sanitizeText, normalizeName, sanitizeCNPJ } from '@/lib/validation/sanitize'

describe('sanitizeText', () => {
  it('remove tags HTML', () => {
    expect(sanitizeText('<b>texto</b>')).toBe('texto')
  })

  it('remove scripts', () => {
    expect(sanitizeText('<script>alert(1)</script>texto')).toBe('texto')
  })

  it('normaliza espaços múltiplos', () => {
    expect(sanitizeText('texto   com    espaços')).toBe('texto com espaços')
  })

  it('retorna string vazia para input não-string', () => {
    expect(sanitizeText(null)).toBe('')
    expect(sanitizeText(undefined)).toBe('')
    expect(sanitizeText(123)).toBe('')
  })
})

describe('sanitizeCNPJ', () => {
  it('aceita CNPJ com formatação', () => {
    expect(sanitizeCNPJ('12.345.678/0001-90')).toBe('12345678000190')
  })

  it('rejeita CNPJ com dígitos insuficientes', () => {
    expect(sanitizeCNPJ('123')).toBeNull()
  })
})

// __tests__/unit/ingest-worker.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/inlabs/client', () => ({
  fetchDOUByDate: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null }) }) }),
      upsert: () => ({ error: null }),
      update: () => ({ eq: () => ({ eq: () => ({}) }) }),
    }),
  }),
}))

import { fetchDOUByDate } from '@/lib/inlabs/client'
import { ingestDOUForDate } from '@/lib/inlabs/ingest-worker'

describe('ingestDOUForDate', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('ignora artigos com conteúdo vazio', async () => {
    vi.mocked(fetchDOUByDate).mockResolvedValueOnce({
      items: [{ id: '1', conteudo: '', dataDO: '2026-01-01' }],
      totalItems: 1,
      page: 1,
      totalPages: 1,
    })

    const result = await ingestDOUForDate('2026-01-01')
    expect(result.skipped).toBe(1)
    expect(result.inserted).toBe(0)
  })

  it('conta erros individualmente sem interromper o batch', async () => {
    vi.mocked(fetchDOUByDate).mockResolvedValueOnce({
      items: [
        { id: '1', conteudo: 'conteudo valido', dataDO: '2026-01-01' },
        { id: '2', conteudo: 'outro valido', dataDO: '2026-01-01' },
      ],
      totalItems: 2, page: 1, totalPages: 1,
    })

    const result = await ingestDOUForDate('2026-01-01')
    expect(result.inserted + result.errors).toBeGreaterThan(0)
  })
})
```

### ✅ Checklist Fase 2

- [ ] Token InLabs com cache e renovação automática
- [ ] Retry com backoff exponencial em todas as chamadas externas
- [ ] Sanitização aplicada em todos os campos antes de gravar
- [ ] Registro de auditoria em `ingest_runs` para cada execução
- [ ] Idempotência: re-executar não duplica registros
- [ ] Endpoint protegido por `CRON_SECRET`
- [ ] Testes unitários de sanitização passando (100% cobertura)
- [ ] Testes de ingestão com mocks passando

---

## Fase 3 — Extração de entidades com LLM

### 3.1 Schema de validação da resposta do LLM

```typescript
// lib/llm/extract-entities.ts
import { z } from 'zod'
import { sanitizeText, normalizeName, sanitizeCPF, sanitizeCNPJ } from '@/lib/validation/sanitize'
import { env } from '@/lib/env'

const EntitySchema = z.object({
  type: z.enum(['person', 'company', 'process']),
  raw_name: z.string().min(2).max(300),
  document: z.string().optional().nullable(),
  context_snippet: z.string().max(500),
  confidence: z.number().min(0).max(1),
})

const ExtractResponseSchema = z.object({
  entities: z.array(EntitySchema).max(50),
})

export type ExtractedEntity = z.infer<typeof EntitySchema>

const SYSTEM_PROMPT = `
Você é um extrator de entidades de documentos do Diário Oficial brasileiro.
Extraia APENAS entidades presentes explicitamente no texto.
Não infira ou invente entidades.
Responda APENAS com JSON válido, sem markdown, sem explicações.
Formato: { "entities": [ { "type": "person"|"company"|"process", "raw_name": "...", "document": "CPF ou CNPJ se presente, null caso contrário", "context_snippet": "trecho de até 100 chars onde aparece", "confidence": 0.0 a 1.0 } ] }
`.trim()

export async function extractEntities(
  content: string
): Promise<ExtractedEntity[]> {
  // Truncar conteúdo longo para reduzir tokens
  const truncated = content.slice(0, 4000)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',  // Haiku para alto volume
      max_tokens: 1000,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: truncated },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  // Parse seguro — LLMs podem retornar texto malformado
  let parsed: unknown
  try {
    // Remover markdown fences se presentes
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    // Fallback: retornar lista vazia em vez de crashar
    return []
  }

  const validated = ExtractResponseSchema.safeParse(parsed)
  if (!validated.success) return []

  // Sanitizar e normalizar cada entidade
  return validated.data.entities
    .map((e) => ({
      ...e,
      raw_name: sanitizeText(e.raw_name),
      normalized_name: normalizeName(e.raw_name),
      document: e.document
        ? (sanitizeCPF(e.document) ?? sanitizeCNPJ(e.document) ?? null)
        : null,
      context_snippet: sanitizeText(e.context_snippet),
    }))
    .filter((e) => e.raw_name.length >= 2)
}
```

### 3.2 Worker de extração em lote

```typescript
// lib/llm/extraction-worker.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { extractEntities } from './extract-entities'
import pino from 'pino'

const logger = pino({ name: 'extraction-worker' })
const BATCH_SIZE = 20

export async function extractEntitiesForDate(date: string) {
  const supabase = createAdminClient()

  // Buscar publicações sem entidades extraídas
  const { data: publications, error } = await supabase
    .from('do_publications')
    .select('id, title, content')
    .eq('edition_date', date)
    .not('id', 'in', `(select publication_id from do_entities)`)
    .limit(BATCH_SIZE)

  if (error) throw error
  if (!publications?.length) return

  for (const pub of publications) {
    try {
      const entities = await extractEntities(
        `${pub.title ?? ''}\n\n${pub.content}`
      )

      if (entities.length === 0) continue

      const rows = entities.map((e) => ({
        publication_id: pub.id,
        entity_type: e.type,
        raw_name: e.raw_name,
        normalized_name: (e as any).normalized_name,
        document: (e as any).document,
        context_snippet: e.context_snippet,
        confidence: e.confidence,
      }))

      const { error: insertError } = await supabase
        .from('do_entities')
        .insert(rows)

      if (insertError) {
        logger.error({ error: insertError, pubId: pub.id }, 'Erro ao inserir entidades')
      } else {
        logger.info({ pubId: pub.id, count: rows.length }, 'Entidades extraídas')
      }
    } catch (err) {
      logger.error({ err, pubId: pub.id }, 'Extração falhou para publicação')
      // Continuar com as próximas — não interromper o batch
    }
  }
}
```

### Testes da Fase 3

```typescript
// __tests__/unit/extract-entities.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ env: { OPENROUTER_API_KEY: 'test-key' } }))

global.fetch = vi.fn()

import { extractEntities } from '@/lib/llm/extract-entities'

describe('extractEntities', () => {
  it('retorna lista vazia se LLM retornar JSON malformado', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'isso não é json' } }],
      }),
    } as any)

    const result = await extractEntities('texto qualquer')
    expect(result).toEqual([])
  })

  it('filtra entidades com nome muito curto', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({
          entities: [{ type: 'person', raw_name: 'A', document: null, context_snippet: 'x', confidence: 0.9 }]
        })}}],
      }),
    } as any)

    const result = await extractEntities('texto')
    expect(result).toEqual([])
  })

  it('sanitiza nomes com HTML injetado', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({
          entities: [{
            type: 'person',
            raw_name: '<script>alert(1)</script>João Silva',
            document: null,
            context_snippet: 'nomeado para cargo',
            confidence: 0.95,
          }]
        })}}],
      }),
    } as any)

    const result = await extractEntities('texto')
    expect(result[0]?.raw_name).not.toContain('<script>')
    expect(result[0]?.raw_name).toBe('João Silva')
  })
})
```

### ✅ Checklist Fase 3

- [ ] Parse do JSON do LLM com try/catch — nunca crasha
- [ ] Validação Zod em toda resposta do LLM
- [ ] Sanitização de raw_name, context_snippet e document
- [ ] Erros individuais não interrompem o batch
- [ ] Testes com respostas malformadas passando
- [ ] Testes de sanitização de entidades passando

---

## Fase 4 — Full-text search nativo

### 4.1 Função de busca

```typescript
// lib/supabase/search.ts
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { sanitizeText, normalizeName } from '@/lib/validation/sanitize'

const SearchParamsSchema = z.object({
  query: z.string().min(2).max(200),
  source: z.enum(['DOU', 'DOE', 'DOM', 'all']).default('all'),
  state: z.string().length(2).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actType: z.string().max(100).optional(),
  page: z.number().int().min(1).max(100).default(1),
  limit: z.number().int().min(1).max(50).default(20),
})

export type SearchParams = z.infer<typeof SearchParamsSchema>

export interface SearchResult {
  id: string
  title: string | null
  content_snippet: string
  source: string
  edition_date: string
  organ: string | null
  act_type: string | null
  original_url: string | null
  rank: number
}

export async function searchPublications(
  rawParams: unknown
): Promise<{ results: SearchResult[]; total: number }> {
  const params = SearchParamsSchema.parse(rawParams)

  const query = sanitizeText(params.query)
  const supabase = createServerClient()
  const offset = (params.page - 1) * params.limit

  // Tentar busca semântica primeiro (tsvector)
  // Fallback para trigram se não houver resultados
  const tsQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(' & ')

  let { data, error, count } = await supabase
    .rpc('search_publications', {
      query_text: tsQuery,
      source_filter: params.source === 'all' ? null : params.source,
      state_filter: params.state ?? null,
      date_from: params.dateFrom ?? null,
      date_to: params.dateTo ?? null,
      act_type_filter: params.actType ?? null,
      result_limit: params.limit,
      result_offset: offset,
    })

  if (error) throw error

  // Fallback trigram se sem resultados
  if (!data?.length) {
    const fallback = await supabase
      .from('do_publications')
      .select('id, title, content, source, edition_date, organ, act_type, original_url', {
        count: 'exact',
      })
      .ilike('title', `%${query}%`)
      .limit(params.limit)
      .range(offset, offset + params.limit - 1)

    data = fallback.data ?? []
    count = fallback.count ?? 0
  }

  const results: SearchResult[] = (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    content_snippet: row.content?.slice(0, 300) + '...',
    source: row.source,
    edition_date: row.edition_date,
    organ: row.organ,
    act_type: row.act_type,
    original_url: row.original_url,
    rank: row.rank ?? 0,
  }))

  return { results, total: count ?? 0 }
}
```

### 4.2 Stored procedure de busca

```sql
-- supabase/migrations/007_search_function.sql
create or replace function search_publications(
  query_text      text,
  source_filter   text    default null,
  state_filter    char(2) default null,
  date_from       date    default null,
  date_to         date    default null,
  act_type_filter text    default null,
  result_limit    int     default 20,
  result_offset   int     default 0
)
returns table (
  id            uuid,
  title         text,
  content       text,
  source        text,
  state         char(2),
  edition_date  date,
  organ         text,
  act_type      text,
  original_url  text,
  rank          float4
)
language sql
stable
as $$
  select
    p.id,
    p.title,
    p.content,
    p.source,
    p.state,
    p.edition_date,
    p.organ,
    p.act_type,
    p.original_url,
    ts_rank(p.search_vector, to_tsquery('portuguese', query_text)) as rank
  from public.do_publications p
  where
    p.search_vector @@ to_tsquery('portuguese', query_text)
    and (source_filter is null or p.source = source_filter)
    and (state_filter is null or p.state = state_filter)
    and (date_from is null or p.edition_date >= date_from)
    and (date_to is null or p.edition_date <= date_to)
    and (act_type_filter is null or p.act_type ilike '%' || act_type_filter || '%')
  order by rank desc, p.edition_date desc
  limit result_limit
  offset result_offset
$$;
```

### Testes da Fase 4

```typescript
// __tests__/integration/search.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { searchPublications } from '@/lib/supabase/search'

describe('searchPublications', () => {
  it('rejeita query muito curta', async () => {
    await expect(searchPublications({ query: 'a' })).rejects.toThrow()
  })

  it('rejeita query com HTML', async () => {
    await expect(
      searchPublications({ query: '<script>xss</script>' })
    ).rejects.toThrow()
  })

  it('retorna resultados para nome existente', async () => {
    const { results } = await searchPublications({ query: 'portaria nomeação' })
    expect(Array.isArray(results)).toBe(true)
  })

  it('respeita paginação', async () => {
    const page1 = await searchPublications({ query: 'contrato', page: 1, limit: 5 })
    const page2 = await searchPublications({ query: 'contrato', page: 2, limit: 5 })
    const ids1 = page1.results.map((r) => r.id)
    const ids2 = page2.results.map((r) => r.id)
    expect(ids1.some((id) => ids2.includes(id))).toBe(false)
  })
})
```

### ✅ Checklist Fase 4

- [ ] `search_vector` sendo gerado automaticamente ao inserir
- [ ] `EXPLAIN ANALYZE` confirma uso dos índices GIN
- [ ] Fallback trigram funcionando quando tsvector retorna vazio
- [ ] Query sanitizada antes de passar para o banco
- [ ] Paginação validada e testada
- [ ] SQL injection impossível (uso de parametrização)

---

## Fase 5 — Motor de correlação

### 5.1 Schema de validação do sinal social

```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const SocialSignalSchema = z.object({
  entity_id: z.string().uuid(),
  entity_name: z.string().min(1).max(300),
  platform: z.enum(['instagram', 'twitter', 'facebook', 'youtube']),
  signal_type: z.enum(['mention_spike', 'sentiment_drop', 'viral_post', 'crisis_alert']),
  mentions_count: z.number().int().min(0),
  sentiment_score: z.number().min(-1).max(1),
  detected_at: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
})

export type SocialSignal = z.infer<typeof SocialSignalSchema>
```

### 5.2 Motor de correlação

```typescript
// lib/correlation/engine.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { SocialSignal } from '@/lib/validation/schemas'
import { generateInsight } from '@/lib/llm/generate-insight'
import { normalizeName } from '@/lib/validation/sanitize'
import pino from 'pino'

const logger = pino({ name: 'correlation-engine' })
const LOOKBACK_DAYS = 30

export async function correlate(signal: SocialSignal): Promise<void> {
  const supabase = createAdminClient()
  const normalizedName = normalizeName(signal.entity_name)

  // Buscar publicações DO dos últimos 30 dias que mencionam a entidade
  const { data: entities, error } = await supabase
    .from('do_entities')
    .select(`
      id,
      raw_name,
      context_snippet,
      publication_id,
      do_publications!inner (
        id, title, edition_date, source, act_type, organ, original_url
      )
    `)
    .ilike('normalized_name', `%${normalizedName.split(' ')[0]}%`)
    .gte('do_publications.edition_date',
      new Date(Date.now() - LOOKBACK_DAYS * 86400000)
        .toISOString().split('T')[0]
    )
    .limit(10)

  if (error) {
    logger.error({ error }, 'Erro ao buscar entidades DO para correlação')
    throw error
  }

  if (!entities?.length) {
    logger.info({ entity: signal.entity_name }, 'Nenhuma publicação DO encontrada')
    return
  }

  for (const entity of entities) {
    const pub = (entity as any).do_publications

    try {
      const insight = await generateInsight({
        entityName: signal.entity_name,
        socialSignal: signal,
        doPublication: {
          title: pub.title,
          actType: pub.act_type,
          organ: pub.organ,
          date: pub.edition_date,
          snippet: entity.context_snippet,
        },
      })

      const severity = calculateSeverity(signal, pub)

      const { error: insertError } = await supabase
        .from('entity_correlations')
        .insert({
          monitored_entity_id: signal.entity_id,
          do_entity_id: entity.id,
          publication_id: entity.publication_id,
          correlation_type: 'social_peak_do_match',
          social_signal: signal as any,
          insight_text: insight,
          severity,
          alert_sent: false,
        })

      if (insertError) {
        logger.error({ insertError }, 'Erro ao salvar correlação')
      } else {
        logger.info({
          entity: signal.entity_name,
          pubId: entity.publication_id,
          severity,
        }, 'Correlação criada')
      }
    } catch (err) {
      logger.error({ err, entityId: entity.id }, 'Erro ao gerar insight')
      // Continuar — não interromper outras correlações
    }
  }
}

function calculateSeverity(
  signal: SocialSignal,
  publication: any
): 'low' | 'medium' | 'high' | 'critical' {
  if (signal.signal_type === 'crisis_alert' && signal.sentiment_score < -0.7) {
    return 'critical'
  }
  if (signal.sentiment_score < -0.5 || signal.mentions_count > 1000) {
    return 'high'
  }
  if (signal.sentiment_score < -0.2 || signal.mentions_count > 200) {
    return 'medium'
  }
  return 'low'
}
```

### 5.3 Geração de insight

```typescript
// lib/llm/generate-insight.ts
import { z } from 'zod'
import { env } from '@/lib/env'

interface InsightInput {
  entityName: string
  socialSignal: {
    signal_type: string
    mentions_count: number
    sentiment_score: number
    platform: string
    detected_at: string
  }
  doPublication: {
    title: string | null
    actType: string | null
    organ: string | null
    date: string
    snippet: string
  }
}

export async function generateInsight(input: InsightInput): Promise<string> {
  const prompt = `
Analise a correlação entre:

SINAL SOCIAL (${input.socialSignal.platform}):
- Tipo: ${input.socialSignal.signal_type}
- Menções: ${input.socialSignal.mentions_count}
- Sentimento: ${input.socialSignal.sentiment_score.toFixed(2)} (-1 negativo, +1 positivo)
- Detectado em: ${input.socialSignal.detected_at}

PUBLICAÇÃO NO DIÁRIO OFICIAL:
- Data: ${input.doPublication.date}
- Órgão: ${input.doPublication.organ ?? 'não informado'}
- Tipo de ato: ${input.doPublication.actType ?? 'não identificado'}
- Título: ${input.doPublication.title ?? 'sem título'}
- Trecho: "${input.doPublication.snippet}"

ENTIDADE MONITORADA: ${input.entityName}

Gere um insight objetivo em português brasileiro (máximo 150 palavras) explicando
a possível relação entre o comportamento nas redes sociais e o ato oficial publicado.
Seja factual. Não especule além do que os dados mostram.
`.trim()

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-6',
      max_tokens: 300,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM insight failed: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  // Validação básica do output
  if (!text || text.length < 20) {
    throw new Error('Insight gerado inválido ou muito curto')
  }

  return text.trim()
}
```

### Testes da Fase 5

```typescript
// __tests__/unit/correlation-engine.test.ts
import { describe, it, expect, vi } from 'vitest'
import { calculateSeverity } from '@/lib/correlation/engine'  // exportar função

describe('calculateSeverity', () => {
  it('retorna critical para crise com sentimento muito negativo', () => {
    const signal = {
      signal_type: 'crisis_alert',
      sentiment_score: -0.8,
      mentions_count: 500,
    }
    expect(calculateSeverity(signal as any, {})).toBe('critical')
  })

  it('retorna high para muitas menções', () => {
    const signal = {
      signal_type: 'mention_spike',
      sentiment_score: -0.1,
      mentions_count: 1500,
    }
    expect(calculateSeverity(signal as any, {})).toBe('high')
  })

  it('retorna low para sinal fraco', () => {
    const signal = {
      signal_type: 'mention_spike',
      sentiment_score: 0.2,
      mentions_count: 50,
    }
    expect(calculateSeverity(signal as any, {})).toBe('low')
  })
})
```

### ✅ Checklist Fase 5

- [ ] Validação Zod do sinal social no início da função
- [ ] Erros de insight individual não interrompem correlações restantes
- [ ] `calculateSeverity` testada para todos os branches
- [ ] Insight com menos de 20 chars lança exceção tratada
- [ ] Correlações duplicadas são prevenidas

---

## Fase 6 — API routes no Next.js

### 6.1 Middleware de autenticação

```typescript
// lib/api/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function requireAuth(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  return session
}
```

### 6.2 Rate limiting

```typescript
// lib/api/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server'

const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  req: NextRequest,
  options: { limit: number; windowMs: number }
) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + options.windowMs })
    return null // permitido
  }

  if (entry.count >= options.limit) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em breve.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) },
      }
    )
  }

  entry.count++
  return null // permitido
}
```

### 6.3 Endpoint de busca

```typescript
// app/api/do/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-middleware'
import { rateLimit } from '@/lib/api/rate-limit'
import { searchPublications } from '@/lib/supabase/search'
import { z } from 'zod'

const QuerySchema = z.object({
  q: z.string().min(2).max(200),
  source: z.enum(['DOU', 'DOE', 'DOM', 'all']).optional(),
  state: z.string().length(2).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).max(100).optional(),
})

export async function GET(req: NextRequest) {
  // Rate limit: 30 buscas por minuto por IP
  const limited = rateLimit(req, { limit: 30, windowMs: 60_000 })
  if (limited) return limited

  // Autenticação
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  // Validação dos parâmetros
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = QuerySchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const result = await searchPublications({
      query: parsed.data.q,
      source: parsed.data.source ?? 'all',
      state: parsed.data.state,
      dateFrom: parsed.data.from,
      dateTo: parsed.data.to,
      page: parsed.data.page ?? 1,
    })

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    })
  } catch (err) {
    // Nunca expor detalhes internos ao cliente
    console.error('Search error:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar busca' },
      { status: 500 }
    )
  }
}
```

### 6.4 Webhook de sinal social

```typescript
// app/api/webhooks/social/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SocialSignalSchema } from '@/lib/validation/schemas'
import { correlate } from '@/lib/correlation/engine'
import { env } from '@/lib/env'
import crypto from 'crypto'

function verifySignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature') ?? ''

  // Verificar autenticidade do webhook
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = SocialSignalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload inválido', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Processar de forma assíncrona — não bloquear a resposta
  correlate(parsed.data).catch((err) => {
    console.error('Correlation failed:', err)
  })

  return NextResponse.json({ ok: true, received: true })
}
```

### Testes da Fase 6

```typescript
// __tests__/integration/api-search.test.ts
import { describe, it, expect } from 'vitest'
import { createMocks } from 'node-mocks-http'

describe('GET /api/do/search', () => {
  it('retorna 400 para query muito curta', async () => {
    const { GET } = await import('@/app/api/do/search/route')
    const req = new Request('http://localhost/api/do/search?q=a')
    const res = await GET(req as any)
    expect(res.status).toBe(400)
  })

  it('retorna 401 sem autenticação', async () => {
    const { GET } = await import('@/app/api/do/search/route')
    const req = new Request('http://localhost/api/do/search?q=portaria')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/webhooks/social', () => {
  it('retorna 401 com assinatura inválida', async () => {
    const { POST } = await import('@/app/api/webhooks/social/route')
    const req = new Request('http://localhost/api/webhooks/social', {
      method: 'POST',
      headers: { 'x-webhook-signature': 'invalida' },
      body: JSON.stringify({ test: true }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })
})
```

### ✅ Checklist Fase 6

- [ ] Todos os endpoints exigem autenticação
- [ ] Rate limiting ativo na rota de busca
- [ ] Webhook validado por HMAC antes de processar
- [ ] Erros internos não vazam stack traces para o cliente
- [ ] Validação Zod em todos os inputs de rota
- [ ] Correlação processada de forma assíncrona (não bloqueia resposta)

---

## Fase 7 — Alertas e notificações

### 7.1 Serviço de e-mail (Resend)

```typescript
// lib/notifications/email.ts
import { Resend } from 'resend'
import { z } from 'zod'
import { env } from '@/lib/env'

const resend = new Resend(env.RESEND_API_KEY)

const AlertEmailSchema = z.object({
  to: z.string().email(),
  entityName: z.string().min(1).max(300),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  insightText: z.string().min(10).max(2000),
  publicationDate: z.string(),
  publicationUrl: z.string().url().optional(),
  publicationTitle: z.string().optional(),
})

export type AlertEmailData = z.infer<typeof AlertEmailSchema>

export async function sendAlertEmail(data: AlertEmailData): Promise<void> {
  const validated = AlertEmailSchema.parse(data)

  const severityLabel = {
    low: '🔵 Informativo',
    medium: '🟡 Atenção',
    high: '🟠 Importante',
    critical: '🔴 URGENTE',
  }[validated.severity]

  const { error } = await resend.emails.send({
    from: 'alertas@seudominio.com.br',
    to: validated.to,
    subject: `${severityLabel} — ${validated.entityName} no Diário Oficial`,
    html: `
      <h2>Alerta de Monitoramento</h2>
      <p><strong>Entidade:</strong> ${validated.entityName}</p>
      <p><strong>Nível:</strong> ${severityLabel}</p>
      <p><strong>Data da publicação:</strong> ${validated.publicationDate}</p>
      ${validated.publicationTitle ? `<p><strong>Ato:</strong> ${validated.publicationTitle}</p>` : ''}
      <hr>
      <p>${validated.insightText.replace(/\n/g, '<br>')}</p>
      ${validated.publicationUrl ? `<p><a href="${validated.publicationUrl}">Ver publicação original</a></p>` : ''}
    `,
  })

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`)
  }
}
```

### 7.2 Serviço de WhatsApp (Z-API)

```typescript
// lib/notifications/whatsapp.ts
import { z } from 'zod'
import { env } from '@/lib/env'

const WhatsAppAlertSchema = z.object({
  phone: z.string().regex(/^55\d{10,11}$/), // formato: 5511999999999
  entityName: z.string().min(1).max(100),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  insightText: z.string().min(10).max(500),
  publicationDate: z.string(),
})

export type WhatsAppAlertData = z.infer<typeof WhatsAppAlertSchema>

export async function sendWhatsAppAlert(data: WhatsAppAlertData): Promise<void> {
  const validated = WhatsAppAlertSchema.parse(data)

  const severityEmoji = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  }[validated.severity]

  const message = [
    `${severityEmoji} *Alerta Monitor 360°*`,
    ``,
    `*Entidade:* ${validated.entityName}`,
    `*Data DO:* ${validated.publicationDate}`,
    ``,
    validated.insightText,
  ].join('\n')

  const url = `https://api.z-api.io/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_TOKEN}/send-text`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': env.ZAPI_CLIENT_TOKEN,
    },
    body: JSON.stringify({ phone: validated.phone, message }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Z-API error ${response.status}: ${errorText}`)
  }
}
```

### 7.3 Worker de disparo

```typescript
// lib/notifications/alert-worker.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAlertEmail } from './email'
import { sendWhatsAppAlert } from './whatsapp'
import pino from 'pino'

const logger = pino({ name: 'alert-worker' })
const BATCH_SIZE = 50

export async function processUnsentAlerts(): Promise<void> {
  const supabase = createAdminClient()

  const { data: correlations, error } = await supabase
    .from('entity_correlations')
    .select(`
      id, insight_text, severity, social_signal,
      monitored_entity_id,
      do_publications!inner (title, edition_date, original_url)
    `)
    .eq('alert_sent', false)
    .in('severity', ['medium', 'high', 'critical'])
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) throw error
  if (!correlations?.length) return

  for (const correlation of correlations) {
    try {
      const pub = (correlation as any).do_publications

      // Buscar preferências de notificação do usuário
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email, whatsapp_phone, channels')
        .eq('entity_id', correlation.monitored_entity_id)
        .single()

      if (!prefs) continue

      const channels: string[] = prefs.channels ?? ['email']

      // Enviar por e-mail
      if (channels.includes('email') && prefs.email) {
        await sendAlertEmail({
          to: prefs.email,
          entityName: (correlation.social_signal as any)?.entity_name ?? 'Entidade',
          severity: correlation.severity as any,
          insightText: correlation.insight_text ?? '',
          publicationDate: pub.edition_date,
          publicationUrl: pub.original_url ?? undefined,
          publicationTitle: pub.title ?? undefined,
        })
      }

      // Enviar por WhatsApp
      if (channels.includes('whatsapp') && prefs.whatsapp_phone) {
        await sendWhatsAppAlert({
          phone: prefs.whatsapp_phone,
          entityName: (correlation.social_signal as any)?.entity_name ?? 'Entidade',
          severity: correlation.severity as any,
          insightText: (correlation.insight_text ?? '').slice(0, 400),
          publicationDate: pub.edition_date,
        })
      }

      // Marcar como enviado
      await supabase
        .from('entity_correlations')
        .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
        .eq('id', correlation.id)

      logger.info({ correlationId: correlation.id }, 'Alerta enviado')
    } catch (err) {
      logger.error({ err, correlationId: correlation.id }, 'Falha ao enviar alerta')
      // Continuar com os próximos — não bloquear o batch
    }
  }
}
```

### Testes da Fase 7

```typescript
// __tests__/unit/notifications.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('sendAlertEmail — validação', () => {
  it('rejeita e-mail inválido', async () => {
    const { sendAlertEmail } = await import('@/lib/notifications/email')
    await expect(
      sendAlertEmail({
        to: 'nao-e-email',
        entityName: 'João',
        severity: 'high',
        insightText: 'insight de teste com texto suficiente',
        publicationDate: '2026-01-01',
      })
    ).rejects.toThrow()
  })
})

describe('sendWhatsAppAlert — validação', () => {
  it('rejeita telefone sem código do país', async () => {
    const { sendWhatsAppAlert } = await import('@/lib/notifications/whatsapp')
    await expect(
      sendWhatsAppAlert({
        phone: '11999999999', // falta 55
        entityName: 'Empresa',
        severity: 'medium',
        insightText: 'insight de teste com texto suficiente',
        publicationDate: '2026-01-01',
      })
    ).rejects.toThrow()
  })
})
```

### ✅ Checklist Fase 7

- [ ] Validação de e-mail e telefone antes de cada envio
- [ ] Erros de envio individuais não interrompem o batch
- [ ] Idempotência: `alert_sent = true` atualizado atomicamente
- [ ] Alertas `low` não são enviados (controle de severity)
- [ ] Testes de validação de input passando

---

## Fase 8 — Interface do usuário

### 8.1 Componente de busca com debounce e validação

```typescript
// components/search/SearchInput.tsx
'use client'

import { useState, useCallback } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { z } from 'zod'

const querySchema = z.string().min(2).max(200)

interface SearchInputProps {
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const debouncedValue = useDebounce(value, 400)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setValue(raw)
    setError(null)

    const result = querySchema.safeParse(raw)
    if (!result.success && raw.length > 0) {
      setError('Mínimo de 2 caracteres')
      return
    }

    if (result.success) {
      onSearch(result.data)
    }
  }, [onSearch])

  return (
    <div>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Buscar por nome, CNPJ ou número de processo..."
        aria-label="Buscar no Diário Oficial"
        aria-invalid={!!error}
        aria-describedby={error ? 'search-error' : undefined}
        disabled={isLoading}
      />
      {error && (
        <p id="search-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  )
}
```

### 8.2 Testes de componente

```typescript
// __tests__/unit/SearchInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchInput } from '@/components/search/SearchInput'

describe('SearchInput', () => {
  it('não chama onSearch com menos de 2 caracteres', () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } })
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('exibe mensagem de erro para input curto', () => {
    render(<SearchInput onSearch={vi.fn()} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'x' } })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('chama onSearch com query válida', async () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'portaria' } })
    expect(onSearch).toHaveBeenCalledWith('portaria')
  })
})
```

### ✅ Checklist Fase 8

- [ ] Validação client-side com feedback imediato ao usuário
- [ ] Debounce para não disparar busca a cada tecla
- [ ] Acessibilidade: `aria-invalid`, `aria-live`, `aria-label`
- [ ] Estados de loading e erro visíveis na UI
- [ ] Testes de componente passando

---

## 12. Estratégia de testes

### Pirâmide de testes

```
         /\
        /E2E\          — Cypress (fluxos críticos: busca, alerta)
       /------\
      /  Integ \       — Vitest + Supabase local (banco, APIs)
     /----------\
    /   Unitários \    — Vitest (sanitize, validação, LLM parse)
   /--------------\
```

### Scripts no package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run __tests__/unit",
    "test:integration": "vitest run __tests__/integration",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "cypress run",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### Fixtures de teste

```typescript
// __tests__/fixtures/do-publication.ts
export const mockPublication = {
  id: '00000000-0000-0000-0000-000000000001',
  source: 'DOU',
  edition_date: '2026-01-15',
  title: 'Portaria nº 123 — Nomeação',
  content: 'João da Silva, CPF 000.000.000-00, nomeado para o cargo de Diretor',
  organ: 'Ministério da Fazenda',
  act_type: 'portaria',
  original_url: 'https://www.in.gov.br/...',
}

export const mockSocialSignal = {
  entity_id: '00000000-0000-0000-0000-000000000002',
  entity_name: 'João da Silva',
  platform: 'instagram',
  signal_type: 'mention_spike',
  mentions_count: 850,
  sentiment_score: -0.65,
  detected_at: '2026-01-15T14:30:00Z',
}
```

---

## 13. Padrões de código

### Tratamento de erro — padrão obrigatório

```typescript
// ❌ Proibido — erro genérico sem contexto
try {
  await doSomething()
} catch (e) {
  console.error(e)
}

// ✅ Correto — erro tipado com contexto e re-throw se necessário
try {
  await doSomething()
} catch (err) {
  const message = err instanceof Error ? err.message : 'Erro desconhecido'
  logger.error({ err, context: 'nome-da-operação' }, message)
  throw new Error(`Falha em nome-da-operação: ${message}`)
}
```

### Validação — padrão obrigatório

```typescript
// ❌ Proibido — confiar em tipos TypeScript em runtime
function process(data: MyType) { /* ... */ }

// ✅ Correto — validar com Zod antes de processar
function process(rawData: unknown) {
  const data = MySchema.parse(rawData) // lança ZodError se inválido
  // ...
}
```

### Logs — nunca logar dados sensíveis

```typescript
// ❌ Proibido
logger.info({ cpf: user.cpf, email: user.email }, 'Usuário processado')

// ✅ Correto
logger.info({ userId: user.id, hasEmail: !!user.email }, 'Usuário processado')
```

---

## 14. Checklist por fase

| Fase | Implementado | Testes | Revisado | Comitado |
|------|-------------|--------|----------|---------|
| 0 — Setup | ☐ | ☐ | ☐ | ☐ |
| 1 — Schema | ☐ | ☐ | ☐ | ☐ |
| 2 — Ingestão DO | ☐ | ☐ | ☐ | ☐ |
| 3 — Extração LLM | ☐ | ☐ | ☐ | ☐ |
| 4 — Search | ☐ | ☐ | ☐ | ☐ |
| 5 — Correlação | ☐ | ☐ | ☐ | ☐ |
| 6 — API Routes | ☐ | ☐ | ☐ | ☐ |
| 7 — Alertas | ☐ | ☐ | ☐ | ☐ |
| 8 — UI | ☐ | ☐ | ☐ | ☐ |

> **Regra:** uma fase só pode ir para "Comitado" após as 3 colunas anteriores estarem marcadas.

---

*Última atualização: Maio 2026*
