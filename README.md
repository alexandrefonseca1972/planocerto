# PlanoCerto

Plataforma de Planos de Ação 5W2H com suporte multitenant, Kanban, integração Microsoft Teams e notificações por email.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Componentes:** shadcn/ui (custom), Lucide Icons, @dnd-kit
- **Validação:** Zod, react-hook-form
- **Exportação:** xlsx (Excel), HTML formatado (PDF)
- **Testes:** Vitest + Testing Library
- **Deploy:** Vercel

## Funcionalidades

- 🔐 Autenticação email/senha com reset de senha e confirmação
- 🏢 Multitenancy — múltiplas empresas com permissões por usuário (owner/admin/member)
- 📋 Planos 5W2H — What, Why, Where, Who, When, How Much, How
- 🗂️ Kanban Board com drag-and-drop
- 📊 Dashboard executivo com KPIs, gráficos e prazos
- 📅 Calendário de prazos
- 🔔 Notificações por tenant/usário com polling automático
- 💬 Comentários por item de ação
- 📎 Upload de anexos (imagens, PDF, Excel)
- 🔗 Dashboard público via link compartilhável
- ✂️ Cópia de plano entre tenants
- 📄 Templates de plano (Comercial, Operacional, Expansão)
- 📨 Notificações por email via Resend
- 💬 Integração Microsoft Teams via Adaptive Cards
- 👥 Admin panel — gestão de usuários, tenants, permissões
- ⏰ Restrição de horário de login por usuário
- 🌙 Dark/Light mode
- 📏 Controle de tamanho de fonte
- 📤 Exportação Excel + PDF
- 📅 Sincronização Google Calendar (OAuth 2.0)
- 📈 Gráfico de Gantt interativo (zoom mês/trimestre/ano)

## Documentação

- [Manual do Usuário](docs/manual-usuario.md) — guia completo de uso
- [Plano de Implementação](docs/plano-implementacao.md) — roadmap técnico
- [CHANGELOG](CHANGELOG.md) — histórico de versões

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxxxxxxxxxx          # Notificações por email
GOOGLE_CLIENT_ID=xxxxxxxx.apps.google... # Google Calendar sync
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxx      # Google Calendar sync

## Setup Local

```bash
# Instalar dependências
npm install

# Criar .env.local com as variáveis acima
cp .env.local.example .env.local

# Rodar migrations (se usar Supabase local)
supabase db push

# Desenvolver
npm run dev

# Testes
npm test

# Build
npm run build
```

## Deploy

O projeto está configurado para deploy automático via Vercel + GitHub. Cada push na branch `main` dispara o deploy de produção.

Para deploy manual:
```bash
npm run build
vercel --prod
```

## Estrutura

```
src/
├── app/
│   ├── (auth)/          # Autenticação (login, register, reset, update-password)
│   ├── (protected)/     # App protegido (dashboard, planos, calendario, profile, admin)
│   ├── actions/         # Server actions (auth, admin, tenant, action-plan, shared, attachments)
│   ├── api/             # API routes (PDF export)
│   ├── pendente/        # Página "aguardando aprovação"
│   └── s/[token]/       # Dashboard público
├── components/
│   ├── forms/           # Login, register, profile forms
│   ├── layout/          # Navbar, footer, tenant-switcher, export
│   ├── planos/          # Plan components (table, kanban, gantt, attachments)
│   ├── profile/         # Calendar integration
│   └── ui/              # Reusable UI (button, card, toast, etc.)
├── lib/
│   ├── supabase/        # Supabase clients (server, admin, browser) + types
│   ├── validations/     # Zod schemas
│   ├── email.ts         # Email notifications (Resend)
│   ├── teams.ts         # Teams webhook
│   ├── sanitize.ts      # Input sanitization
│   ├── errors.ts        # Error handling
│   └── utils.ts         # cn(), formatDate, etc.
├── types/               # TypeScript interfaces
└── __tests__/           # Test files (100 tests, 9 arquivos)

supabase/
└── migrations/          # 10 migrations SQL
```

## Licença

MIT
