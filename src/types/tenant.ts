export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  active: boolean;
  logo_url: string | null;
  teams_webhook_url: string;
  cnpj: string;
  responsavel_nome: string;
  email: string;
  site: string;
  fone: string;
  /** Limite de unidades da empresa. null = ilimitado. */
  max_units: number | null;
  created_at: string;
  updated_at: string;
}

// Valores aceitos no runtime (admin.ts VALID_TENANT_ROLES)
export type TenantMemberRole = "owner" | "admin" | "member" | "manager" | "user" | "viewer";

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantMemberRole;
  created_at: string;
}

export interface TenantMemberWithProfile extends TenantMember {
  profiles: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface TenantFormState {
  message?: string;
  errors?: {
    name?: string[];
    slug?: string[];
    plan?: string[];
    email?: string[];
    role?: string[];
    cnpj?: string[];
    responsavel_nome?: string[];
    site?: string[];
    fone?: string[];
    teams_webhook_url?: string[];
  };
  success?: boolean;
}
