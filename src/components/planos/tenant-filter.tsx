"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
}

interface PlanosTenantFilterProps {
  tenants: Tenant[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function PlanosTenantFilter({
  tenants,
  selectedIds,
  onSelectionChange,
}: PlanosTenantFilterProps) {
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

  const displayText =
    selectedIds.length === 0
      ? "Nenhuma empresa"
      : selectedIds.length === tenants.length
        ? "Todas as empresas"
        : selectedIds.length === 1
          ? tenants.find((t) => t.id === selectedIds[0])?.name || "1 empresa"
          : `${selectedIds.length} empresas`;

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(!open)}
      >
        <Building2 className="h-4 w-4" />
        {displayText}
        {selectedIds.length > 0 && selectedIds.length < tenants.length && (
          <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {selectedIds.length}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 p-3 dark:border-zinc-700">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={handleSelectAll}
              >
                <Checkbox
                  checked={selectedIds.length === tenants.length && tenants.length > 0}
                  onChange={() => {}}
                  className="mr-2"
                />
                {selectedIds.length === tenants.length
                  ? "Desmarcar tudo"
                  : "Marcar tudo"}
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {tenants.length === 0 ? (
                <p className="text-xs text-zinc-500">Nenhuma empresa disponível</p>
              ) : (
                tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => handleToggle(tenant.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(tenant.id)}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <span className="flex-1 text-left truncate">
                      {tenant.name}
                    </span>
                  </button>
                ))
              )}
            </div>

            {selectedIds.length > 0 && (
              <div className="border-t border-zinc-100 p-2 dark:border-zinc-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                  Limpar seleção
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
