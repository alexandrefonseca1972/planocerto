# 🚀 Integrar Documentação no Frontend

Guia para disponibilizar a documentação diretamente na plataforma PlanoCerto.

---

## Visão Geral

Você pode criar:
1. **Página de Help** — `/help` com links para docs
2. **Modal de FAQ** — Clicável via ícone `?`
3. **In-app Guidance** — Tooltips e tours
4. **Sidebar docs** — Acessível em admin

---

## 1. Página de Help

### Criar `/help`

**Arquivo:** `src/app/(protected)/help/page.tsx`

```tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Centro de Ajuda</h1>
        <p className="text-muted-foreground mt-2">
          Tudo que você precisa saber sobre PlanoCerto
        </p>
      </div>

      {/* Para Usuários */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">📖 Para Usuários</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="https://raw.githubusercontent.com/seu-repo/docs/MANUAL-USUARIO.md">
            <Button variant="outline" className="w-full justify-start">
              Manual do Usuário
            </Button>
          </Link>
          <Link href="https://raw.githubusercontent.com/seu-repo/docs/GUIA-RAPIDO.md">
            <Button variant="outline" className="w-full justify-start">
              Guia Rápido
            </Button>
          </Link>
          <Link href="https://raw.githubusercontent.com/seu-repo/docs/FAQ-COMPLETO.md">
            <Button variant="outline" className="w-full justify-start">
              FAQ Completo
            </Button>
          </Link>
        </div>
      </section>

      {/* Para Desenvolvedores */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">🛠️ Para Desenvolvedores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="https://raw.githubusercontent.com/seu-repo/docs/DOCUMENTACAO-TECNICA.md">
            <Button variant="outline" className="w-full justify-start">
              Documentação Técnica
            </Button>
          </Link>
          <Link href="https://raw.githubusercontent.com/seu-repo/docs/ARQUITETURA.md">
            <Button variant="outline" className="w-full justify-start">
              Arquitetura
            </Button>
          </Link>
          <Link href="https://raw.githubusercontent.com/seu-repo/docs/API-REFERENCE.md">
            <Button variant="outline" className="w-full justify-start">
              API Reference
            </Button>
          </Link>
        </div>
      </section>

      {/* Suporte */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">📞 Precisa de Ajuda?</h2>
        <p className="text-muted-foreground">
          Entre em contato conosco:
        </p>
        <ul className="mt-2 space-y-2">
          <li>📧 Email: suporte@planocerto.com</li>
          <li>📱 Telefone: (11) 3000-0000</li>
          <li>💬 Chat: Disponível 9h-18h</li>
        </ul>
      </section>
    </div>
  );
}
```

---

## 2. Modal FAQ

### Componente HelpModal

**Arquivo:** `src/components/ui/help-modal.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'Como crio um plano?',
    answer: 'Clique em "Novo Plano" no topo, preencha título, unidade, responsável e objetivo.',
    category: 'planos'
  },
  {
    question: 'Como exporto um plano?',
    answer: 'Abra o plano, clique "⬇️ Exportar", escolha Excel ou PDF.',
    category: 'planos'
  },
  {
    question: 'Como registro um pagamento?',
    answer: 'Abra a parcela, clique "Registrar Pagamento", preencha data, valor e forma.',
    category: 'financeiro'
  },
  {
    question: 'Esqueci minha senha, como recupero?',
    answer: 'Clique "Esqueceu senha?" na tela de login, insira email, siga o link.',
    category: 'conta'
  },
  // ... mais itens
];

export function HelpModal() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(search.toLowerCase()) ||
    item.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="w-5 h-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Centro de Ajuda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Buscar pergunta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="space-y-4">
              {filtered.length > 0 ? (
                filtered.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{item.question}</h4>
                    <p className="text-sm text-muted-foreground mt-2">{item.answer}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">Nenhuma pergunta encontrada</p>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Não encontrou a resposta? Entre em contato: suporte@planocerto.com
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Usar no Layout

**Arquivo:** `src/app/(protected)/layout.tsx`

```tsx
import { HelpModal } from '@/components/ui/help-modal';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* ... seu layout existente ... */}
      <HelpModal />
    </>
  );
}
```

---

## 3. Adicionar Links na Navbar

**Arquivo:** `src/components/layout/navbar.tsx`

```tsx
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between">
      {/* ... outros items ... */}
      
      <div className="flex items-center gap-2">
        <Link href="/help" className="text-sm hover:underline">
          ? Ajuda
        </Link>
        {/* ... outros items ... */}
      </div>
    </nav>
  );
}
```

---

## 4. Sidebar Admin Com Docs

**Arquivo:** `src/components/admin/admin-nav.tsx`

```tsx
'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function AdminNav() {
  return (
    <nav className="space-y-2">
      {/* ... items existentes ... */}
      
      <div className="border-t pt-4">
        <h3 className="text-xs font-semibold text-muted-foreground px-4 mb-2">
          DOCUMENTAÇÃO
        </h3>
        <Link href="/docs/tecnica" className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded">
          <BookOpen className="w-4 h-4" />
          <span>Docs Técnica</span>
        </Link>
        <Link href="/docs/arquitetura" className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded">
          <BookOpen className="w-4 h-4" />
          <span>Arquitetura</span>
        </Link>
        <a 
          href="/docs/API-REFERENCE.md" 
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded"
        >
          <BookOpen className="w-4 h-4" />
          <span>API Reference</span>
        </a>
      </div>
    </nav>
  );
}
```

---

## 5. Páginas de Docs Dentro do App

### Criar páginas dinâmicas para docs

**Arquivo:** `src/app/(protected)/docs/[doc]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { getDocContent } from '@/lib/docs';
import ReactMarkdown from 'react-markdown';

