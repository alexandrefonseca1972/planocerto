"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useLiveValidation } from "@/lib/hooks/use-live-validation";
import {
  upsertPrioridade,
  deletePrioridade,
  togglePrioridadeActive,
  getPrioridadesAdmin,
} from "@/app/actions/prioridades";
import { prioridadeSchema } from "@/lib/schemas/catalog-schemas";
import type { PrioridadeRow, CatalogFormState } from "@/types/catalog";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  Power,
  PowerOff,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const init: CatalogFormState = { message: undefined, errors: {} };

const COLOR_BADGES: Record<string, string> = {
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  amber:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  emerald:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  zinc: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-950/30 dark:text-zinc-400 dark:border-zinc-800",
};

const COLOR_OPTIONS = [
  { value: "red", label: "Vermelho" },
  { value: "amber", label: "Âmbar" },
  { value: "emerald", label: "Verde" },
  { value: "blue", label: "Azul" },
  { value: "zinc", label: "Neutro" },
] as const;

interface FormValues {
  name: string;
  sort_order: number;
  active: boolean;
  color: "red" | "amber" | "emerald" | "blue" | "zinc";
}

export function PrioridadesClient({ initial }: { initial: PrioridadeRow[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<PrioridadeRow[]>(initial);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PrioridadeRow | null>(null);
  const [deleting, setDeleting] = useState<PrioridadeRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [upsertState, upsertAction, isSaving] = useActionState(upsertPrioridade, init);
  const [deleteState, deleteAction, isDeleting] = useActionState(deletePrioridade, init);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (upsertState.success) {
      toast(upsertState.message || "Salvo!");
      setShowForm(false);
      setEditing(null);
      router.refresh();
      getPrioridadesAdmin().then(setItems);
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
      getPrioridadesAdmin().then(setItems);
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
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, items, showInactive]);

  const activeCount = useMemo(() => items.filter((i) => i.active).length, [items]);

  function handleToggle(item: PrioridadeRow) {
    setTogglingId(item.id);
    startTransition(async () => {
      const next = !item.active;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, active: next } : i)));
      const res = await togglePrioridadeActive(item.id, next);
      if (!res.success && res.message) {
        toast(res.message, "error");
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, active: item.active } : i)),
        );
      } else if (res.success) {
        toast(res.message || "Atualizado.");
      }
      setTogglingId(null);
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
            <BreadcrumbPage>Prioridades</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-accent-600" /> Prioridades
          </h2>
          <p className="text-sm text-zinc-500">
            {activeCount} ativa{activeCount === 1 ? "" : "s"} de {items.length} cadastrada
            {items.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-3.5 w-3.5 accent-accent-500"
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
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nova Prioridade
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            {items.length === 0
              ? "Nenhuma Prioridade cadastrada."
              : "Nenhum resultado para a busca."}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs font-medium uppercase text-zinc-500">
                <th className="px-3 py-2 w-16">Ordem</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Cor</th>
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
                  <td className="px-3 py-2 text-zinc-500 tabular-nums">{item.sort_order}</td>
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        COLOR_BADGES[item.color] || COLOR_BADGES.zinc
                      }`}
                    >
                      {item.name}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {item.active ? (
                      <Badge variant="success">Ativa</Badge>
                    ) : (
                      <Badge variant="muted">Inativa</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(item)}
                        disabled={togglingId === item.id}
                        title={item.active ? "Desativar" : "Ativar"}
                        aria-label={item.active ? "Desativar" : "Ativar"}
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
                        onClick={() => {
                          setEditing(item);
                          setShowForm(true);
                        }}
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(item)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Excluir"
                        aria-label="Excluir"
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
        <PrioridadeForm
          item={editing}
          action={upsertAction}
          state={upsertState}
          isSaving={isSaving}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Prioridade?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Confirma a exclusão de "${deleting?.name}"? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleting(null)}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PrioridadeForm({
  item,
  action,
  state,
  isSaving,
  onClose,
}: {
  item: PrioridadeRow | null;
  action: (formData: FormData) => void;
  state: CatalogFormState;
  isSaving: boolean;
  onClose: () => void;
}) {
  const initial: FormValues = useMemo(
    () => ({
      name: item?.name || "",
      sort_order: item?.sort_order ?? 0,
      active: item ? item.active : true,
      color: (item?.color as FormValues["color"]) || "zinc",
    }),
    [item],
  );

  const { values, setValue, errors, markTouched, isValid, isDirty, validateAll } =
    useLiveValidation<FormValues>(prioridadeSchema, initial);

  const filled =
    (values.name.trim().length >= 2 ? 1 : 0) +
    (values.sort_order >= 0 ? 1 : 0) +
    (values.color ? 1 : 0);

  function submit() {
    if (!validateAll()) return;
    const fd = new FormData();
    if (item) fd.set("id", item.id);
    fd.set("name", values.name);
    fd.set("sort_order", String(values.sort_order));
    fd.set("color", values.color);
    if (values.active) fd.set("active", "on");
    action(fd);
  }

  return (
    <FormDialog
      open
      title={item ? "Editar Prioridade" : "Nova Prioridade"}
      subtitle={
        item ? "Atualize os dados da Prioridade" : "Cadastre um novo nível de prioridade"
      }
      isDirty={isDirty}
      onClose={onClose}
      onSubmit={submit}
      isSaving={isSaving}
      canSave={isValid}
      serverError={!state.success ? state.message : undefined}
      progress={{ filled, total: 3 }}
      submitLabel={item ? "Salvar alterações" : "Criar Prioridade"}
      size="sm"
    >
      <Field
        id="prio-name"
        label="Nome"
        required
        helpText="Nome da prioridade (ex: Alta, Média, Baixa)."
        maxLength={40}
        value={values.name}
        error={errors.name}
      >
        <Input
          id="prio-name"
          name="name"
          maxLength={40}
          autoComplete="off"
          placeholder="Ex: Alta"
          value={values.name}
          onChange={(e) => setValue("name", e.target.value)}
          onBlur={() => markTouched("name")}
          aria-invalid={Boolean(errors.name)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          id="prio-order"
          label="Ordem"
          helpText="1 = mais alta"
          error={errors.sort_order}
        >
          <Input
            id="prio-order"
            name="sort_order"
            type="number"
            min="0"
            max="9999"
            value={String(values.sort_order)}
            onChange={(e) => setValue("sort_order", Number(e.target.value) || 0)}
            onBlur={() => markTouched("sort_order")}
            aria-invalid={Boolean(errors.sort_order)}
          />
        </Field>
        <Field id="prio-color" label="Cor" helpText="Estilo do badge" error={errors.color}>
          <Select
            id="prio-color"
            name="color"
            value={values.color}
            onChange={(e) => setValue("color", e.target.value as FormValues["color"])}
            onBlur={() => markTouched("color")}
          >
            {COLOR_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Preview do badge */}
      <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 dark:border-zinc-600">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Pré-visualização
        </p>
        <div className="mt-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              COLOR_BADGES[values.color] || COLOR_BADGES.zinc
            }`}
          >
            {values.name || "Prévia"}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/30">
        <Switch
          id="prio-active"
          checked={values.active}
          onChange={(e) => setValue("active", e.currentTarget.checked)}
          label={values.active ? "Ativa" : "Inativa"}
        />
        <p className="mt-1 pl-11 text-xs text-zinc-500">
          Prioridades inativas ficam ocultas nos dropdowns.
        </p>
      </div>
    </FormDialog>
  );
}
