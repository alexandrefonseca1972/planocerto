"use client";

import { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format-br";
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Users,
  DollarSign,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  UserCheck,
  Save,
} from "lucide-react";
import {
  deleteInstituicao,
  upsertCursoInstituicao,
  deleteCursoInstituicao,
  upsertCorpoDocente,
  deleteCorpoDocente,
  upsertMensalidade,
  deleteMensalidade,
} from "@/app/actions/competitor";
import type {
  Instituicao,
  CursoInstituicao,
  CorpoDocente,
  MensalidadeConcorrente,
  Modalidade,
  CursoSuperior,
  Turno,
  TipoPa,
} from "@/types/competitor";

interface FullCurso extends CursoInstituicao {
  docentes: CorpoDocente[];
  mensalidades: MensalidadeConcorrente[];
}

interface Detail {
  cursos: FullCurso[];
  modalidades: Modalidade[];
  cursosSuperiores: CursoSuperior[];
  turnos: Turno[];
  tiposPa: TipoPa[];
}

interface UnitOption {
  id: string;
  name: string;
}

interface Props {
  instituicao: Instituicao;
  detail: Detail;
  units: UnitOption[];
}

function getTipoBadgeClass(tipo: string) {
  return cn(
    "text-[10px]",
    tipo === "Publica" && "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    tipo === "Privada" && "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    tipo === "Filantropica" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  );
}

