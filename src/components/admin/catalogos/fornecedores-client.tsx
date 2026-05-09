"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  upsertFornecedor,
  deleteFornecedor,
  toggleFornecedorActive,
  getFornecedores,
  lookupCnpj,
} from "@/app/actions/fornecedores";
import { fornecedorSchema } from "@/lib/schemas/catalog-schemas";
import { formatCNPJ, formatPhone, isValidCNPJ, stripFormat } from "@/lib/format-br";
import type { Fornecedor, CatalogFormState } from "@/types/catalog";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Truck,
  Power,
  PowerOff,
  DownloadCloud,
  Loader2,
  CheckCircle2,
  IdCard,
  Phone,
  Settings2,
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

interface FormValues {
  name: string;
  cnpj: string;
  categoria: string;
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  observacoes: string;
  sort_order: number;
  active: boolean;
}

export function FornecedoresClient({ initial }: { initial: Fornecedor[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<Fornecedor[]>(initial);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [deleting, setDeleting] = useState<Fornecedor | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [upsertState, upsertAction, isSaving] = useActionState(upsertFornecedor, init);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteFornecedor, init);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (upsertState.success) {
      toast(upsertState.message || "Salvo!");
      setShowForm(false);
      setEditing(null);
      router.refresh();
      getFornecedores().then(setItems);
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
      getFornecedores().then(setItems);
    } else if (deleteState.message && !deleteState.success) {
      toast(deleteState.message, "error");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = stripFormat(q);
    return items.filter((i) => {
      if (!showInactive && !i.active) return false;
      if (!q) return true;
      // CNPJ é guardado em dígitos, mas o usuário pode buscar com máscara.
      const cnpjMatch = qDigits && i.cnpj.includes(qDigits);
      return (
        i.name.toLowerCase().includes(q) ||
        cnpjMatch ||
        i.categoria.toLowerCase().includes(q) ||
        i.contato_nome.toLowerCase().includes(q)
      );
    });
  }, [search, items, showInactive]);

  const activeCount = useMemo(() => items.filter((i) => i.active).length, [items]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(item: Fornecedor) {
    setEditing(item);
    setShowForm(true);
  }

  function handleToggle(item: Fornecedor) {
    setTogglingId(item.id);
    startTransition(async () => {
      const next = !item.active;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: next } : i)),
      );
      const res = await toggleFornecedorActive(item.id, next);
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
            <BreadcrumbPage>Fornecedores</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Truck className="h-5 w-5 text-accent-600" /> Fornecedores
          </h2>
          <p className="text-sm text-zinc-500">
            {activeCount} ativo{activeCount === 1 ? "" : "s"} de {items.length} cadastrado
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
            Mostrar inativos
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome, CNPJ, categoria..."
              className="h-9 w-72 pl-8"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo Fornecedor
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
              <Truck className="h-6 w-6 text-zinc-400" />
            </div>
            {items.length === 0 ? (
              <>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nenhum fornecedor cadastrado
                </p>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Comece criando seu primeiro fornecedor. Você pode buscar dados pela
                  Receita Federal usando o CNPJ.
                </p>
                <Button size="sm" onClick={openCreate} className="mt-2">
                  <Plus className="h-4 w-4" /> Novo Fornecedor
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nenhum resultado encontrado
                </p>
                <p className="text-xs text-zinc-500">
                  Tente outro termo ou limpe a busca.
                </p>
                {search && (
                  <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                    Limpar busca
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs font-medium uppercase text-zinc-500">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2 hidden md:table-cell">Categoria</th>
                <th className="px-3 py-2 hidden lg:table-cell">CNPJ</th>
                <th className="px-3 py-2 hidden md:table-cell">Contato</th>
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
                  <td className="px-3 py-2 font-medium">
                    <div className="text-zinc-900 dark:text-zinc-100">{item.name}</div>
                    {item.contato_email && (
                      <a
                        href={`mailto:${item.contato_email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-zinc-500 hover:text-accent-600 hover:underline"
                      >
                        {item.contato_email}
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {item.categoria ? (
                      <Badge variant="muted" className="font-normal">
                        {item.categoria.length > 30
                          ? `${item.categoria.slice(0, 30)}…`
                          : item.categoria}
                      </Badge>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-500 tabular-nums hidden lg:table-cell">
                    {item.cnpj ? formatCNPJ(item.cnpj) : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300 hidden md:table-cell">
                    <div>{item.contato_nome || <span className="text-zinc-400">—</span>}</div>
                    {item.contato_telefone && (
                      <a
                        href={`tel:${item.contato_telefone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-zinc-500 hover:text-accent-600 hover:underline"
                      >
                        {formatPhone(item.contato_telefone)}
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {item.active ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="muted">Inativo</Badge>
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
        <FornecedorForm
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
            <AlertDialogTitle>Excluir Fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Confirma a exclusão de "${deleting?.name}"? Esta ação não pode ser desfeita.`}
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

function SectionHeader({ icon: Icon, title }: { icon: typeof IdCard; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon className="h-3.5 w-3.5 text-zinc-400" />
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h4>
      <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
    </div>
  );
}

function FornecedorForm({
  item,
  action,
  state,
  isSaving,
  onClose,
}: {
  item: Fornecedor | null;
  action: (formData: FormData) => void;
  state: CatalogFormState;
  isSaving: boolean;
  onClose: () => void;
}) {
  const initial: FormValues = useMemo(
    () => ({
      name: item?.name || "",
      cnpj: formatCNPJ(item?.cnpj || ""),
      categoria: item?.categoria || "",
      contato_nome: item?.contato_nome || "",
      contato_email: item?.contato_email || "",
      contato_telefone: formatPhone(item?.contato_telefone || ""),
      observacoes: item?.observacoes || "",
      sort_order: item?.sort_order ?? 0,
      active: item ? item.active : true,
    }),
    [item],
  );

  const { values, setValue, errors, markTouched, isValid, isDirty, validateAll } =
    useLiveValidation<FormValues>(fornecedorSchema, initial);

  // Após o primeiro blur, `useLiveValidation` reavalia o erro a cada
  // mudança — sem esperar novo blur. Antes do primeiro blur o erro fica
  // oculto para não poluir o form enquanto o usuário ainda está digitando.

  const { toast } = useToast();
  const [lookingUp, setLookingUp] = useState(false);
  const cnpjValid = isValidCNPJ(values.cnpj);
  const nameRef = useRef<HTMLInputElement>(null);

  // Foca o primeiro campo ao abrir o form. Cria ação suave: o usuário já
  // pode começar a digitar logo que o modal aparece.
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  async function handleLookup() {
    if (!cnpjValid || lookingUp) return;
    setLookingUp(true);
    const result = await lookupCnpj(stripFormat(values.cnpj));
    setLookingUp(false);

    if (!result.success || !result.data) {
      toast(result.message || "Não foi possível consultar o CNPJ.", "error");
      return;
    }

    const d = result.data;
    // Preenche apenas campos vazios para não sobrescrever entradas manuais.
    if (!values.name.trim() && d.name) setValue("name", d.name);
    if (!values.contato_email.trim() && d.email) setValue("contato_email", d.email);
    if (!values.contato_telefone.trim() && d.telefone) {
      setValue("contato_telefone", formatPhone(d.telefone));
    }
    if (!values.categoria.trim() && d.atividade_principal) {
      setValue("categoria", d.atividade_principal.slice(0, 80));
    }
    // Endereço completo vai para observações se ainda estiver vazio.
    if (!values.observacoes.trim()) {
      const enderecoCompleto = [d.endereco, d.municipio && `${d.municipio}/${d.uf}`, d.cep && `CEP ${d.cep}`]
        .filter(Boolean)
        .join(" — ");
      const sit = d.situacao ? `Situação cadastral: ${d.situacao}` : "";
      const obs = [enderecoCompleto, sit].filter(Boolean).join("\n");
      if (obs) setValue("observacoes", obs);
    }

    toast("Dados preenchidos pela Receita Federal.");
  }

  const filled = (values.name.trim().length >= 2 ? 1 : 0);

  function submit() {
    if (!validateAll()) return;
    const fd = new FormData();
    if (item) fd.set("id", item.id);
    fd.set("name", values.name);
    // Persiste apenas os dígitos do CNPJ/telefone (formatação é exibição).
    fd.set("cnpj", stripFormat(values.cnpj));
    fd.set("categoria", values.categoria);
    fd.set("contato_nome", values.contato_nome);
    fd.set("contato_email", values.contato_email);
    fd.set("contato_telefone", stripFormat(values.contato_telefone));
    fd.set("observacoes", values.observacoes);
    fd.set("sort_order", String(values.sort_order));
    if (values.active) fd.set("active", "on");
    action(fd);
  }

  return (
    <FormDialog
      open
      title={item ? "Editar Fornecedor" : "Novo Fornecedor"}
      subtitle={
        item
          ? "Atualize os dados do fornecedor"
          : "Cadastre um novo fornecedor"
      }
      isDirty={isDirty}
      onClose={onClose}
      onSubmit={submit}
      isSaving={isSaving}
      canSave={isValid}
      serverError={!state.success ? state.message : undefined}
      progress={{ filled, total: 1 }}
      submitLabel={item ? "Salvar alterações" : "Criar Fornecedor"}
      size="lg"
    >
      <SectionHeader icon={IdCard} title="Identificação" />

      <Field
        id="forn-name"
        label="Nome"
        required
        helpText="Razão social ou nome fantasia."
        maxLength={120}
        value={values.name}
        error={errors.name}
      >
        <Input
          id="forn-name"
          ref={nameRef}
          name="name"
          maxLength={120}
          autoComplete="off"
          placeholder="Ex: Gráfica Central Ltda"
          value={values.name}
          onChange={(e) => setValue("name", e.target.value)}
          onBlur={() => markTouched("name")}
          aria-invalid={Boolean(errors.name)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id="forn-cnpj"
          label="CNPJ"
          helpText={cnpjValid ? "CNPJ válido — use Buscar para preencher pela Receita." : undefined}
          error={errors.cnpj}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="forn-cnpj"
                name="cnpj"
                maxLength={20}
                placeholder="00.000.000/0000-00"
                value={values.cnpj}
                onChange={(e) => setValue("cnpj", formatCNPJ(e.target.value))}
                onBlur={() => markTouched("cnpj")}
                inputMode="numeric"
                aria-invalid={Boolean(errors.cnpj)}
                className={cnpjValid ? "pr-8" : ""}
              />
              {cnpjValid && (
                <CheckCircle2
                  className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
                  aria-label="CNPJ válido"
                />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLookup}
              disabled={!cnpjValid || lookingUp}
              title={cnpjValid ? "Consultar Receita Federal" : "Digite um CNPJ válido"}
              className="shrink-0"
            >
              {lookingUp ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <DownloadCloud className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline ml-1">Buscar</span>
            </Button>
          </div>
        </Field>

        <Field
          id="forn-categoria"
          label="Categoria"
          helpText="Tipo de fornecimento (serviço, material...)."
          error={errors.categoria}
        >
          <Input
            id="forn-categoria"
            name="categoria"
            maxLength={80}
            placeholder="Ex: Material gráfico"
            value={values.categoria}
            onChange={(e) => setValue("categoria", e.target.value)}
            onBlur={() => markTouched("categoria")}
          />
        </Field>
      </div>

      <SectionHeader icon={Phone} title="Contato" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id="forn-contato"
          label="Pessoa de contato"
          error={errors.contato_nome}
        >
          <Input
            id="forn-contato"
            name="contato_nome"
            maxLength={120}
            placeholder="Nome do responsável"
            value={values.contato_nome}
            onChange={(e) => setValue("contato_nome", e.target.value)}
            onBlur={() => markTouched("contato_nome")}
            aria-invalid={Boolean(errors.contato_nome)}
          />
        </Field>

        <Field
          id="forn-telefone"
          label="Telefone / WhatsApp"
          error={errors.contato_telefone}
        >
          <Input
            id="forn-telefone"
            name="contato_telefone"
            maxLength={40}
            placeholder="(00) 00000-0000"
            value={values.contato_telefone}
            onChange={(e) => setValue("contato_telefone", formatPhone(e.target.value))}
            onBlur={() => markTouched("contato_telefone")}
            inputMode="tel"
            aria-invalid={Boolean(errors.contato_telefone)}
          />
        </Field>
      </div>

      <Field
        id="forn-email"
        label="E-mail"
        error={errors.contato_email}
      >
        <Input
          id="forn-email"
          name="contato_email"
          type="email"
          maxLength={160}
          placeholder="contato@fornecedor.com.br"
          value={values.contato_email}
          onChange={(e) => setValue("contato_email", e.target.value.toLowerCase())}
          onBlur={() => markTouched("contato_email")}
          aria-invalid={Boolean(errors.contato_email)}
        />
      </Field>

      <SectionHeader icon={Settings2} title="Outros" />

      <Field
        id="forn-obs"
        label="Observações"
        helpText="Notas internas (condições, prazos típicos, restrições)."
        maxLength={2000}
        value={values.observacoes}
        error={errors.observacoes}
      >
        <textarea
          id="forn-obs"
          name="observacoes"
          rows={3}
          maxLength={2000}
          placeholder="Anotações sobre este fornecedor..."
          value={values.observacoes}
          onChange={(e) => setValue("observacoes", e.target.value)}
          onBlur={() => markTouched("observacoes")}
          className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
          aria-invalid={Boolean(errors.observacoes)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id="forn-order"
          label="Ordem de exibição"
          helpText="Menor número aparece primeiro."
          error={errors.sort_order}
        >
          <Input
            id="forn-order"
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
            id="forn-active"
            checked={values.active}
            onChange={(e) => setValue("active", e.currentTarget.checked)}
            label={values.active ? "Ativo" : "Inativo"}
          />
          <p className="mt-1 pl-11 text-xs text-zinc-500">
            Fornecedores inativos ficam ocultos nos dropdowns.
          </p>
        </div>
      </div>
    </FormDialog>
  );
}
