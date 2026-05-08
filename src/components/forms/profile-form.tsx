"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/actions/auth";
import type { FormState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sanitize } from "@/lib/sanitize";
import { formatPhone, isValidPhone } from "@/lib/format-br";
import { Save, MessageCircle } from "lucide-react";

interface ProfileFormProps {
  name: string;
  email: string;
  phone?: string;
  isWhatsapp?: boolean;
}

const initialState: FormState = {
  message: undefined,
  errors: {},
};

export function ProfileForm({
  name,
  email,
  phone: initialPhone = "",
  isWhatsapp: initialIsWhatsapp = false,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );
  const [phone, setPhone] = useState(initialPhone);
  const [isWhatsapp, setIsWhatsapp] = useState(initialIsWhatsapp);

  const phoneInvalid = phone.length > 0 && !isValidPhone(phone);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="opacity-70"
        />
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          O e-mail não pode ser alterado.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">
          Nome <span className="text-red-600">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={name}
          placeholder="Seu nome completo"
          required
          maxLength={100}
          onChange={(e) => {
            e.target.value = sanitize(e.target.value);
          }}
          aria-describedby={state.errors?.name ? "name-error" : undefined}
          aria-invalid={!!state.errors?.name}
        />
        {state.errors?.name && (
          <p id="name-error" className="text-xs text-red-600 dark:text-red-400">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone de contato</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            maxLength={15}
            className="font-mono"
            aria-invalid={phoneInvalid}
          />
          {phoneInvalid ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              Telefone inválido. Use DDD + número.
            </p>
          ) : (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Opcional. Aceita fixo ou celular.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/30">
          <Switch
            id="is_whatsapp"
            name="is_whatsapp"
            checked={isWhatsapp}
            onChange={(e) => setIsWhatsapp(e.currentTarget.checked)}
            disabled={!phone || phoneInvalid}
            label={
              <span className="inline-flex items-center gap-1.5 text-sm">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                WhatsApp
              </span>
            }
          />
          <p className="mt-0.5 pl-11 text-[10px] text-zinc-500">
            {phone && !phoneInvalid
              ? "Sinalize se este número também é WhatsApp"
              : "Preencha um telefone válido"}
          </p>
        </div>
      </div>

      {state.message && (
        <Alert variant={state.success ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end pt-2">
        <Button type="submit" isLoading={isPending} disabled={phoneInvalid}>
          <Save className="h-4 w-4" />
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
