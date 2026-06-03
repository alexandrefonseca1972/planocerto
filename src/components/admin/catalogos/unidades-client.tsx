"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
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
import { unitSchema } from "@/lib/schemas/catalog-schemas";
import { useLiveValidation } from "@/lib/hooks/use-live-validation";
import { formatPhone, stripFormat } from "@/lib/format-br";
import type { Unit, Area, CatalogFormState } from "@/types/catalog";
import {
  Plus,
  Pencil,
  Trash2,
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
  maxUnits = null,
}: {
  initial: Unit[];
  areas: Area[];
  maxUnits?: number | null;
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
  const atLimit = maxUnits != null && items.length >= maxUnits;

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
            {items.length === 1 ? "" : "s"}
            {maxUnits != null && (
              <>
                {" "}·{" "}
                <span className={atLimit ? "font-medium text-red-600 dark:text-red-400" : ""}>
                  {items.length}/{maxUnits} do limite
                </span>
              </>
            )}
            .
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
          <Button
            size="sm"
            onClick={openCreate}
            disabled={atLimit}
            title={atLimit ? `Limite de ${maxUnits} unidades atingido para esta empresa.` : undefined}
          >
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

interface UnitFormValues {
  name: string;
  area_id: string | null;
  uf: string;
  responsavel: string;
  email: string;
  fone: string;
  sort_order: number;
  active: boolean;
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
  const initial: UnitFormValues = useMemo(
    () => ({
      name: item?.name || "",
      area_id: item?.area_id || null,
      uf: item?.uf || "",
      responsavel: item?.responsavel || "",
      email: item?.email || "",
      // telefone é exibido formatado; persistido em dígitos.
      fone: formatPhone(item?.fone || ""),
      sort_order: item?.sort_order ?? 0,
      active: item ? item.active : true,
    }),
    [item],
  );

  const { values, setValue, errors, markTouched, isValid, isDirty, validateAll } =
    useLiveValidation<UnitFormValues>(unitSchema, initial);

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const selectClass =
    "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";

  function submit() {
    if (!validateAll()) return;
    const fd = new FormData();
    if (item) fd.set("id", item.id);
    fd.set("name", values.name);
    if (values.area_id) fd.set("area_id", values.area_id);
    fd.set("uf", values.uf);
    fd.set("responsavel", values.responsavel);
    fd.set("email", values.email);
    fd.set("fone", stripFormat(values.fone));
    fd.set("sort_order", String(values.sort_order));
    if (values.active) fd.set("active", "on");
    action(fd);
  }

  return (
    <FormDialog
      open
      title={item ? "Editar Unidade" : "Nova Unidade"}
      subtitle={item ? "Atualize os dados da unidade" : "Cadastre uma nova unidade"}
      isDirty={isDirty}
      onClose={onClose}
      onSubmit={submit}
      isSaving={isSaving}
      canSave={isValid}
      serverError={!state.success ? state.message : undefined}
      submitLabel={item ? "Salvar alterações" : "Criar Unidade"}
      size="md"
    >
      <Field
        id="unit-name"
        label="Nome"
        required
        maxLength={100}
        value={values.name}
        error={errors.name}
      >
        <Input
          id="unit-name"
          ref={nameRef}
          name="name"
          maxLength={100}
          autoComplete="off"
          placeholder="ex: Belém, Manaus, Brasília..."
          value={values.name}
          onChange={(ev) => setValue("name", ev.target.value)}
          onBlur={() => markTouched("name")}
          aria-invalid={Boolean(errors.name)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="unit-area" label="Área" error={errors.area_id}>
          <select
            id="unit-area"
            className={selectClass}
            value={values.area_id ?? ""}
            onChange={(ev) => setValue("area_id", ev.target.value || null)}
            onBlur={() => markTouched("area_id")}
          >
            <option value="">—</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="unit-uf" label="UF" error={errors.uf}>
          <select
            id="unit-uf"
            className={selectClass}
            value={values.uf}
            onChange={(ev) => setValue("uf", ev.target.value)}
            onBlur={() => markTouched("uf")}
          >
            <option value="">—</option>
            {UFS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        id="unit-responsavel"
        label="Diretor/Reitor"
        helpText="Responsável pela unidade."
        maxLength={150}
        value={values.responsavel}
        error={errors.responsavel}
      >
        <Input
          id="unit-responsavel"
          name="responsavel"
          maxLength={150}
          placeholder="Nome do responsável"
          value={values.responsavel}
          onChange={(ev) => setValue("responsavel", ev.target.value)}
          onBlur={() => markTouched("responsavel")}
          aria-invalid={Boolean(errors.responsavel)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="unit-email" label="Email" error={errors.email}>
          <Input
            id="unit-email"
            name="email"
            type="email"
            maxLength={160}
            placeholder="contato@unidade.com"
            value={values.email}
            onChange={(ev) => setValue("email", ev.target.value.toLowerCase())}
            onBlur={() => markTouched("email")}
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field id="unit-fone" label="Fone" error={errors.fone}>
          <Input
            id="unit-fone"
            name="fone"
            maxLength={40}
            placeholder="(00) 00000-0000"
            value={values.fone}
            onChange={(ev) => setValue("fone", formatPhone(ev.target.value))}
            onBlur={() => markTouched("fone")}
            inputMode="tel"
            aria-invalid={Boolean(errors.fone)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id="unit-order"
          label="Ordem de exibição"
          helpText="Menor número aparece primeiro."
          error={errors.sort_order}
        >
          <Input
            id="unit-order"
            name="sort_order"
            type="number"
            min="0"
            max="9999"
            value={String(values.sort_order)}
            onChange={(ev) => setValue("sort_order", Number(ev.target.value) || 0)}
            onBlur={() => markTouched("sort_order")}
          />
        </Field>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/30">
          <Switch
            id="unit-active"
            checked={values.active}
            onChange={(ev) => setValue("active", ev.currentTarget.checked)}
            label={values.active ? "Ativa" : "Inativa"}
          />
          <p className="mt-1 pl-11 text-xs text-zinc-500">
            Unidades inativas ficam ocultas nos dropdowns.
          </p>
        </div>
      </div>
    </FormDialog>
  );
}
