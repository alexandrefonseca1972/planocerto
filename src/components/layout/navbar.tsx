"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { PlanocertoLogo } from "@/components/layout/planocerto-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PERMISSIONS } from "@/lib/permissions";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, UserCircle, LogOut, Menu, X, Shield, ClipboardList, Calendar,
} from "lucide-react";
import { TenantSwitcher } from "@/components/layout/tenant-switcher";
import { FontControl } from "@/components/layout/font-control";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";

interface NavbarProps {
  user: User;
  userPermissions: Record<string, boolean>;
  role: string;
}

export function Navbar({ user, userPermissions, role }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const userInitial = (user.user_metadata?.name?.[0] || user.email?.[0] || "?").toUpperCase();
  const canAccessAdmin = userPermissions[PERMISSIONS.ADMIN_ACCESS];

  async function handleLogout() {
    setLoggingOut(true);
    try { await logout(); } catch { setLoggingOut(false); }
  }

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/planos", label: "Planos", icon: ClipboardList },
    { href: "/calendario", label: "Calendário", icon: Calendar },
  ];

  const mobileLinks = [
    ...links,
    ...(canAccessAdmin ? [{ href: "/admin/users", label: "Admin", icon: Shield }] : []),
    { href: "/profile", label: "Perfil", icon: UserCircle },
  ];

  const linkClass = (href: string) => cn(
    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
    pathname.startsWith(href) ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
  );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/90">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-4">
          <PlanocertoLogo href="/dashboard" />
          <div className="hidden items-center gap-1 sm:flex">
            <TenantSwitcher userPermissions={userPermissions} />
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map(l => <Link key={l.href} href={l.href} className={linkClass(l.href)}><l.icon className="h-4 w-4" />{l.label}</Link>)}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <FontControl />
            <div className="hidden items-center border-l border-zinc-200/80 pl-3 sm:flex dark:border-zinc-700/80">
              <UserMenu user={user} userPermissions={userPermissions} role={role} />
            </div>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="sm:hidden rounded-md p-2 -mr-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-3 dark:border-zinc-700 dark:bg-zinc-900 sm:hidden animate-[slideDown_150ms_ease-out]">
          <div className="mb-3 flex items-center justify-between">
            <TenantSwitcher userPermissions={userPermissions} />
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ThemeToggle />
              <FontControl />
            </div>
          </div>
          <div className="space-y-0.5">
            {mobileLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", linkClass(l.href))}>
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-700">
            <Avatar className="h-8 w-8"><AvatarFallback className="text-[11px]">{userInitial}</AvatarFallback></Avatar>
            <div className="flex-1"><p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.user_metadata?.name || user.email}</p><p className="text-xs text-zinc-500 truncate">{user.email}</p></div>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={handleLogout} isLoading={loggingOut}><LogOut className="mr-1 h-4 w-4" />Sair</Button>
          </div>
        </div>
      )}
    </header>
  );
}
