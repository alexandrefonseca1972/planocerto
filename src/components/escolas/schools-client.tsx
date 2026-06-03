"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/contexts/tenant-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSchools, upsertSchool, deleteSchool, assignSchoolsToUnit } from "@/app/actions/schools";
import { SortableTh, TablePagination, useDataTable } from "@/components/ui/data-table";
import type { School, SchoolFormState } from "@/types/school";
import type { Unit } from "@/types/catalog";
import { Plus, Pencil, Trash2, X, Save, Search, GraduationCap, Building2, Link2, Unlink } from "lucide-react";

type SchoolSortKey =
  | "idx"
  | "nome"
  | "municipio"
  | "diretor"
  | "prioridade"
  | "meta_inscritos"
  | "inscritos_real"
  | "meta_academica"
  | "academica_real";

const init: SchoolFormState = { message: undefined, errors: {} };

const PRIORIDADE_BADGES: Record<string, string> = {
  Alta: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  Media: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  Baixa: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-950/30 dark:text-zinc-400 dark:border-zinc-800",
};

export function SchoolsClient({ units }: { units: Unit[] }) {
  const { currentTenant } = useTenant();
  const router = useRouter();
  const { toast } = useToast();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUnitId, setBulkUnitId] = useState<string>("");
  const [editing, setEditing] = useState<School | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isAssigning, startAssign] = useTransition();

  const unitMap = useMemo(() => new Map(units.map((u) => [u.id, u.name])), [units]);

  const [upsertState, upsertAction, isSaving] = useActionState(upsertSchool, init);
  const [, deleteAction, isDeleting] = useActionState(deleteSchool, init);

  useEffect(() => {
    if (!currentTenant?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getSchools(currentTenant.id);
      if (!cancelled) {
        setSchools(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTenant]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (upsertState.success) {
      toast(upsertState.message || "Salvo!");
      setShowForm(false);
      setEditing(null);
      router.refresh();
      if (currentTenant?.id) getSchools(currentTenant.id).then(setSchools);
    } else if (upsertState.message && !upsertState.success) {
      toast(upsertState.message, "error");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upsertState]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      if (unitFilter === "__none__" && s.unit_id) return false;
      if (unitFilter && unitFilter !== "__none__" && s.unit_id !== unitFilter) return false;
      if (!q) return true;
      return (
        s.nome.toLowerCase().includes(q) ||
        s.municipio.toLowerCase().includes(q) ||
        s.diretor.toLowerCase().includes(q)
      );
    });
  }, [search, schools, unitFilter]);

  const PRIORIDADE_RANK = { Alta: 0, Media: 1, Baixa: 2 } as const;

  const table = useDataTable<School, SchoolSortKey>(filtered, {
    initialSort: "nome",
    initialAsc: true,
    initialPageSize: 20,
    sortAccessor: (s, key) => {
      switch (key) {
        case "nome":
          return s.nome;
        case "municipio":
          return `${s.municipio || ""} ${s.uf || ""}`;
        case "diretor":
          return s.diretor || "";
        case "prioridade":
          return PRIORIDADE_RANK[s.prioridade] ?? 99;
        case "meta_inscritos":
          return s.meta_inscritos || 0;
        case "inscritos_real":
          return s.inscritos_real || 0;
        case "meta_academica":
          return s.meta_academica || 0;
        case "academica_real":
          return s.academica_real || 0;
        default:
          return 0;
      }
    },
  });

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(school: School) {
    setEditing(school);
    setShowForm(true);
  }

  async function handleDelete(school: School) {
    if (!confirm(`Excluir escola "${school.nome}"?`)) return;
    const fd = new FormData();
    fd.set("schoolId", school.id);
    deleteAction(fd);
    setSchools((prev) => prev.filter((s) => s.id !== school.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(school.id);
      return next;
    });
    toast("Escola excluída.");
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (filtered.every((s) => next.has(s.id))) {
        filtered.forEach((s) => next.delete(s.id));
      } else {
        filtered.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }

  function handleAssign(unitId: string | null) {
    const ids = [...selectedIds];
    if (!ids.length) return;
    startAssign(async () => {
      const res = await assignSchoolsToUnit(ids, unitId);
      if (res.success) {
        toast(res.message);
        setSelectedIds(new Set());
        setBulkUnitId("");
        if (currentTenant?.id) getSchools(currentTenant.id).then(setSchools);
      } else {
        toast(res.message, "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <GraduationCap className="h-6 w-6" /> Carteira de Escolas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {schools.length} {schools.length === 1 ? "escola" : "escolas"}
            {currentTenant ? ` em ${currentTenant.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={unitFilter}
            onChange={(e) => {
              setUnitFilter(e.target.value);
              setSelectedIds(new Set());
            }}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Todas as unidades</option>
            <option value="__none__">Sem unidade</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova Escola
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-200 bg-accent-50/60 px-4 py-2.5 dark:border-accent-800 dark:bg-accent-950/20">
          <span className="text-sm font-medium">
            {selectedIds.size} selecionada{selectedIds.size === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <select
              value={bulkUnitId}
              onChange={(e) => setBulkUnitId(e.target.value)}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Selecione a unidade…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={() => handleAssign(bulkUnitId)}
              disabled={!bulkUnitId || isAssigning}
              isLoading={isAssigning}
            >
              <Link2 className="h-4 w-4" /> Associar
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAssign(null)}
            disabled={isAssigning}
          >
            <Unlink className="h-4 w-4" /> Remover da unidade
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto"
          >
            Limpar seleção
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            Nenhuma escola cadastrada{search ? " com esse filtro" : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr className="text-left">
                  <th className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      aria-label="Selecionar todas"
                      className="h-4 w-4 align-middle"
                    />
                  </th>
                  <th className="px-3 py-2 w-12 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">#</th>
                  <SortableTh<SchoolSortKey>
                    label="Escola"
                    sortKey="nome"
                    activeKey={table.sortKey}
                    asc={table.asc}
                    onSort={table.handleSort}
                  />
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Unidade</th>
                  <SortableTh<SchoolSortKey>
                    label="Município/UF"
                    sortKey="municipio"
                    activeKey={table.sortKey}
                    asc={table.asc}
                    onSort={table.handleSort}
                  />
                  <SortableTh<SchoolSortKey>
                    label="Diretor"
                    sortKey="diretor"
                    activeKey={table.sortKey}
                    asc={table.asc}
                    onSort={table.handleSort}
                  />
                  <SortableTh<SchoolSortKey>
                    label="Prioridade"
                    sortKey="prioridade"
                    activeKey={table.sortKey}
                    asc={table.asc}
                    onSort={table.handleSort}
                  />
                  <SortableTh<SchoolSortKey>
                    label="Meta IN"
                    sortKey="meta_inscritos"
                    activeKey={table.sortKey}
                    asc={table.asc}
                    onSort={table.handleSort}
                    align="right"
                  />
                  <SortableTh<SchoolSortKey>
                    label="Real IN"
                    sortKey="inscritos_real"
                    activeKey={table.sortKey}
                    asc={table.asc}
                    onSort={table.handleSort}
                    align="right"
                  />
                  <SortableTh<SchoolSortKey>
                    label="Meta MA"
                    sortKey="meta_academica"
                    activeKey={table.sortKey}
                    asc={table.asc}
                    onSort={table.handleSort}
                    align="right"
                  />
                  <SortableTh<SchoolSortKey>
                    label="Real MA"
                    sortKey="academica_real"
                    activeKey={table.sortKey}
                    asc={table.asc}
                    onSort={table.handleSort}
                    align="right"
                  />
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {table.pageItems.map((s, i) => (
                  <tr key={s.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${selectedIds.has(s.id) ? "bg-accent-50/40 dark:bg-accent-950/10" : ""}`}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        aria-label={`Selecionar ${s.nome}`}
                        className="h-4 w-4 align-middle"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] tabular-nums text-zinc-400">
                      {table.offset + i + 1}
                    </td>
                  <td className="px-3 py-2 font-medium">
                    {s.nome}
                    {s.conveniado && (
                      <span className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Conveniada
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {s.unit_id ? (unitMap.get(s.unit_id) || "—") : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {[s.municipio, s.uf].filter(Boolean).join("/") || "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{s.diretor || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        PRIORIDADE_BADGES[s.prioridade] || ""
                      }`}
                    >
                      {s.prioridade}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.meta_inscritos}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.inscritos_real}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.meta_academica}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.academica_real}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(s)}
                        disabled={isDeleting}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={table.page}
            totalPages={table.totalPages}
            pageSize={table.pageSize}
            totalItems={table.totalItems}
            offset={table.offset}
            onPage={table.setPage}
            onPageSize={table.setPageSize}
          />
        </div>
      )}

      {showForm && currentTenant && (
        <SchoolForm
          school={editing}
          tenantId={currentTenant.id}
          units={units}
          action={upsertAction}
          state={upsertState}
          isSaving={isSaving}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function SchoolForm({
  school,
  tenantId,
  units,
  action,
  state,
  isSaving,
  onClose,
}: {
  school: School | null;
  tenantId: string;
  units: Unit[];
  action: (formData: FormData) => void;
  state: SchoolFormState;
  isSaving: boolean;
  onClose: () => void;
}) {
  const e = state.errors || {};
  const v = (k: keyof School, fallback: string | number | boolean = "") =>
    school ? (school as unknown as Record<string, unknown>)[k] ?? fallback : fallback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">{school ? "Editar escola" : "Nova escola"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form action={action} className="space-y-4 p-6">
          <input type="hidden" name="tenantId" value={tenantId} />
          {school && <input type="hidden" name="schoolId" value={school.id} />}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Nome da Escola*" error={e.nome?.[0]}>
              <Input name="nome" defaultValue={String(v("nome"))} required />
            </Field>
            <Field label="Tipo de Escola">
              <Input name="tipo_escola" defaultValue={String(v("tipo_escola"))} />
            </Field>
            <Field label="Unidade">
              <select
                name="unit_id"
                defaultValue={(v("unit_id") as string) || ""}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">—</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prioridade">
              <select
                name="prioridade"
                defaultValue={(v("prioridade") as string) || "Media"}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </Field>
            <Field label="Conveniada">
              <label className="flex h-10 items-center gap-2 px-1">
                <input
                  type="checkbox"
                  name="conveniado"
                  defaultChecked={Boolean(v("conveniado", false))}
                  className="h-4 w-4"
                />
                <span className="text-sm">Sim, conveniada</span>
              </label>
            </Field>
            <Field label="Público Alvo">
              <Input name="publico_alvo" defaultValue={String(v("publico_alvo"))} />
            </Field>

            <Field label="Endereço" className="md:col-span-2">
              <Input name="endereco" defaultValue={String(v("endereco"))} />
            </Field>
            <Field label="Bairro">
              <Input name="bairro" defaultValue={String(v("bairro"))} />
            </Field>
            <Field label="Município">
              <Input name="municipio" defaultValue={String(v("municipio"))} />
            </Field>
            <Field label="UF">
              <Input name="uf" maxLength={2} defaultValue={String(v("uf"))} />
            </Field>
            <Field label="País">
              <Input name="pais" defaultValue={String(v("pais", "Brasil"))} />
            </Field>

            <Field label="Diretor">
              <Input name="diretor" defaultValue={String(v("diretor"))} />
            </Field>
            <Field label="Contato Diretor">
              <Input name="contato_diretor" defaultValue={String(v("contato_diretor"))} />
            </Field>
            <Field label="Coordenador 3º Ano">
              <Input name="coordenador_3ano" defaultValue={String(v("coordenador_3ano"))} />
            </Field>
            <Field label="Contato Coordenador">
              <Input
                name="contato_coordenador"
                defaultValue={String(v("contato_coordenador"))}
              />
            </Field>

            <Field label="Base Alunos Ens. Médio">
              <Input
                name="base_alunos_em"
                type="number"
                min="0"
                defaultValue={String(v("base_alunos_em", 0))}
              />
            </Field>
            <Field label="Base Alunos 3º Ano">
              <Input
                name="base_alunos_3ano"
                type="number"
                min="0"
                defaultValue={String(v("base_alunos_3ano", 0))}
              />
            </Field>
            <Field label="Mensalidade 3º Ano (R$)">
              <Input
                name="mensalidade_3ano"
                type="number"
                step="0.01"
                min="0"
                defaultValue={String(v("mensalidade_3ano", 0))}
              />
            </Field>
            <Field label="Nº Colaboradores">
              <Input
                name="numero_colaboradores"
                type="number"
                min="0"
                defaultValue={String(v("numero_colaboradores", 0))}
              />
            </Field>

            <Field label="Consultor" className="md:col-span-2">
              <Input name="consultor" defaultValue={String(v("consultor"))} />
            </Field>

            <fieldset className="md:col-span-2 grid grid-cols-2 gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700 md:grid-cols-3">
              <legend className="px-1 text-xs font-medium text-zinc-500">
                Metas e realizado
              </legend>
              <Field label="Meta Inscritos">
                <Input
                  name="meta_inscritos"
                  type="number"
                  min="0"
                  defaultValue={String(v("meta_inscritos", 0))}
                />
              </Field>
              <Field label="Inscritos Real">
                <Input
                  name="inscritos_real"
                  type="number"
                  min="0"
                  defaultValue={String(v("inscritos_real", 0))}
                />
              </Field>
              <span />
              <Field label="Meta Financeira">
                <Input
                  name="meta_financeira"
                  type="number"
                  min="0"
                  defaultValue={String(v("meta_financeira", 0))}
                />
              </Field>
              <Field label="Financeira Real">
                <Input
                  name="financeira_real"
                  type="number"
                  min="0"
                  defaultValue={String(v("financeira_real", 0))}
                />
              </Field>
              <span />
              <Field label="Meta Acadêmica">
                <Input
                  name="meta_academica"
                  type="number"
                  min="0"
                  defaultValue={String(v("meta_academica", 0))}
                />
              </Field>
              <Field label="Acadêmica Real">
                <Input
                  name="academica_real"
                  type="number"
                  min="0"
                  defaultValue={String(v("academica_real", 0))}
                />
              </Field>
            </fieldset>
          </div>

          {state.message && !state.success && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {state.message}
            </div>
          )}

          <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-2 border-t border-zinc-200 bg-white px-6 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className || ""}`}>
      <Label className="text-xs font-medium uppercase text-zinc-500">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
