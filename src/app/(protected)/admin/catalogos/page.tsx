import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  ListChecks,
  MapPin,
  Building,
  Sparkles,
  Radio,
  AlertTriangle,
  GraduationCap,
  Building2,
  Calculator,
  Truck,
  Tag,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = { title: "Catálogos — PlanoCerto" };

interface CatalogCard {
  href: string;
  label: string;
  description: string;
  icon: typeof ListChecks;
  status: "ready" | "soon";
}

// Catálogos de domínio (listas usadas como dropdowns no sistema)
const dictionaries: CatalogCard[] = [
  {
    href: "/admin/catalogos/tipos-pa",
    label: "Tipos PA",
    description: "Graduação, Pós, Técnico, High School…",
    icon: ListChecks,
    status: "ready",
  },
  {
    href: "/admin/catalogos/areas",
    label: "Áreas",
    description: "Pará-Amapá, Amazônia, Cerrado, Sul.",
    icon: MapPin,
    status: "ready",
  },
  {
    href: "/admin/catalogos/unidades",
    label: "Unidades",
    description: "Belém, Manaus, Brasília…",
    icon: Building,
    status: "ready",
  },
  {
    href: "/admin/catalogos/macro-acoes",
    label: "Macro Ações",
    description: "Eventos, ENEM, Marketplace, Trade…",
    icon: Sparkles,
    status: "ready",
  },
  {
    href: "/admin/catalogos/prioridades",
    label: "Prioridades",
    description: "Alta, Média, Baixa.",
    icon: AlertTriangle,
    status: "ready",
  },
  {
    href: "/admin/catalogos/fornecedores",
    label: "Fornecedores",
    description: "Cadastro de fornecedores e contatos.",
    icon: Truck,
    status: "ready",
  },
  {
    href: "/admin/catalogos/categorias-despesa",
    label: "Categorias de despesa",
    description: "Marketing, Folha, Aluguel, Insumos…",
    icon: Tag,
    status: "ready",
  },
  {
    href: "/admin/catalogos/canais",
    label: "Canais",
    description: "Canais do funil de captação.",
    icon: Radio,
    status: "soon",
  },
];

// Cadastros operacionais (carteiras e simulador)
const registries: CatalogCard[] = [
  {
    href: "/escolas",
    label: "Escolas",
    description: "Carteira de escolas parceiras e prospects.",
    icon: GraduationCap,
    status: "ready",
  },
  {
    href: "/empresas",
    label: "Empresas",
    description: "Carteira B2B de empresas para prospecção.",
    icon: Building2,
    status: "ready",
  },
  {
    href: "/simulador",
    label: "Simulador de Metas",
    description: "Cenários por canal — funil IN → MF → MA.",
    icon: Calculator,
    status: "ready",
  },
];

function renderCard(c: CatalogCard) {
  const inner = (
    <CardContent className="flex items-start gap-3 p-4">
      <div className="rounded-md bg-accent-50 p-2 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300">
        <c.icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{c.label}</h3>
          {c.status === "soon" && (
            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:border-zinc-700">
              em breve
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{c.description}</p>
      </div>
    </CardContent>
  );
  if (c.status === "ready") {
    return (
      <Link key={c.href} href={c.href} className="block">
        <Card className="transition-all hover:border-accent-400 hover:bg-accent-50/30 hover:shadow-sm dark:hover:bg-accent-950/20">
          {inner}
        </Card>
      </Link>
    );
  }
  return (
    <Card key={c.href} className="opacity-60">
      {inner}
    </Card>
  );
}

export default function CatalogosPage() {
  return (
    <div className="space-y-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/users">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Catálogos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h2 className="text-lg font-semibold">Catálogos</h2>
        <p className="text-sm text-zinc-500">
          Listas, dicionários de domínio e cadastros operacionais.
        </p>
      </div>

      {/* Cadastros operacionais (carteiras + simulador) */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Cadastros operacionais
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {registries.map(renderCard)}
        </div>
      </section>

      {/* Dicionários de domínio */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Dicionários de domínio
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dictionaries.map(renderCard)}
        </div>
      </section>
    </div>
  );
}
