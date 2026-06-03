"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  upsertUnit,
  deleteUnit,
  toggleUnitActive,
  getUnitsAdmin,
} from "@/app/actions/unidades";
import type { Unit, Area, CatalogFormState } from "@/types/catalog";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  Building,
  Power,
  PowerOff,
  Sparkles,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RegionalContextForm } from "./regional-context-form";
import { Tooltip } from "@/components/ui/tooltip";

const init: CatalogFormState = { message: undefined, errors: {} };

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export function UnidadesClient({
  initial,
  areas,
}: {
  initial: Unit[];
  areas: Area[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<Unit[]>(initial);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [showInactive, setShowInactive] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [contextUnit, setContextUnit] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [, startTransition] = useTransition();

  const [upsertState, upsertAction, isSaving] = useActionState(upsertUnit, init);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteUnit, init);

  const areaMap = useMemo(() => new Map(areas.map((a) => [a.id, a.name])), [areas]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (upsertState.success) {
      toast(upsertState.message || "Salvo!");
      setShowForm(false);
      setEditing(null);
      router.refresh();
      getUnitsAdmin().then(setItems);
    } else if (upsertState.message && !upsertState.success) {
      toast(upsertState.message, "error");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upsertState]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (deleteState.success) {
      toast(deleteState.message || "Excluído.");
      setDeleting(null);
      router.refresh();
      getUnitsAdmin().then(setItems);
    } else if (deleteState.message && !deleteState.success) {
      toast(deleteState.message, "error");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (!showInactive && !i.active) return false;
      if (areaFilter && i.area_id !== areaFilter) return false;
      if (q) {
        const haystack = `${i.name} ${i.uf} ${i.area_id ? areaMap.get(i.area_id) || "" : ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [search, items, showInactive, areaFilter, areaMap]);

  const activeCount = useMemo(() => items.filter((i) => i.active).length, [items]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(item: Unit) {
    setEditing(item);
    setShowForm(true);
  }

  function handleToggle(item: Unit) {
    startTransition(async () => {
      const next = !item.active;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: next } : i)),
      );
      const res = await toggleUnitActive(item.id, next);
      if (!res.success && res.message) {
        toast(res.message, "error");
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, active: item.active } : i)),
        );
      } else if (res.success) {
        toast(res.message || "Atualizado.");
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const fd = new FormData();
    fd.set("id", deleting.id);
    deleteAction(fd);
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/users">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/catalogos">Catálogos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Unidades</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Building className="h-5 w-5" /> Unidades
          </h2>
          <p className="text-sm text-zinc-500">
            {activeCount} ativa{activeCount === 1 ? "" : "s"} de {items.length} cadastrada
            {items.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="flex h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Todas as áreas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Mostrar inativas
          </label>
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
            <Plus className="h-4 w-4" /> Nova Unidade
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            {items.length === 0
              ? "Nenhuma Unidade cadastrada."
              : "Nenhum resultado para o filtro."}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs font-medium uppercase text-zinc-500">
                <th className="px-3 py-2 w-16">Ordem</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Área</th>
                <th className="px-3 py-2 w-16">UF</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${
                    !item.active ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-zinc-500 tabular-nums">
                    {item.sort_order}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    <div className="flex items-center gap-2">
                      {item.name}
                      {item.regional_context && Object.values(item.regional_context).some(v => v) && (
                        <Tooltip content="Possui contexto regional para IA">
                          <Sparkles className="h-3 w-3 text-accent-500" />
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {item.area_id ? areaMap.get(item.area_id) || "—" : "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500 tabular-nums">
                    {item.uf || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {item.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                        Inativa
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(item)}
                        title={item.active ? "Desativar" : "Ativar"}
                      >
                        {item.active ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setContextUnit(item)}
                        className="text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-950/30"
                        title="Inteligência Regional"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(item)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Excluir"
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
      )}

      {showForm && (
        <UnitForm
          item={editing}
          areas={areas}
          action={upsertAction}
          state={upsertState}
          isSaving={isSaving}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {contextUnit && (
        <RegionalContextForm
          unit={contextUnit}
          onClose={() => setContextUnit(null)}
          onSuccess={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setContextUnit(null);
            toast("Contexto regional atualizado!");
          }}
        />
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Unidade?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Confirma a exclusão de "${deleting?.name}"? Escolas, empresas ou cenários vinculados impedirão a exclusão.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleting(null)}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UnitForm({
  item,
  areas,
  action,
  state,
  isSaving,
  onClose,
}: {
  item: Unit | null;
  areas: Area[];
  action: (formData: FormData) => void;
  state: CatalogFormState;
  isSaving: boolean;
  onClose: () => void;
}) {
  const e = state.errors || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-700">
          <h3 className="text-base font-semibold">
            {item ? "Editar Unidade" : "Nova Unidade"}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form action={action} className="space-y-3 p-6">
          {item && <input type="hidden" name="id" value={item.id} />}

          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase text-zinc-500">
              Nome*
            </Label>
            <Input
              name="name"
              defaultValue={item?.name || ""}
              required
              autoFocus
              maxLength={100}
              placeholder="ex: Belém, Manaus, Brasília..."
            />
            {e.name?.[0] && <p className="text-xs text-red-600">{e.name[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase text-zinc-500">
                Área
              </Label>
              <select
                name="area_id"
                defaultValue={item?.area_id || ""}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">—</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase text-zinc-500">
                UF
              </Label>
              <select
                name="uf"
                defaultValue={item?.uf || ""}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">—</option>
                {UFS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase text-zinc-500">
              Diretor/Reitor
            </Label>
            <Input
              name="responsavel"
              defaultValue={item?.responsavel || ""}
              maxLength={150}
              placeholder="Nome do responsável pela unidade"
            />
            {e.responsavel?.[0] && (
              <p className="text-xs text-red-600">{e.responsavel[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase text-zinc-500">
                Email
              </Label>
              <Input
                name="email"
                type="email"
                defaultValue={item?.email || ""}
                maxLength={160}
                placeholder="contato@unidade.com"
              />
              {e.email?.[0] && (
                <p className="text-xs text-red-600">{e.email[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase text-zinc-500">
                Fone
              </Label>
              <Input
                name="fone"
                defaultValue={item?.fone || ""}
                maxLength={40}
                placeholder="(00) 00000-0000"
              />
              {e.fone?.[0] && (
                <p className="text-xs text-red-600">{e.fone[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase text-zinc-500">
              Ordem de exibição
            </Label>
            <Input
              name="sort_order"
              type="number"
              min="0"
              defaultValue={String(item?.sort_order ?? 0)}
            />
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={item ? item.active : true}
              className="h-4 w-4"
            />
            Ativa
          </label>

          {state.message && !state.success && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {state.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
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
