"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/types/tenant";
import { switchTenant as switchTenantAction } from "@/app/actions/tenant";
import { useToast } from "@/components/ui/toast";

const STORAGE_KEY = "selected_tenants";

interface TenantContextType {
  currentTenant: Tenant | null;
  allTenants: Tenant[];
  selectedTenantIds: string[];
  setSelectedTenantIds: (ids: string[]) => void;
  switchTenant: (tenantId: string) => Promise<void>;
  isSwitching: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

interface TenantProviderProps {
  children: ReactNode;
  initialTenant: Tenant | null;
  initialTenants: Tenant[];
}

export function TenantProvider({
  children,
  initialTenant,
  initialTenants,
}: TenantProviderProps) {
  const [activeTenantId, setActiveTenantId] = useState<string | null>(
    initialTenant?.id || null
  );
  // Inicializa igual no servidor e no cliente para evitar hydration mismatch.
  // Hidrata de localStorage só depois do mount.
  const [selectedTenantIds, setSelectedTenantIdsState] = useState<string[]>(
    initialTenant ? [initialTenant.id] : [],
  );
  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as string[];
      const validIds = parsed.filter((id) =>
        initialTenants.some((t) => t.id === id),
      );
      if (validIds.length > 0) {
        setSelectedTenantIdsState(validIds);
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // localStorage indisponível
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // initialTenants é estável (vem do server component) — não dispara loop
  }, [initialTenants]);

  const setSelectedTenantIds = useCallback(
    (ids: string[]) => {
      setSelectedTenantIdsState(ids);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));

      if (ids.length === 1 && ids[0] !== activeTenantId) {
        switchTenantAction(ids[0]).then((success) => {
          if (success) {
            setActiveTenantId(ids[0]);
            router.refresh();
          } else {
            toast("Não foi possível trocar a empresa. Tente novamente.", "error");
          }
        }).catch(() => {
          toast("Não foi possível trocar a empresa. Tente novamente.", "error");
        });
      }
    },
    [activeTenantId, router]
  );

  const currentTenant = useMemo(() => {
    if (selectedTenantIds.length > 0) {
      return (
        initialTenants.find((t) => t.id === selectedTenantIds[0]) ||
        initialTenants.find((t) => t.id === activeTenantId) ||
        null
      );
    }
    return (
      initialTenants.find((t) => t.id === activeTenantId) ||
      initialTenants[0] ||
      null
    );
  }, [initialTenants, selectedTenantIds, activeTenantId]);

  const switchTenant = useCallback(
    async (tenantId: string) => {
      setIsSwitching(true);
      try {
        const success = await switchTenantAction(tenantId);
        if (success) {
          setActiveTenantId(tenantId);
          setSelectedTenantIdsState([tenantId]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([tenantId]));
          router.refresh();
        }
      } catch {
        toast("Não foi possível trocar a empresa. Tente novamente.", "error");
      } finally {
        setIsSwitching(false);
      }
    },
    [router]
  );

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        allTenants: initialTenants,
        selectedTenantIds,
        setSelectedTenantIds,
        switchTenant,
        isSwitching,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}
