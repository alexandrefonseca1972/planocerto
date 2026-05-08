export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export type UserRole = "super_admin" | "admin" | "manager" | "user" | "viewer";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  active_tenant_id: string | null;
  login_start_time: string | null;
  login_end_time: string | null;
  is_active: boolean;
  permissions: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithTenants extends Profile {
  tenant_ids: string[];
}

export interface AuthState {
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export interface FormState {
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  success?: boolean;
}
