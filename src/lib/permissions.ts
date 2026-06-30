export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_MANAGE_TENANTS: "users.manage_tenants",
  TENANTS_READ: "tenants.read",
  TENANTS_CREATE: "tenants.create",
  TENANTS_UPDATE: "tenants.update",
  TENANTS_DELETE: "tenants.delete",
  TENANTS_MANAGE_MEMBERS: "tenants.manage_members",
  PLANS_CREATE: "plans.create",
  PLANS_READ: "plans.read",
  PLANS_UPDATE: "plans.update",
  PLANS_DELETE: "plans.delete",
  NOTIFICATIONS_CREATE: "notifications.create",
  NOTIFICATIONS_UPDATE: "notifications.update",
  NOTIFICATIONS_DELETE: "notifications.delete",
  TEMPLATES_MANAGE: "templates.manage",
  REPORTS_VIEW: "reports.view",
  SETTINGS_MANAGE: "settings.manage",
  ADMIN_ACCESS: "admin.access",
  ROLES_MANAGE: "roles.manage",
  FINANCE_READ: "finance.read",
  FINANCE_CREATE: "finance.create",
  FINANCE_UPDATE: "finance.update",
  FINANCE_DELETE: "finance.delete",
  COMPETITOR_READ: "competitor.read",
  COMPETITOR_WRITE: "competitor.write",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export interface RoleDefinition {
  key: string;
  label: string;
  description: string;
  permissions: Permission[];
}

export const ROLES: Record<string, RoleDefinition> = {
  super_admin: {
    key: "super_admin",
    label: "Super Admin",
    description: "Gerencia empresas (tenants) e tem acesso total ao sistema e a todos os clientes.",
    permissions: [...ALL_PERMISSIONS],
  },
  admin: {
    key: "admin",
    label: "Administrador",
    description: "Acesso total ao sistema.",
    permissions: [...ALL_PERMISSIONS],
  },
  manager: {
    key: "manager",
    label: "Gerente",
    description: "Gerencia usuários, empresas e planos. Sem acesso a configurações do sistema.",
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_MANAGE_TENANTS,
      PERMISSIONS.TENANTS_READ,
      PERMISSIONS.TENANTS_CREATE,
      PERMISSIONS.TENANTS_UPDATE,
      PERMISSIONS.TENANTS_MANAGE_MEMBERS,
      PERMISSIONS.PLANS_CREATE,
      PERMISSIONS.PLANS_READ,
      PERMISSIONS.PLANS_UPDATE,
      PERMISSIONS.PLANS_DELETE,
      PERMISSIONS.NOTIFICATIONS_CREATE,
      PERMISSIONS.NOTIFICATIONS_UPDATE,
      PERMISSIONS.NOTIFICATIONS_DELETE,
      PERMISSIONS.TEMPLATES_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.ADMIN_ACCESS,
      PERMISSIONS.FINANCE_READ,
      PERMISSIONS.FINANCE_CREATE,
      PERMISSIONS.FINANCE_UPDATE,
      PERMISSIONS.FINANCE_DELETE,
      PERMISSIONS.COMPETITOR_READ,
      PERMISSIONS.COMPETITOR_WRITE,
    ],
  },
  user: {
    key: "user",
    label: "Usuário",
    description: "Acesso básico: criar e editar planos próprios.",
    permissions: [
      PERMISSIONS.PLANS_CREATE,
      PERMISSIONS.PLANS_READ,
      PERMISSIONS.PLANS_UPDATE,
      PERMISSIONS.FINANCE_READ,
      PERMISSIONS.COMPETITOR_READ,
    ],
  },
  viewer: {
    key: "viewer",
    label: "Visualizador",
    description: "Apenas leitura de planos.",
    permissions: [
      PERMISSIONS.PLANS_READ,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.FINANCE_READ,
      PERMISSIONS.COMPETITOR_READ,
    ],
  },
};

export interface CustomRoleDefinition {
  name: string;
  permissions: Record<string, boolean>;
}

export function getRolePermissions(role: string, customRoles?: Record<string, Permission[]>): Permission[] {
  if (customRoles?.[role]) return customRoles[role];
  return ROLES[role]?.permissions ?? [];
}

export function getPermissionsMap(
  role: string,
  overrides?: Record<string, boolean> | null,
  customRoles?: Record<string, Permission[]>
): Record<Permission, boolean> {
  const base = getRolePermissions(role, customRoles);
  const map: Record<string, boolean> = {};

  for (const perm of ALL_PERMISSIONS) {
    map[perm] = base.includes(perm);
  }

  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (PERMISSIONS[key as keyof typeof PERMISSIONS]) {
        map[key] = Boolean(value);
      }
    }
  }

  return map as Record<Permission, boolean>;
}

export function hasPermission(
  userPermissions: Record<string, boolean> | null,
  role: string,
  requiredPermission: Permission,
  customRoles?: Record<string, Permission[]>
): boolean {
  const effectivePermissions = getPermissionsMap(role, userPermissions, customRoles);
  return effectivePermissions[requiredPermission] === true;
}

export function isAdminLike(role: string): boolean {
  return role === "super_admin" || role === "admin" || role === "manager";
}

