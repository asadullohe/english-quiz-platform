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
      levels: {
        Row: {
          id: string;
          slug: string;
          name: string;
          order_index: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          order_index: number;
          is_active?: boolean;
        };
        Update: {
          slug?: string;
          name?: string;
          order_index?: number;
          is_active?: boolean;
        };
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          order_index: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          order_index: number;
          is_active?: boolean;
        };
        Update: {
          slug?: string;
          name?: string;
          order_index?: number;
          is_active?: boolean;
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
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "student" | "teacher" | "support_teacher";
          joined_at: string;
          status: "active" | "removed";
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role: "student" | "teacher" | "support_teacher";
          joined_at?: string;
          status?: "active" | "removed";
        };
        Update: {
          role?: "student" | "teacher" | "support_teacher";
          joined_at?: string;
          status?: "active" | "removed";
        };
      };
      question_assignments: {
        Row: {
          id: string;
          group_id: string;
          created_by_user_id: string;
          title: string;
          topic: string;
          level_id: string | null;
          category_id: string | null;
          questions_per_student: number;
          deadline_at: string | null;
          share_approved_to_public_bank: boolean;
          status: "open" | "reviewing" | "ready" | "used" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          created_by_user_id: string;
          title: string;
          topic: string;
          level_id?: string | null;
          category_id?: string | null;
          questions_per_student: number;
          deadline_at?: string | null;
          share_approved_to_public_bank?: boolean;
          status?: "open" | "reviewing" | "ready" | "used" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          group_id?: string;
          title?: string;
          topic?: string;
          level_id?: string | null;
          category_id?: string | null;
          questions_per_student?: number;
          deadline_at?: string | null;
          share_approved_to_public_bank?: boolean;
          status?: "open" | "reviewing" | "ready" | "used" | "archived";
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          created_by_user_id: string;
          source_assignment_id: string | null;
          source_group_id: string | null;
          level_id: string | null;
          category_id: string | null;
          answer_type: "single_choice" | "text";
          prompt: string;
          explanation: string | null;
          image_asset_id: string | null;
          audio_asset_id: string | null;
          points: number;
          visibility: "public" | "group_only";
          status:
            | "draft"
            | "pending_review"
            | "needs_changes"
            | "approved"
            | "rejected"
            | "flagged"
            | "archived";
          approved_by_user_id: string | null;
          approved_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by_user_id: string;
          source_assignment_id?: string | null;
          source_group_id?: string | null;
          level_id?: string | null;
          category_id?: string | null;
          answer_type: "single_choice" | "text";
          prompt: string;
          explanation?: string | null;
          image_asset_id?: string | null;
          audio_asset_id?: string | null;
          points?: number;
          visibility?: "public" | "group_only";
          status?:
            | "draft"
            | "pending_review"
            | "needs_changes"
            | "approved"
            | "rejected"
            | "flagged"
            | "archived";
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          source_assignment_id?: string | null;
          source_group_id?: string | null;
          level_id?: string | null;
          category_id?: string | null;
          answer_type?: "single_choice" | "text";
          prompt?: string;
          explanation?: string | null;
          image_asset_id?: string | null;
          audio_asset_id?: string | null;
          points?: number;
          visibility?: "public" | "group_only";
          status?:
            | "draft"
            | "pending_review"
            | "needs_changes"
            | "approved"
            | "rejected"
            | "flagged"
            | "archived";
          approved_by_user_id?: string | null;
          approved_at?: string | null;
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
