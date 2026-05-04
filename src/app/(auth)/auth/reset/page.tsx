"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import type { FormState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sanitizeInput } from "@/lib/utils";
import { Mail, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const initialState: FormState = { message: undefined, errors: {} };

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, initialState);

  if (state.success) {
    return (
      <>
        <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Send className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Email enviado!</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
        </Card>
        <div className="text-center">
          <Link href="/auth" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>Esqueceu a senha?</CardTitle>
          <CardDescription>Digite seu email para receber um link de recuperação.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                required
                onChange={(e) => { e.target.value = sanitizeInput(e.target.value); }}
                aria-describedby={state.errors?.email ? "email-error" : undefined}
                aria-invalid={!!state.errors?.email}
              />
              {state.errors?.email && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400">{state.errors.email[0]}</p>
              )}
            </div>

            {state.message && !state.success && (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" isLoading={isPending} className="w-full">
              <Send className="h-4 w-4" />
              Enviar link de recuperação
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
