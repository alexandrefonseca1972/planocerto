"use client";

import { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
}

interface TenantFilterProps {
  tenants: Tenant[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function TenantFilter({ tenants, selectedIds, onSelectionChange }: TenantFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (tenantId: string) => {
    const newSelected = selectedIds.includes(tenantId)
      ? selectedIds.filter((id) => id !== tenantId)
      : [...selectedIds, tenantId];
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === tenants.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tenants.map((t) => t.id));
    }
  };

  const allSelected = selectedIds.length === tenants.length && tenants.length > 0;

  const displayText =
    selectedIds.length === 0
      ? "Nenhuma empresa"
      : allSelected
        ? "Todas as empresas"
        : selectedIds.length === 1
          ? tenants.find((t) => t.id === selectedIds[0])?.name || "1 empresa"
          : `${selectedIds.length} empresas`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Building2 className="h-3.5 w-3.5 text-zinc-500" />
        <span className="max-w-[160px] truncate font-medium text-zinc-700 dark:text-zinc-300">
          {displayText}
        </span>
        {selectedIds.length > 0 && !allSelected && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-100 px-1 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-zinc-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="px-3 py-1.5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Filtrar empresas
            </p>
          </div>
          <button
            onClick={handleSelectAll}
            className="flex w-full items-center gap-2 border-b border-zinc-100 px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
          >
            <span className="flex-1">{allSelected ? "Desmarcar tudo" : "Marcar tudo"}</span>
            {allSelected && <Check className="h-3.5 w-3.5 shrink-0 text-zinc-500" />}
          </button>
          <div role="listbox" className="max-h-64 overflow-y-auto">
            {tenants.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-500">Nenhuma empresa disponível</p>
            ) : (
              tenants.map((tenant) => {
                const isChecked = selectedIds.includes(tenant.id);
                return (
                  <button
                    key={tenant.id}
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => handleToggle(tenant.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                      isChecked
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <span className="flex-1 truncate">{tenant.name}</span>
                    {isChecked && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
