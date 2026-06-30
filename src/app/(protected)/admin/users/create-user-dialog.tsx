"use client";

import { useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Copy, Building2 } from "lucide-react";
import { sanitize } from "@/lib/sanitize";
import { generateSecurePassword } from "@/lib/security/password";
import { cn } from "@/lib/utils";
import type { AdminFormState, RoleRow } from "@/app/actions/admin";
import type { Tenant } from "@/types/tenant";
import { TenantRoleRow } from "./tenant-role-row";

// Default do papel de membership a partir do papel global escolhido.
function toTenantRole(globalRole: string): string {
  return globalRole === "admin" || globalRole === "manager" || globalRole === "super_admin"
    ? "admin"
    : "member";
}

export function CreateUserDialog({
  state,
  action,
  isPending,
  onClose,
  tenants = [],
  customRoles = [],
  isSuperAdmin = false,
}: {
  state: AdminFormState;
  action: (payload: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  tenants: Tenant[];
  customRoles?: RoleRow[];
  isSuperAdmin?: boolean;
}) {
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user");

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
    setPasswordValue(generateSecurePassword());
    setShowPassword(true);
  }

  return (
    <AlertDialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="max-w-lg max-h-[90vh] flex flex-col" closeOnOverlayClick={false} closeOnEsc={false}>
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
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="user">Usuário</option>
                  <option value="manager">Gerente</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  {isSuperAdmin && (
                    <option value="super_admin">Super Admin</option>
                  )}
                  {isSuperAdmin &&
                    customRoles.map((role) => (
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
                  onChange={(e) => { setPasswordValue(e.target.value); setShowPassword(true); }}
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
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                  {tenants.map((tenant) => (
                    <TenantRoleRow
                      key={tenant.id}
                      tenant={tenant}
                      formPrefix="create"
                      // Empresa única (típico de admin de uma só empresa) já vem
                      // marcada; com várias (super_admin) ficam desmarcadas.
                      defaultChecked={tenants.length === 1}
                      defaultRole={toTenantRole(selectedRole)}
                      isSuperAdmin={isSuperAdmin}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {selectedRole === "super_admin"
                    ? "Super admins enxergam todas as empresas — associar é opcional."
                    : tenants.length === 1
                    ? "Empresa já marcada. Ajuste o papel do usuário se necessário."
                    : "Selecione ao menos uma empresa (obrigatório) e o papel do usuário em cada uma."}
                </p>
              </div>
            )}

            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
              <Checkbox
                id="create-send-welcome"
                name="sendWelcome"
                defaultChecked
                label="Enviar e-mail de acesso ao usuário"
              />
              <p className="mt-1 pl-6 text-[11px] text-zinc-400">
                O usuário recebe um link para definir a própria senha. Desmarque se preferir repassar a senha manualmente.
              </p>
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
