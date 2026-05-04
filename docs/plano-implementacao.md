# PLANO DE IMPLEMENTAÇÃO — PlanoCerto v2
> Revisão completa + sanitização + tratamento de erro + tipagem forte + testes automatizados

---

## PILARES TRANSVERSAIS (aplicados em cada fase)

### A. Tratamento de Erro Padronizado
Toda server action segue este template:

```ts
export async function myAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const raw = Object.fromEntries(formData);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { message: parsed.error.errors.map(e => e.message).join("; ") };
    }

    const data = sanitizeRecord(parsed.data);

    const { error } = await supabase.from("table").operation(data);
    if (error) {
      console.error("[myAction] DB error:", JSON.stringify(error));
      return { message: getErrorMessage(error) };
    }

    revalidatePaths();

    return { message: "Sucesso!", success: true };
  } catch (error) {
    console.error("[myAction] Unexpected:", error);
    return { message: "Erro inesperado. Tente novamente." };
  }
}
```

- `console.error("[ActionName]", error)` em TODO catch block
- Mensagens em português, sem stack traces, sem dados internos
- Operações idempotentes com retry em erros de rede (409/503)

### B. Sanitização Universal

```ts
// src/lib/sanitize.ts
export function sanitize(text: string): string {
  return text.replace(/[<>]/g, "");
}

export function sanitizeRecord<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === "string") result[key] = sanitize(value) as T[Extract<keyof T, string>];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeRecord(value as Record<string, unknown>) as T[Extract<keyof T, string>];
    }
  }
  return result;
}

export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (allowedDomains?.length && !allowedDomains.some(d => parsed.hostname.endsWith(d))) return false;
    return true;
  } catch { return false; }
}
```

### C. Tipagem Forte

- Zod → TypeScript: `type MyInput = z.infer<typeof mySchema>` em toda action — sem `as`, sem `any`
- `database.types.ts` sincronizado com migrations (validado a cada fase)
- ESLint: `@typescript-eslint/no-explicit-any: error`
- `FormState<T>` unificado para todas as actions
- `tsc --noEmit` zero erros antes de cada commit

### D. Testes Automatizados

| Fase | Cobertura Meta | Tipo de Teste |
|------|---------------|---------------|
| 1 | 40% | Unitários: utils, sanitize, errors, validations, proxy |
| 2 | 50% | Unitários + Actions + Componentes (forms, KPIs, notifications) |
| 3 | 60% | Componentes planos refatorados, calendário, actions |
| 4 | 70% | Fluxos completos: reset senha, upload, drag-drop, bulk |
| 5 | 80% | Integrações, API, E2E com Playwright |

### E. Revisão Pós-Fase (checklist fixo)

```
□ npm run lint        → 0 errors, 0 warnings
□ npm run typecheck   → 0 errors
□ npm run test        → todos passam, coverage ≥ meta da fase
□ npm run build       → 0 errors
□ Deploy preview      → vercel deploy (preview URL)
□ Smoke test manual   → login, dashboard, planos, calendario
□ Git tag             → git tag v1.X.0
□ Deploy production   → vercel --prod
```

---

## FASE 1: Correções Críticas
**Esforço: 3h | Meta cobertura: 40% | Bloqueia: Fases 2-5**

| # | Tarefa | Arquivos | Sanitização | Erro | Tipo | Teste |
|---|--------|----------|-------------|------|------|-------|
| 1.1 | Deletar `004_pdca.sql` | `supabase/migrations/` | — | — | — | — |
| 1.2 | Nova migration `008_teams_webhook.sql` | `supabase/migrations/008_add_teams_webhook.sql` | — | — | `teams_webhook_url: string` | Teste de migration |
| 1.3 | Corrigir redirect loop (auth com restrição) | `proxy.ts` | `searchParams.get()` validado | `console.error` no catch | — | Teste unitário proxy |
| 1.4 | Unificar `isProtectedPath` com `isProtectedPage` | `proxy.ts` | — | — | — | Teste unitário de rotas |
| 1.5 | `router.refresh()` pós-mutations (stale data) | `planos/page.tsx` | — | `try/catch` no refresh | — | Teste de componente |
| 1.6 | Criar `lib/sanitize.ts` | `lib/sanitize.ts` | `sanitize()`, `sanitizeRecord()`, `isValidUrl()` | — | Tipos genéricos `<T>` | 8+ testes unitários |
| 1.7 | Padronizar `console.error` em todas actions | `actions/*.ts` (5 arquivos) | — | Adicionar em todos catch blocks | — | Teste de log em actions |
| 1.8 | Criar `lib/errors.ts` | `lib/errors.ts` | — | `getErrorMessage()`, `isRetryable()`, `FormState<T>` | Tipos de erro tipados | 5+ testes unitários |

