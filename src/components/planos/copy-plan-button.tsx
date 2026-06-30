"use client";

import { useState, useEffect } from "react";
import { Copy, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { clonePlanWithDateShift } from "@/app/actions/action-plan";
import { copyPlan } from "@/app/actions/shared";
import type { ActionPlan } from "@/types/action-plan";

interface CopyPlanButtonProps {
  plan: ActionPlan | null;
  plans?: ActionPlan[];
  toast: (msg: string, type?: "success" | "error") => void;
  router: { refresh: () => void };
  autoOpen?: boolean;
}

export function CopyPlanButton({ plan, plans, toast, router, autoOpen }: CopyPlanButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStartDate, setNewStartDate] = useState("");
  const [targetTenantId, setTargetTenantId] = useState("");
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState(plan?.id || "");
  const [allPlans, setAllPlans] = useState<ActionPlan[]>([]);
  const hasPlansList = plans && plans.length > 0;

  const loadTenantsAndOpen = async () => {
    try {
      const { getUserTenants } = await import("@/app/actions/tenant");
      const t = await getUserTenants();
      const activeTenants = t.filter(t => t.active !== false);
      setTenants(activeTenants);
      setTargetTenantId(plan?.tenant_id || activeTenants[0]?.id || "");
      if (plans) setAllPlans(plans);
      if (!plan && plans) setSelectedPlanId(plans[0]?.id || "");
      setOpen(true);
    } catch {
      toast("Erro ao carregar empresas.", "error");
    }
  };

  useEffect(() => {
    if (!autoOpen) return;
    const run = async () => { await loadTenantsAndOpen(); };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const effectivePlanId = plan?.id || selectedPlanId;
  const effectivePlan = plan || allPlans.find(p => p.id === selectedPlanId) || null;

  if (!plan && !hasPlansList) return null;

  const handleClone = async () => {
    if (!effectivePlanId) return;
    setLoading(true);
    try {
      const sourceTenantId = effectivePlan?.tenant_id ?? "";
      const isCrossTenant = targetTenantId && sourceTenantId && targetTenantId !== sourceTenantId;
      const result = isCrossTenant
        ? await copyPlan(effectivePlanId, targetTenantId)
        : await clonePlanWithDateShift(effectivePlanId, newStartDate);

      if (result.success) {
        toast(result.message || "Plano clonado!");
        if (isCrossTenant) {
          toast("A projeção de datas é aplicada apenas quando a clonagem ocorre na mesma empresa.");
        }
        setOpen(false);
        router.refresh();
      } else {
        toast(result.message || "Erro ao clonar.", "error");
      }
    } catch {
      toast("Serviço indisponível.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={loadTenantsAndOpen} title="Clonar ou Copiar Plano">
        <Copy className="h-3.5 w-3.5 mr-1" /> Clonar
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent closeOnOverlayClick={false} closeOnEsc={false}>
          <AlertDialogHeader>
            <AlertDialogTitle>Clonar Plano de Ação</AlertDialogTitle>
            <AlertDialogDescription>
              {effectivePlan
                ? `Isso criará uma cópia completa de "${effectivePlan.title}" com todas as suas ações reiniciadas para "Não Iniciada".`
                : "Selecione um plano para clonar."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            {!plan && hasPlansList && (
              <div className="space-y-2">
                <Label htmlFor="source-plan" className="text-sm font-medium flex items-center gap-2">
                  <Copy className="h-4 w-4 text-zinc-400" />
                  Plano de Origem
                </Label>
                <Select
                  id="source-plan"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="h-10"
                >
                  {plans!.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="target-tenant" className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-400" />
                Empresa Destino
              </Label>
              <Select 
                id="target-tenant"
                value={targetTenantId}
                onChange={(e) => setTargetTenantId(e.target.value)}
                className="h-10"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-start-date" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                Nova Data de Início (Projeção)
              </Label>
              <Input 
                id="new-start-date"
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="h-10"
              />
              <p className="text-[11px] text-zinc-500">
                Opcional. A projeção de datas é aplicada apenas quando a clonagem ocorre na mesma empresa.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <Button onClick={handleClone} isLoading={loading} disabled={loading || !effectivePlanId}>
              Confirmar Clonagem
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
