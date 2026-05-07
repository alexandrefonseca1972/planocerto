"use client";

import { useState } from "react";
import { Filter, X, Check } from "lucide-react";
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

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-zinc-900 bg-zinc-900 dark:border-zinc-50 dark:bg-zinc-50"
          : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
      )}
    >
      {checked && (
        <Check className="h-3 w-3 text-white dark:text-zinc-900" strokeWidth={3} />
      )}
    </div>
  );
}

export function TenantFilter({ tenants, selectedIds, onSelectionChange }: TenantFilterProps) {
  const [open, setOpen] = useState(false);

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

  const handleClear = () => {
    onSelectionChange([]);
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
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        <Filter className="h-4 w-4" />
        {displayText}
        {selectedIds.length > 0 && !allSelected && (
          <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {selectedIds.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 p-2 dark:border-zinc-700">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <CheckBox checked={allSelected} />
                <span>{allSelected ? "Desmarcar tudo" : "Marcar tudo"}</span>
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {tenants.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-500">Nenhuma empresa disponível</p>
              ) : (
                tenants.map((tenant) => {
                  const isChecked = selectedIds.includes(tenant.id);
                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => handleToggle(tenant.id)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <CheckBox checked={isChecked} />
                      <span className="flex-1 text-left truncate">{tenant.name}</span>
                    </button>
                  );
                })
              )}
            </div>

            {selectedIds.length > 0 && (
              <div className="border-t border-zinc-100 p-2 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  <X className="h-3 w-3" />
                  Limpar seleção
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
