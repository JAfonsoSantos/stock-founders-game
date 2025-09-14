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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      founder_members: {
        Row: {
          can_manage: boolean
          created_at: string
          id: string
          participant_id: string
          role: Database["public"]["Enums"]["founder_member_role"]
          venture_id: string
        }
        Insert: {
          can_manage?: boolean
          created_at?: string
          id?: string
          participant_id: string
          role?: Database["public"]["Enums"]["founder_member_role"]
          venture_id: string
        }
        Update: {
          can_manage?: boolean
          created_at?: string
          id?: string
          participant_id?: string
          role?: Database["public"]["Enums"]["founder_member_role"]
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_members_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_members_startup_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      game_roles: {
        Row: {
          default_budget: number
          game_id: string
          id: string
          role: Database["public"]["Enums"]["participant_role"]
        }
        Insert: {
          default_budget: number
          game_id: string
          id?: string
          role: Database["public"]["Enums"]["participant_role"]
        }
        Update: {
          default_budget?: number
          game_id?: string
          id?: string
          role?: Database["public"]["Enums"]["participant_role"]
        }
        Relationships: [
          {
            foreignKeyName: "game_roles_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_team_members: {
        Row: {
          created_at: string | null
          email: string
          game_id: string
          id: string
          name: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          game_id: string
          id?: string
          name: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          game_id?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_team_members_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          allow_secondary: boolean
          asset_plural: string | null
          asset_singular: string | null
          circuit_breaker: boolean
          circuit_breaker_active: boolean | null
          circuit_breaker_until: string | null
          color_theme: string | null
          created_at: string
          currency: string
          description: string | null
          enable_primary_market: boolean | null
          end_time: string | null
          ends_at: string
          event_website: string | null
          has_specific_times: boolean | null
          hero_image_url: string | null
          id: string
          judges_panel: boolean | null
          locale: string
          logo_url: string | null
          max_price_per_share: number
          name: string
          notifications_enabled: boolean | null
          organizer_company: string | null
          organizer_name: string | null
          owner_user_id: string
          show_public_leaderboards: boolean
          start_time: string | null
          starts_at: string
          status: Database["public"]["Enums"]["game_status"]
          template_id: string | null
          trading_mode: string | null
          updated_at: string
        }
        Insert: {
          allow_secondary?: boolean
          asset_plural?: string | null
          asset_singular?: string | null
          circuit_breaker?: boolean
          circuit_breaker_active?: boolean | null
          circuit_breaker_until?: string | null
          color_theme?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          enable_primary_market?: boolean | null
          end_time?: string | null
          ends_at: string
          event_website?: string | null
          has_specific_times?: boolean | null
          hero_image_url?: string | null
          id?: string
          judges_panel?: boolean | null
          locale?: string
          logo_url?: string | null
          max_price_per_share?: number
          name: string
          notifications_enabled?: boolean | null
          organizer_company?: string | null
          organizer_name?: string | null
          owner_user_id: string
          show_public_leaderboards?: boolean
          start_time?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["game_status"]
          template_id?: string | null
          trading_mode?: string | null
          updated_at?: string
        }
        Update: {
          allow_secondary?: boolean
          asset_plural?: string | null
          asset_singular?: string | null
          circuit_breaker?: boolean
          circuit_breaker_active?: boolean | null
          circuit_breaker_until?: string | null
          color_theme?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          enable_primary_market?: boolean | null
          end_time?: string | null
          ends_at?: string
          event_website?: string | null
          has_specific_times?: boolean | null
          hero_image_url?: string | null
          id?: string
          judges_panel?: boolean | null
          locale?: string
          logo_url?: string | null
          max_price_per_share?: number
          name?: string
          notifications_enabled?: boolean | null
          organizer_company?: string | null
          organizer_name?: string | null
          owner_user_id?: string
          show_public_leaderboards?: boolean
          start_time?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["game_status"]
          template_id?: string | null
          trading_mode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          from_participant_id: string | null
          game_id: string
          id: string
          payload: Json | null
          status: string
          to_participant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          from_participant_id?: string | null
          game_id: string
          id?: string
          payload?: Json | null
          status?: string
          to_participant_id: string
          type: string
        }
        Update: {
          created_at?: string
          from_participant_id?: string | null
          game_id?: string
          id?: string
          payload?: Json | null
          status?: string
          to_participant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_from_participant_id_fkey"
            columns: ["from_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_to_participant_id_fkey"
            columns: ["to_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_primary: {
        Row: {
          auto_accept_min_price: number | null
          buyer_participant_id: string
          created_at: string
          decided_by_participant_id: string | null
          game_id: string
          id: string
          price_per_share: number
          qty: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          venture_id: string
        }
        Insert: {
          auto_accept_min_price?: number | null
          buyer_participant_id: string
          created_at?: string
          decided_by_participant_id?: string | null
          game_id: string
          id?: string
          price_per_share: number
          qty: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          venture_id: string
        }
        Update: {
          auto_accept_min_price?: number | null
          buyer_participant_id?: string
          created_at?: string
          decided_by_participant_id?: string | null
          game_id?: string
          id?: string
          price_per_share?: number
          qty?: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_primary_buyer_participant_id_fkey"
            columns: ["buyer_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_primary_decided_by_participant_id_fkey"
            columns: ["decided_by_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_primary_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_primary_startup_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          current_cash: number
          game_id: string
          id: string
          initial_budget: number
          is_suspended: boolean
          role: Database["public"]["Enums"]["participant_role"]
          status: Database["public"]["Enums"]["participant_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_cash: number
          game_id: string
          id?: string
          initial_budget: number
          is_suspended?: boolean
          role: Database["public"]["Enums"]["participant_role"]
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_cash?: number
          game_id?: string
          id?: string
          initial_budget?: number
          is_suspended?: boolean
          role?: Database["public"]["Enums"]["participant_role"]
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          avg_cost: number
          id: string
          participant_id: string
          qty_total: number
          updated_at: string
          venture_id: string
        }
        Insert: {
          avg_cost?: number
          id?: string
          participant_id: string
          qty_total?: number
          updated_at?: string
          venture_id: string
        }
        Update: {
          avg_cost?: number
          id?: string
          participant_id?: string
          qty_total?: number
          updated_at?: string
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_startup_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          buyer_participant_id: string
          created_at: string
          game_id: string
          id: string
          market_type: Database["public"]["Enums"]["market_type"]
          price_per_share: number
          qty: number
          seller_participant_id: string | null
          venture_id: string
        }
        Insert: {
          buyer_participant_id: string
          created_at?: string
          game_id: string
          id?: string
          market_type: Database["public"]["Enums"]["market_type"]
          price_per_share: number
          qty: number
          seller_participant_id?: string | null
          venture_id: string
        }
        Update: {
          buyer_participant_id?: string
          created_at?: string
          game_id?: string
          id?: string
          market_type?: Database["public"]["Enums"]["market_type"]
          price_per_share?: number
          qty?: number
          seller_participant_id?: string | null
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_buyer_participant_id_fkey"
            columns: ["buyer_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_seller_participant_id_fkey"
            columns: ["seller_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_startup_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          locale_pref: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          locale_pref?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          locale_pref?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ventures: {
        Row: {
          created_at: string
          description: string | null
          game_id: string
          id: string
          last_vwap_price: number | null
          linkedin: string | null
          logo_url: string | null
          name: string
          primary_shares_remaining: number
          slug: string
          total_shares: number
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          game_id: string
          id?: string
          last_vwap_price?: number | null
          linkedin?: string | null
          logo_url?: string | null
          name: string
          primary_shares_remaining?: number
          slug: string
          total_shares?: number
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          game_id?: string
          id?: string
          last_vwap_price?: number | null
          linkedin?: string | null
          logo_url?: string | null
          name?: string
          primary_shares_remaining?: number
          slug?: string
          total_shares?: number
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startups_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_demo_participant: {
        Args: {
          p_budget: number
          p_email: string
          p_first_name: string
          p_game_id: string
          p_last_name: string
          p_role: Database["public"]["Enums"]["participant_role"]
        }
        Returns: Json
      }
      admin_delete_users: {
        Args: { user_ids: string[] }
        Returns: Json
      }
      get_all_users_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_angel_leaderboard: {
        Args: { p_game_id?: string }
        Returns: {
          current_cash: number
          game_id: string
          initial_budget: number
          participant_id: string
          portfolio_value: number
          roi_percentage: number
          role: Database["public"]["Enums"]["participant_role"]
          total_value: number
          user_id: string
        }[]
      }
      get_portfolio_data: {
        Args: { p_game_id?: string }
        Returns: {
          current_cash: number
          game_id: string
          initial_budget: number
          participant_id: string
          portfolio_value: number
          roi_percentage: number
          role: Database["public"]["Enums"]["participant_role"]
          total_value: number
          user_id: string
        }[]
      }
      get_vc_leaderboard: {
        Args: { p_game_id?: string }
        Returns: {
          current_cash: number
          game_id: string
          initial_budget: number
          participant_id: string
          portfolio_value: number
          roi_percentage: number
          role: Database["public"]["Enums"]["participant_role"]
          total_value: number
          user_id: string
        }[]
      }
      is_game_owner: {
        Args: { game_uuid: string }
        Returns: boolean
      }
      is_game_owner_direct: {
        Args: { game_uuid: string }
        Returns: boolean
      }
      is_participant_in_game_direct: {
        Args: { game_uuid: string }
        Returns: boolean
      }
      is_participant_of_user: {
        Args: { participant_uuid: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_participant_in_game: {
        Args: { game_uuid: string }
        Returns: boolean
      }
      reset_expired_circuit_breakers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      founder_member_role: "owner" | "member"
      game_status: "draft" | "pre_market" | "open" | "closed" | "results"
      market_type: "primary" | "secondary"
      order_status: "pending" | "accepted" | "rejected" | "canceled" | "expired"
      participant_role: "founder" | "angel" | "vc" | "organizer"
      participant_status: "pending" | "active" | "suspended"
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
    Enums: {
      founder_member_role: ["owner", "member"],
      game_status: ["draft", "pre_market", "open", "closed", "results"],
      market_type: ["primary", "secondary"],
      order_status: ["pending", "accepted", "rejected", "canceled", "expired"],
      participant_role: ["founder", "angel", "vc", "organizer"],
      participant_status: ["pending", "active", "suspended"],
    },
  },
} as const
