"use client";

import { useActionState, useState } from "react";
import { changePassword } from "@/app/actions/auth";
import type { FormState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound } from "lucide-react";

const initialState: FormState = {
  message: undefined,
  errors: {},
};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePassword,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const key = state.success ? "reset" : "form";

  return (
    <form key={key} action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">
          Senha atual <span className="text-red-600">*</span>
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={state.errors?.currentPassword ? "currentPassword-error" : undefined}
          aria-invalid={!!state.errors?.currentPassword}
        />
        {state.errors?.currentPassword && (
          <p id="currentPassword-error" className="text-xs text-red-600 dark:text-red-400">
            {state.errors.currentPassword[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          Nova senha <span className="text-red-600">*</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={state.errors?.password ? "password-error" : undefined}
          aria-invalid={!!state.errors?.password}
        />
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.
        </p>
        {state.errors?.password && (
          <p id="password-error" className="text-xs text-red-600 dark:text-red-400">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">
          Confirmar nova senha <span className="text-red-600">*</span>
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-describedby={state.errors?.confirmPassword ? "confirmPassword-error" : undefined}
          aria-invalid={!!state.errors?.confirmPassword}
        />
        {state.errors?.confirmPassword && (
          <p id="confirmPassword-error" className="text-xs text-red-600 dark:text-red-400">
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      {state.message && (
        <Alert variant={state.success ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end pt-2">
        <Button type="submit" isLoading={isPending}>
          <KeyRound className="h-4 w-4" />
          Alterar senha
        </Button>
      </div>
    </form>
  );
}