### Tipos novos

```ts
// lib/errors.ts
type AppError =
  | { code: "AUTH_REQUIRED"; message: string }
  | { code: "VALIDATION_ERROR"; message: string; fields: Record<string, string> }
  | { code: "DB_ERROR"; message: string; retryable: boolean }
  | { code: "UNEXPECTED"; message: string };

type FormState<T = void> = {
  message: string;
  success?: boolean;
  data?: T;
  errors?: Record<string, string>;
};
```

### Testes Fase 1 (meta: 40% cobertura)

| Arquivo | Testes | Tipo |
|---------|--------|------|
| `lib/sanitize.test.ts` | 8 | sanitize(), sanitizeRecord(), isValidUrl() |
| `lib/errors.test.ts` | 5 | getErrorMessage(), isRetryable() |
| `lib/utils.test.ts` | 15 | Existente ✓ |
| `lib/validations/auth.test.ts` | 14 | Existente ✓ |
| `proxy.test.ts` | 8 | Mock request, redirects, restrições |
| **Total fase** | **+21 novos = 50 total** | |

---

## FASE 2: Segurança, Dados e UX Crítica
**Esforço: 5h | Meta cobertura: 50% | Depende: Fase 1**

| # | Tarefa | Arquivos | Sanitização | Erro | Tipo |
|---|--------|----------|-------------|------|------|
| 2.1 | Proteção criação admin por admin | `actions/admin.ts`, `validations/admin.ts` | `role` validado Zod enum | Erro específico | `z.enum(["user","admin","super_admin"])` |
| 2.2 | Impedir remoção do último owner | `actions/tenant.ts` | — | Erro "último owner" | Função `getOwnerCount()` tipada |
| 2.3 | Admin verifica membership ao trocar tenant | `actions/tenant.ts` | `tenantId` UUID validado | `console.error` se falhar | — |
| 2.4 | Polling notificações 30s | `notification-bell.tsx` | — | `try/catch` no intervalo | `useEffect` + `setInterval` tipado |
| 2.5 | Timeout 5s webhook + validar URL | `lib/teams.ts`, `actions/tenant.ts` | `isValidUrl(url, ["webhook.office.com"])` | `AbortController`, catch logado | `webhookUrl: string` |
| 2.6 | Corrigir KPIs (categorias mutuamente exclusivas) | `dashboard/page.tsx` | — | — | `DashboardKPI` tipado |
| 2.7 | Corrigir progresso (remover peso 50% de overdue) | `dashboard/page.tsx` | — | — | `completionRate: number` |
| 2.8 | Sanitizar inputs em forms cliente | `login-form`, `register-form`, `profile-form` | `sanitize()` antes de `formData.append()` | `try/catch` no submit | — |
| 2.9 | Error boundary por seção | `planos/`, `dashboard/`, `calendario/` | — | `ErrorBoundary` com fallback + log | Props tipadas |

### Tipos novos

```ts
// types/dashboard.ts
type DashboardKPI = {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  pendingItems: number;
  overdueItems: number;        // mutuamente exclusivo das outras categorias
  completionRate: number;      // completed / total * 100
};

// lib/teams.ts
type TeamsWebhookOptions = {
  webhookUrl: string;          // validado: https://*.webhook.office.com/*
  tenantName: string;
  timeout?: number;            // default 5000
};
```

### Testes Fase 2 (meta: 50% cobertura)

| Arquivo | Testes |
|---------|--------|
| `actions/admin.test.ts` | 3 |
| `actions/tenant.test.ts` | 5 |
| `components/notification-bell.test.tsx` | 4 |
| `lib/teams.test.ts` | 5 |
| `lib/dashboard-kpi.test.ts` | 8 |
| `components/login-form.test.tsx` | 3 |
| **Total fase** | **+28 novos = 78 total** |

---

## FASE 3: Qualidade e Performance
**Esforço: 8h | Meta cobertura: 60% | Depende: Fase 1**

