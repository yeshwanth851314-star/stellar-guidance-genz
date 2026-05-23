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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_content: {
        Row: {
          ayurvedic_tip: string | null
          cosmic_energy: number | null
          created_at: string
          date: string
          deity: string | null
          id: string
          lucky_color: string | null
          lucky_number: number | null
          mantra: string | null
          planetary_insight: string | null
          power_hour_end: string | null
          power_hour_start: string | null
          practical_tip: string | null
          spiritual_guidance: string | null
          user_id: string
          vibe_color: string | null
          vibe_description: string | null
          vibe_icon: string | null
          vibe_theme: string | null
        }
        Insert: {
          ayurvedic_tip?: string | null
          cosmic_energy?: number | null
          created_at?: string
          date: string
          deity?: string | null
          id?: string
          lucky_color?: string | null
          lucky_number?: number | null
          mantra?: string | null
          planetary_insight?: string | null
          power_hour_end?: string | null
          power_hour_start?: string | null
          practical_tip?: string | null
          spiritual_guidance?: string | null
          user_id: string
          vibe_color?: string | null
          vibe_description?: string | null
          vibe_icon?: string | null
          vibe_theme?: string | null
        }
        Update: {
          ayurvedic_tip?: string | null
          cosmic_energy?: number | null
          created_at?: string
          date?: string
          deity?: string | null
          id?: string
          lucky_color?: string | null
          lucky_number?: number | null
          mantra?: string | null
          planetary_insight?: string | null
          power_hour_end?: string | null
          power_hour_start?: string | null
          practical_tip?: string | null
          spiritual_guidance?: string | null
          user_id?: string
          vibe_color?: string | null
          vibe_description?: string | null
          vibe_icon?: string | null
          vibe_theme?: string | null
        }
        Relationships: []
      }
      herbs: {
        Row: {
          benefit: string | null
          dosha: string[] | null
          emoji: string | null
          id: number
          name_english: string
          name_sanskrit: string
          name_telugu: string
          traditional_use: string | null
        }
        Insert: {
          benefit?: string | null
          dosha?: string[] | null
          emoji?: string | null
          id?: number
          name_english: string
          name_sanskrit: string
          name_telugu: string
          traditional_use?: string | null
        }
        Update: {
          benefit?: string | null
          dosha?: string[] | null
          emoji?: string | null
          id?: number
          name_english?: string
          name_sanskrit?: string
          name_telugu?: string
          traditional_use?: string | null
        }
        Relationships: []
      }
      nakshatra_library: {
        Row: {
          body_part: string | null
          constellation_stars: Json | null
          deity: string | null
          element: string
          gana: string
          id: number
          idx: number
          lord: string
          name_english: string
          name_sanskrit: string
          name_telugu: string
          quality: string | null
          star_count: number | null
          symbol: string
          trait: string
        }
        Insert: {
          body_part?: string | null
          constellation_stars?: Json | null
          deity?: string | null
          element: string
          gana: string
          id?: number
          idx: number
          lord: string
          name_english: string
          name_sanskrit: string
          name_telugu: string
          quality?: string | null
          star_count?: number | null
          symbol: string
          trait: string
        }
        Update: {
          body_part?: string | null
          constellation_stars?: Json | null
          deity?: string | null
          element?: string
          gana?: string
          id?: number
          idx?: number
          lord?: string
          name_english?: string
          name_sanskrit?: string
          name_telugu?: string
          quality?: string | null
          star_count?: number | null
          symbol?: string
          trait?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          birth_lat: number | null
          birth_lng: number | null
          birth_place: string | null
          birth_time: string | null
          created_at: string
          dosha: string | null
          email: string | null
          fcm_token: string | null
          id: string
          karana_index: number | null
          lagna: number | null
          moon_longitude: number | null
          nakshatra: number | null
          name: string | null
          notif_lunar: boolean | null
          notif_muhurta: boolean | null
          notif_planetary: boolean | null
          notif_spiritual: boolean | null
          notif_weekly: boolean | null
          notif_wellness: boolean | null
          notification_time: string | null
          onboarded: boolean | null
          pada: number | null
          phone: string | null
          rasi: number | null
          sound_enabled: boolean | null
          sound_theme: string | null
          sound_volume: number | null
          sun_longitude: number | null
          theme: string | null
          tithi: number | null
          updated_at: string
          user_id: string
          vara: number | null
          yoga_index: number | null
        }
        Insert: {
          birth_date?: string | null
          birth_lat?: number | null
          birth_lng?: number | null
          birth_place?: string | null
          birth_time?: string | null
          created_at?: string
          dosha?: string | null
          email?: string | null
          fcm_token?: string | null
          id?: string
          karana_index?: number | null
          lagna?: number | null
          moon_longitude?: number | null
          nakshatra?: number | null
          name?: string | null
          notif_lunar?: boolean | null
          notif_muhurta?: boolean | null
          notif_planetary?: boolean | null
          notif_spiritual?: boolean | null
          notif_weekly?: boolean | null
          notif_wellness?: boolean | null
          notification_time?: string | null
          onboarded?: boolean | null
          pada?: number | null
          phone?: string | null
          rasi?: number | null
          sound_enabled?: boolean | null
          sound_theme?: string | null
          sound_volume?: number | null
          sun_longitude?: number | null
          theme?: string | null
          tithi?: number | null
          updated_at?: string
          user_id: string
          vara?: number | null
          yoga_index?: number | null
        }
        Update: {
          birth_date?: string | null
          birth_lat?: number | null
          birth_lng?: number | null
          birth_place?: string | null
          birth_time?: string | null
          created_at?: string
          dosha?: string | null
          email?: string | null
          fcm_token?: string | null
          id?: string
          karana_index?: number | null
          lagna?: number | null
          moon_longitude?: number | null
          nakshatra?: number | null
          name?: string | null
          notif_lunar?: boolean | null
          notif_muhurta?: boolean | null
          notif_planetary?: boolean | null
          notif_spiritual?: boolean | null
          notif_weekly?: boolean | null
          notif_wellness?: boolean | null
          notification_time?: string | null
          onboarded?: boolean | null
          pada?: number | null
          phone?: string | null
          rasi?: number | null
          sound_enabled?: boolean | null
          sound_theme?: string | null
          sound_volume?: number | null
          sun_longitude?: number | null
          theme?: string | null
          tithi?: number | null
          updated_at?: string
          user_id?: string
          vara?: number | null
          yoga_index?: number | null
        }
        Relationships: []
      }
      rasi_library: {
        Row: {
          body_part: string | null
          color: string
          element: string
          id: number
          idx: number
          lord: string
          name_english: string
          name_sanskrit: string
          name_telugu: string
          quality: string
          symbol: string
          trait_keywords: string[] | null
        }
        Insert: {
          body_part?: string | null
          color: string
          element: string
          id?: number
          idx: number
          lord: string
          name_english: string
          name_sanskrit: string
          name_telugu: string
          quality: string
          symbol: string
          trait_keywords?: string[] | null
        }
        Update: {
          body_part?: string | null
          color?: string
          element?: string
          id?: number
          idx?: number
          lord?: string
          name_english?: string
          name_sanskrit?: string
          name_telugu?: string
          quality?: string
          symbol?: string
          trait_keywords?: string[] | null
        }
        Relationships: []
      }
      yoga_poses: {
        Row: {
          benefit: string | null
          best_time: string | null
          category: string | null
          dosha: string[] | null
          duration_minutes: number | null
          emoji: string | null
          id: number
          name_english: string
          name_sanskrit: string
          name_telugu: string
        }
        Insert: {
          benefit?: string | null
          best_time?: string | null
          category?: string | null
          dosha?: string[] | null
          duration_minutes?: number | null
          emoji?: string | null
          id?: number
          name_english: string
          name_sanskrit: string
          name_telugu: string
        }
        Update: {
          benefit?: string | null
          best_time?: string | null
          category?: string | null
          dosha?: string[] | null
          duration_minutes?: number | null
          emoji?: string | null
          id?: number
          name_english?: string
          name_sanskrit?: string
          name_telugu?: string
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
