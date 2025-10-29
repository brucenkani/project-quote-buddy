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
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          bank_name: string
          branch_code: string | null
          company_id: string
          created_at: string
          currency: string
          current_balance: number
          id: string
          is_active: boolean
          ledger_account: string
          opening_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          bank_name: string
          branch_code?: string | null
          company_id: string
          created_at?: string
          currency?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          ledger_account: string
          opening_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          bank_name?: string
          branch_code?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          ledger_account?: string
          opening_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          account_id: string | null
          balance: number
          category: string | null
          company_id: string | null
          created_at: string | null
          credit: number | null
          date: string
          debit: number | null
          description: string
          id: string
          is_reconciled: boolean | null
          reference: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          balance: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          credit?: number | null
          date: string
          debit?: number | null
          description: string
          id?: string
          is_reconciled?: boolean | null
          reference?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          balance?: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          credit?: number | null
          date?: string
          debit?: number | null
          description?: string
          id?: string
          is_reconciled?: boolean | null
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
          parent_account: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          parent_account?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          parent_account?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          address: string | null
          business_category: string
          business_description: string | null
          business_name: string
          city: string | null
          company_id: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          featured_until: string | null
          id: string
          is_featured: boolean | null
          logo_url: string | null
          tagline: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_category: string
          business_description?: string | null
          business_name: string
          city?: string | null
          company_id?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          tagline?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_category?: string
          business_description?: string | null
          business_name?: string
          city?: string | null
          company_id?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          tagline?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      community_payments: {
        Row: {
          amount: number
          community_member_id: string
          created_at: string | null
          featured_end_date: string | null
          featured_start_date: string | null
          id: string
          payfast_payment_id: string | null
          payment_reference: string
          payment_status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          community_member_id: string
          created_at?: string | null
          featured_end_date?: string | null
          featured_start_date?: string | null
          id?: string
          payfast_payment_id?: string | null
          payment_reference: string
          payment_status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          community_member_id?: string
          created_at?: string | null
          featured_end_date?: string | null
          featured_start_date?: string | null
          id?: string
          payfast_payment_id?: string | null
          payment_reference?: string
          payment_status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_payments_community_member_id_fkey"
            columns: ["community_member_id"]
            isOneToOne: false
            referencedRelation: "community_members"
            referencedColumns: ["id"]
          },
        ]
      }
      community_settings: {
        Row: {
          created_at: string | null
          featured_duration_days: number
          featured_listing_fee: number
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          featured_duration_days?: number
          featured_listing_fee?: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          featured_duration_days?: number
          featured_listing_fee?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string
          city: string
          company_id: string | null
          company_name: string
          company_type: string
          country: string
          created_at: string | null
          currency: string
          currency_symbol: string
          email: string
          financial_year_end: string
          id: string
          invoice_prefix: string
          invoice_start_number: number
          logo_url: string | null
          phone: string
          postal_code: string
          purchase_prefix: string
          purchase_start_number: number
          quote_prefix: string
          quote_start_number: number
          registration_number: string
          state: string
          tax_number: string
          tax_rate: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string
          city?: string
          company_id?: string | null
          company_name?: string
          company_type?: string
          country?: string
          created_at?: string | null
          currency?: string
          currency_symbol?: string
          email?: string
          financial_year_end?: string
          id?: string
          invoice_prefix?: string
          invoice_start_number?: number
          logo_url?: string | null
          phone?: string
          postal_code?: string
          purchase_prefix?: string
          purchase_start_number?: number
          quote_prefix?: string
          quote_start_number?: number
          registration_number?: string
          state?: string
          tax_number?: string
          tax_rate?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          company_id?: string | null
          company_name?: string
          company_type?: string
          country?: string
          created_at?: string | null
          currency?: string
          currency_symbol?: string
          email?: string
          financial_year_end?: string
          id?: string
          invoice_prefix?: string
          invoice_start_number?: number
          logo_url?: string | null
          phone?: string
          postal_code?: string
          purchase_prefix?: string
          purchase_start_number?: number
          quote_prefix?: string
          quote_start_number?: number
          registration_number?: string
          state?: string
          tax_number?: string
          tax_rate?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          tax_number: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_number?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_number?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_dashboards: {
        Row: {
          company_id: string | null
          created_at: string
          data_source_id: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          data_source_id?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          company_id?: string | null
          created_at?: string
          data_source_id?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_dashboards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_dashboards_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_payroll_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          item_type: string
          payroll_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          item_type: string
          payroll_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          item_type?: string
          payroll_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      data_deletion_queue: {
        Row: {
          company_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          scheduled_deletion_date: string
          status: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          scheduled_deletion_date: string
          status?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          scheduled_deletion_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_deletion_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          columns: Json
          company_id: string | null
          created_at: string
          data: Json
          file_name: string
          id: string
          name: string
          row_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          columns: Json
          company_id?: string | null
          created_at?: string
          data: Json
          file_name: string
          id?: string
          name: string
          row_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          columns?: Json
          company_id?: string | null
          created_at?: string
          data?: Json
          file_name?: string
          id?: string
          name?: string
          row_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company_id: string | null
          created_at: string
          customer: string
          id: string
          probability: number
          stage: string
          title: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          customer: string
          id?: string
          probability?: number
          stage?: string
          title: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          customer?: string
          id?: string
          probability?: number
          stage?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      employees: {
        Row: {
          account_number: string | null
          account_type: string | null
          address: string | null
          annual_leave_days: number | null
          bank_name: string | null
          basic_salary: number
          company_id: string
          created_at: string | null
          date_of_birth: string
          department: string | null
          email: string
          employee_number: string
          end_date: string | null
          family_responsibility_leave_days: number | null
          first_name: string
          id: string
          id_number: string
          last_name: string
          maternity_leave_days: number | null
          phone: string | null
          position: string
          sick_leave_days: number | null
          start_date: string
          status: string | null
          study_leave_days: number | null
          tax_number: string | null
          uif_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          annual_leave_days?: number | null
          bank_name?: string | null
          basic_salary: number
          company_id: string
          created_at?: string | null
          date_of_birth: string
          department?: string | null
          email: string
          employee_number: string
          end_date?: string | null
          family_responsibility_leave_days?: number | null
          first_name: string
          id?: string
          id_number: string
          last_name: string
          maternity_leave_days?: number | null
          phone?: string | null
          position: string
          sick_leave_days?: number | null
          start_date: string
          status?: string | null
          study_leave_days?: number | null
          tax_number?: string | null
          uif_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          address?: string | null
          annual_leave_days?: number | null
          bank_name?: string | null
          basic_salary?: number
          company_id?: string
          created_at?: string | null
          date_of_birth?: string
          department?: string | null
          email?: string
          employee_number?: string
          end_date?: string | null
          family_responsibility_leave_days?: number | null
          first_name?: string
          id?: string
          id_number?: string
          last_name?: string
          maternity_leave_days?: number | null
          phone?: string | null
          position?: string
          sick_leave_days?: number | null
          start_date?: string
          status?: string | null
          study_leave_days?: number | null
          tax_number?: string | null
          uif_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          expense_id: string
          id: string
          quantity: number
          tax_rate: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          expense_id: string
          id?: string
          quantity: number
          tax_rate: number
          total: number
          unit: string
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          expense_id?: string
          id?: string
          quantity?: number
          tax_rate?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_line_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          company_id: string | null
          created_at: string | null
          date: string
          expense_id: string
          id: string
          method: string
          notes: string | null
          reference: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          date: string
          expense_id: string
          id?: string
          method: string
          notes?: string | null
          reference: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          date?: string
          expense_id?: string
          id?: string
          method?: string
          notes?: string | null
          reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          company_id: string | null
          created_at: string | null
          date: string
          discount: number | null
          due_date: string
          expense_number: string
          id: string
          notes: string | null
          payment_terms: string | null
          status: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          date: string
          discount?: number | null
          due_date: string
          expense_number: string
          id?: string
          notes?: string | null
          payment_terms?: string | null
          status?: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          tax_rate: number
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          date?: string
          discount?: number | null
          due_date?: string
          expense_number?: string
          id?: string
          notes?: string | null
          payment_terms?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          company_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          gl_account_id: string | null
          id: string
          is_taxable: boolean | null
          last_cost: number | null
          name: string
          quantity: number
          reorder_level: number | null
          sku: string | null
          tax_rate: number
          unit: string
          unit_price: number
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          gl_account_id?: string | null
          id?: string
          is_taxable?: boolean | null
          last_cost?: number | null
          name: string
          quantity?: number
          reorder_level?: number | null
          sku?: string | null
          tax_rate?: number
          unit?: string
          unit_price: number
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          gl_account_id?: string | null
          id?: string
          is_taxable?: boolean | null
          last_cost?: number | null
          name?: string
          quantity?: number
          reorder_level?: number | null
          sku?: string | null
          tax_rate?: number
          unit?: string
          unit_price?: number
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          company_id: string | null
          created_at: string | null
          destination_warehouse_id: string | null
          id: string
          item_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string
          reference_type: string
          source_warehouse_id: string | null
          unit_cost: number
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          destination_warehouse_id?: string | null
          id?: string
          item_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id: string
          reference_type: string
          source_warehouse_id?: string | null
          unit_cost: number
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          destination_warehouse_id?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string
          reference_type?: string
          source_warehouse_id?: string | null
          unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity: number
          tax_rate: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          company_id: string | null
          created_at: string | null
          date: string
          id: string
          invoice_id: string
          method: string
          notes: string | null
          reference: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          invoice_id: string
          method: string
          notes?: string | null
          reference: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string | null
          created_at: string | null
          customer_id: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          terms: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          customer_id: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          notes?: string | null
          status?: string
          subtotal: number
          tax_amount: number
          terms?: string | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          customer_id?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string | null
          created_at: string | null
          date: string
          description: string
          entry_number: string
          id: string
          is_manual: boolean | null
          reference: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          date: string
          description: string
          entry_number: string
          id?: string
          is_manual?: boolean | null
          reference?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          entry_number?: string
          id?: string
          is_manual?: boolean | null
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          account_name: string
          created_at: string | null
          credit: number | null
          debit: number | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          account_name: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          account_name?: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_article_views: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          category: string
          content: Json
          created_at: string
          created_by: string
          description: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean
          slug: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string
          created_by: string
          description?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number
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
            referencedRelation: "employee_safe_view"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "employee_safe_view"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "payroll_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_safe_view"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
          country: string
          created_at: string
          currency: string
          currency_symbol: string
          current_tax_year: number
          id: string
          smtp_from_email: string | null
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          country?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          current_tax_year?: number
          id?: string
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          country?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          current_tax_year?: number
          id?: string
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      purchase_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          purchase_id: string
          quantity: number
          received_quantity: number | null
          tax_rate: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          purchase_id: string
          quantity: number
          received_quantity?: number | null
          tax_rate: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          purchase_id?: string
          quantity?: number
          received_quantity?: number | null
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_line_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          purchase_order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          purchase_order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          purchase_order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_line_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string | null
          created_at: string | null
          delivery_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string
          notes: string | null
          po_number: string
          received_date: string | null
          status: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date: string
          notes?: string | null
          po_number: string
          received_date?: string | null
          status?: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          po_number?: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          company_id: string | null
          created_at: string | null
          date: string
          id: string
          method: string
          notes: string | null
          purchase_id: string
          reference: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          method: string
          notes?: string | null
          purchase_id: string
          reference: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          company_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          method?: string
          notes?: string | null
          purchase_id?: string
          reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          company_id: string | null
          created_at: string | null
          due_date: string
          id: string
          invoice_date: string | null
          issue_date: string
          notes: string | null
          purchase_number: string
          received_date: string | null
          status: string
          subtotal: number
          supplier_id: string
          supplier_invoice_number: string | null
          tax_amount: number
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          invoice_date?: string | null
          issue_date: string
          notes?: string | null
          purchase_number: string
          received_date?: string | null
          status?: string
          subtotal: number
          supplier_id: string
          supplier_invoice_number?: string | null
          tax_amount: number
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_date?: string | null
          issue_date?: string
          notes?: string | null
          purchase_number?: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          supplier_invoice_number?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          company_id: string | null
          created_at: string | null
          customer_id: string
          frequency: string
          id: string
          next_invoice_date: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          customer_id: string
          frequency: string
          id?: string
          next_invoice_date: string
          notes?: string | null
          status?: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          customer_id?: string
          frequency?: string
          id?: string
          next_invoice_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          permission: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          permission: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          permission?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payfast_payment_id: string | null
          status: string
          subscription_id: string
          transaction_date: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payfast_payment_id?: string | null
          status: string
          subscription_id: string
          transaction_date?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payfast_payment_id?: string | null
          status?: string
          subscription_id?: string
          transaction_date?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          auto_renew: boolean | null
          cancellation_date: string | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          deletion_scheduled_date: string | null
          id: string
          payfast_payment_id: string | null
          payfast_subscription_token: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_end: string | null
          subscription_start: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          auto_renew?: boolean | null
          cancellation_date?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          deletion_scheduled_date?: string | null
          id?: string
          payfast_payment_id?: string | null
          payfast_subscription_token?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_end?: string | null
          subscription_start?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          auto_renew?: boolean | null
          cancellation_date?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          deletion_scheduled_date?: string | null
          id?: string
          payfast_payment_id?: string | null
          payfast_subscription_token?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_end?: string | null
          subscription_start?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      warehouses: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      employee_safe_view: {
        Row: {
          annual_leave_days: number | null
          created_at: string | null
          department: string | null
          email: string | null
          employee_number: string | null
          end_date: string | null
          family_responsibility_leave_days: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          maternity_leave_days: number | null
          phone: string | null
          position: string | null
          sick_leave_days: number | null
          start_date: string | null
          status: string | null
          study_leave_days: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          annual_leave_days?: number | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string | null
          end_date?: string | null
          family_responsibility_leave_days?: number | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          maternity_leave_days?: number | null
          phone?: string | null
          position?: string | null
          sick_leave_days?: number | null
          start_date?: string | null
          status?: string | null
          study_leave_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          annual_leave_days?: number | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string | null
          end_date?: string | null
          family_responsibility_leave_days?: number | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          maternity_leave_days?: number | null
          phone?: string | null
          position?: string | null
          sick_leave_days?: number | null
          start_date?: string | null
          status?: string | null
          study_leave_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_company_full: {
        Args: { _name: string; _settings?: Json }
        Returns: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }[]
      }
      get_company_role: {
        Args: { _company_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_employee_safe_profile: {
        Args: { employee_user_id: string }
        Returns: {
          annual_leave_days: number | null
          created_at: string | null
          department: string | null
          email: string | null
          employee_number: string | null
          end_date: string | null
          family_responsibility_leave_days: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          maternity_leave_days: number | null
          phone: string | null
          position: string | null
          sick_leave_days: number | null
          start_date: string | null
          status: string | null
          study_leave_days: number | null
          updated_at: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "employee_safe_view"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }[]
      }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_in_trial: { Args: { _user_id: string }; Returns: boolean }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      schedule_data_deletion: {
        Args: { _company_id: string; _user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "accountant" | "employee" | "admin" | "super_admin"
      subscription_status:
        | "trial"
        | "active"
        | "expired"
        | "cancelled"
        | "suspended"
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
      app_role: ["owner", "accountant", "employee", "admin", "super_admin"],
      subscription_status: [
        "trial",
        "active",
        "expired",
        "cancelled",
        "suspended",
      ],
    },
  },
} as const
