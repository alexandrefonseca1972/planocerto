"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useTenant } from "@/lib/contexts/tenant-context";
import {
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantMembers,
  addTenantMember,
  removeTenantMember,
  updateTenantMemberRole,
} from "@/app/actions/tenant";
import type {
  TenantFormState,
  TenantMemberWithProfile,
  Tenant,
} from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { useLiveValidation } from "@/lib/hooks/use-live-validation";
import { tenantFormSchema, type TenantFormValues } from "@/lib/schemas/tenant-schemas";
import { formatCNPJ, formatPhone } from "@/lib/format-br";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  Shield,
  User as UserIcon,
  UserPlus,
  Crown,
  CheckCircle2,
  CircleSlash,
} from "lucide-react";

const initialState: TenantFormState = { message: undefined, errors: {} };

const PLAN_LABEL = { free: "Gratuito", pro: "Profissional", enterprise: "Enterprise" } as const;

function planBadge(plan: Tenant["plan"]) {
  if (plan === "enterprise") return <Badge variant="default">Enterprise</Badge>;
  if (plan === "pro") return <Badge variant="accent">Profissional</Badge>;
  return <Badge variant="muted">Gratuito</Badge>;
}

export default function AdminTenantsPage() {
  const { allTenants, currentTenant } = useTenant();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState<Tenant | null>(null);
  const [managing, setManaging] = useState<Tenant | null>(null);
  const [search, setSearch] = useState("");

  const [createState, createAction, isCreating] = useActionState(createTenant, initialState);
  const [updateState, updateAction, isUpdating] = useActionState(updateTenant, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteTenant, initialState);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTenants;
    return allTenants.filter(
      (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }, [search, allTenants]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <Building2 className="h-5 w-5 text-accent-600" /> Empresas
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {allTenants.length} {allTenants.length === 1 ? "empresa" : "empresas"} ·
            Gerencie organizações e seus membros.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa..."
            className="h-9 w-64"
          />
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4" /> Nova Empresa
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            {allTenants.length === 0
              ? "Nenhuma empresa cadastrada."
              : "Nenhum resultado para a busca."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tenant) => {
            const isActive = currentTenant?.id === tenant.id;
            return (
              <Card
                key={tenant.id}
                className={`transition-all hover:shadow-md ${
                  isActive
                    ? "ring-2 ring-accent-500 ring-offset-2 dark:ring-offset-zinc-900"
                    : ""
                }`}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/40">
                        <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-200" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {tenant.name}
                        </h3>
                        <p className="truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                          {tenant.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {planBadge(tenant.plan)}
                      {isActive && <Badge variant="accent">Atual</Badge>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      {tenant.active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <CircleSlash className="h-3 w-3 text-zinc-400" />
                          Inativa
                        </>
                      )}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span>Criada em {formatDate(tenant.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <Button variant="ghost" size="sm" onClick={() => setManaging(tenant)}>
                      <Users className="h-3.5 w-3.5" /> Membros
                    </Button>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(tenant)}
                        aria-label="Editar empresa"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(tenant)}
                        aria-label="Excluir empresa"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <TenantFormDialog
          state={createState}
          action={createAction}
          isPending={isCreating}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <TenantFormDialog
          state={updateState}
          action={updateAction}
          isPending={isUpdating}
          onClose={() => setEditing(null)}
          tenant={editing}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        {deleting && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {deleting.name}
                </strong>
                ? Todos os dados associados (planos, escolas, empresas B2B,
                cenários, áreas, unidades) serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteState.message && !deleteState.success && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                {deleteState.message}
              </div>
            )}

            <form action={deleteAction}>
              <input type="hidden" name="tenantId" value={deleting.id} />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <Button type="submit" variant="destructive" isLoading={isDeleting}>
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {managing && <MemberManager tenant={managing} onClose={() => setManaging(null)} />}
    </div>
  );
}

function TenantFormDialog({
  state,
  action,
  isPending,
  onClose,
  tenant,
}: {
  state: TenantFormState;
  action: (payload: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  tenant?: Tenant;
}) {
  const isEdit = !!tenant;
  const initial: TenantFormValues = useMemo(
    () => ({
      name: tenant?.name || "",
      plan: (tenant?.plan as TenantFormValues["plan"]) || "free",
      active: tenant?.active ?? true,
      teams_webhook_url: tenant?.teams_webhook_url || "",
      cnpj: tenant?.cnpj || "",
      responsavel_nome: tenant?.responsavel_nome || "",
      email: tenant?.email || "",
      site: tenant?.site || "",
      fone: tenant?.fone || "",
    }),
    [tenant],
  );

  const { values, setValue, errors, markTouched, isValid, isDirty, validateAll } =
    useLiveValidation<TenantFormValues>(tenantFormSchema, initial);

  const filled =
    (values.name.trim().length >= 2 ? 1 : 0) +
    (values.plan ? 1 : 0);

  function submit() {
    if (!validateAll()) return;
    const fd = new FormData();
    if (tenant) fd.set("tenantId", tenant.id);
    fd.set("name", values.name);
    fd.set("plan", values.plan);
    if (values.active) fd.set("active", "on");
    fd.set("teams_webhook_url", values.teams_webhook_url || "");
    fd.set("cnpj", values.cnpj || "");
    fd.set("responsavel_nome", values.responsavel_nome || "");
    fd.set("email", values.email || "");
    fd.set("site", values.site || "");
    fd.set("fone", values.fone || "");
    action(fd);
  }

  return (
    <FormDialog
      open
      title={isEdit ? "Editar empresa" : "Nova empresa"}
      subtitle={
        isEdit
          ? "Atualize os dados da empresa"
          : "Cadastre uma nova organização (camada acima das unidades)"
      }
      isDirty={isDirty}
      onClose={onClose}
      onSubmit={submit}
      isSaving={isPending}
      canSave={isValid}
      serverError={!state.success ? state.message : undefined}
      progress={{ filled, total: 2 }}
      submitLabel={isEdit ? "Salvar alterações" : "Criar empresa"}
      size="lg"
    >
      <Field
        id="t-name"
        label="Nome"
        required
        helpText="Nome legível da organização (ex: Estácio, IDOMED, IBMEC)."
        maxLength={100}
        value={values.name}
        error={errors.name || (state.errors?.name?.[0] as string | undefined)}
      >
        <Input
          id="t-name"
          name="name"
          maxLength={100}
          autoComplete="off"
          placeholder="Ex: Estácio"
          value={values.name}
          onChange={(e) => setValue("name", e.target.value)}
          onBlur={() => markTouched("name")}
          aria-invalid={Boolean(errors.name)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="t-plan" label="Plano" required helpText="Nível de assinatura.">
          <Select
            id="t-plan"
            name="plan"
            value={values.plan}
            onChange={(e) =>
              setValue("plan", e.target.value as TenantFormValues["plan"])
            }
            onBlur={() => markTouched("plan")}
          >
            <option value="free">{PLAN_LABEL.free}</option>
            <option value="pro">{PLAN_LABEL.pro}</option>
            <option value="enterprise">{PLAN_LABEL.enterprise}</option>
          </Select>
        </Field>

        <Field id="t-active" label="Status" helpText="Empresas inativas ficam ocultas.">
          <div className="flex h-10 items-center px-1">
            <Switch
              id="t-active"
              checked={values.active}
              onChange={(e) => setValue("active", e.currentTarget.checked)}
              label={values.active ? "Ativa" : "Inativa"}
            />
          </div>
        </Field>
      </div>

      {/* Bloco: Cadastro / Contato — todos opcionais */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/40 p-3 dark:border-zinc-700 dark:bg-zinc-800/20">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Cadastro & Contato (opcional)
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              id="t-cnpj"
              label="CNPJ"
              helpText="Documento da empresa."
              error={errors.cnpj}
              value={values.cnpj}
            >
              <Input
                id="t-cnpj"
                name="cnpj"
                inputMode="numeric"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
                value={values.cnpj}
                onChange={(e) => setValue("cnpj", formatCNPJ(e.target.value))}
                onBlur={() => markTouched("cnpj")}
                aria-invalid={Boolean(errors.cnpj)}
                maxLength={18}
                className="font-mono"
              />
            </Field>

            <Field
              id="t-fone"
              label="Telefone"
              helpText="DDD + número (fixo ou celular)."
              error={errors.fone}
              value={values.fone}
            >
              <Input
                id="t-fone"
                name="fone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="(11) 99999-9999"
                value={values.fone}
                onChange={(e) => setValue("fone", formatPhone(e.target.value))}
                onBlur={() => markTouched("fone")}
                aria-invalid={Boolean(errors.fone)}
                maxLength={15}
                className="font-mono"
              />
            </Field>
          </div>

          <Field
            id="t-responsavel"
            label="Nome do responsável"
            helpText="Pessoa de contato principal."
            error={errors.responsavel_nome}
            value={values.responsavel_nome}
            maxLength={120}
          >
            <Input
              id="t-responsavel"
              name="responsavel_nome"
              autoComplete="off"
              placeholder="Ex: Maria Silva"
              maxLength={120}
              value={values.responsavel_nome}
              onChange={(e) => setValue("responsavel_nome", e.target.value)}
              onBlur={() => markTouched("responsavel_nome")}
              aria-invalid={Boolean(errors.responsavel_nome)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              id="t-email"
              label="E-mail"
              helpText="Contato corporativo."
              error={errors.email}
              value={values.email}
              maxLength={120}
            >
              <Input
                id="t-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="contato@empresa.com.br"
                maxLength={120}
                value={values.email}
                onChange={(e) => setValue("email", e.target.value.trim())}
                onBlur={() => markTouched("email")}
                aria-invalid={Boolean(errors.email)}
              />
            </Field>

            <Field
              id="t-site"
              label="Site"
              helpText="Página oficial."
              error={errors.site}
              value={values.site}
              maxLength={200}
            >
              <Input
                id="t-site"
                name="site"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="empresa.com.br"
                maxLength={200}
                value={values.site}
                onChange={(e) => setValue("site", e.target.value.trim())}
                onBlur={() => markTouched("site")}
                aria-invalid={Boolean(errors.site)}
              />
            </Field>
          </div>
        </div>
      </div>

      <Field
        id="t-webhook"
        label="Microsoft Teams Webhook"
        helpText="Opcional. Recebe notificações de criação/atualização de planos."
        error={errors.teams_webhook_url}
        value={values.teams_webhook_url}
        maxLength={500}
      >
        <Input
          id="t-webhook"
          name="teams_webhook_url"
          type="url"
          autoComplete="off"
          placeholder="https://xxx.webhook.office.com/webhookb2/..."
          value={values.teams_webhook_url}
          onChange={(e) => setValue("teams_webhook_url", e.target.value)}
          onBlur={() => markTouched("teams_webhook_url")}
          aria-invalid={Boolean(errors.teams_webhook_url)}
        />
      </Field>
    </FormDialog>
  );
}

function MemberManager({
  tenant,
  onClose,
}: {
  tenant: Tenant;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<TenantMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [addState, addAction, isAdding] = useActionState(addTenantMember, initialState);
  const [, removeAction, isRemoving] = useActionState(removeTenantMember, initialState);
  const [, roleAction, isChangingRole] = useActionState(updateTenantMemberRole, initialState);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const data = await getTenantMembers(tenant.id);
      if (!cancelled) {
        setMembers(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tenant.id]);

  // Re-carrega ao adicionar com sucesso
  useEffect(() => {
    if (addState.success) {
      getTenantMembers(tenant.id).then(setMembers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addState.success]);

  const roleLabel: Record<string, string> = {
    owner: "Dono",
    admin: "Admin",
    member: "Membro",
  };
  const roleVariant: Record<string, "warning" | "accent" | "success"> = {
    owner: "warning",
    admin: "accent",
    member: "success",
  };
  const roleIcon: Record<string, React.ReactNode> = {
    owner: <Crown className="h-3 w-3" />,
    admin: <Shield className="h-3 w-3" />,
    member: <UserIcon className="h-3 w-3" />,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-700">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Membros
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tenant.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <form action={addAction} className="flex gap-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <Input
              name="email"
              type="email"
              placeholder="email@usuário.com"
              className="flex-1"
              required
            />
            <Button type="submit" size="sm" isLoading={isAdding}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </form>

          {addState.message && (
            <div
              className={`rounded-md p-2 text-xs ${
                addState.success
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
              }`}
            >
              {addState.message}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-zinc-400">Carregando...</p>
            ) : members.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">
                Nenhum membro nesta empresa.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                        {(m.profiles?.name?.[0] || m.profiles?.email?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {m.profiles?.name || "Sem nome"}
                          </p>
                          <Badge variant={roleVariant[m.role] || "muted"} className="gap-0.5">
                            {roleIcon[m.role]}
                            {roleLabel[m.role]}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {m.profiles?.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={roleAction} className="flex items-center gap-1">
                        <input type="hidden" name="memberId" value={m.id} />
                        <Select
                          name="role"
                          defaultValue={m.role}
                          className="h-7 px-1.5 text-xs"
                        >
                          <option value="owner">Dono</option>
                          <option value="admin">Admin</option>
                          <option value="member">Membro</option>
                        </Select>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          isLoading={isChangingRole}
                          aria-label="Salvar papel"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </form>
                      <form action={removeAction}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          isLoading={isRemoving}
                          aria-label="Remover membro"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
