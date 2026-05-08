"use client";

import { useCallback, useMemo, useState } from "react";
import type { ZodTypeAny } from "zod";

export type FieldErrors = Record<string, string | undefined>;

/**
 * Validação reativa baseada em zod.
 *
 * - `values`: estado atual dos campos
 * - `setValue(name, value)`: atualiza um campo (e dispara validação se ele já foi tocado)
 * - `errors`: mensagem de erro por campo (apenas para campos tocados)
 * - `touched`: flags de "campo tocado" (qual já foi alterado/blurado)
 * - `markTouched(name)`: marca campo como tocado (chamar em onBlur)
 * - `validateAll()`: força validação de todos os campos. Retorna true se ok.
 * - `isValid`: validação inteira passa (independente de touched)
 * - `isDirty`: algum valor diferente do inicial
 */
export function useLiveValidation<T extends object>(
  schema: ZodTypeAny,
  initial: T,
) {
  const [values, setValues] = useState<T>(initial);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const markTouched = useCallback((name: string) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);

  const allErrors = useMemo<FieldErrors>(() => {
    const result = schema.safeParse(values);
    if (result.success) return {};
    const out: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (key && !out[key]) out[key] = issue.message;
    }
    return out;
  }, [schema, values]);

  const errors = useMemo<FieldErrors>(() => {
    const out: FieldErrors = {};
    for (const k of Object.keys(allErrors)) {
      if (touched[k]) out[k] = allErrors[k];
    }
    return out;
  }, [allErrors, touched]);

  const isValid = useMemo(() => Object.keys(allErrors).length === 0, [allErrors]);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initial);
  }, [values, initial]);

  const validateAll = useCallback(() => {
    const allKeys: Record<string, boolean> = {};
    for (const k of Object.keys(values)) allKeys[k] = true;
    setTouched(allKeys);
    return Object.keys(allErrors).length === 0;
  }, [values, allErrors]);

  const reset = useCallback((next?: T) => {
    setValues(next ?? initial);
    setTouched({});
  }, [initial]);

  return {
    values,
    setValue,
    errors,
    touched,
    markTouched,
    isValid,
    isDirty,
    validateAll,
    reset,
  };
}
