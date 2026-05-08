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
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
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
