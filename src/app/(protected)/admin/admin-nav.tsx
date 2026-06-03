"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Users, Building2, Bell, Shield, ListChecks, LayoutDashboard } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: typeof Users;
  permission?: string;
  /** Exibido apenas para super_admin (visão global do SaaS). */
  superOnly?: boolean;
}

const allLinks: NavLink[] = [
  { href: "/admin/painel", label: "Painel", icon: LayoutDashboard, superOnly: true },
  { href: "/admin/users", label: "Usuários", icon: Users, permission: PERMISSIONS.USERS_READ },
  { href: "/admin/tenants", label: "Empresas", icon: Building2, permission: PERMISSIONS.TENANTS_READ },
  { href: "/admin/roles", label: "Papéis", icon: Shield, permission: PERMISSIONS.ROLES_MANAGE },
  { href: "/admin/catalogos", label: "Catálogos", icon: ListChecks, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/notifications", label: "Notificações", icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_CREATE },
];

export function AdminNav({
  userPermissions = {},
  isSuperAdmin = false,
}: {
  userPermissions?: Record<string, boolean>;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();

  const links = allLinks.filter((link) => {
    if (link.superOnly) return isSuperAdmin;
    return !link.permission || userPermissions[link.permission];
  });

  return (
    <nav className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
