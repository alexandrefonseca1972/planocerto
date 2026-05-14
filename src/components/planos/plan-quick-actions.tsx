"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CopyPlanButton } from "@/components/planos/copy-plan-button";
import { ShareLinkButton } from "@/components/planos/share-link-button";
import { MoreHorizontal, Copy, Share2 } from "lucide-react";
import type { ActionPlan } from "@/types/action-plan";

interface Props {
  plan: ActionPlan | null;
  plans: ActionPlan[];
  toast: (msg: string, type?: "success" | "error") => void;
  router: { refresh: () => void };
}

export function PlanQuickActions({ plan, plans, toast, router }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)} title="Mais ações">
        <MoreHorizontal className="h-3.5 w-3.5" />
        <span className="hidden sm:inline ml-1 text-xs">Ações</span>
      </Button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 py-1">
          <button
            onClick={() => { setMenuOpen(false); setShowClone(true); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Copy className="h-3.5 w-3.5" /> Clonar plano
          </button>
          {plan && (
            <button
              onClick={() => { setMenuOpen(false); setShowShare(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Share2 className="h-3.5 w-3.5" /> Compartilhar
            </button>
          )}
        </div>
      )}

      {showClone && (
        <CopyPlanButton plan={plan} plans={plans} toast={toast} router={router} autoOpen />
      )}
      {showShare && plan && (
        <ShareLinkButton planId={plan.id} toast={(m) => toast(m)} canCreate autoOpen />
      )}
    </div>
  );
}
