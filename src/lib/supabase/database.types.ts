export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; name: string; email: string; role: "user" | "admin";
          avatar_url: string | null; active_tenant_id: string | null;
          phone: string; social_media: Json;
          permissions: Json; login_start_time: string | null; login_end_time: string | null; is_active: boolean;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; name?: string; email?: string; role?: "user" | "admin";
          avatar_url?: string | null; active_tenant_id?: string | null;
          phone?: string; social_media?: Json;
          permissions?: Json; login_start_time?: string | null; login_end_time?: string | null; is_active?: boolean;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; name?: string; email?: string; role?: "user" | "admin";
          avatar_url?: string | null; active_tenant_id?: string | null;
          phone?: string; social_media?: Json;
          permissions?: Json; login_start_time?: string | null; login_end_time?: string | null; is_active?: boolean;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string; name: string; slug: string;
          plan: "free" | "pro" | "enterprise"; active: boolean;
          logo_url: string | null; teams_webhook_url: string;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; name: string; slug: string;
          plan?: "free" | "pro" | "enterprise"; active?: boolean;
          logo_url?: string | null; teams_webhook_url?: string;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; name?: string; slug?: string;
          plan?: "free" | "pro" | "enterprise"; active?: boolean;
          logo_url?: string | null; teams_webhook_url?: string;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      tenant_members: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Relationships: [];
      };
      action_plans: {
        Row: {
          id: string; tenant_id: string; title: string;
          unit: string; director: string; goal: string;
          status: string; user_id: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; tenant_id: string; title: string;
          unit?: string; director?: string; goal?: string;
          status?: string; user_id?: string; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; tenant_id?: string; title?: string;
          unit?: string; director?: string; goal?: string;
          status?: string; user_id?: string; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      action_items: {
        Row: {
          id: string; plan_id: string; parent_id: string | null; number: string; sort_order: number;
          action: string; why: string; where: string; responsible: string;
          planned_start: string | null; planned_end: string | null; actual_start: string | null; actual_end: string | null;
          cost: string; expected_result: string; actual_result: string; status: number; observations: string;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; plan_id: string; parent_id?: string | null; number: string; sort_order?: number;
          action: string; why?: string; where?: string; responsible?: string;
          planned_start?: string | null; planned_end?: string | null; actual_start?: string | null; actual_end?: string | null;
          cost?: string; expected_result?: string; actual_result?: string; status?: number; observations?: string;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; plan_id?: string; parent_id?: string | null; number?: string; sort_order?: number;
          action?: string; why?: string; where?: string; responsible?: string;
          planned_start?: string | null; planned_end?: string | null; actual_start?: string | null; actual_end?: string | null;
          cost?: string; expected_result?: string; actual_result?: string; status?: number; observations?: string;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      plan_audit_log: {
        Row: { id: string; plan_id: string; item_id: string | null; action: string; snapshot: Json; user_id: string | null; user_name: string; created_at: string; };
        Insert: { id?: string; plan_id: string; item_id?: string | null; action: string; snapshot?: Json; user_id?: string | null; user_name?: string; created_at?: string; };
        Update: { id?: string; plan_id?: string; item_id?: string | null; action?: string; snapshot?: Json; user_id?: string | null; user_name?: string; created_at?: string; };
        Relationships: [];
      };
      notifications: {
        Row: { id: string; title: string; message: string; type: string; target_type: string; target_id: string | null; is_fixed: boolean; expires_at: string | null; created_by: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; title: string; message?: string; type?: string; target_type?: string; target_id?: string | null; is_fixed?: boolean; expires_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; title?: string; message?: string; type?: string; target_type?: string; target_id?: string | null; is_fixed?: boolean; expires_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      notification_reads: {
        Row: { id: string; notification_id: string; user_id: string; read_at: string; };
        Insert: { id?: string; notification_id: string; user_id: string; read_at?: string; };
        Update: { id?: string; notification_id?: string; user_id?: string; read_at?: string; };
        Relationships: [];
      };
      item_comments: {
        Row: { id: string; item_id: string; user_id: string; content: string; created_at: string; updated_at: string; };
        Insert: { id?: string; item_id: string; user_id: string; content: string; created_at?: string; updated_at?: string; };
        Update: { id?: string; item_id?: string; user_id?: string; content?: string; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      public_links: {
        Row: { id: string; plan_id: string; token: string; expires_at: string | null; created_by: string | null; created_at: string; };
        Insert: { id?: string; plan_id: string; token: string; expires_at?: string | null; created_by?: string | null; created_at?: string; };
        Update: { id?: string; plan_id?: string; token?: string; expires_at?: string | null; created_by?: string | null; created_at?: string; };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