| # | Tarefa | Arquivos |
|---|--------|----------|
| 3.1 | Refatorar `planos/page.tsx` (827 linhas → 7 arquivos) | `components/planos/plan-table.tsx`, `plan-kanban.tsx`, `plan-form-dialog.tsx`, `item-form-dialog.tsx`, `plan-audit-panel.tsx`, `plan-filters.tsx`, `plan-utils.ts` |
| 3.2 | `useMemo` no `flattenItems` | `planos/plan-utils.ts` |
| 3.3 | Zod `.trim().min()` (trim antes de validar) | `actions/action-plan.ts` |
| 3.4 | Audit log: `"DELETE_PLAN"` em vez de `"UPDATE_PLAN"` | `actions/action-plan.ts:123` |
| 3.5 | `revalidatePath` para dashboard e calendário | `actions/action-plan.ts` |
| 3.6 | Email duplicado no `addTenantMember` | `actions/tenant.ts` |
| 3.7 | `safeJsonParse()` para permissões | `actions/admin.ts:190` |
| 3.8 | `activeTenant` null → array vazio (não busca todos) | `calendario/page.tsx` |
| 3.9 | Calendário com paginação mensal | `calendario/page.tsx` |
| 3.10 | Remover campo `expected_result` duplicado | `planos/page.tsx:465` |
| 3.11 | `https://` no schema Adaptive Card | `lib/teams.ts:40` |
| 3.12 | ESLint `no-explicit-any: error` | `eslint.config.mjs` |
| 3.13 | Regenerar `database.types.ts` via Supabase CLI | `database.types.ts` |

### Tipos novos

```ts
// components/planos/types.ts
type PlanTableProps = { items: FlatItem[]; planId: string; onRefresh: () => void };
type KanbanProps = { items: FlatItem[]; planId: string; columns: KanbanColumn[] };
type PlanFormDialogProps = { plan?: ActionPlan; tenantId: string; onClose: () => void };
type ItemFormDialogProps = { item?: ActionItem; planId: string; groups: FlatItem[]; onClose: () => void };
type PlanAuditPanelProps = { planId: string; open: boolean; onClose: () => void };
type PlanFiltersProps = { search: string; statusFilter: number | null;
  onSearch: (v: string) => void; onStatus: (v: number | null) => void };

// Plan utils
type FlatItem = ActionItem & { depth: number; children: FlatItem[] };
function flattenItems(items: ActionItem[], depth?: number): FlatItem[];

// Permissions
type PermissionShape = z.infer<typeof permissionSchema>;
const permissionSchema = z.object({
  create_plan: z.boolean(), edit_plan: z.boolean(), delete_plan: z.boolean(),
  create_item: z.boolean(), edit_item: z.boolean(), delete_item: z.boolean(),
});
```

### Testes Fase 3 (meta: 60% cobertura)

| Arquivo | Testes |
|---------|--------|
| `components/planos/plan-table.test.tsx` | 6 |
| `components/planos/plan-kanban.test.tsx` | 5 |
| `components/planos/plan-form-dialog.test.tsx` | 5 |
| `components/planos/item-form-dialog.test.tsx` | 5 |
| `components/planos/plan-utils.test.ts` | 6 |
| `components/calendario.test.tsx` | 5 |
| `actions/admin.test.ts` | 3 |
| `lib/safeJsonParse.test.ts` | 4 |
| **Total fase** | **+39 novos = 117 total** |

---

## FASE 4: Funcionalidades Ausentes
**Esforço: 14h | Meta cobertura: 70% | Depende: Fases 1-3**

| # | Tarefa | Arquivos |
|---|--------|----------|
| 4.1 | Reset de senha | `actions/auth.ts`, `auth/reset/page.tsx`, `auth/update-password/page.tsx` |
| 4.2 | Confirmação de email real | `actions/auth.ts` (remover `email_confirm: true`) |
| 4.3 | Rate limiting (config Supabase) | Dashboard Supabase |
| 4.4 | Drag-drop Kanban (`@dnd-kit/core`) | `components/planos/plan-kanban.tsx` |
| 4.5 | Bulk status update | `actions/action-plan.ts`, `plan-table.tsx` |
| 4.6 | Upload de anexos | `actions/action-plan.ts`, Storage, migration `009` |
| 4.7 | Filtro por mês no calendário | `calendario/page.tsx` |

### Tipos novos

```ts
// types/attachments.ts
type PlanAttachment = {
  id: string;
  item_id: string;
  filename: string;          // sanitizado: sem path traversal
  storage_path: string;
  size: number;
  mime_type: string;         // allowlist: image/*, pdf, xlsx, csv
  uploaded_by: string;
  created_at: string;
};

const ALLOWED_MIMES = [
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
] as const;

// types/bulk.ts
type BulkUpdateInput = {
  planId: string;            // UUID validado
  itemIds: string[];         // array de UUIDs, min 1
  status: number;            // 1-5
};

// types/auth.ts
const resetSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Senhas não conferem." });
```

