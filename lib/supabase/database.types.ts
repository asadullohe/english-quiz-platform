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
      question_options: {
        Row: {
          id: string;
          question_id: string;
          text: string;
          is_correct: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          text: string;
          is_correct?: boolean;
          order_index: number;
          created_at?: string;
        };
        Update: {
          text?: string;
          is_correct?: boolean;
          order_index?: number;
        };
      };
      question_text_answers: {
        Row: {
          id: string;
          question_id: string;
          answer_text: string;
          normalized_answer: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          answer_text: string;
          normalized_answer: string;
          created_at?: string;
        };
        Update: {
          answer_text?: string;
          normalized_answer?: string;
        };
      };
      question_tags: {
        Row: {
          id: string;
          question_id: string;
          tag: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          tag: string;
        };
        Update: {
          tag?: string;
        };
      };
      question_review_events: {
        Row: {
          id: string;
          question_id: string;
          actor_id: string;
          event_type:
            | "submitted"
            | "edited"
            | "commented"
            | "approved"
            | "needs_changes"
            | "rejected"
            | "flagged"
            | "archived";
          comment: string | null;
          visibility: "student_visible" | "internal";
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          actor_id: string;
          event_type:
            | "submitted"
            | "edited"
            | "commented"
            | "approved"
            | "needs_changes"
            | "rejected"
            | "flagged"
            | "archived";
          comment?: string | null;
          visibility?: "student_visible" | "internal";
          created_at?: string;
        };
        Update: {
          comment?: string | null;
          visibility?: "student_visible" | "internal";
        };
      };
      quiz_templates: {
        Row: {
          id: string;
          created_by_user_id: string;
          group_id: string | null;
          title: string;
          description: string | null;
          cover_image_asset_id: string | null;
          level_id: string | null;
          category_id: string | null;
          question_count_per_participant: number;
          duration_minutes: number;
          feedback_mode: "instant" | "after_finish";
          show_correct_answers_after_finish: boolean;
          allow_guests: boolean;
          status: "draft" | "active" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by_user_id: string;
          group_id?: string | null;
          title: string;
          description?: string | null;
          cover_image_asset_id?: string | null;
          level_id?: string | null;
          category_id?: string | null;
          question_count_per_participant: number;
          duration_minutes: number;
          feedback_mode?: "instant" | "after_finish";
          show_correct_answers_after_finish?: boolean;
          allow_guests?: boolean;
          status?: "draft" | "active" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          group_id?: string | null;
          title?: string;
          description?: string | null;
          cover_image_asset_id?: string | null;
          level_id?: string | null;
          category_id?: string | null;
          question_count_per_participant?: number;
          duration_minutes?: number;
          feedback_mode?: "instant" | "after_finish";
          show_correct_answers_after_finish?: boolean;
          allow_guests?: boolean;
          status?: "draft" | "active" | "archived";
          updated_at?: string;
        };
      };
      quiz_template_questions: {
        Row: {
          id: string;
          quiz_template_id: string;
          question_id: string;
          order_index: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_template_id: string;
          question_id: string;
          order_index?: number | null;
          created_at?: string;
        };
        Update: {
          order_index?: number | null;
        };
      };
      live_sessions: {
        Row: {
          id: string;
          quiz_template_id: string | null;
          group_id: string | null;
          created_by_user_id: string;
          join_code: string;
          title_snapshot: string;
          description_snapshot: string | null;
          cover_image_asset_id_snapshot: string | null;
          duration_minutes: number;
          question_count_per_participant: number;
          feedback_mode: "instant" | "after_finish";
          show_correct_answers_after_finish: boolean;
          allow_guests: boolean;
          status: "waiting" | "live" | "ended";
          started_at: string | null;
          ends_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_template_id?: string | null;
          group_id?: string | null;
          created_by_user_id: string;
          join_code: string;
          title_snapshot: string;
          description_snapshot?: string | null;
          cover_image_asset_id_snapshot?: string | null;
          duration_minutes: number;
          question_count_per_participant: number;
          feedback_mode: "instant" | "after_finish";
          show_correct_answers_after_finish: boolean;
          allow_guests?: boolean;
          status?: "waiting" | "live" | "ended";
          started_at?: string | null;
          ends_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "waiting" | "live" | "ended";
          started_at?: string | null;
          ends_at?: string | null;
          ended_at?: string | null;
          updated_at?: string;
        };
      };
      session_question_pool: {
        Row: {
          id: string;
          session_id: string;
          original_question_id: string;
          created_by_user_id_snapshot: string | null;
          points_snapshot: number;
          prompt_snapshot: string;
          explanation_snapshot: string | null;
          answer_type_snapshot: "single_choice" | "text";
          options_snapshot: Json | null;
          accepted_answers_snapshot: Json | null;
          image_asset_id_snapshot: string | null;
          audio_asset_id_snapshot: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          original_question_id: string;
          created_by_user_id_snapshot?: string | null;
          points_snapshot: number;
          prompt_snapshot: string;
          explanation_snapshot?: string | null;
          answer_type_snapshot: "single_choice" | "text";
          options_snapshot?: Json | null;
          accepted_answers_snapshot?: Json | null;
          image_asset_id_snapshot?: string | null;
          audio_asset_id_snapshot?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      participants: {
        Row: {
          id: string;
          session_id: string;
          participant_type: "account" | "guest";
          user_id: string | null;
          guest_name: string | null;
          status: "waiting" | "active" | "submitted" | "auto_submitted" | "removed";
          joined_at: string;
          removed_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          participant_type: "account" | "guest";
          user_id?: string | null;
          guest_name?: string | null;
          status?: "waiting" | "active" | "submitted" | "auto_submitted" | "removed";
          joined_at?: string;
          removed_at?: string | null;
        };
        Update: {
          status?: "waiting" | "active" | "submitted" | "auto_submitted" | "removed";
          removed_at?: string | null;
        };
      };
      attempts: {
        Row: {
          id: string;
          attempt_type: "live" | "self_practice";
          user_id: string | null;
          participant_id: string | null;
          live_session_id: string | null;
          status: "in_progress" | "retrying" | "submitted" | "auto_submitted" | "completed" | "removed";
          self_practice_level_id: string | null;
          self_practice_category_id: string | null;
          started_at: string;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_type: "live" | "self_practice";
          user_id?: string | null;
          participant_id?: string | null;
          live_session_id?: string | null;
          status?: "in_progress" | "retrying" | "submitted" | "auto_submitted" | "completed" | "removed";
          self_practice_level_id?: string | null;
          self_practice_category_id?: string | null;
          started_at?: string;
          submitted_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "in_progress" | "retrying" | "submitted" | "auto_submitted" | "completed" | "removed";
          submitted_at?: string | null;
        };
      };
      attempt_question_snapshots: {
        Row: {
          id: string;
          attempt_id: string;
          original_question_id: string | null;
          session_question_pool_id: string | null;
          created_by_user_id_snapshot: string | null;
          order_index: number;
          points_snapshot: number;
          answer_type_snapshot: "single_choice" | "text";
          prompt_snapshot: string;
          explanation_snapshot: string | null;
          options_snapshot: Json | null;
          accepted_answers_snapshot: Json | null;
          image_asset_id_snapshot: string | null;
          audio_asset_id_snapshot: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          original_question_id?: string | null;
          session_question_pool_id?: string | null;
          created_by_user_id_snapshot?: string | null;
          order_index: number;
          points_snapshot?: number;
          answer_type_snapshot: "single_choice" | "text";
          prompt_snapshot: string;
          explanation_snapshot?: string | null;
          options_snapshot?: Json | null;
          accepted_answers_snapshot?: Json | null;
          image_asset_id_snapshot?: string | null;
          audio_asset_id_snapshot?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      answers: {
        Row: {
          id: string;
          attempt_question_snapshot_id: string;
          selected_option_snapshot_id: string | null;
          text_answer: string | null;
          normalized_text_answer: string | null;
          is_skipped: boolean;
          auto_is_correct: boolean | null;
          final_is_correct: boolean | null;
          locked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attempt_question_snapshot_id: string;
          selected_option_snapshot_id?: string | null;
          text_answer?: string | null;
          normalized_text_answer?: string | null;
          is_skipped?: boolean;
          auto_is_correct?: boolean | null;
          final_is_correct?: boolean | null;
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          selected_option_snapshot_id?: string | null;
          text_answer?: string | null;
          normalized_text_answer?: string | null;
          is_skipped?: boolean;
          auto_is_correct?: boolean | null;
          final_is_correct?: boolean | null;
          locked_at?: string | null;
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
