"use client";

import { useActionState, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  upsertCategoriaDespesa,
  deleteCategoriaDespesa,
  toggleCategoriaDespesaActive,
  getCategoriasDespesa,
} from "@/app/actions/contas-pagar-categorias";
import { categoriaDespesaSchema } from "@/lib/schemas/financeiro-schemas";
import type { CategoriaDespesa, FinanceFormState } from "@/types/financeiro";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Tag,
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

const init: FinanceFormState = { message: undefined, errors: {} };

interface FormValues {
  name: string;
  sort_order: number;
  active: boolean;
}

export function CategoriasDespesaClient({
  initial,
}: {
  initial: CategoriaDespesa[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<CategoriaDespesa[]>(initial);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoriaDespesa | null>(null);
  const [deleting, setDeleting] = useState<CategoriaDespesa | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [upsertState, upsertAction, isSaving] = useActionState(
    upsertCategoriaDespesa,
    init,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCategoriaDespesa,
    init,
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (upsertState.success) {
      toast(upsertState.message || "Salvo!");
      setShowForm(false);
      setEditing(null);
      router.refresh();
      getCategoriasDespesa().then(setItems);
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
      getCategoriasDespesa().then(setItems);
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
      if (!q) return true;
      return i.name.toLowerCase().includes(q);
    });
  }, [search, items, showInactive]);

  const activeCount = useMemo(
    () => items.filter((i) => i.active).length,
    [items],
  );

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(item: CategoriaDespesa) {
    setEditing(item);
    setShowForm(true);
  }

  function handleToggle(item: CategoriaDespesa) {
    setTogglingId(item.id);
    startTransition(async () => {
      const next = !item.active;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: next } : i)),
      );
      const res = await toggleCategoriaDespesaActive(item.id, next);
      if (!res.success && res.message) {
        toast(res.message, "error");
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, active: item.active } : i,
          ),
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
            <BreadcrumbPage>Categorias de despesa</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Tag className="h-5 w-5 text-accent-600" /> Categorias de despesa
          </h2>
          <p className="text-sm text-zinc-500">
            {activeCount} ativa{activeCount === 1 ? "" : "s"} de {items.length}{" "}
            cadastrada{items.length === 1 ? "" : "s"}.
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
              placeholder="Buscar categoria..."
              className="h-9 w-72 pl-8"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova categoria
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            {items.length === 0
              ? "Nenhuma categoria cadastrada."
              : "Nenhum resultado para a busca."}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs font-medium uppercase text-zinc-500">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Escopo</th>
                <th className="px-3 py-2 hidden md:table-cell">Ordem</th>
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
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                    {item.tenant_id ? (
                      <Badge variant="muted">Empresa</Badge>
                    ) : (
                      <Badge variant="outline">Global</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-500 tabular-nums hidden md:table-cell">
                    {item.sort_order}
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
                        onClick={() => openEdit(item)}
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
        <CategoriaForm
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

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Confirma a exclusão de "${deleting?.name}"? Contas vinculadas ficarão sem categoria.`}
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

function CategoriaForm({
  item,
  action,
  state,
  isSaving,
  onClose,
}: {
  item: CategoriaDespesa | null;
  action: (formData: FormData) => void;
  state: FinanceFormState;
  isSaving: boolean;
  onClose: () => void;
}) {
  const initial: FormValues = useMemo(
    () => ({
      name: item?.name || "",
      sort_order: item?.sort_order ?? 0,
      active: item ? item.active : true,
    }),
    [item],
  );

  const {
    values,
    setValue: setValueBase,
    errors,
    markTouched,
    isValid,
    isDirty,
    validateAll,
  } = useLiveValidation<FormValues>(categoriaDespesaSchema, initial);

  const setValue = useCallback(
    <K extends keyof FormValues>(name: K, value: FormValues[K]) => {
      setValueBase(name, value);
      markTouched(name as string);
    },
    [setValueBase, markTouched],
  );

  const filled = values.name.trim().length >= 2 ? 1 : 0;

  function submit() {
    if (!validateAll()) return;
    const fd = new FormData();
    if (item) fd.set("id", item.id);
    if (item?.tenant_id) fd.set("tenant_id", item.tenant_id);
    fd.set("name", values.name);
    fd.set("sort_order", String(values.sort_order));
    if (values.active) fd.set("active", "on");
    action(fd);
  }

  return (
    <FormDialog
      open
      title={item ? "Editar categoria" : "Nova categoria"}
      subtitle={
        item
          ? "Atualize a categoria de despesa"
          : "Cadastre uma nova categoria"
      }
      isDirty={isDirty}
      onClose={onClose}
      onSubmit={submit}
      isSaving={isSaving}
      canSave={isValid}
      serverError={!state.success ? state.message : undefined}
      progress={{ filled, total: 1 }}
      submitLabel={item ? "Salvar alterações" : "Criar categoria"}
      size="md"
    >
      <Field
        id="cat-name"
        label="Nome"
        required
        helpText="Identifica o tipo de despesa nas contas a pagar."
        maxLength={80}
        value={values.name}
        error={errors.name}
      >
        <Input
          id="cat-name"
          name="name"
          maxLength={80}
          autoComplete="off"
          placeholder="Ex: Marketing digital"
          value={values.name}
          onChange={(e) => setValue("name", e.target.value)}
          onBlur={() => markTouched("name")}
          aria-invalid={Boolean(errors.name)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id="cat-order"
          label="Ordem de exibição"
          helpText="Menor número aparece primeiro."
          error={errors.sort_order}
        >
          <Input
            id="cat-order"
            name="sort_order"
            type="number"
            min="0"
            max="9999"
            value={String(values.sort_order)}
            onChange={(e) => setValue("sort_order", Number(e.target.value) || 0)}
            onBlur={() => markTouched("sort_order")}
          />
        </Field>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/30">
          <Switch
            id="cat-active"
            checked={values.active}
            onChange={(e) => setValue("active", e.currentTarget.checked)}
            label={values.active ? "Ativa" : "Inativa"}
          />
          <p className="mt-1 pl-11 text-xs text-zinc-500">
            Categorias inativas ficam ocultas nos dropdowns.
          </p>
        </div>
      </div>
    </FormDialog>
  );
}
