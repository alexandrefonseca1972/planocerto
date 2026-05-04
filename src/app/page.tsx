import Link from "next/link";
import { PlanocertoLogo } from "@/components/layout/planocerto-logo";
import { ClipboardList, Building2, LayoutGrid, Bell, Shield, Users, ArrowRight, Target, CheckCircle2, TrendingUp } from "lucide-react";
import { HeroIllustration } from "@/components/layout/hero-illustration";

const features = [
  { icon: ClipboardList, title: "Planos 5W2H", desc: "Estruture ações com O Quê, Por Quê, Onde, Quem e Quando. Metodologia comprovada de gestão." },
  { icon: LayoutGrid, title: "Kanban Board", desc: "Visualize o progresso em colunas por status. Arraste ações entre estágios do ciclo." },
  { icon: Building2, title: "Multitenant", desc: "Gerencie múltiplas unidades em um só lugar. Cada empresa com seu plano, equipe e metas." },
  { icon: Bell, title: "Notificações", desc: "Alertas em tempo real no Microsoft Teams. Saiba quando ações são criadas ou concluídas." },
  { icon: Shield, title: "Controle de Acesso", desc: "Restrições de horário, permissões por usuário e conta ativa/inativa por empresa." },
  { icon: Users, title: "Times por Empresa", desc: "Associe usuários a empresas com papéis: owner, admin ou member. Tudo com RLS no Supabase." },
];

const highlights = [
  { value: "5W2H", label: "Metodologia" },
  { value: "Kanban", label: "Visualização" },
  { value: "Teams", label: "Integração" },
  { value: "RBAC", label: "Permissões" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <PlanocertoLogo />
          <div className="flex items-center gap-3">
            <Link href="/auth" className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">Entrar</Link>
            <Link href="/auth" className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-all hover:bg-zinc-800 hover:shadow-md dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">Criar conta</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-zinc-50 dark:from-blue-950/30 dark:to-zinc-950 pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="text-center lg:text-left">
                <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 lg:mx-0">
                  <Target className="h-3.5 w-3.5 text-blue-500" />
                  Plataforma de Planos de Ação 5W2H
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
                  Do planejamento à
                  <span className="block bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">execução com método.</span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-xl lg:mx-0 mx-auto">
                  Crie planos de ação estruturados, acompanhe o progresso em tempo real e integre
                  com o Microsoft Teams. Sua equipe alinhada em um único lugar.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 lg:justify-start justify-center">
                  {highlights.map(h => (
                    <span key={h.label} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {h.value}
                      <span className="text-zinc-400">·</span>
                      <span className="text-zinc-500">{h.label}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex items-center gap-4 lg:justify-start justify-center">
                  <Link href="/auth" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-8 text-base font-semibold text-zinc-50 transition-all hover:bg-zinc-800 hover:shadow-lg dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                    Comece agora <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/auth" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-8 text-base font-medium text-zinc-900 transition-all hover:bg-zinc-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">
                    Fazer login
                  </Link>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                <HeroIllustration className="w-full max-w-[500px]" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t border-zinc-200 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Tudo que você precisa para gerenciar planos
              </h2>
              <p className="mt-3 text-zinc-500 dark:text-zinc-400">
                Do cadastro da ação ao relatório executivo, o PlanoCerto cobre todo o ciclo.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="group rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-6 transition-all hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-md dark:border-zinc-700/60 dark:bg-zinc-800/20 dark:hover:border-blue-800 dark:hover:bg-blue-950/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ruphus Ecosystem */}
        <section className="border-t border-zinc-200 bg-zinc-50/50 py-16 dark:border-zinc-700 dark:bg-zinc-800/20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                <TrendingUp className="h-4 w-4 text-zinc-500" />
                Ecossistema Ruphus
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Parte do ecossistema do <span className="text-blue-600 dark:text-blue-400">ERP Ruphus</span>
              </h2>
              <p className="mt-3 text-zinc-500 dark:text-zinc-400 leading-relaxed">
                O PlanoCerto integra o ecossistema de produtos <strong className="text-zinc-700 dark:text-zinc-300">Ruphus</strong>, um ERP completo para
                gestão empresarial. Conecte seus planos de ação com os demais módulos do sistema
                para uma visão unificada do seu negócio.
              </p>
              <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
                Desenvolvido por <strong>Ruphus</strong> · Tecnologia <strong>Next.js</strong> + <strong>Supabase</strong>
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-zinc-200 py-16 dark:border-zinc-700">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Pronto para organizar seus planos?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-500 dark:text-zinc-400">
              Crie sua conta e comece a gerenciar planos de ação com metodologia 5W2H.
            </p>
            <Link href="/auth" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-8 text-base font-semibold text-zinc-50 transition-all hover:bg-zinc-800 hover:shadow-lg dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Criar minha conta <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
