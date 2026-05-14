"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const querySchema = z.string().min(2).max(200);

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchInput({ onSearch, isLoading, className }: SearchInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setValue(raw);
      setError(null);

      const result = querySchema.safeParse(raw);
      if (!result.success && raw.length > 0) {
        setError("Mínimo de 2 caracteres");
        return;
      }

      if (result.success) {
        onSearch(result.data);
      }
    },
    [onSearch]
  );

  return (
    <div className={cn("w-full max-w-xl", className)}>
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Buscar por nome, CNPJ ou número de processo..."
        aria-label="Buscar no Diário Oficial"
        aria-invalid={!!error}
        aria-describedby={error ? "search-error" : undefined}
        disabled={isLoading}
        className="h-12"
      />
      {error && (
        <p id="search-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
