'use client';

import { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { ChevronRight, Search, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DocSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  subsections: { id: string; title: string }[];
}

export interface DocsViewerProps {
  sections: DocSection[];
  defaultSection?: string;
}

export function DocsViewer({ sections, defaultSection }: DocsViewerProps) {
  const [activeSection, setActiveSection] = useState(defaultSection || sections[0]?.id);
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeDoc = sections.find((s) => s.id === activeSection);
  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border overflow-y-auto bg-muted/30">
        <div className="sticky top-0 p-4 bg-background border-b border-border z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>

        <nav className="p-3 space-y-2">
          {filteredSections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => {
                  setActiveSection(section.id);
                  setActiveSubsection(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="text-lg">{section.icon}</span>
                <span className="flex-1 text-left">{section.title}</span>
                {activeSection === section.id && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {activeSection === section.id && section.subsections.length > 0 && (
                <div className="ml-9 mt-1 space-y-1 border-l border-border">
                  {section.subsections.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubsection(sub.id)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                        activeSubsection === sub.id
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sub.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeDoc ? (
          <article className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <header className="mb-8 pb-6 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{activeDoc.icon}</span>
                <h1 className="text-4xl font-bold">{activeDoc.title}</h1>
              </div>
              <p className="text-muted-foreground">
                Guia completo sobre {activeDoc.title.toLowerCase()}
              </p>
            </header>

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <DocContent
                content={activeDoc.content}
                onCopyCode={handleCopyCode}
                copiedCode={copiedCode}
              />
            </div>

            {/* Navigation */}
            <nav className="mt-12 pt-6 border-t border-border flex justify-between">
              <Button variant="outline" disabled>
                ← Anterior
              </Button>
              <Button variant="outline" disabled>
                Próximo →
              </Button>
            </nav>
          </article>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-muted-foreground">
              <p className="text-lg">Nenhum resultado encontrado</p>
              <p className="text-sm">Tente outra busca</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DocContent({
  content,
  onCopyCode,
  copiedCode,
}: {
  content: string;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}) {
  // Parse markdown-like content com suporte a blocos de código
  const parts = content.split(/```(\w*)\n([\s\S]*?)```/);
  const elements = [];

  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) {
      elements.push(
        <div
          key={`text-${i}`}
          className="whitespace-pre-wrap text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatText(parts[i]) }}
        />
      );
    }
    if (parts[i + 1] && parts[i + 2]) {
      const lang = parts[i + 1] || 'text';
      const code = parts[i + 2];
      elements.push(
        <div key={`code-${i}`} className="my-6 rounded-lg border border-border overflow-hidden bg-muted">
          <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground">{lang}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopyCode(code)}
              className="h-7 px-2 gap-1 text-xs"
            >
              {copiedCode === code ? (
                <>
                  <Check className="w-3 h-3" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-muted-foreground">{code.trim()}</code>
          </pre>
        </div>
      );
    }
  }

  return <div className="space-y-4">{elements}</div>;
}

function formatText(text: string): string {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
    .replace(/### (.*?)(?=\n|$)/g, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
    .replace(/## (.*?)(?=\n|$)/g, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/- (.*?)(?=\n|$)/g, '<li class="ml-4">$1</li>')
    .replace(/(\d+)\. (.*?)(?=\n|$)/g, '<li class="ml-4">$2</li>');
  // Hardening: ainda que o conteúdo seja estático, sanitiza o HTML gerado antes
  // de injetar via dangerouslySetInnerHTML (remove href javascript:, handlers, etc.).
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'a', 'h2', 'h3', 'li', 'br'],
    ALLOWED_ATTR: ['href', 'class'],
  });
}