### Testes Fase 4 (meta: 70% cobertura)

| Arquivo | Testes |
|---------|--------|
| `actions/auth.test.ts` | 6 |
| `auth/reset/page.test.tsx` | 4 |
| `auth/update-password/page.test.tsx` | 4 |
| `actions/action-plan.test.ts` | 8 |
| `components/planos/plan-kanban.test.tsx` | 5 |
| `components/planos/plan-table.test.tsx` | 5 |
| `components/calendario.test.tsx` | 4 |
| `lib/upload.test.ts` | 6 |
| **Total fase** | **+42 novos = 159 total** |

---

## FASE 5: Novas Funcionalidades
**Esforço: 24h | Meta cobertura: 80% | Depende: Fases 1-3**

| # | Tarefa | Arquivos | Destaque |
|---|--------|----------|----------|
| 5.1 | **Google Calendar + Outlook sync** ⭐ | `lib/calendar/`, `actions/calendar-sync.ts`, migration `010` | OAuth 2.0, CRUD eventos, sync bidirecional |
| 5.2 | Notificações por email (Resend) | `lib/email.ts`, edge function | Templates HTML, disparo assíncrono |
| 5.3 | Relatório PDF | `components/planos/plan-pdf.tsx`, `api/plans/[id]/pdf/route.ts` | `@react-pdf/renderer`, capa + tabela + timeline |
| 5.4 | Templates de plano | `actions/templates.ts`, migration `011` | 3 templates padrão + customizados |
| 5.5 | Cópia de plano entre tenants | `actions/action-plan.ts` | Copia plan + items recursivamente com novos UUIDs |
| 5.6 | Dashboard público (link compartilhável) | `s/[token]/page.tsx`, migration `012` | Read-only, token com expiração configurável |
| 5.7 | Comentários nos itens | `components/comments/`, migration `013` | Thread de comentários, notificação no Teams/email |
| 5.8 | API REST v1 | `api/v1/`, `lib/api-auth.ts` | API keys por tenant, OpenAPI docs, rate limiting |
| 5.9 | Gráfico de Gantt | `components/planos/plan-gantt.tsx` | SVG-based, zoom mês/trimestre/ano, cores por status |
| 5.10 | E2E com Playwright | `e2e/` | 10+ cenários: signup → criar plano → drag-drop → export |

### Tipos novos (destaques)

```ts
// lib/calendar/types.ts
type CalendarProvider = "google" | "outlook";
type SyncStatus = "synced" | "pending" | "error" | "not_connected";

type CalendarEvent = {
  summary: string;           // sanitizado
  description?: string;      // sanitizado
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
};

// api/v1/types.ts
type ApiResponse<T> = { data: T; meta?: { page: number; total: number } };
type ApiError = { error: { code: string; message: string; details?: unknown } };

// lib/email/types.ts
type EmailPayload = {
  to: string;
  subject: string;
  template: "welcome" | "item_created" | "item_completed" | "deadline_reminder";
  data: Record<string, string>;  // sanitizado
};
```

### Testes Fase 5 (meta: 80% cobertura)

| Arquivo | Testes |
|---------|--------|
| `lib/calendar/google.test.ts` | 8 |
| `lib/calendar/outlook.test.ts` | 8 |
| `actions/calendar-sync.test.ts` | 6 |
| `lib/email.test.ts` | 5 |
| `components/planos/plan-pdf.test.tsx` | 4 |
| `actions/templates.test.ts` | 5 |
| `actions/public-link.test.ts` | 5 |
| `actions/comments.test.ts` | 6 |
| `api/v1/plans.test.ts` | 10 |
| `api/v1/items.test.ts` | 8 |
| `components/planos/plan-gantt.test.tsx` | 5 |
| `e2e/*.spec.ts` | 10 |
| **Total fase** | **+70 unitários + 10 E2E = 229 total + 10 E2E** |

---

## ARQUITETURA DE TESTES

