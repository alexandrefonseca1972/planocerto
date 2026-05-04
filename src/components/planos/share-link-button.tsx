"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createPublicLink, getPublicLinks, deletePublicLink } from "@/app/actions/shared";
import { Share2, Copy, Trash2 } from "lucide-react";

export function ShareLinkButton({ planId, toast }: { planId: string; toast: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<{ id: string; token: string; expires_at: string | null; created_at: string }[]>([]);

  const loadLinks = async () => {
    const l = await getPublicLinks(planId);
    setLinks(l);
    setOpen(true);
  };

  const handleCreate = async () => {
    const result = await createPublicLink(planId, 30);
    if (result.success && result.token) {
      toast("Link criado!");
      const l = await getPublicLinks(planId);
      setLinks(l);
    } else {
      toast(result.message || "Erro ao criar link.");
    }
  };

  const handleDelete = async (id: string) => {
    await deletePublicLink(id);
    const l = await getPublicLinks(planId);
    setLinks(l);
    toast("Link removido.");
  };

  const getShareUrl = (token: string) => `https://planocerto.ruphus.app/s/${token}`;

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={loadLinks} title="Compartilhar dashboard">
        <Share2 className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-700">
            <span className="text-xs font-semibold text-zinc-500">Links públicos</span>
            <Button size="sm" variant="outline" onClick={handleCreate} className="text-xs h-7">+ Novo</Button>
          </div>
          {links.length === 0 ? (
            <p className="px-3 py-4 text-xs text-zinc-400 text-center">Nenhum link criado.</p>
          ) : (
            links.map(link => (
              <div key={link.id} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-zinc-50 dark:border-zinc-800">
                <span className="flex-1 font-mono text-zinc-600 dark:text-zinc-400 truncate">{getShareUrl(link.token)}</span>
                <button onClick={() => navigator.clipboard.writeText(getShareUrl(link.token)).then(() => toast("Link copiado!"))} className="text-zinc-400 hover:text-zinc-600"><Copy className="h-3 w-3" /></button>
                <button onClick={() => handleDelete(link.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
