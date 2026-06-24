"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { upsertInstituicao } from "@/app/actions/competitor";
import { formatCNPJ, isValidCNPJ } from "@/lib/format-br";
import { AlertCircle, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface UnitOption {
  id: string;
  name: string;
}

interface Props {
  units: UnitOption[];
  instituicao?: {
    id: string;
    nome: string;
    nome_fantasia: string;
    cnpj: string;
    tipo: string;
    grupo_economico: string;
    site: string;
    unit_id: string | null;
    observacoes: string;
    active: boolean;
  };
}

const initialState = { message: "" };

export function InstituicaoForm({ units, instituicao }: Props) {
  const router = useRouter();
  const isEditing = !!instituicao;
  const [state, formAction, isPending] = useActionState(
    upsertInstituicao,
    initialState,
  );

  // CNPJ com máscara progressiva e validação inline (campo opcional → só avisa).
  const [cnpj, setCnpj] = useState(instituicao?.cnpj ? formatCNPJ(instituicao.cnpj) : "");
  const cnpjInvalido = cnpj.trim().length > 0 && !isValidCNPJ(cnpj);

  if (state?.success) {
    router.push("/benchmarking");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isEditing ? "Editar Instituição" : "Nova Instituição"}</CardTitle>
          <Link href="/benchmarking">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {instituicao?.id && (
            <input type="hidden" name="id" value={instituicao.id} />
          )}
          <input type="hidden" name="active" value={instituicao ? String(instituicao.active) : "true"} />

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nome">
              Nome da Instituição <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              name="nome"
              required
              defaultValue={instituicao?.nome || ""}
              placeholder="Ex: Universidade Paulista"
            />
            {state?.errors?.nome && (
              <p className="text-[11px] text-red-600">{state.errors.nome[0]}</p>
            )}
          </div>

          {/* Nome Fantasia */}
          <div className="space-y-1.5">
            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
            <Input
              id="nome_fantasia"
              name="nome_fantasia"
              defaultValue={instituicao?.nome_fantasia || ""}
              placeholder="Ex: UNIP"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* CNPJ */}
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                name="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                inputMode="numeric"
                maxLength={18}
                placeholder="00.000.000/0000-00"
                aria-invalid={cnpjInvalido}
              />
              {cnpjInvalido && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  CNPJ incompleto ou inválido.
                </p>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                id="tipo"
                name="tipo"
                defaultValue={instituicao?.tipo || "Privada"}
              >
                <option value="Publica">Pública</option>
                <option value="Privada">Privada</option>
                <option value="Filantropica">Filantrópica</option>
              </Select>
            </div>
          </div>

          {/* Grupo Econômico */}
          <div className="space-y-1.5">
            <Label htmlFor="grupo_economico">Grupo Econômico</Label>
            <Input
              id="grupo_economico"
              name="grupo_economico"
              defaultValue={instituicao?.grupo_economico || ""}
              placeholder="Ex: Kroton, Grupo Ser Educacional"
            />
          </div>

          {/* Site */}
          <div className="space-y-1.5">
            <Label htmlFor="site">Site</Label>
            <Input
              id="site"
              name="site"
              type="url"
              defaultValue={instituicao?.site || ""}
              placeholder="https://www..."
            />
          </div>

          {/* Unidade/Campus */}
          <div className="space-y-1.5">
            <Label htmlFor="unit_id">Cidade/Campus</Label>
            <Select
              id="unit_id"
              name="unit_id"
              defaultValue={instituicao?.unit_id || ""}
            >
              <option value="">— Não informado —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              name="observacoes"
              defaultValue={instituicao?.observacoes || ""}
              placeholder="Anotações sobre a instituição"
            />
          </div>

          {/* Erro/sucesso */}
          {state?.message && !state.success && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              {state.message}
            </div>
          )}

          {state?.message && state.success && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <AlertCircle className="h-4 w-4" />
              {state.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <Link href="/benchmarking">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-1.5 h-4 w-4" />
              {isPending
                ? "Salvando..."
                : isEditing
                ? "Salvar Alterações"
                : "Criar Instituição"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
