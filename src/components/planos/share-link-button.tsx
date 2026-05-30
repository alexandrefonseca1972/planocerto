"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createPublicLink, getPublicLinks, deletePublicLink } from "@/app/actions/shared";
import { Share2, Copy, Trash2, Clock } from "lucide-react";

export function ShareLinkButton({ planId, toast, canCreate = false, autoOpen }: {
  planId: string;
  toast: (msg: string) => void;
  canCreate?: boolean;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<{ id: string; token: string; expires_at: string | null; created_at: string }[]>([]);
  const [expiresInHours, setExpiresInHours] = useState(24);

  const loadLinks = async () => {
    const l = await getPublicLinks(planId);
    setLinks(l);
    setOpen(true);
  };

  useEffect(() => {
    if (!autoOpen) return;
    const run = async () => { await loadLinks(); };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const handleCreate = async () => {
    const result = await createPublicLink(planId, expiresInHours);
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

  function formatExpires(expiresAt: string | null): string {
    if (!expiresAt) return "Sem prazo";
    const d = new Date(expiresAt);
    const now = new Date();
    const horas = Math.ceil((d.getTime() - now.getTime()) / 3600000);
    if (horas <= 0) return "Expirado";
    if (horas === 1) return "Expira em 1h";
    if (horas < 24) return `Expira em ${horas}h`;
    const dias = Math.ceil(horas / 24);
    return `Expira em ${dias} dia${dias > 1 ? "s" : ""}`;
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={loadLinks} title="Compartilhar dashboard">
        <Share2 className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-700">
            <span className="text-xs font-semibold text-zinc-500">Links públicos</span>
          </div>
          {canCreate && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-100 dark:border-zinc-700">
              <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
              <Select
                value={String(expiresInHours)}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="h-7 text-[11px] w-16"
              >
                <option value="1">1h</option>
                <option value="4">4h</option>
                <option value="8">8h</option>
                <option value="12">12h</option>
                <option value="24">24h</option>
                <option value="48">48h</option>
              </Select>
              <Button size="sm" variant="outline" onClick={handleCreate} className="text-xs h-7 ml-auto">Criar</Button>
            </div>
          )}
          {links.length === 0 ? (
            <p className="px-3 py-4 text-xs text-zinc-400 text-center">
              {canCreate ? "Nenhum link criado." : "Nenhum link disponível."}
            </p>
          ) : (
            links.map(link => (
              <div key={link.id} className="flex flex-col gap-0.5 px-3 py-2 text-xs border-b border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-zinc-600 dark:text-zinc-400 truncate">{getShareUrl(link.token)}</span>
                  <button onClick={() => navigator.clipboard.writeText(getShareUrl(link.token)).then(() => toast("Link copiado!"))} className="text-zinc-400 hover:text-zinc-600"><Copy className="h-3 w-3" /></button>
                  {canCreate && (
                    <button onClick={() => handleDelete(link.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400">{formatExpires(link.expires_at)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
