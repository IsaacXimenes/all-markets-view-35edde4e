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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      colaboradores: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string | null
          id: string
          loja_id: string | null
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          id?: string
          loja_id?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          id?: string
          loja_id?: string | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          categoria: string | null
          created_at: string | null
          data_lancamento: string | null
          descricao: string | null
          id: string
          loja_id: string | null
          tipo: string
          valor: number
          venda_id: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data_lancamento?: string | null
          descricao?: string | null
          id?: string
          loja_id?: string | null
          tipo: string
          valor: number
          venda_id?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data_lancamento?: string | null
          descricao?: string | null
          id?: string
          loja_id?: string | null
          tipo?: string
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      garantias: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          imei: string | null
          modelo: string | null
          produto_id: string | null
          status: string | null
          venda_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          imei?: string | null
          modelo?: string | null
          produto_id?: string | null
          status?: string | null
          venda_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          imei?: string | null
          modelo?: string | null
          produto_id?: string | null
          status?: string | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garantias_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantias_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          comissao_percentual: number
          created_at: string | null
          id: string
          nome: string
          tipo: string | null
        }
        Insert: {
          comissao_percentual: number
          created_at?: string | null
          id?: string
          nome: string
          tipo?: string | null
        }
        Update: {
          comissao_percentual?: number
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: string | null
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string | null
          id: string
          loja_destino_id: string | null
          loja_origem_id: string | null
          motivo: string | null
          produto_id: string | null
          quantidade: number | null
          responsavel_id: string | null
          tipo_movimentacao: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          loja_destino_id?: string | null
          loja_origem_id?: string | null
          motivo?: string | null
          produto_id?: string | null
          quantidade?: number | null
          responsavel_id?: string | null
          tipo_movimentacao?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          loja_destino_id?: string | null
          loja_origem_id?: string | null
          motivo?: string | null
          produto_id?: string | null
          quantidade?: number | null
          responsavel_id?: string | null
          tipo_movimentacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_loja_destino_id_fkey"
            columns: ["loja_destino_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_loja_origem_id_fkey"
            columns: ["loja_origem_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          aparelho_modelo: string | null
          cliente_nome: string
          created_at: string | null
          id: string
          imei: string | null
          loja_id: string | null
          parecer_tecnico: string | null
          problema_relatado: string | null
          status: string | null
          tecnico_id: string | null
          valor_orcamento: number | null
        }
        Insert: {
          aparelho_modelo?: string | null
          cliente_nome: string
          created_at?: string | null
          id?: string
          imei?: string | null
          loja_id?: string | null
          parecer_tecnico?: string | null
          problema_relatado?: string | null
          status?: string | null
          tecnico_id?: string | null
          valor_orcamento?: number | null
        }
        Update: {
          aparelho_modelo?: string | null
          cliente_nome?: string
          created_at?: string | null
          id?: string
          imei?: string | null
          loja_id?: string | null
          parecer_tecnico?: string | null
          problema_relatado?: string | null
          status?: string | null
          tecnico_id?: string | null
          valor_orcamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          imei: string | null
          loja_id: string | null
          marca: string
          modelo: string
          saude_bateria: number | null
          status: string | null
          tipo: string | null
          valor_custo: number | null
          valor_venda_sugerido: number | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          imei?: string | null
          loja_id?: string | null
          marca: string
          modelo: string
          saude_bateria?: number | null
          status?: string | null
          tipo?: string | null
          valor_custo?: number | null
          valor_venda_sugerido?: number | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          imei?: string | null
          loja_id?: string | null
          marca?: string
          modelo?: string
          saude_bateria?: number | null
          status?: string | null
          tipo?: string | null
          valor_custo?: number | null
          valor_venda_sugerido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_nome: string | null
          created_at: string | null
          data_venda: string | null
          id: string
          loja_id: string | null
          status_pagamento: string | null
          valor_total: number
          vendedor_nome: string | null
        }
        Insert: {
          cliente_nome?: string | null
          created_at?: string | null
          data_venda?: string | null
          id?: string
          loja_id?: string | null
          status_pagamento?: string | null
          valor_total: number
          vendedor_nome?: string | null
        }
        Update: {
          cliente_nome?: string | null
          created_at?: string | null
          data_venda?: string | null
          id?: string
          loja_id?: string | null
          status_pagamento?: string | null
          valor_total?: number
          vendedor_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
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