export function InstituicaoDetailClient({ instituicao, detail, units }: Props) {
  const router = useRouter();
  const [showCursoForm, setShowCursoForm] = useState(false);
  const [showDocenteFormFor, setShowDocenteFormFor] = useState<string | null>(null);
  const [editingDocenteId, setEditingDocenteId] = useState<string | null>(null);
  const [showMensalidadeFormFor, setShowMensalidadeFormFor] = useState<string | null>(null);
  const [editingMensalidadeId, setEditingMensalidadeId] = useState<string | null>(null);
  const [deleteState, deleteAction] = useActionState(deleteInstituicao, { message: "" });

  useEffect(() => {
    if (deleteState?.success) router.push("/benchmarking");
  }, [deleteState?.success, router]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/benchmarking"
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            <Building2 className="h-6 w-6 text-accent-600" />
            {instituicao.nome}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="muted" className={getTipoBadgeClass(instituicao.tipo)}>
              {instituicao.tipo}
            </Badge>
            {instituicao.nome_fantasia && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {instituicao.nome_fantasia}
              </span>
            )}
            {instituicao.grupo_economico && (
              <Badge variant="muted" className="text-[10px]">
                {instituicao.grupo_economico}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/benchmarking/${instituicao.id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Editar
            </Button>
          </Link>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={instituicao.id} />
            <Button variant="outline" size="sm" type="submit" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Excluir
            </Button>
          </form>
        </div>
      </div>

      {/* Info card */}
      {instituicao.site && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-1 p-3 text-sm">
            <a
              href={instituicao.site.startsWith("http") ? instituicao.site : `https://${instituicao.site}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-accent-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {instituicao.site}
            </a>
            {instituicao.cnpj && (
              <span className="text-zinc-500 dark:text-zinc-400">
                CNPJ: {instituicao.cnpj}
              </span>
            )}
            {instituicao.observacoes && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {instituicao.observacoes}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Courses section */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <GraduationCap className="h-5 w-5" />
          Cursos ({detail.cursos.length})
        </h2>
        <Button size="sm" onClick={() => { setShowCursoForm(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Adicionar Curso
        </Button>
      </div>

      {detail.cursos.length === 0 && !showCursoForm && (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <GraduationCap className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhum curso cadastrado para esta instituição.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Curso form modal */}
      {showCursoForm && (
        <CursoFormPanel
          instituicaoId={instituicao.id}
          cursosSuperiores={detail.cursosSuperiores}
          tiposPa={detail.tiposPa}
          units={units}
          onClose={() => setShowCursoForm(false)}
        />
      )}

      {/* Course list */}
      <div className="space-y-3">
        {detail.cursos.map((curso: FullCurso) => (
          <CursoCard
            key={curso.id}
            curso={curso}
            cursosSuperiores={detail.cursosSuperiores}
            tiposPa={detail.tiposPa}
            modalidades={detail.modalidades}
            turnos={detail.turnos}
            units={units}
            showDocenteForm={showDocenteFormFor === curso.id}
            editingDocenteId={editingDocenteId}
            showMensalidadeForm={showMensalidadeFormFor === curso.id}
            editingMensalidadeId={editingMensalidadeId}
            onToggleDocenteForm={() => {
              setShowDocenteFormFor(showDocenteFormFor === curso.id ? null : curso.id);
              setEditingDocenteId(null);
            }}
            onEditDocente={(id: string) => {
              setShowDocenteFormFor(curso.id);
              setEditingDocenteId(id);
            }}
            onToggleMensalidadeForm={() => {
              setShowMensalidadeFormFor(showMensalidadeFormFor === curso.id ? null : curso.id);
              setEditingMensalidadeId(null);
            }}
            onEditMensalidade={(id: string) => {
              setShowMensalidadeFormFor(curso.id);
              setEditingMensalidadeId(id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Curso Card ──────────────────────────────────────────────────────────────

function CursoCard({
  curso,
  cursosSuperiores,
  tiposPa,
  modalidades,
  turnos,
  units,
  showDocenteForm,
  editingDocenteId,
  showMensalidadeForm,
  editingMensalidadeId,
  onToggleDocenteForm,
  onEditDocente,
  onToggleMensalidadeForm,
  onEditMensalidade,
}: {
  curso: FullCurso;
  cursosSuperiores: CursoSuperior[];
  tiposPa: TipoPa[];
  modalidades: Modalidade[];
  turnos: Turno[];
  units: UnitOption[];
  showDocenteForm: boolean;
  editingDocenteId: string | null;
  showMensalidadeForm: boolean;
  editingMensalidadeId: string | null;
  onToggleDocenteForm: () => void;
  onEditDocente: (id: string) => void;
  onToggleMensalidadeForm: () => void;
  onEditMensalidade: (id: string) => void;
}) {
  const cursoName = cursosSuperiores.find((c) => c.id === curso.curso_id)?.name || "—";
  const tipoPaName = tiposPa.find((t) => t.id === curso.tipo_pa_id)?.name;
  const unitName = units.find((u) => u.id === curso.unit_id)?.name;
  const deleteCursoAction = async (formData: FormData) => {
    await deleteCursoInstituicao({ message: "" }, formData);
  };
  const deleteMensalidadeAction = async (formData: FormData) => {
    await deleteMensalidade({ message: "" }, formData);
  };
  const deleteDocenteAction = async (formData: FormData) => {
    await deleteCorpoDocente({ message: "" }, formData);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{cursoName}</CardTitle>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
              {tipoPaName && <span>{tipoPaName}</span>}
              {unitName && <span>{unitName}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <form action={deleteCursoAction}>
              <input type="hidden" name="id" value={curso.id} />
              <Button variant="ghost" size="sm" type="submit" className="h-7 text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Coordinator info */}
        {curso.coordenador_nome && (
          <div className="flex items-start gap-2 rounded-md bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
            <UserCheck className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div className="text-xs">
              <p className="font-medium">Coordenador: {curso.coordenador_nome}</p>
              {curso.coordenador_email && <p className="text-zinc-500">{curso.coordenador_email}</p>}
              {curso.coordenador_telefone && <p className="text-zinc-500">{curso.coordenador_telefone}</p>}
              {curso.coordenador_lattes && (
                <a href={curso.coordenador_lattes} target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">
                  Currículo Lattes
                </a>
              )}
            </div>
          </div>
        )}

        {/* Mensalidades */}
        <div>
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <DollarSign className="h-3.5 w-3.5" />
              Mensalidades ({curso.mensalidades.length})
            </h4>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggleMensalidadeForm}>
              <Plus className="mr-1 h-3 w-3" />
              Adicionar
            </Button>
          </div>

          {showMensalidadeForm && (
            <MensalidadeFormPanel
              key={editingMensalidadeId || "nova-mensalidade"}
              cursoInstituicaoId={curso.id}
              modalidades={modalidades}
              turnos={turnos}
              editId={editingMensalidadeId}
              initial={curso.mensalidades.find((m) => m.id === editingMensalidadeId)}
              onClose={() => { onToggleMensalidadeForm(); }}
            />
          )}

          {curso.mensalidades.length > 0 && (
            <div className="mt-2 divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
              {curso.mensalidades.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">{formatBRL(m.valor)}</span>
                    <span className="text-zinc-500">
                      {modalidades.find((mod) => mod.id === m.modalidade_id)?.name || "—"}
                    </span>
                    <span className="text-zinc-400">
                      {turnos.find((t) => t.id === m.turno_id)?.name || "—"}
                    </span>
                    {m.desconto && (
                      <Badge variant="muted" className="text-[9px]">{m.desconto}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400">
                      Coletado: {m.data_coleta ? new Date(m.data_coleta + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => onEditMensalidade(m.id)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <form action={deleteMensalidadeAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-600" type="submit">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Corpo Docente */}
        <div>
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Users className="h-3.5 w-3.5" />
              Corpo Docente ({curso.docentes.length})
            </h4>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggleDocenteForm}>
              <Plus className="mr-1 h-3 w-3" />
              Adicionar
            </Button>
          </div>

          {showDocenteForm && (
            <DocenteFormPanel
              key={editingDocenteId || "novo-docente"}
              cursoInstituicaoId={curso.id}
              editId={editingDocenteId}
              initial={curso.docentes.find((d) => d.id === editingDocenteId)}
              onClose={() => { onToggleDocenteForm(); }}
            />
          )}

          {curso.docentes.length > 0 && (
            <div className="mt-2 divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
              {curso.docentes.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{d.nome}</p>
                    <p className="text-zinc-500">
                      {[d.titulacao, d.disciplina, d.regime].filter(Boolean).join(" · ")}
                    </p>
                    {d.lattes_url && (
                      <a href={d.lattes_url} target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">
                        Lattes
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => onEditDocente(d.id)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <form action={deleteDocenteAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-600" type="submit">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Curso Form Panel ────────────────────────────────────────────────────────

function CursoFormPanel({
  instituicaoId,
  cursosSuperiores,
  tiposPa,
  units,
  onClose,
}: {
  instituicaoId: string;
  cursosSuperiores: CursoSuperior[];
  tiposPa: TipoPa[];
  units: UnitOption[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(upsertCursoInstituicao, { message: "" });

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  return (
    <Card className="border-accent-200 dark:border-accent-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Adicionar Curso</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="instituicao_id" value={instituicaoId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Curso *</Label>
              <Select name="curso_id" required>
                <option value="">Selecione...</option>
                {cursosSuperiores.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Tipo *</Label>
              <Select name="tipo_pa_id" required defaultValue="">
                <option value="">Selecione...</option>
                {tiposPa.filter(t => t.active).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">Campus</Label>
            <Select name="unit_id">
              <option value="">— Igual à instituição —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">Coordenador</Label>
            <Input name="coordenador_nome" placeholder="Nome do coordenador" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="coordenador_email" placeholder="Email" />
            <Input name="coordenador_telefone" placeholder="Telefone" />
          </div>
          <div className="space-y-1">
            <Input name="coordenador_lattes" placeholder="URL Lattes" />
          </div>

          {state?.message && !state.success && (
            <p className="text-[11px] text-red-600">{state.message}</p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending}>
              <Save className="mr-1 h-3.5 w-3.5" />
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Docente Form Panel ──────────────────────────────────────────────────────

function DocenteFormPanel({
  cursoInstituicaoId,
  editId,
  initial,
  onClose,
}: {
  cursoInstituicaoId: string;
  editId: string | null;
  initial?: CorpoDocente;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(upsertCorpoDocente, { message: "" });

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  return (
    <Card className="border-accent-200 dark:border-accent-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{editId ? "Editar Professor" : "Adicionar Professor"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="curso_instituicao_id" value={cursoInstituicaoId} />
          {editId && <input type="hidden" name="id" value={editId} />}

          <div className="space-y-1">
            <Label className="text-[11px]">Nome *</Label>
            <Input name="nome" required defaultValue={initial?.nome || ""} placeholder="Nome do professor" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Titulação</Label>
              <Input name="titulacao" defaultValue={initial?.titulacao || ""} placeholder="Doutor, Mestre..." />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Regime</Label>
              <Input name="regime" defaultValue={initial?.regime || ""} placeholder="Integral, Parcial..." />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">Disciplina</Label>
            <Input name="disciplina" defaultValue={initial?.disciplina || ""} placeholder="O que leciona" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Email</Label>
              <Input name="email" type="email" defaultValue={initial?.email || ""} placeholder="email@..." />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Lattes URL</Label>
              <Input name="lattes_url" defaultValue={initial?.lattes_url || ""} placeholder="http://lattes.cnpq.br/..." />
            </div>
          </div>

          {state?.message && !state.success && (
            <p className="text-[11px] text-red-600">{state.message}</p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending}>
              <Save className="mr-1 h-3.5 w-3.5" />
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Mensalidade Form Panel ──────────────────────────────────────────────────

function MensalidadeFormPanel({
  cursoInstituicaoId,
  modalidades,
  turnos,
  editId,
  initial,
  onClose,
}: {
  cursoInstituicaoId: string;
  modalidades: Modalidade[];
  turnos: Turno[];
  editId: string | null;
  initial?: MensalidadeConcorrente;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(upsertMensalidade, { message: "" });

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  return (
    <Card className="border-accent-200 dark:border-accent-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{editId ? "Editar Mensalidade" : "Registrar Mensalidade"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="curso_instituicao_id" value={cursoInstituicaoId} />
          {editId && <input type="hidden" name="id" value={editId} />}

          <div className="space-y-1">
            <Label className="text-[11px]">Valor (R$) *</Label>
            <Input
              name="valor"
              required
              type="text"
              inputMode="decimal"
              defaultValue={initial ? String(initial.valor).replace(".", ",") : ""}
              placeholder="0,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Modalidade *</Label>
              <Select name="modalidade_id" required defaultValue={initial?.modalidade_id || ""}>
                <option value="">Selecione...</option>
                {modalidades.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Turno *</Label>
              <Select name="turno_id" required defaultValue={initial?.turno_id || ""}>
                <option value="">Selecione...</option>
                {turnos.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Período</Label>
              <Select name="periodo" defaultValue={initial?.periodo || "mensal"}>
                <option value="mensal">Mensal</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Desconto/Bolsa</Label>
              <Input name="desconto" defaultValue={initial?.desconto || ""} placeholder="Ex: 30% pontualidade" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Vigência Início *</Label>
              <Input name="vigencia_inicio" type="date" required defaultValue={initial?.vigencia_inicio || ""} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Vigência Fim</Label>
              <Input name="vigencia_fim" type="date" defaultValue={initial?.vigencia_fim || ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Data da Coleta</Label>
              <Input name="data_coleta" type="date" defaultValue={initial?.data_coleta || ""} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Fonte</Label>
              <Input name="fonte" defaultValue={initial?.fonte || ""} placeholder="Site, edital, visita..." />
            </div>
          </div>

          {state?.message && !state.success && (
            <p className="text-[11px] text-red-600">{state.message}</p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending}>
              <Save className="mr-1 h-3.5 w-3.5" />
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
