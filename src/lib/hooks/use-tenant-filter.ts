import { useEffect, useState } from "react";

const STORAGE_KEY = "planos_selected_tenants";

export function useTenantFilter(allTenantIds: string[]) {
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const validIds = parsed.filter((id: string) => allTenantIds.includes(id));
        if (validIds.length > 0) {
          setSelectedTenantIds(validIds);
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setSelectedTenantIds(allTenantIds);
  }, [allTenantIds]);

  const updateSelection = (ids: string[]) => {
    setSelectedTenantIds(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  };

  return {
    mounted,
    selectedTenantIds,
    updateSelection,
  };
}
