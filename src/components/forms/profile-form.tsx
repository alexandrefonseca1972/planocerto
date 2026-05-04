"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/auth";
import type { FormState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sanitizeInput } from "@/lib/utils";
import { Save } from "lucide-react";

interface ProfileFormProps {
  name: string;
  email: string;
}

const initialState: FormState = {
  message: undefined,
  errors: {},
};

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="opacity-70"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          O email não pode ser alterado.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={name}
          placeholder="Seu nome completo"
          required
          onChange={(e) => {
            e.target.value = sanitizeInput(e.target.value);
          }}
          aria-describedby={state.errors?.name ? "name-error" : undefined}
          aria-invalid={!!state.errors?.name}
        />
        {state.errors?.name && (
          <p id="name-error" className="text-sm text-red-600 dark:text-red-400">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      {state.message && (
        <Alert variant={state.success ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" isLoading={isPending}>
        <Save className="h-4 w-4" />
        Salvar alterações
      </Button>
    </form>
  );
}
