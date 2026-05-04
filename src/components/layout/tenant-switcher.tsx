"use client";

import { useState, useRef, useEffect } from "react";
import { useTenant } from "@/lib/contexts/tenant-context";
import { Building2, ChevronDown, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TenantSwitcherProps {
  isAdmin?: boolean;
}

export function TenantSwitcher({ isAdmin }: TenantSwitcherProps) {
  const { currentTenant, allTenants, switchTenant, isSwitching } = useTenant();
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

  if (allTenants.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400 dark:border-zinc-700">
        <Building2 className="h-3.5 w-3.5" />
        <span>Sem empresas</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Building2 className="h-3.5 w-3.5 text-zinc-500" />
        <span className="max-w-[120px] truncate font-medium text-zinc-700 dark:text-zinc-300">
          {currentTenant?.name || "Selecionar empresa"}
        </span>
        {isSwitching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
        ) : (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-zinc-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="px-3 py-1.5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Empresas
            </p>
          </div>
          <div role="listbox">
            {allTenants.map((tenant) => (
              <button
                key={tenant.id}
                role="option"
                aria-selected={currentTenant?.id === tenant.id}
                onClick={() => {
                  switchTenant(tenant.id);
                  setIsOpen(false);
                }}
                disabled={isSwitching}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  currentTenant?.id === tenant.id
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                )}
              >
                <span className="flex-1 truncate">{tenant.name}</span>
                {isSwitching && currentTenant?.id === tenant.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                ) : currentTenant?.id === tenant.id ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                ) : null}
              </button>
            ))}
          </div>
          {isAdmin && (
            <div className="border-t border-zinc-200 dark:border-zinc-700">
              <Link
                href="/admin/tenants"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                onClick={() => setIsOpen(false)}
              >
                <Plus className="h-3.5 w-3.5" />
                Gerenciar empresas
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
