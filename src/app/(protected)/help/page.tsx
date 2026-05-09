'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocsViewer } from '@/components/ui/docs-viewer';
import { DOCS_SECTIONS } from '@/lib/docs-sections';
import { HelpCircle, BookOpen, Mail, Phone, MessageCircle, ArrowRight } from 'lucide-react';

const QUICK_GUIDE_FEATURES = [
  {
    number: 1,
    title: 'Criar Plano',
    description: 'Clique em "Novo Plano" → Preencha os campos → Pronto!',
    icon: '📋',
  },
  {
    number: 2,
    title: 'Adicionar Itens',
    description: 'Use os 7 campos 5W2H para estruturar suas ações',
    icon: '✅',
  },
  {
    number: 3,
    title: 'Visualizações',
    description: 'Dashboard, Calendário e Relatórios automáticos',
    icon: '📊',
  },
  {
    number: 4,
    title: 'Financeiro',
    description: 'Controle contas a pagar e fornecedores',
    icon: '💰',
  },
  {
    number: 5,
    title: 'Compartilhar',
    description: 'Gere links públicos ou exporte para PDF/Excel',
    icon: '🔗',
  },
  {
    number: 6,
    title: 'Multi-empresa',
    description: 'Mude entre empresas com um clique',
    icon: '🏢',
  },
];

const TOPIC_CARDS = [
  {
    icon: '📋',
    title: 'Planos 5W2H',
    description: 'Aprenda a criar e gerenciar planos usando a metodologia 5W2H',
    features: [
      'Estrutura de um plano',
      'Criação de itens de ação',
      'Metodologia 5W2H',
      'Exportação de planos',
    ],
  },
  {
    icon: '💰',
    title: 'Gestão Financeira',
    description: 'Controle suas contas a pagar e geradores financeiros',
    features: [
      'Contas a pagar',
      'Fornecedores',
      'Categorias de despesa',
      'Registrar pagamentos',
    ],
  },
  {
    icon: '⚙️',
    title: 'Administração',
    description: 'Painel administrativo para gerenciar usuários e catálogos',
    features: [
      'Gerenciar usuários',
      'Atribuir papéis',
      'Catálogos centralizados',
      'Auditoria e segurança',
    ],
  },
  {
    icon: '🔍',
    title: 'Resolução de Problemas',
    description: 'Encontre soluções para problemas comuns',
    features: [
      'Problemas de carregamento',
      'Autenticação',
      'Sincronização de dados',
      'Suporte',
    ],
  },
];

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState('quick');

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <HelpCircle className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Centro de Ajuda PlanoCerto</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Encontre respostas para suas dúvidas e aprenda a usar toda a potência da plataforma
        </p>
      </section>

      {/* Quick Access Cards */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Acesso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Manual Completo</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Navegue por toda a documentação da plataforma
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <HelpCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Perguntas Frequentes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Respostas rápidas para as dúvidas mais comuns
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Entrar em Contato</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Fale com nossa equipe de suporte
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabbed Content */}
      <section>
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">⚡ Guia Rápido</TabsTrigger>
            <TabsTrigger value="topics">📚 Por Tópico</TabsTrigger>
            <TabsTrigger value="videos">🎥 Vídeos</TabsTrigger>
          </TabsList>

          {/* Quick Guide Tab */}
          <TabsContent value="quick" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {QUICK_GUIDE_FEATURES.map((feature) => (
                <Card key={feature.number} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm mb-2">
                          {feature.number}
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
                      Saiba mais <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TOPIC_CARDS.map((topic) => (
                <Card key={topic.title} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{topic.icon}</span>
                      <div>
                        <CardTitle>{topic.title}</CardTitle>
                        <CardDescription className="mt-1">{topic.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {topic.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo em Vídeo</CardTitle>
                <CardDescription>
                  Assista a tutoriais passo a passo sobre como usar a plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  🎬 Conteúdo de vídeo em breve
                </p>
                <p className="text-sm text-muted-foreground">
                  Estamos preparando tutoriais em vídeo para ajudar você a aproveitar melhor o PlanoCerto.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Documentation Viewer */}
      <section className="bg-muted/30 -mx-4 -mb-6 px-4 py-8 lg:-mx-8 lg:px-8">
        <h2 className="text-2xl font-bold mb-6">Documentação Completa</h2>
        <DocsViewer sections={DOCS_SECTIONS} defaultSection="getting-started" />
      </section>

      {/* Contact Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Entre em Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Mail className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Envie suas dúvidas por email
              </p>
              <a href="mailto:suporte@planocerto.com" className="text-primary font-medium text-sm hover:underline">
                suporte@planocerto.com
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Phone className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Telefone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Suporte disponível de seg-sex, 9:00-17:00
              </p>
              <a href="tel:+551199999999" className="text-primary font-medium text-sm hover:underline">
                (11) 99999-9999
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <MessageCircle className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Chat ao vivo com nossa equipe
              </p>
              <Button size="sm" className="w-full">
                Iniciar Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <section className="border-t pt-6 text-center text-sm text-muted-foreground">
        <p>
          PlanoCerto versão 2.0 • Desenvolvido por{' '}
          <span className="font-medium">Ruphus Tecnologia</span>
        </p>
        <p className="mt-2">
          Não encontrou a resposta? Entre em contato com nosso suporte
        </p>
      </section>
    </div>
  );
}
