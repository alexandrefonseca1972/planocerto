"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login } from "@/app/actions/auth";
import type { FormState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { sanitize } from "@/lib/sanitize";
import { Mail, Lock, LogIn } from "lucide-react";
import Link from "next/link";

const initialState: FormState = {
  message: undefined,
  errors: {},
};

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <Mail className="h-3.5 w-3.5" />
          Email
        </Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          required
          onChange={(e) => {
            setEmail(sanitize(e.target.value));
          }}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
          aria-invalid={!!state.errors?.email}
          className="transition-all duration-200 focus:shadow-md"
        />
        {state.errors?.email && (
          <p
            key={`email-err-${state.message}`}
            id="email-error"
            className="animate-[slideDown_200ms_ease-out] text-sm text-red-600 dark:text-red-400"
          >
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <Lock className="h-3.5 w-3.5" />
          Senha
        </Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          aria-describedby={state.errors?.password ? "password-error" : undefined}
          aria-invalid={!!state.errors?.password}
          className="transition-all duration-200 focus:shadow-md"
        />
        {state.errors?.password && (
          <p
            key={`pwd-err-${state.message}`}
            id="password-error"
            className="animate-[slideDown_200ms_ease-out] text-sm text-red-600 dark:text-red-400"
          >
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Checkbox
          id="remember-me"
          label="Lembrar de mim"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
      </div>

      <p className="text-right text-xs">
        <Link href="/auth/reset" className="text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300">
          Esqueceu a senha?
        </Link>
      </p>

      {state.message && !state.success && (
        <div
          key={`msg-${state.message}`}
          className="animate-[fadeIn_200ms_ease-out] rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
        >
          {state.message}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
        <LogIn className="h-4 w-4" />
        Entrar
      </Button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Não tem uma conta?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-zinc-900 underline underline-offset-2 transition-colors hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
        >
          Criar conta
        </button>
      </p>
    </form>
  );
}
