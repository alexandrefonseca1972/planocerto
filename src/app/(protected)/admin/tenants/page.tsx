"use client";

import { useActionState, useState, useEffect } from "react";
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
} from "@/types/tenant";
import type { Tenant } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { sanitizeInput, formatDate } from "@/lib/utils";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  Shield,
  User,
  UserPlus,
  Crown,
} from "lucide-react";

const initialState: TenantFormState = { message: undefined, errors: {} };

export default function AdminTenantsPage() {
  const { allTenants, currentTenant } = useTenant();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [managingTenant, setManagingTenant] = useState<Tenant | null>(null);

  const [createState, createAction, isCreating] = useActionState(createTenant, initialState);
  const [updateState, updateAction, isUpdating] = useActionState(updateTenant, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteTenant, initialState);

  const planLabel: Record<string, string> = {
    free: "Gratuito", pro: "Profissional", enterprise: "Enterprise",
  };
  const planColor: Record<string, string> = {
    free: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    pro: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    enterprise: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Empresas
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie empresas e seus membros.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Nova empresa
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allTenants.map((tenant) => (
          <Card
            key={tenant.id}
            className={`transition-shadow hover:shadow-md ${
              currentTenant?.id === tenant.id
                ? "ring-2 ring-zinc-900 dark:ring-zinc-50"
                : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Building2 className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{tenant.name}</CardTitle>
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {tenant.slug}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${planColor[tenant.plan]}`}
                >
                  {planLabel[tenant.plan]}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Criado em {formatDate(tenant.created_at)}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManagingTenant(tenant)}
                >
                  <Users className="mr-1 h-3.5 w-3.5" />
                  Membros
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingTenant(tenant)}
                  aria-label="Editar empresa"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingTenant(tenant)}
                  aria-label="Excluir empresa"
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreate && (
        <TenantFormDialog
          title="Nova empresa"
          state={createState}
          action={createAction}
          isPending={isCreating}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingTenant && (
        <TenantFormDialog
          title="Editar empresa"
          state={updateState}
          action={updateAction}
          isPending={isUpdating}
          onClose={() => setEditingTenant(null)}
          tenant={editingTenant}
        />
      )}

      <AlertDialog
        open={!!deletingTenant}
        onOpenChange={(open) => { if (!open) setDeletingTenant(null); }}
      >
        {deletingTenant && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {deletingTenant.name}
                </strong>
                ? Todos os dados associados serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteState.message && (
              <div className={`mb-3 rounded-md p-3 text-sm ${
                deleteState.success
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border border-red-300 bg-red-50 text-red-800"
              }`}>
                {deleteState.message}
              </div>
            )}

            <form action={deleteAction}>
              <input type="hidden" name="tenantId" value={deletingTenant.id} />
              <AlertDialogFooter>
                <AlertDialogCancel />
                <Button type="submit" variant="destructive" isLoading={isDeleting}>
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {managingTenant && (
        <MemberManager
          tenant={managingTenant}
          onClose={() => setManagingTenant(null)}
        />
      )}
    </div>
  );
}

function TenantFormDialog({
  title,
  state,
  action,
  isPending,
  onClose,
  tenant,
}: {
  title: string;
  state: TenantFormState;
  action: (payload: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  tenant?: Tenant;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form action={action} className="space-y-4">
          {tenant && <input type="hidden" name="tenantId" value={tenant.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Nome</Label>
            <Input
              id="t-name" name="name" placeholder="Nome da empresa"
              defaultValue={tenant?.name} required
              onChange={(e) => { e.target.value = sanitizeInput(e.target.value); }}
            />
            {state.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-slug">Slug</Label>
            <Input
              id="t-slug" name="slug" placeholder="nome-da-empresa"
              defaultValue={tenant?.slug} required
              onChange={(e) => {
                e.target.value = sanitizeInput(e.target.value).toLowerCase().replace(/\s+/g, "-");
              }}
            />
            {state.errors?.slug && <p className="text-sm text-red-600">{state.errors.slug[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-plan">Plano</Label>
            <select
              id="t-plan" name="plan" defaultValue={tenant?.plan || "free"}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="free">Gratuito</option>
              <option value="pro">Profissional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-webhook">Teams Webhook URL</Label>
            <Input
              id="t-webhook" name="teams_webhook_url" placeholder="https://xxx.webhook.office.com/..."
              defaultValue={tenant?.teams_webhook_url || ""}
              onChange={(e) => { e.target.value = sanitizeInput(e.target.value); }}
            />
            <p className="text-xs text-zinc-400">Receba notificações no Microsoft Teams quando ações forem criadas ou atualizadas.</p>
          </div>
          {state.message && (
            <div className={`rounded-md p-3 text-sm ${
              state.success
                ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "border border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
            }`}>
              {state.message}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" isLoading={isPending}>
              {title === "Nova empresa" ? "Criar" : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
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
    return () => { cancelled = true; };
  }, [tenant.id]);

  const roleLabel: Record<string, string> = { owner: "Dono", admin: "Admin", member: "Membro" };
  const roleColor: Record<string, string> = {
    owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    member: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
  const roleIcon: Record<string, React.ReactNode> = {
    owner: <Crown className="h-3 w-3" />,
    admin: <Shield className="h-3 w-3" />,
    member: <User className="h-3 w-3" />,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-700">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Membros
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tenant.name}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <form action={addAction} className="mb-4 flex gap-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <Input
              name="email"
              type="email"
              placeholder="Email do usuário..."
              className="flex-1"
              required
            />
            <Button type="submit" size="sm" isLoading={isAdding}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </form>

          {addState.message && (
            <div className={`mb-3 rounded-md p-2 text-xs ${
              addState.success
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
            }`}>
              {addState.message}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-zinc-400">Carregando...</p>
            ) : members.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">Nenhum membro.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium dark:bg-zinc-800">
                        {(m.profiles?.name?.[0] || m.profiles?.email?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {m.profiles?.name || "Sem nome"}
                          </p>
                          <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${roleColor[m.role]}`}>
                            {roleIcon[m.role]}
                            {roleLabel[m.role]}
                          </span>
                        </div>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {m.profiles?.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={roleAction} className="flex items-center gap-1">
                        <input type="hidden" name="memberId" value={m.id} />
                        <select
                          name="role"
                          defaultValue={m.role}
                          className="h-7 rounded border border-zinc-200 bg-white px-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                        >
                          <option value="owner">Dono</option>
                          <option value="admin">Admin</option>
                          <option value="member">Membro</option>
                        </select>
                        <Button type="submit" variant="ghost" size="icon" className="h-7 w-7" isLoading={isChangingRole}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </form>
                      <form action={removeAction}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 text-red-600" isLoading={isRemoving}>
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
