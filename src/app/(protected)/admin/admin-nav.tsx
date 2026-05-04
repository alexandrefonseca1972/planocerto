"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Building2, Bell } from "lucide-react";

const links = [
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/tenants", label: "Empresas", icon: Building2 },
  { href: "/admin/notifications", label: "Notificações", icon: Bell },
];

export function AdminNav() {
  const pathname = usePathname();

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
