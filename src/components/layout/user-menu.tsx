"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, LogOut, Shield, Loader2 } from "lucide-react";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  user: User;
  userPermissions?: Record<string, boolean>;
  role?: string;
}

export function UserMenu({ user, userPermissions = {}, role = "user" }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = (
    user.user_metadata?.name?.[0] ||
    user.email?.[0] ||
    "?"
  ).toUpperCase();
  const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "Usuário";
  const canAccessAdmin = userPermissions[PERMISSIONS.ADMIN_ACCESS];
  const roleLabel = ROLES[role]?.label ?? role;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-full ring-1 ring-zinc-200/50 transition-all hover:ring-zinc-300 dark:ring-zinc-700/50 dark:hover:ring-zinc-600"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Menu do usuário"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-[11px]">{userInitial}</AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {displayName}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </p>
            {roleLabel && (
              <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {roleLabel}
              </p>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
            >
              <UserCircle className="h-4 w-4 text-zinc-500" />
              <span>Perfil</span>
            </Link>

            {canAccessAdmin && (
              <Link
                href="/admin/users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              >
                <Shield className="h-4 w-4 text-zinc-500" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30",
                loggingOut && "opacity-60"
              )}
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
