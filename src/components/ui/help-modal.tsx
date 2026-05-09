'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HelpCircle, Search, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'geral' | 'planos' | 'financeiro' | 'admin' | 'configuracoes' | 'troubleshooting';
  tags: string[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'Como crio um plano?',
    answer:
      '1. Clique em "Novo Plano" no topo\n2. Preencha: Título, Unidade, Responsável, Objetivo\n3. Clique em "Criar"\n\nO plano será criado com status "active" e você poderá adicionar itens de ação.',
    category: 'planos',
    tags: ['plano', 'criar', 'básico'],
  },
  {
    id: '2',
    question: 'Como adiciono itens de ação?',
    answer:
      'Dentro de um plano, clique em "+ Adicionar Item" e preencha os 7 campos 5W2H:\n- O quê (What)\n- Por quê (Why)\n- Onde (Where)\n- Quem (Who)\n- Quando (When)\n- Como (How)\n- Quanto (Cost)',
    category: 'planos',
    tags: ['item', '5w2h', 'ação'],
  },
  {
    id: '3',
    question: 'Como registro um pagamento?',
    answer:
      '1. Vá em Financeiro → Contas a Pagar\n2. Abra a conta desejada\n3. Clique em "Registrar Pagamento" na parcela\n4. Preencha: Data, Valor pago, Forma\n5. Confirme\n\nO status da conta será atualizado automaticamente.',
    category: 'financeiro',
    tags: ['pagamento', 'parcela', 'conta'],
  },
  {
    id: '4',
    question: 'Posso exportar um plano?',
    answer:
      'Sim! Abra o plano e clique em "⬇️ Exportar".\n\nOpções:\n- Excel: Arquivo .xlsx com todos os itens\n- PDF: Documento formatado para impressão\n\nÚtil para apresentações e compartilhamento.',
    category: 'planos',
    tags: ['exportar', 'excel', 'pdf', 'download'],
  },
  {
    id: '5',
    question: 'Como mudo de empresa?',
    answer:
      'Use o seletor no topo esquerdo da navbar:\n\n[Minha Empresa ▼]\n\nClique para ver todas as empresas que você tem acesso e selecione a desejada. Todos os dados serão filtrados para a empresa selecionada.',
    category: 'geral',
    tags: ['empresa', 'tenant', 'multi-tenant'],
  },
  {
    id: '6',
    question: 'Esqueci minha senha, como recupero?',
    answer:
      '1. Na tela de login, clique em "Esqueceu senha?"\n2. Insira seu email\n3. Clique em "Enviar Link"\n4. Verifique seu email (cheque spam)\n5. Clique no link\n6. Defina uma nova senha',
    category: 'configuracoes',
    tags: ['senha', 'login', 'recuperação'],
  },
  {
    id: '7',
    question: 'Página não carrega, vejo erro',
    answer:
      'Tente:\n1. Atualize a página (Ctrl+R ou Cmd+R)\n2. Limpe cookies: Dev Tools → Application → Clear Storage\n3. Tente outro navegador\n4. Faça logout e login novamente\n5. Se persiste, contate suporte: suporte@planocerto.com',
    category: 'troubleshooting',
    tags: ['erro', 'carregamento', 'debug'],
  },
  {
    id: '8',
    question: 'Como compartilho um plano publicamente?',
    answer:
      'Abra o plano e clique em "🔗 Compartilhar".\n\nO sistema gera um link único que pode ser:\n- Enviado por email/chat\n- Compartilhado em redes sociais\n- Acessado sem login (visualização apenas)\n\nPerfei para apresentar a stakeholders.',
    category: 'planos',
    tags: ['compartilhar', 'público', 'link'],
  },
];

export function HelpModal() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQItem['category'] | 'todos'>(
    'todos'
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories: Array<{ id: FAQItem['category'] | 'todos'; label: string; icon: string }> = [
    { id: 'todos', label: 'Tudo', icon: '📚' },
    { id: 'geral', label: 'Geral', icon: '❓' },
    { id: 'planos', label: 'Planos', icon: '📋' },
    { id: 'financeiro', label: 'Financeiro', icon: '💰' },
    { id: 'admin', label: 'Admin', icon: '⚙️' },
    { id: 'configuracoes', label: 'Config', icon: '🔧' },
    { id: 'troubleshooting', label: 'Debug', icon: '🔍' },
  ];

  const filtered = FAQ_ITEMS.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Botão flutuante */}
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Centro de Ajuda
            </DialogTitle>
            <DialogDescription>
              Encontre respostas rápidas para suas dúvidas sobre PlanoCerto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar perguntas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  {cat.icon} {cat.label}
                </Button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-3">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.question}</h4>
                        {expandedId === item.id && (
                          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                            {item.answer}
                          </p>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {expandedId === item.id ? '▼' : '▶'}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma pergunta encontrada</p>
                  <p className="text-xs mt-1">Tente outra busca ou categoria</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Não encontrou sua resposta?
              </p>
              <a href="/help" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Manual Completo
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
