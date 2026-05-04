"use client";

import { useState, useEffect } from "react";
import { getNotifications, getUnreadCount, markAsRead } from "@/app/actions/notifications";
import type { NotificationItem } from "@/app/actions/notifications";
import { Bell, X, Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcon: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  // Poll unread count every 30s
  useEffect(() => {
    const fetch = () => { getUnreadCount().then(setUnread).catch(() => {}); };
    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      getNotifications().then(setNotifications);
    } else {
      getUnreadCount().then(setUnread);
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notification-bell]")) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const handleRead = async (id: string) => {
    await markAsRead(id);
    setUnread(p => Math.max(0, p - 1));
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="relative" data-notification-bell>
      <button onClick={() => setOpen(!open)} className="relative rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-700">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Notificações</span>
            <button onClick={() => setOpen(false)} className="rounded p-0.5 text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-zinc-400">Nenhuma notificação.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => handleRead(n.id)}
                  className={cn("flex items-start gap-2 px-3 py-2.5 text-xs cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50", !n.read && "bg-blue-50/50 dark:bg-blue-950/20")}>
                  <span className="mt-0.5">{typeIcon[n.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", !n.read ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400")}>{n.title}</p>
                    {n.message && <p className="text-zinc-500 truncate mt-0.5">{n.message}</p>}
                    <p className="text-zinc-400 mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