interface DocPageProps {
  params: {
    doc: string;
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const content = await getDocContent(params.doc);
  
  if (!content) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <article className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
```

**Arquivo:** `src/lib/docs.ts`

```typescript
import fs from 'fs';
import path from 'path';

export async function getDocContent(docName: string): Promise<string | null> {
  try {
    const docPath = path.join(process.cwd(), 'docs', `${docName}.md`);
    const content = fs.readFileSync(docPath, 'utf-8');
    return content;
  } catch (error) {
    return null;
  }
}
```

---

## 6. Embed MDX (Avançado)

Para versão mais sofisticada, use MDX:

```bash
npm install next-mdx-remote
```

**Arquivo:** `src/app/(protected)/docs/[doc]/page.tsx`

```tsx
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getDocContent } from '@/lib/docs';

export default async function DocPage({ params }: { params: { doc: string } }) {
  const content = await getDocContent(params.doc);
  
  if (!content) {
    return <div>Documento não encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <article className="prose dark:prose-invert">
        <MDXRemote source={content} />
      </article>
    </div>
  );
}
```

---

## 7. Search de Docs

**Arquivo:** `src/components/docs-search.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const DOCS = [
  { title: 'Manual do Usuário', slug: 'MANUAL-USUARIO' },
  { title: 'Documentação Técnica', slug: 'DOCUMENTACAO-TECNICA' },
  { title: 'Arquitetura', slug: 'ARQUITETURA' },
  { title: 'API Reference', slug: 'API-REFERENCE' },
  { title: 'Guia Rápido', slug: 'GUIA-RAPIDO' },
  { title: 'FAQ Completo', slug: 'FAQ-COMPLETO' },
];

export function DocsSearch() {
  const [search, setSearch] = useState('');

  const filtered = DOCS.filter(doc =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar documentação..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-2">
        {filtered.map(doc => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}`}
            className="block p-3 hover:bg-accent rounded border"
          >
            {doc.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Docs (se hospedado externamente)
NEXT_PUBLIC_DOCS_URL=https://raw.githubusercontent.com/seu-repo/docs
```

---

## 9. Deploy da Documentação

### Opção 1: GitHub Pages
```bash
# Publicar /docs no GitHub Pages
# Configurar em: Settings → Pages → Source: /docs
```

### Opção 2: Vercel
```bash
# Criar site separado para docs
# Ou integrar no mesmo projeto
```

### Opção 3: Embed no App
```typescript
// Recomendado: copia .md files para public/docs
// Serve diretamente do Next.js
```

---

## 10. Checklist

- [ ] Página `/help` criada
- [ ] Modal de FAQ adicionado ao layout
- [ ] Links para docs na navbar
- [ ] Admin panel com referências
- [ ] Breadcrumbs nas páginas de docs
- [ ] Search de docs
- [ ] Footer com links de ajuda
- [ ] Integração sugerida no onboarding

---

## Exemplo Completo de Integração

Veja `docs/INTEGRACAO-EXEMPLO.tsx` para componente pronto para usar.

---

**Próximos Passos:**
1. Escolha quais docs integrar
2. Implemente no seu app
3. Teste em `/help` e modal `?`
4. Deploy quando pronto

