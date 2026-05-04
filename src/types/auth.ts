export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
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
