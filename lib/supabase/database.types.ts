export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: "student" | "teacher" | "support_teacher" | "admin";
          status: "active" | "disabled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: "student" | "teacher" | "support_teacher" | "admin";
          status?: "active" | "disabled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          role?: "student" | "teacher" | "support_teacher" | "admin";
          status?: "active" | "disabled";
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          level_id: string | null;
          teacher_id: string;
          invite_code: string;
          invite_enabled: boolean;
          status: "active" | "archived";
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          level_id?: string | null;
          teacher_id: string;
          invite_code: string;
          invite_enabled?: boolean;
          status?: "active" | "archived";
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          level_id?: string | null;
          invite_code?: string;
          invite_enabled?: boolean;
          status?: "active" | "archived";
          archived_at?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link_url: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link_url?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
