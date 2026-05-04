"use client";

import { useState } from "react";
import type { ActionPlan } from "@/types/action-plan";
import { Button } from "@/components/ui/button";
import { copyPlan } from "@/app/actions/shared";
import { Building2, Copy } from "lucide-react";

export function CopyPlanButton({ plan, toast, router }: {
  plan: ActionPlan | null;
  toast: (msg: string) => void;
  router: ReturnType<typeof import("next/navigation").useRouter>;
}) {
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  const loadTenants = async () => {
    const { getUserTenants } = await import("@/app/actions/tenant");
    const t = await getUserTenants();
    setTenants(t.filter(t => t.active !== false));
    setOpen(true);
  };

  const handleCopy = async (targetId: string) => {
    if (!plan) return;
    setOpen(false);
    const result = await copyPlan(plan.id, targetId);
    if (result.success) { toast(result.message); router.refresh(); }
    else toast(result.message || "Erro ao copiar.");
  };

  if (!plan) return null;

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={loadTenants} title="Copiar plano">
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500">Copiar para</div>
          {tenants.map(t => (
            <button key={t.id} onClick={() => handleCopy(t.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <Building2 className="h-3.5 w-3.5" /> {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
