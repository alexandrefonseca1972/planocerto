"use client";

import { useActionState, useEffect, useRef, useState, useMemo } from "react";
import { signup } from "@/app/actions/auth";
import type { FormState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { UserPlus, User, Mail, Check } from "lucide-react";

const initialState: FormState = {
  message: undefined,
  errors: {},
};

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(signup, initialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

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

  const passwordReqs = useMemo(() => [
    { met: passwordValue.length >= 8, label: "8+ caracteres" },
    { met: /[a-z]/.test(passwordValue), label: "Letra minúscula" },
    { met: /[A-Z]/.test(passwordValue), label: "Letra maiúscula" },
    { met: /[0-9]/.test(passwordValue), label: "Número" },
    { met: /[^a-zA-Z0-9]/.test(passwordValue), label: "Caractere especial" },
  ], [passwordValue]);

  if (state.success) {
    return (
      <div className="space-y-4 animate-[fadeIn_300ms_ease-out]">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <svg
              className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Conta criada!
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {state.message}
            </p>
          </div>
          {onSwitchToLogin && (
            <Button
              variant="outline"
              onClick={onSwitchToLogin}
              className="mt-2"
            >
              Ir para o login
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <User className="h-3.5 w-3.5" />
          Nome
        </Label>
        <Input
          ref={nameRef}
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Seu nome completo"
          value={name}
          required
          onChange={(e) => {
            setName(sanitize(e.target.value));
          }}
          aria-describedby={state.errors?.name ? "name-error" : undefined}
          aria-invalid={!!state.errors?.name}
          className="transition-all duration-200 focus:shadow-md"
        />
        {state.errors?.name && (
          <p
            key={`name-err-${state.message}`}
            id="name-error"
            className="animate-[slideDown_200ms_ease-out] text-sm text-red-600 dark:text-red-400"
          >
            {state.errors.name[0]}
          </p>
        )}
      </div>

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
          Senha
        </Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={passwordValue}
          required
          onChange={(e) => setPasswordValue(e.target.value)}
          aria-describedby={state.errors?.password ? "password-error" : undefined}
          aria-invalid={!!state.errors?.password}
          className="transition-all duration-200 focus:shadow-md"
        />
        {passwordValue && (
          <div className="space-y-1.5 animate-[slideDown_200ms_ease-out]">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", passwordStrength.color)}
                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                />
              </div>
              <span className={cn(
                "text-xs font-medium",
                passwordStrength.score <= 2 ? "text-red-500" : passwordStrength.score <= 4 ? "text-amber-500" : "text-emerald-500"
              )}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {passwordReqs.map((req) => (
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
          <div
            key={`pwd-err-${state.message}`}
            id="password-error"
            className="space-y-0.5 animate-[slideDown_200ms_ease-out]"
          >
            {state.errors.password.map((err) => (
              <p key={err} className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-red-500" />
                {err}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          Confirmar senha
        </Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repita a senha"
          required
          aria-describedby={
            state.errors?.confirmPassword ? "confirmPassword-error" : undefined
          }
          aria-invalid={!!state.errors?.confirmPassword}
        />
        {state.errors?.confirmPassword && (
          <p
            key={`cpwd-err-${state.message}`}
            id="confirmPassword-error"
            className="animate-[slideDown_200ms_ease-out] text-sm text-red-600 dark:text-red-400"
          >
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      {state.message && !state.success && (
        <div
          key={`msg-${state.message}`}
          className="animate-[fadeIn_200ms_ease-out] rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
        >
          {state.message}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
        <UserPlus className="h-4 w-4" />
        Criar conta
      </Button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Já tem uma conta?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-zinc-900 underline underline-offset-2 transition-colors hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
        >
          Entrar
        </button>
      </p>
    </form>
  );
}