export function isSuperAdmin(role: string): boolean {
  return role === "super_admin";
}

export function hasAnyPermission(
  userPermissions: Record<string, boolean> | null,
  role: string,
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((p) => hasPermission(userPermissions, role, p));
}

export function hasAllPermissions(
  userPermissions: Record<string, boolean> | null,
  role: string,
  requiredPermissions: Permission[],
  customRoles?: Record<string, Permission[]>
): boolean {
  return requiredPermissions.every((p) => hasPermission(userPermissions, role, p, customRoles));
}

export function buildCustomRolesMap(
  roles: { name: string; permissions: Record<string, boolean> }[]
): Record<string, Permission[]> {
  const map: Record<string, Permission[]> = {};
  for (const role of roles) {
    const perms: Permission[] = [];
    for (const [key, value] of Object.entries(role.permissions)) {
      if (value && ALL_PERMISSIONS.includes(key as Permission)) {
        perms.push(key as Permission);
      }
    }
    map[role.name] = perms;
  }
  return map;
}

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Administração",
    permissions: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ROLES_MANAGE],
  },
  {
    label: "Usuários",
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.USERS_MANAGE_TENANTS,
    ],
  },
  {
    label: "Empresas",
    permissions: [
      PERMISSIONS.TENANTS_READ,
      PERMISSIONS.TENANTS_CREATE,
      PERMISSIONS.TENANTS_UPDATE,
      PERMISSIONS.TENANTS_DELETE,
      PERMISSIONS.TENANTS_MANAGE_MEMBERS,
    ],
  },
  {
    label: "Planos de Ação",
    permissions: [
      PERMISSIONS.PLANS_CREATE,
      PERMISSIONS.PLANS_READ,
      PERMISSIONS.PLANS_UPDATE,
      PERMISSIONS.PLANS_DELETE,
    ],
  },
  {
    label: "Notificações",
    permissions: [
      PERMISSIONS.NOTIFICATIONS_CREATE,
      PERMISSIONS.NOTIFICATIONS_UPDATE,
      PERMISSIONS.NOTIFICATIONS_DELETE,
    ],
  },
  {
    label: "Financeiro",
    permissions: [
      PERMISSIONS.FINANCE_READ,
      PERMISSIONS.FINANCE_CREATE,
      PERMISSIONS.FINANCE_UPDATE,
      PERMISSIONS.FINANCE_DELETE,
    ],
  },
  {
    label: "Benchmarking",
    permissions: [PERMISSIONS.COMPETITOR_READ, PERMISSIONS.COMPETITOR_WRITE],
  },
  {
    label: "Outros",
    permissions: [PERMISSIONS.TEMPLATES_MANAGE, PERMISSIONS.REPORTS_VIEW],
  },
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.USERS_READ]: "Ver usuários",
  [PERMISSIONS.USERS_CREATE]: "Criar usuários",
  [PERMISSIONS.USERS_UPDATE]: "Editar usuários",
  [PERMISSIONS.USERS_DELETE]: "Excluir usuários",
  [PERMISSIONS.USERS_MANAGE_TENANTS]: "Gerenciar empresas dos usuários",
  [PERMISSIONS.TENANTS_READ]: "Ver empresas",
  [PERMISSIONS.TENANTS_CREATE]: "Criar empresas",
  [PERMISSIONS.TENANTS_UPDATE]: "Editar empresas",
  [PERMISSIONS.TENANTS_DELETE]: "Excluir empresas",
  [PERMISSIONS.TENANTS_MANAGE_MEMBERS]: "Gerenciar membros",
  [PERMISSIONS.PLANS_CREATE]: "Criar planos",
  [PERMISSIONS.PLANS_READ]: "Ver planos",
  [PERMISSIONS.PLANS_UPDATE]: "Editar planos",
  [PERMISSIONS.PLANS_DELETE]: "Excluir planos",
  [PERMISSIONS.NOTIFICATIONS_CREATE]: "Criar notificações",
  [PERMISSIONS.NOTIFICATIONS_UPDATE]: "Editar notificações",
  [PERMISSIONS.NOTIFICATIONS_DELETE]: "Excluir notificações",
  [PERMISSIONS.TEMPLATES_MANAGE]: "Gerenciar templates",
  [PERMISSIONS.REPORTS_VIEW]: "Ver relatórios",
  [PERMISSIONS.SETTINGS_MANAGE]: "Gerenciar configurações",
  [PERMISSIONS.ROLES_MANAGE]: "Gerenciar papéis",
  [PERMISSIONS.ADMIN_ACCESS]: "Acessar painel admin",
  [PERMISSIONS.FINANCE_READ]: "Ver financeiro",
  [PERMISSIONS.FINANCE_CREATE]: "Criar contas a pagar",
  [PERMISSIONS.FINANCE_UPDATE]: "Editar contas a pagar",
  [PERMISSIONS.FINANCE_DELETE]: "Excluir contas a pagar",
  [PERMISSIONS.COMPETITOR_READ]: "Ver benchmarking",
  [PERMISSIONS.COMPETITOR_WRITE]: "Gerenciar benchmarking",
};
