"use client";

import { type ReactNode } from "react";
import { TenantProvider } from "@/lib/contexts/tenant-context";
import type { Tenant } from "@/types/tenant";

interface TenantAwareWrapperProps {
  children: ReactNode;
  currentTenant: Tenant | null;
  tenants: Tenant[];
}

export function TenantAwareWrapper({
  children,
  currentTenant,
  tenants,
}: TenantAwareWrapperProps) {
  return (
    <TenantProvider
      initialTenant={currentTenant}
      initialTenants={tenants}
    >
      {children}
    </TenantProvider>
  );
}
