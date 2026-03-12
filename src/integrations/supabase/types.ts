export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_logs: {
        Row: {
          action: string
          agent_name: string
          created_at: string
          detail: string | null
          id: string
          level: string
          pipeline_run_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          agent_name: string
          created_at?: string
          detail?: string | null
          id?: string
          level?: string
          pipeline_run_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          agent_name?: string
          created_at?: string
          detail?: string | null
          id?: string
          level?: string
          pipeline_run_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          agent_name: string
          id: string
          last_run: string | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          agent_name: string
          id?: string
          last_run?: string | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string
          id?: string
          last_run?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_opportunities: {
        Row: {
          created_at: string
          gancho: string | null
          id: string
          plataforma: string | null
          pontuacao_viral: number | null
          roteiro_curto: string | null
          slides_carrossel: Json | null
          source_problem_id: string | null
          tipo_conteudo: string | null
          titulo_conteudo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gancho?: string | null
          id?: string
          plataforma?: string | null
          pontuacao_viral?: number | null
          roteiro_curto?: string | null
          slides_carrossel?: Json | null
          source_problem_id?: string | null
          tipo_conteudo?: string | null
          titulo_conteudo: string
          user_id: string
        }
        Update: {
          created_at?: string
          gancho?: string | null
          id?: string
          plataforma?: string | null
          pontuacao_viral?: number | null
          roteiro_curto?: string | null
          slides_carrossel?: Json | null
          source_problem_id?: string | null
          tipo_conteudo?: string | null
          titulo_conteudo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_opportunities_source_problem_id_fkey"
            columns: ["source_problem_id"]
            isOneToOne: false
            referencedRelation: "detected_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_problems: {
        Row: {
          complaint_examples: Json | null
          created_at: string
          frequency_score: number | null
          id: string
          impact_level: string | null
          niche_category: string | null
          nichos: string | null
          problem_description: string | null
          problem_title: string
          related_tools: Json | null
          source_platform: string | null
          timing_status: string | null
          urgency_score: number | null
          user_id: string
          viral_score: number | null
        }
        Insert: {
          complaint_examples?: Json | null
          created_at?: string
          frequency_score?: number | null
          id?: string
          impact_level?: string | null
          niche_category?: string | null
          nichos?: string | null
          problem_description?: string | null
          problem_title: string
          related_tools?: Json | null
          source_platform?: string | null
          timing_status?: string | null
          urgency_score?: number | null
          user_id: string
          viral_score?: number | null
        }
        Update: {
          complaint_examples?: Json | null
          created_at?: string
          frequency_score?: number | null
          id?: string
          impact_level?: string | null
          niche_category?: string | null
          nichos?: string | null
          problem_description?: string | null
          problem_title?: string
          related_tools?: Json | null
          source_platform?: string | null
          timing_status?: string | null
          urgency_score?: number | null
          user_id?: string
          viral_score?: number | null
        }
        Relationships: []
      }
      mvp_plans: {
        Row: {
          core_features: Json
          created_at: string
          id: string
          monetization: string
          opportunity_id: string
          product_concept: string
          roadmap: Json
          tech_stack: Json
          ui_structure: Json
          user_id: string
        }
        Insert: {
          core_features?: Json
          created_at?: string
          id?: string
          monetization: string
          opportunity_id: string
          product_concept: string
          roadmap?: Json
          tech_stack?: Json
          ui_structure?: Json
          user_id: string
        }
        Update: {
          core_features?: Json
          created_at?: string
          id?: string
          monetization?: string
          opportunity_id?: string
          product_concept?: string
          roadmap?: Json
          tech_stack?: Json
          ui_structure?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvp_plans_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          audience: string | null
          competition_score: number | null
          demand_score: number | null
          id: string
          niche_name: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          competition_score?: number | null
          demand_score?: number | null
          id?: string
          niche_name: string
          user_id: string
        }
        Update: {
          audience?: string | null
          competition_score?: number | null
          demand_score?: number | null
          id?: string
          niche_name?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          competition_level: string | null
          created_at: string
          difficulty_level: string | null
          id: string
          market_score: number | null
          niche: string | null
          problem: string | null
          solution: string | null
          source_pattern_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          competition_level?: string | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          market_score?: number | null
          niche?: string | null
          problem?: string | null
          solution?: string | null
          source_pattern_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          competition_level?: string | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          market_score?: number | null
          niche?: string | null
          problem?: string | null
          solution?: string | null
          source_pattern_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_source_pattern_id_fkey"
            columns: ["source_pattern_id"]
            isOneToOne: false
            referencedRelation: "problem_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics: {
        Row: {
          comentarios: number | null
          compartilhamentos: number | null
          curtidas: number | null
          data_coleta: string
          id: string
          post_id: string | null
          salvamentos: number | null
          user_id: string
          visualizacoes: number | null
        }
        Insert: {
          comentarios?: number | null
          compartilhamentos?: number | null
          curtidas?: number | null
          data_coleta?: string
          id?: string
          post_id?: string | null
          salvamentos?: number | null
          user_id: string
          visualizacoes?: number | null
        }
        Update: {
          comentarios?: number | null
          compartilhamentos?: number | null
          curtidas?: number | null
          data_coleta?: string
          id?: string
          post_id?: string | null
          salvamentos?: number | null
          user_id?: string
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_patterns: {
        Row: {
          average_viral_score: number | null
          created_at: string
          id: string
          oportunidades_geradas: Json | null
          pattern_description: string | null
          pattern_title: string
          related_problems: Json | null
          total_occurrences: number | null
          user_id: string
        }
        Insert: {
          average_viral_score?: number | null
          created_at?: string
          id?: string
          oportunidades_geradas?: Json | null
          pattern_description?: string | null
          pattern_title: string
          related_problems?: Json | null
          total_occurrences?: number | null
          user_id: string
        }
        Update: {
          average_viral_score?: number | null
          created_at?: string
          id?: string
          oportunidades_geradas?: Json | null
          pattern_description?: string | null
          pattern_title?: string
          related_problems?: Json | null
          total_occurrences?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tool_combinations: {
        Row: {
          content_idea: string | null
          created_at: string
          expected_result: string | null
          id: string
          innovation_score: number | null
          solution_description: string | null
          solution_name: string
          source_problem_id: string | null
          tools_used: Json
          user_id: string
          video_script: Json | null
        }
        Insert: {
          content_idea?: string | null
          created_at?: string
          expected_result?: string | null
          id?: string
          innovation_score?: number | null
          solution_description?: string | null
          solution_name: string
          source_problem_id?: string | null
          tools_used?: Json
          user_id: string
          video_script?: Json | null
        }
        Update: {
          content_idea?: string | null
          created_at?: string
          expected_result?: string | null
          id?: string
          innovation_score?: number | null
          solution_description?: string | null
          solution_name?: string
          source_problem_id?: string | null
          tools_used?: Json
          user_id?: string
          video_script?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_combinations_source_problem_id_fkey"
            columns: ["source_problem_id"]
            isOneToOne: false
            referencedRelation: "detected_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          category: string | null
          description: string | null
          id: string
          tool_name: string
          user_id: string
          website: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          tool_name: string
          user_id: string
          website?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          tool_name?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      trends: {
        Row: {
          category: string | null
          detected_at: string
          growth_score: number | null
          id: string
          name: string
          source: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          detected_at?: string
          growth_score?: number | null
          id?: string
          name: string
          source?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          detected_at?: string
          growth_score?: number | null
          id?: string
          name?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
