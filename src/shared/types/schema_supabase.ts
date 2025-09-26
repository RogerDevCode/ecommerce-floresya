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
      occasions: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: number
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: number
          order_id: number
          product_id: number | null
          product_name: string
          product_summary: string | null
          quantity: number
          subtotal_usd: number
          subtotal_ves: number | null
          unit_price_usd: number
          unit_price_ves: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          order_id: number
          product_id?: number | null
          product_name: string
          product_summary?: string | null
          quantity: number
          subtotal_usd: number
          subtotal_ves?: number | null
          unit_price_usd: number
          unit_price_ves?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          order_id?: number
          product_id?: number | null
          product_name?: string
          product_summary?: string | null
          quantity?: number
          subtotal_usd?: number
          subtotal_ves?: number | null
          unit_price_usd?: number
          unit_price_ves?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: number | null
          created_at: string | null
          id: number
          new_status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: number
        }
        Insert: {
          changed_by?: number | null
          created_at?: string | null
          id?: number
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: number
        }
        Update: {
          changed_by?: number | null
          created_at?: string | null
          id?: number
          new_status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          currency_rate: number | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_address: string
          delivery_city: string | null
          delivery_date: string | null
          delivery_notes: string | null
          delivery_state: string | null
          delivery_time_slot: string | null
          delivery_zip: string | null
          id: number
          notes: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount_usd: number
          total_amount_ves: number | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          currency_rate?: number | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_address: string
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_notes?: string | null
          delivery_state?: string | null
          delivery_time_slot?: string | null
          delivery_zip?: string | null
          id?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount_usd: number
          total_amount_ves?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          currency_rate?: number | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_notes?: string | null
          delivery_state?: string | null
          delivery_time_slot?: string | null
          delivery_zip?: string | null
          id?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount_usd?: number
          total_amount_ves?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_info: Json | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: number
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["payment_method_type"]
          updated_at: string | null
        }
        Insert: {
          account_info?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string | null
        }
        Update: {
          account_info?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount_usd: number
          amount_ves: number | null
          confirmed_date: string | null
          created_at: string | null
          currency_rate: number | null
          id: number
          order_id: number
          payment_date: string | null
          payment_details: Json | null
          payment_method_id: number | null
          payment_method_name: string
          receipt_image_url: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          transaction_id: string | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          admin_notes?: string | null
          amount_usd: number
          amount_ves?: number | null
          confirmed_date?: string | null
          created_at?: string | null
          currency_rate?: number | null
          id?: number
          order_id: number
          payment_date?: string | null
          payment_details?: Json | null
          payment_method_id?: number | null
          payment_method_name: string
          receipt_image_url?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          admin_notes?: string | null
          amount_usd?: number
          amount_ves?: number | null
          confirmed_date?: string | null
          created_at?: string | null
          currency_rate?: number | null
          id?: number
          order_id?: number
          payment_date?: string | null
          payment_details?: Json | null
          payment_method_id?: number | null
          payment_method_name?: string
          receipt_image_url?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          file_hash: string
          id: number
          image_index: number
          is_primary: boolean
          mime_type: string
          product_id: number
          size: Database["public"]["Enums"]["image_size"]
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          file_hash: string
          id?: number
          image_index: number
          is_primary?: boolean
          mime_type?: string
          product_id: number
          size: Database["public"]["Enums"]["image_size"]
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          file_hash?: string
          id?: number
          image_index?: number
          is_primary?: boolean
          mime_type?: string
          product_id?: number
          size?: Database["public"]["Enums"]["image_size"]
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_occasions: {
        Row: {
          created_at: string | null
          id: number
          occasion_id: number
          product_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          occasion_id: number
          product_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          occasion_id?: number
          product_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_occasions_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_occasions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          carousel_order: number | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: number
          name: string
          price_usd: number
          price_ves: number | null
          sku: string | null
          stock: number | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          carousel_order?: number | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: number
          name: string
          price_usd: number
          price_ves?: number | null
          sku?: string | null
          stock?: number | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          carousel_order?: number | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: number
          name?: string
          price_usd?: number
          price_ves?: number | null
          sku?: string | null
          stock?: number | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_public: boolean | null
          key: string
          type: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_public?: boolean | null
          key: string
          type?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_public?: boolean | null
          key?: string
          type?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: number
          is_active: boolean | null
          password_hash: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: number
          is_active?: boolean | null
          password_hash?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: number
          is_active?: boolean | null
          password_hash?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_with_items: {
        Args: { order_data: Json; order_items: Json[] }
        Returns: Json
      }
      create_product_images_atomic: {
        Args: {
          image_index: number
          images_data: Json[]
          is_primary?: boolean
          product_id: number
        }
        Returns: Json
      }
      create_product_with_occasions: {
        Args: { occasion_ids: number[]; product_data: Json }
        Returns: Json[]
      }
      delete_product_images_safe: {
        Args: { product_id: number }
        Returns: boolean
      }
      get_existing_image_by_hash: {
        Args: { hash_input: string }
        Returns: {
          file_hash: string
          id: number
          original_filename: string
          url_large: string
          url_medium: string
          url_small: string
          url_thumb: string
        }[]
      }
      get_product_occasions: {
        Args: { p_product_id: number }
        Returns: {
          color: string
          description: string
          icon: string
          id: number
          name: string
        }[]
      }
      get_products_by_occasion: {
        Args: { p_limit?: number; p_occasion_id: number }
        Returns: {
          description: string
          id: number
          image_url: string
          name: string
          price: number
          primary_image: string
        }[]
      }
      get_products_with_occasions: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          category_name: string
          description: string
          id: number
          image_url: string
          name: string
          occasions: Json[]
          price: number
          primary_image: string
        }[]
      }
      update_carousel_order_atomic: {
        Args: { new_order: number; product_id: number }
        Returns: Json
      }
      update_order_status_with_history: {
        Args: {
          changed_by?: number
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string
          order_id: number
        }
        Returns: Json
      }
    }
    Enums: {
      image_size: "thumb" | "small" | "medium" | "large"
      order_status:
        | "pending"
        | "verified"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_method_type:
        | "bank_transfer"
        | "mobile_payment"
        | "cash"
        | "crypto"
        | "international"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      user_role: "user" | "admin"
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
      image_size: ["thumb", "small", "medium", "large"],
      order_status: [
        "pending",
        "verified",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method_type: [
        "bank_transfer",
        "mobile_payment",
        "cash",
        "crypto",
        "international",
      ],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      user_role: ["user", "admin"],
    },
  },
} as const
