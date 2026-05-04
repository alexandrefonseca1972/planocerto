"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/types/tenant";
import { switchTenant as switchTenantAction } from "@/app/actions/tenant";

interface TenantContextType {
  currentTenant: Tenant | null;
  allTenants: Tenant[];
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
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(
    initialTenant?.id || null
  );
  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();

  const currentTenant = useMemo(
    () =>
      initialTenants.find((t) => t.id === selectedTenantId) ||
      initialTenants[0] ||
      null,
    [initialTenants, selectedTenantId]
  );

  const switchTenant = useCallback(
    async (tenantId: string) => {
      setIsSwitching(true);
      try {
        const success = await switchTenantAction(tenantId);
        if (success) {
          setSelectedTenantId(tenantId);
          router.refresh();
        }
      } catch {
        // ação falhou — mantém estado atual
      } finally {
        setIsSwitching(false);
      }
    },
    [router]
  );

  return (
    <TenantContext.Provider
      value={{ currentTenant, allTenants: initialTenants, switchTenant, isSwitching }}
    >
      {children}
    </TenantContext.Provider>
  );
}
