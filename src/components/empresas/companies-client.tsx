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
import { getCompanies, upsertCompany, deleteCompany, assignCompaniesToUnit } from "@/app/actions/companies";
import { SortableTh, TablePagination, useDataTable } from "@/components/ui/data-table";
import type { Company, CompanyFormState } from "@/types/company";
import type { Unit } from "@/types/catalog";
import { Plus, Pencil, Trash2, X, Save, Search, Building2, Link2, Unlink } from "lucide-react";

type CompanySortKey =
  | "nome_fantasia"
  | "segmento"
  | "municipio"
  | "responsavel_nome"
  | "chance_contato"
  | "qtd_oportunidade"
  | "inscritos_real";

const init: CompanyFormState = { message: undefined, errors: {} };

const CHANCE_BADGES: Record<string, string> = {
  Alta: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  Media: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  Baixa: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-950/30 dark:text-zinc-400 dark:border-zinc-800",
};

export function CompaniesClient({ units }: { units: Unit[] }) {
  const { currentTenant } = useTenant();
  const router = useRouter();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUnitId, setBulkUnitId] = useState<string>("");
  const [editing, setEditing] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isAssigning, startAssign] = useTransition();

  const unitMap = useMemo(() => new Map(units.map((u) => [u.id, u.name])), [units]);

  const [upsertState, upsertAction, isSaving] = useActionState(upsertCompany, init);
  const [, deleteAction, isDeleting] = useActionState(deleteCompany, init);

  useEffect(() => {
    if (!currentTenant?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getCompanies(currentTenant.id);
      if (!cancelled) {
        setCompanies(data);
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
      if (currentTenant?.id) getCompanies(currentTenant.id).then(setCompanies);
    } else if (upsertState.message && !upsertState.success) {
      toast(upsertState.message, "error");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upsertState]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (unitFilter === "__none__" && c.unit_id) return false;
      if (unitFilter && unitFilter !== "__none__" && c.unit_id !== unitFilter) return false;
      if (!q) return true;
      return (
        c.nome_fantasia.toLowerCase().includes(q) ||
        c.cnpj.toLowerCase().includes(q) ||
        c.municipio.toLowerCase().includes(q) ||
        c.responsavel_nome.toLowerCase().includes(q)
      );
    });
  }, [search, companies, unitFilter]);

  const CHANCE_RANK = { Alta: 0, Media: 1, Baixa: 2, "": 3 } as const;

  const table = useDataTable<Company, CompanySortKey>(filtered, {
    initialSort: "nome_fantasia",
    initialAsc: true,
    initialPageSize: 20,
    sortAccessor: (c, key) => {
      switch (key) {
        case "nome_fantasia":
          return c.nome_fantasia || "";
        case "segmento":
          return c.segmento || "";
        case "municipio":
          return `${c.municipio || ""} ${c.uf || ""}`;
        case "responsavel_nome":
          return c.responsavel_nome || "";
        case "chance_contato":
          return CHANCE_RANK[c.chance_contato] ?? 99;
        case "qtd_oportunidade":
          return c.qtd_oportunidade || 0;
        case "inscritos_real":
          return c.inscritos_real || 0;
        default:
          return 0;
      }
    },
  });

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setShowForm(true);
  }

  async function handleDelete(company: Company) {
    if (!confirm(`Excluir empresa "${company.nome_fantasia}"?`)) return;
    const fd = new FormData();
    fd.set("companyId", company.id);
    deleteAction(fd);
    setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(company.id);
      return next;
    });
    toast("Empresa excluída.");
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

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
      if (filtered.every((c) => next.has(c.id))) {
        filtered.forEach((c) => next.delete(c.id));
      } else {
        filtered.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }

  function handleAssign(unitId: string | null) {
    const ids = [...selectedIds];
    if (!ids.length) return;
    startAssign(async () => {
      const res = await assignCompaniesToUnit(ids, unitId);
      if (res.success) {
        toast(res.message);
        setSelectedIds(new Set());
        setBulkUnitId("");
        if (currentTenant?.id) getCompanies(currentTenant.id).then(setCompanies);
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
            <Building2 className="h-6 w-6" /> Carteira de Empresas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {companies.length} {companies.length === 1 ? "empresa" : "empresas"}
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
              placeholder="Buscar nome, CNPJ, cidade..."
              className="h-9 w-72 pl-8"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova Empresa
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
            Nenhuma empresa cadastrada{search ? " com esse filtro" : ""}.
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
                <SortableTh<CompanySortKey>
                  label="Empresa"
                  sortKey="nome_fantasia"
                  activeKey={table.sortKey}
                  asc={table.asc}
                  onSort={table.handleSort}
                />
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Unidade</th>
                <SortableTh<CompanySortKey>
                  label="Segmento"
                  sortKey="segmento"
                  activeKey={table.sortKey}
                  asc={table.asc}
                  onSort={table.handleSort}
                />
                <SortableTh<CompanySortKey>
                  label="Município/UF"
                  sortKey="municipio"
                  activeKey={table.sortKey}
                  asc={table.asc}
                  onSort={table.handleSort}
                />
                <SortableTh<CompanySortKey>
                  label="Responsável"
                  sortKey="responsavel_nome"
                  activeKey={table.sortKey}
                  asc={table.asc}
                  onSort={table.handleSort}
                />
                <SortableTh<CompanySortKey>
                  label="Chance"
                  sortKey="chance_contato"
                  activeKey={table.sortKey}
                  asc={table.asc}
                  onSort={table.handleSort}
                />
                <SortableTh<CompanySortKey>
                  label="Oportunidade"
                  sortKey="qtd_oportunidade"
                  activeKey={table.sortKey}
                  asc={table.asc}
                  onSort={table.handleSort}
                  align="right"
                />
                <SortableTh<CompanySortKey>
                  label="IN Real"
                  sortKey="inscritos_real"
                  activeKey={table.sortKey}
                  asc={table.asc}
                  onSort={table.handleSort}
                  align="right"
                />
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {table.pageItems.map((c, i) => (
                <tr key={c.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${selectedIds.has(c.id) ? "bg-accent-50/40 dark:bg-accent-950/10" : ""}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      aria-label={`Selecionar ${c.nome_fantasia}`}
                      className="h-4 w-4 align-middle"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] tabular-nums text-zinc-400">
                    {table.offset + i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {c.nome_fantasia}
                    {c.conveniado && (
                      <span className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Conveniada
                      </span>
                    )}
                    {c.cnpj && (
                      <div className="text-[11px] text-zinc-500">{c.cnpj}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {c.unit_id ? (unitMap.get(c.unit_id) || "—") : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{c.segmento || "—"}</td>
                  <td className="px-3 py-2 text-zinc-500">
                    {[c.municipio, c.uf].filter(Boolean).join("/") || "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {c.responsavel_nome || "—"}
                    {c.responsavel_cargo && (
                      <div className="text-[11px] text-zinc-500">{c.responsavel_cargo}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {c.chance_contato ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          CHANCE_BADGES[c.chance_contato] || ""
                        }`}
                      >
                        {c.chance_contato}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.qtd_oportunidade}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.inscritos_real}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c)}
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
        <CompanyForm
          company={editing}
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

function CompanyForm({
  company,
  tenantId,
  units,
  action,
  state,
  isSaving,
  onClose,
}: {
  company: Company | null;
  tenantId: string;
  units: Unit[];
  action: (formData: FormData) => void;
  state: CompanyFormState;
  isSaving: boolean;
  onClose: () => void;
}) {
  const e = state.errors || {};
  const v = (k: keyof Company, fallback: string | number | boolean = "") =>
    company ? (company as unknown as Record<string, unknown>)[k] ?? fallback : fallback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">{company ? "Editar empresa" : "Nova empresa"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form action={action} className="space-y-4 p-6">
          <input type="hidden" name="tenantId" value={tenantId} />
          {company && <input type="hidden" name="companyId" value={company.id} />}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Nome Fantasia*" error={e.nome_fantasia?.[0]}>
              <Input
                name="nome_fantasia"
                defaultValue={String(v("nome_fantasia"))}
                required
              />
            </Field>
            <Field label="CNPJ">
              <Input name="cnpj" defaultValue={String(v("cnpj"))} />
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
            <Field label="Cluster">
              <Input name="cluster" defaultValue={String(v("cluster"))} />
            </Field>
            <Field label="Segmento">
              <Input name="segmento" defaultValue={String(v("segmento"))} />
            </Field>
            <Field label="Faixa de Funcionários">
              <Input
                name="faixa_funcionarios"
                defaultValue={String(v("faixa_funcionarios"))}
              />
            </Field>
            <Field label="Chance de Contato">
              <select
                name="chance_contato"
                defaultValue={(v("chance_contato") as string) || ""}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">—</option>
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

            <Field label="Responsável">
              <Input name="responsavel_nome" defaultValue={String(v("responsavel_nome"))} />
            </Field>
            <Field label="Cargo do Responsável">
              <Input name="responsavel_cargo" defaultValue={String(v("responsavel_cargo"))} />
            </Field>
            <Field label="WhatsApp">
              <Input name="contato_whatsapp" defaultValue={String(v("contato_whatsapp"))} />
            </Field>
            <Field label="E-mail">
              <Input name="email" type="email" defaultValue={String(v("email"))} />
            </Field>
            <Field label="Link Facebook">
              <Input name="link_facebook" defaultValue={String(v("link_facebook"))} />
            </Field>
            <Field label="Link Instagram">
              <Input name="link_instagram" defaultValue={String(v("link_instagram"))} />
            </Field>

            <Field label="Consultor" className="md:col-span-2">
              <Input name="consultor" defaultValue={String(v("consultor"))} />
            </Field>

            <fieldset className="md:col-span-2 grid grid-cols-1 gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700 md:grid-cols-3">
              <legend className="px-1 text-xs font-medium text-zinc-500">Visitas</legend>
              <Field label="Data 1ª Visita">
                <Input
                  name="data_primeira_visita"
                  type="date"
                  defaultValue={(v("data_primeira_visita") as string) || ""}
                />
              </Field>
              <Field label="Previsão de Retorno">
                <Input
                  name="data_previsao_retorno"
                  type="date"
                  defaultValue={(v("data_previsao_retorno") as string) || ""}
                />
              </Field>
              <Field label="Retorno Real">
                <Input
                  name="data_retorno_real"
                  type="date"
                  defaultValue={(v("data_retorno_real") as string) || ""}
                />
              </Field>
            </fieldset>

            <fieldset className="md:col-span-2 grid grid-cols-2 gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700 md:grid-cols-4">
              <legend className="px-1 text-xs font-medium text-zinc-500">Resultado</legend>
              <Field label="Qtd Oportunidade">
                <Input
                  name="qtd_oportunidade"
                  type="number"
                  min="0"
                  defaultValue={String(v("qtd_oportunidade", 0))}
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
              <Field label="Financeira Real">
                <Input
                  name="financeira_real"
                  type="number"
                  min="0"
                  defaultValue={String(v("financeira_real", 0))}
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

            <Field label="Comentários e Observações" className="md:col-span-2">
              <textarea
                name="comentarios"
                defaultValue={String(v("comentarios"))}
                rows={3}
                className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </Field>
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
