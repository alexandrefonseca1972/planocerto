"use client";

import { useState } from "react";
import { X, Save, Sparkles, Globe, Users, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateUnitRegionalContext } from "@/app/actions/unidades";
import type { Unit, CatalogFormState } from "@/types/catalog";
import { sanitize } from "@/lib/sanitize";

interface RegionalContextFormProps {
  unit: Unit;
  onClose: () => void;
  onSuccess: (updated: Unit) => void;
}

export function RegionalContextForm({
  unit,
  onClose,
  onSuccess,
}: RegionalContextFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<NonNullable<Unit["regional_context"]>>(
    unit.regional_context || {
      perfil_persona: "",
      regionalidade: "",
      eventos_locais: "",
      concorrentes: "",
    }
  );

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateUnitRegionalContext(unit.id, ctx);
      if (res.success) {
        onSuccess({ ...unit, regional_context: ctx });
      } else {
        setError(res.message || "Erro ao salvar.");
      }
    } catch (e) {
      setError("Erro de rede ou permissão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-[slideUp_200ms_ease-out]">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent-50 p-2 text-accent-600 dark:bg-accent-950/40 dark:text-accent-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Inteligência Regional</h3>
              <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Unidade: {unit.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Estes metadados alimentam o motor de IA para gerar sugestões de planos de ação ultra-contextualizados para esta região.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 tracking-widest">
                <Users className="h-3.5 w-3.5" /> Perfil da Persona
              </Label>
              <textarea
                value={ctx.perfil_persona}
                onChange={(e) => setCtx({ ...ctx, perfil_persona: sanitize(e.target.value) })}
                placeholder="Ex: Alunos de classe C, focados em cursos noturnos, buscam inserção rápida no mercado."
                className="w-full h-24 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm focus:ring-2 focus:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-800/50 resize-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 tracking-widest">
                <Globe className="h-3.5 w-3.5" /> Regionalidade / Cultura
              </Label>
              <textarea
                value={ctx.regionalidade}
                onChange={(e) => setCtx({ ...ctx, regionalidade: sanitize(e.target.value) })}
                placeholder="Ex: Valorizam tradições locais, forte influência do Círio, resistência a vendas agressivas."
                className="w-full h-24 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm focus:ring-2 focus:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-800/50 resize-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 tracking-widest">
                <Calendar className="h-3.5 w-3.5" /> Eventos & Calendário Local
              </Label>
              <textarea
                value={ctx.eventos_locais}
                onChange={(e) => setCtx({ ...ctx, eventos_locais: sanitize(e.target.value) })}
                placeholder="Ex: Feriado municipal em 15/08, Expo-Agro em Outubro (grande fluxo no centro)."
                className="w-full h-24 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm focus:ring-2 focus:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-800/50 resize-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 tracking-widest">
                <Trophy className="h-3.5 w-3.5" /> Concorrência & Mercado
              </Label>
              <textarea
                value={ctx.concorrentes}
                onChange={(e) => setCtx({ ...ctx, concorrentes: sanitize(e.target.value) })}
                placeholder="Ex: Presença forte de EAD do concorrente X, mercado de saúde está saturado na região."
                className="w-full h-24 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm focus:ring-2 focus:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-800/50 resize-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 bg-zinc-50/50 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800/30 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={loading} disabled={loading} className="rounded-xl shadow-md">
            <Save className="h-4 w-4 mr-2" /> Salvar Contexto
          </Button>
        </div>
      </div>
    </div>
  );
}
