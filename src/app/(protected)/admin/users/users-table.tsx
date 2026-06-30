"use client";

import { useActionState, useState, useCallback, useEffect, useRef, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  resendConfirmation,
  resetUserPassword,
  bulkDeleteUsers,
  getUserImpact,
  getAllAreas,
  getAllUnits,
  getUserAreaIds,
  getUserUnitIds,
  getUserAuditLog,
} from "@/app/actions/admin";
import type {
  AdminFormState,
  AreaOption,
  UnitOption,
  AuditLogEntry,
} from "@/app/actions/admin";
import { getBulkUserTenantIds, getUserTenantMemberships } from "@/app/actions/tenant";
import type { TenantMembership } from "@/app/actions/tenant";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { AuditLogDialog } from "./audit-log-dialog";
import type { RoleRow } from "@/app/actions/admin";
import type { Tenant } from "@/types/tenant";
import type { Profile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { sanitize } from "@/lib/sanitize";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  User,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ban,
  RefreshCw,
  Download,
  Copy,
  CheckCheck,
  History,
  KeyRound,
  Mail,
} from "lucide-react";

const createInitialState: AdminFormState = { message: undefined, errors: {} };
const DEBOUNCE_MS = 300;


/** Gera as iniciais de um nome (até 2 letras). */
function userInitials(name: string, email: string): string {
  const parts = (name || email || "?").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

/** Cor de fundo determinística baseada no email (consistente entre renders). */
function avatarColor(email: string): string {
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Gerente",
  viewer: "Visualizador",
  user: "Usuário",
};

function roleLabel(role: string, customRoles: RoleRow[]): string {
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  const custom = customRoles.find((r) => r.name === role);
  return custom?.name || role;
}

function exportToCSV(
  users: Profile[],
  tenants: Tenant[],
  userTenantMap: Map<string, string[]>,
  customRoles: RoleRow[]
) {
  const headers = ["Nome", "Email", "Papel", "Ativo", "Restrição de Horário", "Empresas", "Criado em"];
  const rows = users.map((u) => {
    const tenantIds = userTenantMap.get(u.id) || [];
    const tenantNames = tenantIds
      .map((tid) => tenants.find((t) => t.id === tid)?.name || tid)
      .join("; ");
    const timeRestriction =
      u.login_start_time && u.login_end_time
        ? `${u.login_start_time}-${u.login_end_time}`
        : "";
    return [
      u.name,
      u.email,
      roleLabel(u.role, customRoles),
      u.is_active ? "Sim" : "Não",
      timeRestriction,
      tenantNames,
      formatDate(u.created_at),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `usuarios-planocerto-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function UsersTable({
  users,
  total,
  currentPage,
  perPage,
  customRoles = [],
  initialSearch = "",
  initialStatus = "all",
  initialRole = "",
  isSuperAdmin = false,
  initialTenants = [],
}: {
  users: Profile[];
  total: number;
  currentPage: number;
  perPage: number;
  customRoles?: RoleRow[];
  initialSearch?: string;
  initialStatus?: "all" | "active" | "inactive";
  initialRole?: string;
  isSuperAdmin?: boolean;
  initialTenants?: Tenant[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<Profile | null>(null);
  const [reactivatingUser, setReactivatingUser] = useState<Profile | null>(null);
  const [resendingUser, setResendingUser] = useState<Profile | null>(null);
  const [resettingUser, setResettingUser] = useState<Profile | null>(null);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(initialStatus);
  const [sortKey, setSortKey] = useState<keyof Profile>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [allTenants] = useState<Tenant[]>(initialTenants);
  const [allAreas, setAllAreas] = useState<AreaOption[]>([]);
  const [allUnits, setAllUnits] = useState<UnitOption[]>([]);
  const [editingUserTenantIds, setEditingUserTenantIds] = useState<string[]>([]);
  const [editingUserTenantRoles, setEditingUserTenantRoles] = useState<Record<string, string>>({});
  const [editingUserAreaIds, setEditingUserAreaIds] = useState<string[]>([]);
  const [editingUserUnitIds, setEditingUserUnitIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<string>(initialRole);
  const [tenantFilter, setTenantFilter] = useState<string>("");
  const [userTenantMap, setUserTenantMap] = useState<Map<string, string[]>>(new Map());
  const [deleteImpact, setDeleteImpact] = useState<{ tenantMemberships: number; actionPlans: number } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [auditingUser, setAuditingUser] = useState<Profile | null>(null);
  const [userAuditLog, setUserAuditLog] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [createState, createAction, isCreating] = useActionState(createUser, createInitialState);
  const [updateState, updateAction, isUpdating] = useActionState(updateUser, createInitialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteUser, createInitialState);
  const [deactivateState, deactivateAction, isDeactivating] = useActionState(deactivateUser, createInitialState);
  const [activateState, activateAction, isActivating] = useActionState(activateUser, createInitialState);
  const [resendState, resendAction, isResending] = useActionState(resendConfirmation, createInitialState);
  const [resetState, resetAction, isResetting] = useActionState(resetUserPassword, createInitialState);
  const [bulkDeleteState, bulkDeleteAction, isBulkDeleting] = useActionState(bulkDeleteUsers, createInitialState);

  useEffect(() => {
    if (!bulkDeleteState.success) return;
    const t = setTimeout(() => {
      setSelectedIds(new Set());
      setConfirmingBulkDelete(false);
    }, 0);
    return () => clearTimeout(t);
  }, [bulkDeleteState]);

  useEffect(() => {
    if (!deleteState.success) return;
    const t = setTimeout(() => setDeletingUser(null), 0);
    return () => clearTimeout(t);
  }, [deleteState]);

  useEffect(() => {
    if (!deactivateState.success) return;
    const t = setTimeout(() => setDeactivatingUser(null), 0);
    return () => clearTimeout(t);
  }, [deactivateState]);

  useEffect(() => {
    if (!activateState.success) return;
    const t = setTimeout(() => setReactivatingUser(null), 0);
    return () => clearTimeout(t);
  }, [activateState]);

  useEffect(() => {
    if (!resendState.success) return;
    const t = setTimeout(() => setResendingUser(null), 0);
    return () => clearTimeout(t);
  }, [resendState]);

  useEffect(() => {
    if (!resetState.success) return;
    const pw = resetState.data?.password ?? null;
    const t = setTimeout(() => {
      setResettingUser(null);
      if (pw) setGeneratedPassword(pw);
    }, 0);
    return () => clearTimeout(t);
  }, [resetState]);

  useEffect(() => {
    if (!updateState.success) return;
    const t = setTimeout(() => setEditingUser(null), 0);
    return () => clearTimeout(t);
  }, [updateState]);

  useEffect(() => {
    Promise.all([getAllAreas(), getAllUnits()])
      .then(([a, u]) => { setAllAreas(a); setAllUnits(u); })
      .catch(() => { /* dados de apoio indisponíveis — dialogs ficarão com listas vazias */ });
  }, []);

  useEffect(() => {
    if (users.length === 0) return;
    getBulkUserTenantIds(users.map((u) => u.id))
      .then(setUserTenantMap)
      .catch(() => { /* filtro de tenant ficará inativo */ });
  }, [users]);

  const handleEditUser = useCallback(async (user: Profile) => {
    try {
      const [memberships, aIds, uIds] = await Promise.all([
        getUserTenantMemberships(user.id),
        getUserAreaIds(user.id),
        getUserUnitIds(user.id),
      ]);
      const tIds = memberships.map((m: TenantMembership) => m.tenantId);
      const tRoles = Object.fromEntries(memberships.map((m: TenantMembership) => [m.tenantId, m.role]));
      setEditingUserTenantIds(tIds);
      setEditingUserTenantRoles(tRoles);
      setEditingUserAreaIds(aIds);
      setEditingUserUnitIds(uIds);
      setEditingUser(user);
    } catch {
      toast("Erro ao carregar dados do usuário. Tente novamente.", "error");
    }
  }, [toast]);

  const handleViewAudit = useCallback(async (user: Profile) => {
    setAuditingUser(user);
    setLoadingAudit(true);
    try {
      const log = await getUserAuditLog(user.id);
      setUserAuditLog(log);
    } catch {
      setUserAuditLog([]);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  const handleDeleteClick = useCallback(async (user: Profile) => {
    try {
      const impact = await getUserImpact(user.id);
      setDeleteImpact(impact);
    } catch {
      setDeleteImpact(null); // mostra diálogo sem dados de impacto
    }
    setDeletingUser(user);
  }, []);

  const handleSort = useCallback(
    (key: keyof Profile) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const pushQuery = useCallback(
    (next: { q?: string; status?: "all" | "active" | "inactive"; role?: string; page?: number }) => {
      const sp = new URLSearchParams();
      const q = next.q ?? search;
      const st = next.status ?? statusFilter;
      const rl = next.role !== undefined ? next.role : roleFilter;
      const page = next.page ?? 1;
      if (q.trim()) sp.set("q", q.trim());
      if (st !== "all") sp.set("status", st);
      if (rl) sp.set("role", rl);
      if (page > 1) sp.set("page", String(page));
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router, pathname, search, statusFilter, roleFilter]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== initialSearch) {
        pushQuery({ q: search, page: 1 });
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, initialSearch, pushQuery]);

  const filteredSorted = useMemo(() => {
    // roleFilter é aplicado no servidor — aqui só filtramos por tenant (client-side via mapa)
    const filtered = users.filter((u) => {
      return !tenantFilter || (userTenantMap.get(u.id) || []).includes(tenantFilter);
    });

    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        return sortDir === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [users, tenantFilter, sortKey, sortDir, userTenantMap]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredSorted.length && filteredSorted.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSorted.map((u) => u.id)));
    }
  }, [selectedIds.size, filteredSorted]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const totalPages = Math.ceil(total / perPage);

  const statusMessage = (state: AdminFormState) => {
    if (!state.message) return null;
    return (
      <div
        className={cn(
          "rounded-md p-3 text-sm",
          state.success
            ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            : "border border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
        )}
      >
        {state.message}
      </div>
    );
  };

  const handleCreateClose = useCallback(() => {
    setShowCreateDialog(false);
  }, []);

  useEffect(() => {
    if (!createState.success) return;
    const pw = createState.data?.password ?? null;
    const t = setTimeout(() => {
      setShowCreateDialog(false);
      if (pw) setGeneratedPassword(pw);
    }, 0);
    return () => clearTimeout(t);
  }, [createState]);

  const pageUrl = (page: number) => {
    const sp = new URLSearchParams();
    if (search.trim()) sp.set("q", search.trim());
    if (statusFilter !== "all") sp.set("status", statusFilter);
    if (roleFilter) sp.set("role", roleFilter);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({total})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Buscar usuários..."
                  value={search}
                  onChange={(e) => { setSearch(sanitize(e.target.value)); setSelectedIds(new Set()); }}
                  className="pl-8"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const v = e.target.value as "all" | "active" | "inactive";
                  setStatusFilter(v);
                  setSelectedIds(new Set());
                  pushQuery({ status: v, page: 1 });
                }}
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                aria-label="Filtrar por status"
              >
                <option value="all">Todos status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <select
                value={roleFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setRoleFilter(val);
                  setSelectedIds(new Set());
                  pushQuery({ role: val, page: 1 });
                }}
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                aria-label="Filtrar por papel"
              >
                <option value="">Todos papéis</option>
                {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                {isSuperAdmin && <option value="admin">Admin</option>}
                <option value="manager">Gerente</option>
                <option value="user">Usuário</option>
                <option value="viewer">Visualizador</option>
                {isSuperAdmin &&
                  customRoles.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
              </select>
              {allTenants.length > 0 && (
                <select
                  value={tenantFilter}
                  onChange={(e) => { setTenantFilter(e.target.value); setSelectedIds(new Set()); }}
                  className="h-10 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  aria-label="Filtrar por empresa"
                >
                  <option value="">Todas empresas</option>
                  {allTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    filteredSorted,
                    allTenants,
                    userTenantMap,
                    customRoles
                  )
                }
                title="Exportar para CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button onClick={() => { setGeneratedPassword(null); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIds.size > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {selectedIds.size} selecionado(s)
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmingBulkDelete(true)}
                >
                  <Trash2 className="h-3 w-3" />
                  Excluir selecionados
                </Button>
              </div>
            </div>
          )}

          {generatedPassword && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <span className="font-mono select-all">{generatedPassword}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 w-7"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7"
                onClick={() => setGeneratedPassword(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-2 py-3 w-8">
                    <Checkbox
                      id="select-all"
                      name="selectAll"
                      checked={selectedIds.size === filteredSorted.length && filteredSorted.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  {(
                    [
                      { key: "name" as const, label: "Nome" },
                      { key: "email" as const, label: "Email" },
                      { key: "role" as const, label: "Papel" },
                      { key: "is_active" as const, label: "Status" },
                      { key: "created_at" as const, label: "Criado em" },
                    ]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="cursor-pointer px-3 py-3 font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredSorted.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                      !user.is_active && "opacity-60"
                    )}
                  >
                    <td className="px-2 py-3">
                      <Checkbox
                        id={`select-${user.id}`}
                        name="select"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", avatarColor(user.email))}>
                          {userInitials(user.name, user.email)}
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {user.name || "Sem nome"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          user.role === "super_admin"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
                            : user.role === "admin"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              : user.role === "manager"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : user.role === "viewer"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                  : user.role === "user"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        )}
                      >
                        {user.role === "admin" || user.role === "super_admin" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {roleLabel(user.role, customRoles)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            user.is_active
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          )}
                        >
                          {user.is_active ? "Ativo" : "Inativo"}
                        </span>
                        {user.login_start_time && user.login_end_time && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                            <Clock className="h-3 w-3" />
                            {user.login_start_time.slice(0, 5)}-{user.login_end_time.slice(0, 5)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewAudit(user)}
                          aria-label={`Histórico de ${user.name || user.email}`}
                          title="Histórico de alterações"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResendingUser(user)}
                          aria-label={`Reenviar confirmação para ${user.name || user.email}`}
                          title="Reenviar acesso (magic link)"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResettingUser(user)}
                          aria-label={`Redefinir senha de ${user.name || user.email}`}
                          title="Redefinir senha"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                          aria-label={`Editar ${user.name || user.email}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.is_active ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeactivatingUser(user)}
                            aria-label={`Desativar ${user.name || user.email}`}
                            className="text-amber-600 hover:text-amber-700"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReactivatingUser(user)}
                            aria-label={`Reativar ${user.name || user.email}`}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                          aria-label={`Excluir ${user.name || user.email}`}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-12 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      {search || tenantFilter || statusFilter !== "all"
                        ? "Nenhum usuário encontrado."
                        : "Nenhum usuário cadastrado."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Link href={pageUrl(currentPage - 1)}>
                  <Button variant="outline" size="sm" disabled={currentPage <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                </Link>
                <Link href={pageUrl(currentPage + 1)}>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateDialog && (
        <CreateUserDialog
          state={createState}
          action={createAction}
          isPending={isCreating}
          onClose={handleCreateClose}
          tenants={allTenants}
          customRoles={customRoles}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          state={updateState}
          action={updateAction}
          isPending={isUpdating}
          onClose={() => setEditingUser(null)}
          tenants={allTenants}
          selectedTenantIds={editingUserTenantIds}
          selectedTenantRoles={editingUserTenantRoles}
          areas={allAreas}
          units={allUnits}
          selectedAreaIds={editingUserAreaIds}
          selectedUnitIds={editingUserUnitIds}
          customRoles={customRoles}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {auditingUser && (
        <AuditLogDialog
          user={auditingUser}
          entries={userAuditLog}
          loading={loadingAudit}
          onClose={() => { setAuditingUser(null); setUserAuditLog([]); }}
        />
      )}

      <AlertDialog
        open={confirmingBulkDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmingBulkDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuários em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente{" "}
              <strong className="text-zinc-900 dark:text-zinc-50">
                {selectedIds.size} usuário(s)
              </strong>
              ? Esta ação não pode ser desfeita. Usuários com vínculos ativos
              (empresas ou planos) não serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {statusMessage(bulkDeleteState)}

          <form action={bulkDeleteAction}>
            {Array.from(selectedIds).map((id) => (
              <input key={id} type="hidden" name="userIds" value={id} />
            ))}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmingBulkDelete(false)}>
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" variant="destructive" isLoading={isBulkDeleting}>
                <Trash2 className="h-4 w-4" />
                Excluir {selectedIds.size}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null);
            setDeleteImpact(null);
          }
        }}
      >
        {deletingUser && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <span className="block">
                    Tem certeza que deseja excluir permanentemente{" "}
                    <strong className="text-zinc-900 dark:text-zinc-50">
                      {deletingUser.name || deletingUser.email}
                    </strong>
                    ? Esta ação não pode ser desfeita.
                  </span>
                  {deleteImpact &&
                    (deleteImpact.tenantMemberships > 0 || deleteImpact.actionPlans > 0) && (
                      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        <span className="block font-medium">Ao excluir, estes vínculos serão afetados:</span>
                        {deleteImpact.tenantMemberships > 0 && (
                          <span className="block">· {deleteImpact.tenantMemberships} empresa(s) — vínculo removido</span>
                        )}
                        {deleteImpact.actionPlans > 0 && (
                          <span className="block">· {deleteImpact.actionPlans} plano(s) de ação — mantidos, mas sem responsável</span>
                        )}
                        <span className="mt-2 block">
                          Se preferir preservar o histórico, você pode apenas desativar o usuário.
                        </span>
                      </div>
                    )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            {statusMessage(deleteState)}

            <form action={deleteAction}>
              <input type="hidden" name="userId" value={deletingUser.id} />
              <AlertDialogFooter>
                <AlertDialogCancel />
                <Button
                  type="submit"
                  variant="destructive"
                  isLoading={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <AlertDialog
        open={!!deactivatingUser}
        onOpenChange={(open) => {
          if (!open) setDeactivatingUser(null);
        }}
      >
        {deactivatingUser && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja desativar{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {deactivatingUser.name || deactivatingUser.email}
                </strong>
                ? O usuário não poderá acessar o sistema até ser reativado.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {statusMessage(deactivateState)}

            <form action={deactivateAction}>
              <input type="hidden" name="userId" value={deactivatingUser.id} />
              <AlertDialogFooter>
                <AlertDialogCancel />
                <Button type="submit" variant="destructive" isLoading={isDeactivating}>
                  <Ban className="h-4 w-4" />
                  Desativar
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <AlertDialog
        open={!!reactivatingUser}
        onOpenChange={(open) => {
          if (!open) setReactivatingUser(null);
        }}
      >
        {reactivatingUser && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reativar usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja reativar{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {reactivatingUser.name || reactivatingUser.email}
                </strong>
                ? O usuário voltará a ter acesso ao sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {statusMessage(activateState)}

            <form action={activateAction}>
              <input type="hidden" name="userId" value={reactivatingUser.id} />
              <AlertDialogFooter>
                <AlertDialogCancel />
                <Button type="submit" isLoading={isActivating}>
                  <Check className="h-4 w-4" />
                  Reativar
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <AlertDialog
        open={!!resendingUser}
        onOpenChange={(open) => {
          if (!open) setResendingUser(null);
        }}
      >
        {resendingUser && (
            <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reenviar acesso</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja reenviar o email de acesso para{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {resendingUser.email}
                </strong>
                ?
              </AlertDialogDescription>
            </AlertDialogHeader>

            {statusMessage(resendState)}

            <form action={resendAction}>
              <input type="hidden" name="email" value={resendingUser.email} />
              <AlertDialogFooter>
                <AlertDialogCancel />
                <Button type="submit" isLoading={isResending}>
                  <RefreshCw className="h-4 w-4" />
                  Reenviar
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <AlertDialog
        open={!!resettingUser}
        onOpenChange={(open) => {
          if (!open) setResettingUser(null);
        }}
      >
        {resettingUser && (
          <AlertDialogContent closeOnOverlayClick={false} closeOnEsc={false}>
            <AlertDialogHeader>
              <AlertDialogTitle>Redefinir senha</AlertDialogTitle>
              <AlertDialogDescription>
                Escolha como redefinir a senha de{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {resettingUser.email}
                </strong>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>

            {statusMessage(resetState)}

            <div className="space-y-3">
              <form
                action={resetAction}
                className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <input type="hidden" name="userId" value={resettingUser.id} />
                <input type="hidden" name="email" value={resettingUser.email} />
                <input type="hidden" name="mode" value="email" />
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Enviar e-mail de redefinição
                </p>
                <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                  O usuário recebe um link para criar a própria senha.
                </p>
                <Button type="submit" size="sm" isLoading={isResetting}>
                  <Mail className="h-4 w-4" />
                  Enviar e-mail
                </Button>
              </form>

              <form
                action={resetAction}
                className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <input type="hidden" name="userId" value={resettingUser.id} />
                <input type="hidden" name="email" value={resettingUser.email} />
                <input type="hidden" name="mode" value="temp" />
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Gerar senha temporária
                </p>
                <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                  O sistema define uma senha e a exibe para você repassar com segurança.
                </p>
                <Button type="submit" size="sm" variant="outline" isLoading={isResetting}>
                  <KeyRound className="h-4 w-4" />
                  Gerar senha
                </Button>
              </form>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel />
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}

