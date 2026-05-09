"use client";

import { useActionState, useState, useCallback, useEffect, useRef, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  resendConfirmation,
  bulkDeleteUsers,
  getUserImpact,
  getAllAreas,
  getAllUnits,
  getUserAreaIds,
  getUserUnitIds,
} from "@/app/actions/admin";
import type {
  AdminFormState,
  AreaOption,
  UnitOption,
} from "@/app/actions/admin";
import { getAllTenants, getUserTenantIds, getBulkUserTenantIds } from "@/app/actions/tenant";
import type { RoleRow } from "@/app/actions/admin";
import type { Tenant } from "@/types/tenant";
import type { Profile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PermissionManager } from "@/components/admin/permission-manager";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  User,
  Building2,
  MapPin,
  Building,
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
} from "lucide-react";

const createInitialState: AdminFormState = { message: undefined, errors: {} };
const DEBOUNCE_MS = 300;

function md5(message: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < message.length; i++) bytes.push(message.charCodeAt(i));
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0x00);
  const ml = message.length * 8;
  for (let i = 0; i < 8; i++) bytes.push((ml >>> (i * 8)) & 0xff);

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let k = 0; k < bytes.length; k += 64) {
    const M = new Array(16) as number[];
    for (let i = 0; i < 16; i++) {
      M[i] = bytes[k + i * 4] | (bytes[k + i * 4 + 1] << 8) | (bytes[k + i * 4 + 2] << 16) | (bytes[k + i * 4 + 3] << 24);
    }

    let A = a0, B = b0, C = c0, D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) | 0;
    }

    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }

  return [a0, b0, c0, d0]
    .map((v) => (v >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function gravatarUrl(email: string, size = 40): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp&r=g`;
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
}: {
  users: Profile[];
  total: number;
  currentPage: number;
  perPage: number;
  customRoles?: RoleRow[];
  initialSearch?: string;
  initialStatus?: "all" | "active" | "inactive";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<Profile | null>(null);
  const [reactivatingUser, setReactivatingUser] = useState<Profile | null>(null);
  const [resendingUser, setResendingUser] = useState<Profile | null>(null);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(initialStatus);
  const [sortKey, setSortKey] = useState<keyof Profile>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [allAreas, setAllAreas] = useState<AreaOption[]>([]);
  const [allUnits, setAllUnits] = useState<UnitOption[]>([]);
  const [editingUserTenantIds, setEditingUserTenantIds] = useState<string[]>([]);
  const [editingUserAreaIds, setEditingUserAreaIds] = useState<string[]>([]);
  const [editingUserUnitIds, setEditingUserUnitIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tenantFilter, setTenantFilter] = useState<string>("");
  const [userTenantMap, setUserTenantMap] = useState<Map<string, string[]>>(new Map());
  const [deleteImpact, setDeleteImpact] = useState<{ tenantMemberships: number; actionPlans: number } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [createState, createAction, isCreating] = useActionState(createUser, createInitialState);
  const [updateState, updateAction, isUpdating] = useActionState(updateUser, createInitialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteUser, createInitialState);
  const [deactivateState, deactivateAction, isDeactivating] = useActionState(deactivateUser, createInitialState);
  const [activateState, activateAction, isActivating] = useActionState(activateUser, createInitialState);
  const [resendState, resendAction, isResending] = useActionState(resendConfirmation, createInitialState);
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
    if (!updateState.success) return;
    const t = setTimeout(() => setEditingUser(null), 0);
    return () => clearTimeout(t);
  }, [updateState]);

  useEffect(() => {
    getAllTenants().then(setAllTenants);
    getAllAreas().then(setAllAreas);
    getAllUnits().then(setAllUnits);
  }, []);

  useEffect(() => {
    if (users.length === 0) return;
    getBulkUserTenantIds(users.map((u) => u.id)).then(setUserTenantMap);
  }, [users]);

  const handleEditUser = useCallback(async (user: Profile) => {
    const [tIds, aIds, uIds] = await Promise.all([
      getUserTenantIds(user.id),
      getUserAreaIds(user.id),
      getUserUnitIds(user.id),
    ]);
    setEditingUserTenantIds(tIds);
    setEditingUserAreaIds(aIds);
    setEditingUserUnitIds(uIds);
    setEditingUser(user);
  }, []);

  const handleDeleteClick = useCallback(async (user: Profile) => {
    const impact = await getUserImpact(user.id);
    setDeleteImpact(impact);
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
    (next: { q?: string; status?: "all" | "active" | "inactive"; page?: number }) => {
      const sp = new URLSearchParams();
      const q = next.q ?? search;
      const st = next.status ?? statusFilter;
      const page = next.page ?? 1;
      if (q.trim()) sp.set("q", q.trim());
      if (st !== "all") sp.set("status", st);
      if (page > 1) sp.set("page", String(page));
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router, pathname, search, statusFilter]
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
    const filtered = users.filter((u) => {
      const matchesTenant =
        !tenantFilter ||
        (userTenantMap.get(u.id) || []).includes(tenantFilter);
      return matchesTenant;
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
                        <Image
                          src={gravatarUrl(user.email, 40)}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full"
                          loading="lazy"
                          unoptimized
                        />
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
                          onClick={() => setResendingUser(user)}
                          aria-label={`Reenviar confirmação para ${user.name || user.email}`}
                        >
                          <RefreshCw className="h-4 w-4" />
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
          areas={allAreas}
          units={allUnits}
          selectedAreaIds={editingUserAreaIds}
          selectedUnitIds={editingUserUnitIds}
          customRoles={customRoles}
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
              <AlertDialogDescription>
                Tem certeza que deseja excluir permanentemente{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {deletingUser.name || deletingUser.email}
                </strong>
                ?
                {deleteImpact &&
                  (deleteImpact.tenantMemberships > 0 || deleteImpact.actionPlans > 0) && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      <p>Este usuário possui vínculos ativos:</p>
                      {deleteImpact.tenantMemberships > 0 && (
                        <p>- {deleteImpact.tenantMemberships} empresa(s)</p>
                      )}
                      {deleteImpact.actionPlans > 0 && (
                        <p>- {deleteImpact.actionPlans} plano(s) de ação</p>
                      )}
                      <p className="mt-1 font-medium">
                        Remova os vínculos antes de excluir, ou apenas
                        desative o usuário.
                      </p>
                    </div>
                  )}
                Esta ação não pode ser desfeita.
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
                  disabled={
                    !!deleteImpact &&
                    (deleteImpact.tenantMemberships > 0 || deleteImpact.actionPlans > 0)
                  }
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
              <AlertDialogTitle>Reenviar confirmação</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja reenviar o email de confirmação para{" "}
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
    </>
  );
}

function CreateUserDialog({
  state,
  action,
  isPending,
  onClose,
  tenants = [],
  customRoles = [],
}: {
  state: AdminFormState;
  action: (payload: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  tenants: Tenant[];
  customRoles?: RoleRow[];
}) {
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    const p = passwordValue;
    if (!p) return { score: 0, label: "", color: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    if (score <= 2) return { score, label: "Fraca", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Média", color: "bg-amber-500" };
    return { score, label: "Forte", color: "bg-emerald-500" };
  }, [passwordValue]);

  function handleGeneratePassword() {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const special = "!@#$%&*";
    const all = upper + lower + digits + special;

    let password = "";
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += special[Math.floor(Math.random() * special.length)];

    const array = new Uint32Array(12);
    crypto.getRandomValues(array);
    for (let i = 0; i < array.length; i++) {
      password += all[array[i] % all.length];
    }

    const chars = password.split("");
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000) * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const generated = chars.join("");
    setPasswordValue(generated);
    setShowPassword(true);
  }

  return (
    <AlertDialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle>Criar usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Preencha os dados para cadastrar um novo usuário.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={action} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-name">Nome</Label>
                <Input
                  id="create-name"
                  name="name"
                  placeholder="Nome completo"
                  required
                  onChange={(e) => { e.target.value = sanitize(e.target.value); }}
                />
                {state.errors?.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{state.errors.name[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-role">Papel</Label>
                <select
                  id="create-role"
                  name="role"
                  defaultValue="user"
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="user">Usuário</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  {customRoles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
                {state.errors?.role && (
                  <p className="text-sm text-red-600 dark:text-red-400">{state.errors.role[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                name="email"
                type="email"
                placeholder="email@exemplo.com"
                required
                onChange={(e) => { e.target.value = sanitize(e.target.value); }}
              />
              {state.errors?.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="create-password">Senha</Label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Gerar senha
                </button>
              </div>
              <div className="relative">
                <Input
                  id="create-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres ou gere automaticamente"
                  value={passwordValue}
                  onChange={(e) => { setPasswordValue(sanitize(e.target.value)); setShowPassword(true); }}
                />
                {passwordValue && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(passwordValue)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                    aria-label="Copiar senha"
                    title="Copiar senha"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
              {passwordValue && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", passwordStrength.color)}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                    <span className={cn("text-xs font-medium", passwordStrength.score <= 2 ? "text-red-500" : passwordStrength.score <= 4 ? "text-amber-500" : "text-emerald-500")}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {[
                      { met: passwordValue.length >= 8, label: "8+ caracteres" },
                      { met: /[a-z]/.test(passwordValue), label: "Minúscula" },
                      { met: /[A-Z]/.test(passwordValue), label: "Maiúscula" },
                      { met: /[0-9]/.test(passwordValue), label: "Número" },
                      { met: /[^a-zA-Z0-9]/.test(passwordValue), label: "Especial" },
                    ].map((req) => (
                      <span
                        key={req.label}
                        className={cn(
                          "text-[11px] transition-colors flex items-center gap-1",
                          req.met ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                        )}
                      >
                        {req.met ? <Check className="h-3 w-3" /> : <span className="inline-block w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />}
                        {req.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {state.errors?.password && (
                <div className="space-y-0.5">
                  {state.errors.password.map((err) => (
                    <p key={err} className="text-sm text-red-600 dark:text-red-400">{err}</p>
                  ))}
                </div>
              )}
            </div>

            {tenants.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Empresas
                </Label>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                  {tenants.map((tenant) => (
                    <Checkbox
                      key={tenant.id}
                      id={`create-tenant-${tenant.id}`}
                      name="tenantIds"
                      value={tenant.id}
                      label={tenant.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {state.message && (
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
            )}
          </div>

          <AlertDialogFooter className="shrink-0 pt-3">
            <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
            <Button type="submit" isLoading={isPending}>
              <Check className="h-4 w-4" />
              Criar
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditUserDialog({
  user,
  state,
  action,
  isPending,
  onClose,
  tenants = [],
  selectedTenantIds = [],
  areas = [],
  units = [],
  selectedAreaIds = [],
  selectedUnitIds = [],
  customRoles = [],
}: {
  user: Profile;
  state: AdminFormState;
  action: (payload: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  tenants: Tenant[];
  selectedTenantIds: string[];
  areas?: AreaOption[];
  units?: UnitOption[];
  selectedAreaIds?: string[];
  selectedUnitIds?: string[];
  customRoles?: RoleRow[];
}) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    user.permissions || {}
  );
  const [currentRole, setCurrentRole] = useState(user.role);

  const permissionsJson = JSON.stringify(permissions);

  const handlePermissionsChange = (newPerms: Record<string, boolean>) => {
    setPermissions(newPerms);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentRole(e.target.value);
    setPermissions({});
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Editar usuário
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={action} className="flex flex-1 min-h-0 flex-col">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="tenantsTouched" value="1" />
          <input type="hidden" name="areasTouched" value="1" />
          <input type="hidden" name="unitsTouched" value="1" />

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              value={user.email}
              disabled
              className="text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              name="name"
              placeholder="Nome completo"
              defaultValue={user.name}
              required
              onChange={(e) => {
                e.target.value = sanitize(e.target.value);
              }}
            />
            {state.errors?.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.errors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Papel</Label>
            <select
              id="edit-role"
              name="role"
              defaultValue={user.role}
              onChange={handleRoleChange}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="user">Usuário</option>
              <option value="manager">Gerente</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="viewer">Visualizador</option>
              {customRoles.map((role) => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
            {state.errors?.role && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.errors.role[0]}
              </p>
            )}
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Permissões
            </p>
            <PermissionManager
              role={currentRole}
              overrides={user.permissions}
              onChange={handlePermissionsChange}
            />
            <input type="hidden" name="permissions" value={permissionsJson} />
          </div>

          {tenants.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Empresas
              </Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                {tenants.map((tenant) => (
                  <Checkbox
                    key={tenant.id}
                    id={`edit-tenant-${tenant.id}`}
                    name="tenantIds"
                    value={tenant.id}
                    label={tenant.name}
                    defaultChecked={selectedTenantIds.includes(tenant.id)}
                  />
                ))}
                {tenants.length === 0 && (
                  <p className="text-xs text-zinc-400">Nenhuma empresa disponível.</p>
                )}
              </div>
            </div>
          )}

          <ScopePicker
            id="areas"
            label="Áreas"
            icon={<MapPin className="h-3.5 w-3.5" />}
            inputName="areaIds"
            items={areas.map((a) => ({ id: a.id, label: a.name }))}
            selectedIds={selectedAreaIds}
            emptyMessage="Nenhuma área disponível."
            helperText="Restringe o acesso. Vazio = todas."
          />

          <ScopePicker
            id="units"
            label="Unidades"
            icon={<Building className="h-3.5 w-3.5" />}
            inputName="unitIds"
            items={units.map((u) => ({
              id: u.id,
              label: u.uf ? `${u.name} (${u.uf})` : u.name,
            }))}
            selectedIds={selectedUnitIds}
            emptyMessage="Nenhuma unidade disponível."
            helperText="Restringe o acesso. Vazio = todas."
          />

          <div className="space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Restrições de acesso
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Horário início</Label>
                <Input
                  name="login_start_time"
                  type="time"
                  defaultValue={user.login_start_time || ""}
                />
                {state.errors?.login_start_time && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {state.errors.login_start_time[0]}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Horário fim</Label>
                <Input
                  name="login_end_time"
                  type="time"
                  defaultValue={user.login_end_time || ""}
                />
                {state.errors?.login_end_time && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {state.errors.login_end_time[0]}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Deixe em branco para acesso livre.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                value="true"
                defaultChecked={user.is_active}
                className="rounded"
              />
              <span className="text-xs">Conta ativa</span>
            </label>
          </div>

          {state.message && (
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
          )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-200 bg-white px-6 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Check className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScopePicker({
  id,
  label,
  icon,
  inputName,
  items,
  selectedIds,
  emptyMessage,
  helperText,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  inputName: string;
  items: { id: string; label: string }[];
  selectedIds: string[];
  emptyMessage: string;
  helperText?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedIds),
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const toggleOne = (itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          {icon}
          {label}
          {selected.size > 0 && (
            <span className="ml-1 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
              {selected.size}
            </span>
          )}
        </Label>
        {items.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-[11px] font-medium text-accent-600 hover:underline dark:text-accent-400"
          >
            {selected.size === items.length ? "Limpar" : "Selecionar todas"}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-zinc-200 p-3 text-xs text-zinc-400 dark:border-zinc-700">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              id={`scope-${id}-search`}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(sanitize(e.target.value))}
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
            {filtered.length === 0 ? (
              <p className="py-2 text-center text-xs text-zinc-400">
                Nada encontrado.
              </p>
            ) : (
              filtered.map((item) => (
                <Checkbox
                  key={item.id}
                  id={`scope-${id}-${item.id}`}
                  name={inputName}
                  value={item.id}
                  label={item.label}
                  checked={selected.has(item.id)}
                  onChange={() => toggleOne(item.id)}
                />
              ))
            )}
          </div>
        </>
      )}
      {helperText && (
        <p className="text-[11px] text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}
