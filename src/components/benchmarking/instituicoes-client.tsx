"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Instituicao } from "@/types/competitor";

interface Props {
  initial: Instituicao[];
}

export function InstituicoesClient({ initial }: Props) {
  if (initial.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <Building2 className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Nenhuma instituição cadastrada
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Cadastre instituições concorrentes para comparar mensalidades.
          </p>
          <Link href="/benchmarking/nova" className="mt-4">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova Instituição
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {initial.length} instituiç{initial.length === 1 ? "ão" : "ões"}
        </span>
        <Link href="/benchmarking/nova">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Instituição
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {initial.map((inst) => (
          <Link key={inst.id} href={`/benchmarking/${inst.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {inst.nome}
                    </h3>
                    {inst.nome_fantasia && (
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {inst.nome_fantasia}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="muted"
                    className={cn(
                      "shrink-0 text-[10px]",
                      inst.tipo === "Publica" && "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
                      inst.tipo === "Privada" && "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                      inst.tipo === "Filantropica" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
                    )}
                  >
                    {inst.tipo}
                  </Badge>
                </div>

                {inst.grupo_economico && (
                  <p className="mt-1.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    Grupo: {inst.grupo_economico}
                  </p>
                )}

                {inst.site && (
                  <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-accent-600 hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    {inst.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                  <GraduationCap className="h-3 w-3" />
                  <span>Ver cursos e mensalidades</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
