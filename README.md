# PlanoCerto

Plataforma de Planos de Ação 5W2H com suporte multitenant, Kanban, integração Microsoft Teams e notificações por email.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** PostgreSQL, Auth e PostgREST self-hosted na VPS
- **Componentes:** shadcn/ui (custom), Lucide Icons, @dnd-kit
- **Validação:** Zod, react-hook-form
- **Exportação:** xlsx (Excel), HTML formatado (PDF)
- **Testes:** Vitest + Testing Library
- **Deploy:** VPS com Caddy + systemd e Cloudflare

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

## 📚 Documentação Completa

Acesse **[docs/](docs/README.md)** para documentação completa:

### Para Usuários
- 📖 [Manual do Usuário](docs/MANUAL-USUARIO.md) — Guia completo de uso (Dashboard, Planos, Financeiro, Admin)
- ⚡ [Guia Rápido](docs/GUIA-RAPIDO.md) — Comandos essenciais e referências rápidas

### Para Desenvolvedores
- 🏗️ [Documentação Técnica](docs/DOCUMENTACAO-TECNICA.md) — Stack, estrutura, permissões, banco de dados
- 🏗️ [Arquitetura](docs/ARQUITETURA.md) — Visão aprofundada da arquitetura e fluxos
- 🔌 [API Reference](docs/API-REFERENCE.md) — Server Actions, Auth e exemplos de código
- 📋 [Centro de Docs](docs/README.md) — Índice e navegação principal

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://planocerto.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxxxxxxxxxx          # Notificações por email
GOOGLE_CLIENT_ID=xxxxxxxx.apps.google... # Google Calendar sync
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxx      # Google Calendar sync
```

Os nomes das variáveis são mantidos por compatibilidade com as bibliotecas de Auth; os serviços rodam na VPS.

## Setup Local

```bash
# Instalar dependências
npm install

# Criar .env.local com as variáveis acima
cp .env.local.example .env.local

# Aplicar migrations conforme /opt/planocerto/OPERACAO.md

# Desenvolver
npm run dev

# Testes
npm test

# Build
npm run build
```

## Deploy

O projeto roda na VPS com Next.js, Caddy e systemd. A Cloudflare fornece DNS e proxy para `planocerto.app` e `www.planocerto.app`.

Para atualizar a aplicação na VPS, a partir da `main` local igual a `origin/main`:
```bash
scripts/deploy.sh --dry-run   # mostra os arquivos que mudam na VPS
scripts/deploy.sh             # deploy completo
```

O script guarda a versão atual em `app-prev` e compila com o site parado; se a compilação falhar, restaura a versão anterior. Depois testa as páginas e registra no `OPERACAO.md` da VPS. Em seguida atualiza o grafo do projeto (`graphify update .`, só código e sem LLM) e, se ele mudou, faz commit e push de `graphify-out/` na `main`. Use `--no-graph` para pular o grafo. Migrations não são aplicadas pelo script.

A operação, os backups e as configurações dos serviços estão documentados em `/opt/planocerto/OPERACAO.md`.

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
│   ├── supabase/        # Clients Auth/API (server, admin, browser) + types
│   ├── validations/     # Zod schemas
│   ├── email.ts         # Email notifications (Resend)
│   ├── teams.ts         # Teams webhook
│   ├── sanitize.ts      # Input sanitization
│   ├── errors.ts        # Error handling
│   └── utils.ts         # cn(), formatDate, etc.
├── types/               # TypeScript interfaces
└── __tests__/           # 349 testes em 45 arquivos

supabase/
└── migrations/          # 10 migrations SQL
```

## Licença

MIT
