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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          account_number: string | null
          account_type: string | null
          address: string | null
          bank_name: string | null
          basic_salary: number
          created_at: string | null
          date_of_birth: string
          department: string | null
          email: string
          employee_number: string
          end_date: string | null
          first_name: string
          id: string
          id_number: string
          last_name: string
          phone: string | null
          position: string
          start_date: string
          status: string | null
          tax_number: string | null
          uif_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          bank_name?: string | null
          basic_salary: number
          created_at?: string | null
          date_of_birth: string
          department?: string | null
          email: string
          employee_number: string
          end_date?: string | null
          first_name: string
          id?: string
          id_number: string
          last_name: string
          phone?: string | null
          position: string
          start_date: string
          status?: string | null
          tax_number?: string | null
          uif_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          bank_name?: string | null
          basic_salary?: number
          created_at?: string | null
          date_of_birth?: string
          department?: string | null
          email?: string
          employee_number?: string
          end_date?: string | null
          first_name?: string
          id?: string
          id_number?: string
          last_name?: string
          phone?: string | null
          position?: string
          start_date?: string
          status?: string | null
          tax_number?: string | null
          uif_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          available_days: number
          created_at: string | null
          employee_id: string
          id: string
          leave_type_id: string
          total_days: number
          updated_at: string | null
          used_days: number | null
          year: number
        }
        Insert: {
          available_days: number
          created_at?: string | null
          employee_id: string
          id?: string
          leave_type_id: string
          total_days: number
          updated_at?: string | null
          used_days?: number | null
          year: number
        }
        Update: {
          available_days?: number
          created_at?: string | null
          employee_id?: string
          id?: string
          leave_type_id?: string
          total_days?: number
          updated_at?: string | null
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          days_requested: number
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_requested: number
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_requested?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          carry_over: boolean | null
          created_at: string | null
          days_per_year: number
          description: string | null
          id: string
          name: string
        }
        Insert: {
          carry_over?: boolean | null
          created_at?: string | null
          days_per_year: number
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          carry_over?: boolean | null
          created_at?: string | null
          days_per_year?: number
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          allowances: number | null
          basic_salary: number
          bonuses: number | null
          created_at: string | null
          employee_id: string
          gross_salary: number
          id: string
          net_salary: number
          notes: string | null
          other_deductions: number | null
          overtime: number | null
          paye: number | null
          payment_date: string | null
          period_end: string
          period_start: string
          status: string | null
          total_deductions: number
          uif: number | null
          updated_at: string | null
        }
        Insert: {
          allowances?: number | null
          basic_salary: number
          bonuses?: number | null
          created_at?: string | null
          employee_id: string
          gross_salary: number
          id?: string
          net_salary: number
          notes?: string | null
          other_deductions?: number | null
          overtime?: number | null
          paye?: number | null
          payment_date?: string | null
          period_end: string
          period_start: string
          status?: string | null
          total_deductions: number
          uif?: number | null
          updated_at?: string | null
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          bonuses?: number | null
          created_at?: string | null
          employee_id?: string
          gross_salary?: number
          id?: string
          net_salary?: number
          notes?: string | null
          other_deductions?: number | null
          overtime?: number | null
          paye?: number | null
          payment_date?: string | null
          period_end?: string
          period_start?: string
          status?: string | null
          total_deductions?: number
          uif?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_settings: {
        Row: {
          country: string
          created_at: string
          currency: string
          currency_symbol: string
          current_tax_year: number
          id: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          current_tax_year?: number
          id?: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          current_tax_year?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_brackets: {
        Row: {
          age_group: string
          bracket_max: number | null
          bracket_min: number
          country: string
          created_at: string | null
          id: string
          rate: number
          rebate: number | null
          threshold: number
          year: number
        }
        Insert: {
          age_group: string
          bracket_max?: number | null
          bracket_min: number
          country?: string
          created_at?: string | null
          id?: string
          rate: number
          rebate?: number | null
          threshold: number
          year: number
        }
        Update: {
          age_group?: string
          bracket_max?: number | null
          bracket_min?: number
          country?: string
          created_at?: string | null
          id?: string
          rate?: number
          rebate?: number | null
          threshold?: number
          year?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "accountant" | "employee"
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
      app_role: ["owner", "accountant", "employee"],
    },
  },
} as const