```
src/__tests__/
├── lib/
│   ├── sanitize.test.ts          # Fase 1
│   ├── errors.test.ts            # Fase 1
│   ├── utils.test.ts             # Existente
│   ├── teams.test.ts             # Fase 2
│   ├── dashboard-kpi.test.ts     # Fase 2
│   ├── safeJsonParse.test.ts     # Fase 3
│   ├── upload.test.ts            # Fase 4
│   ├── calendar/                 # Fase 5
│   │   ├── google.test.ts
│   │   └── outlook.test.ts
│   ├── email.test.ts             # Fase 5
│   └── validations/
│       ├── auth.test.ts          # Existente
│       ├── admin.test.ts         # Fase 3
│       └── tenant.test.ts        # Fase 4
├── actions/
│   ├── auth.test.ts              # Fase 4
│   ├── admin.test.ts             # Fase 2
│   ├── tenant.test.ts            # Fase 2
│   ├── action-plan.test.ts       # Fase 3
│   ├── notifications.test.ts     # Fase 4
│   ├── calendar-sync.test.ts     # Fase 5
│   ├── templates.test.ts         # Fase 5
│   ├── public-link.test.ts       # Fase 5
│   └── comments.test.ts          # Fase 5
├── components/
│   ├── login-form.test.tsx       # Fase 2
│   ├── register-form.test.tsx    # Fase 2
│   ├── notification-bell.test.tsx # Fase 2
│   ├── planos/                   # Fase 3
│   │   ├── plan-table.test.tsx
│   │   ├── plan-kanban.test.tsx
│   │   ├── plan-form-dialog.test.tsx
│   │   ├── item-form-dialog.test.tsx
│   │   ├── plan-utils.test.ts
│   │   └── plan-pdf.test.tsx     # Fase 5
│   └── calendario.test.tsx       # Fase 3
├── proxy.test.ts                 # Fase 1
├── api/v1/                       # Fase 5
│   ├── plans.test.ts
│   └── items.test.ts
└── e2e/                          # Fase 5
    ├── auth.spec.ts
    ├── planos.spec.ts
    └── dashboard.spec.ts
```

---

## CONFIGURAÇÕES ADICIONAIS

### Husky + lint-staged (Fase 1)

```json
// .husky/pre-commit
{
  "*.{ts,tsx}": ["eslint --fix"],
  "*.{ts,tsx}": ["tsc --noEmit"]
}
```

### ESLint adicional (Fase 3)

```js
// eslint.config.mjs
rules: {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "no-console": ["warn", { "allow": ["error", "warn"] }],
}
```

### Vitest thresholds (Fase 1)

```ts
// vitest.config.ts
coverage: {
  provider: "v8",
  thresholds: {
    statements: 40,
    branches: 35,
    functions: 40,
    lines: 40,
  },
}
```

---

## RESUMO FINAL

| Fase | Horas | Itens | Testes novos | Cobertura | Tag |
|------|-------|-------|-------------|-----------|-----|
| 1 | 3h | 8 | +21 (50 total) | 40% | v1.1.0 |
| 2 | 5h | 9 | +28 (78 total) | 50% | v1.2.0 |
| 3 | 8h | 13 | +39 (117 total) | 60% | v1.3.0 |
| 4 | 14h | 7 | +42 (159 total) | 70% | v1.4.0 |
| 5 | 24h | 10 | +70 + 10 E2E (239 total) | 80% | v2.0.0 |

| **TOTAL** | **~54h** | **47** | **~239 testes + 10 E2E** | **80%** | |

### Ordem de execução

| Sprint | Dias | Escopo |
|--------|------|--------|
| Sprint 1 | 3 | Fase 1 completa + Fase 2.1-2.4 (logging, segurança) |
| Sprint 2 | 3 | Fase 2.5-2.9 (notificações, webhook, KPIs) + Fase 3.1-3.4 (refactor planos) |
| Sprint 3 | 3 | Fase 3.5-3.13 (ajustes médios) + Fase 4.1-4.3 (reset senha, email, rate limit) |
| Sprint 4 | 4 | Fase 4.4-4.7 (Kanban drag-drop, bulk, anexos, calendário) + Fase 5.4-5.5 (templates, cópia) |
| Sprint 5 | 4 | Fase 5.1-5.3 (Google/Outlook Calendar, email, PDF) |
| Sprint 6 | 4 | Fase 5.6-5.10 (dashboard público, comentários, API, Gantt, E2E) |

### Dependências

```
Fase 1 ──► Fase 2 ──► Fase 4
  │           │
  └──► Fase 3 ──► Fase 5
```

**Regra de ouro:** Nenhuma fase avança sem checklist de revisão 100% verde. Nenhum código mergeia sem tipagem, sanitização, tratamento de erro e testes.

---

*Plano gerado em 2026-05-04. Revisado com base em auditoria completa de código, segurança e funcionalidades.*
