"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";
import type { FormState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

const initialState: FormState = { message: undefined, errors: {} };

export default function UpdatePasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <>
      <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
          <CardDescription>Digite sua nova senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Lock className="h-3.5 w-3.5" />
                Nova senha
              </Label>
              <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" required
                aria-describedby={state.errors?.password ? "password-error" : undefined}
                aria-invalid={!!state.errors?.password} />
              {state.errors?.password && (
                <p id="password-error" className="text-sm text-red-600 dark:text-red-400">{state.errors.password[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Lock className="h-3.5 w-3.5" />
                Confirmar senha
              </Label>
              <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Repita a senha" required
                aria-describedby={state.errors?.confirmPassword ? "confirmPassword-error" : undefined}
                aria-invalid={!!state.errors?.confirmPassword} />
              {state.errors?.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-red-600 dark:text-red-400">{state.errors.confirmPassword[0]}</p>
              )}
            </div>

            {state.message && !state.success && (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" isLoading={isPending} className="w-full">
              <Lock className="h-4 w-4" />
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="text-center">
        <Link href="/auth" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
        </Link>
      </div>
    </>
  );
}
