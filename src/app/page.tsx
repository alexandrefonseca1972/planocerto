import Link from "next/link";
import { PlanocertoLogo } from "@/components/layout/planocerto-logo";
import { TrendingUp, Shield, Zap, Smartphone } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Crescimento",
    description: "Acompanhe seu progresso com métricas claras e objetivas.",
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Seus dados protegidos com a tecnologia Supabase.",
  },
  {
    icon: Zap,
    title: "Rápido",
    description: "Experiência fluida com Next.js e renderização otimizada.",
  },
  {
    icon: Smartphone,
    title: "Responsivo",
    description: "Acesse de qualquer dispositivo, a qualquer momento.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-700">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <PlanocertoLogo />
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              Entrar
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
            Seu plano financeiro
            <span className="block text-zinc-600 dark:text-zinc-300">
              mais simples e certo.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Organize suas finanças, acompanhe seus gastos e planeje o futuro com
            uma plataforma moderna, segura e fácil de usar.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/auth"
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-zinc-900 px-8 text-base font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Comece grátis
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-8 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white py-16 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Por que escolher o PlanoCerto?
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <feature.icon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-700">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} PlanoCerto. Todos os direitos
          reservados.
        </div>
      </footer>
    </div>
  );
}
