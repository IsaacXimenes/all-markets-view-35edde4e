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
          cpf: string | null
          created_at: string | null
          data_admissao: string | null
          data_inativacao: string | null
          data_nascimento: string | null
          email: string | null
          foto: string | null
          id: string
          loja_id: string | null
          modelo_pagamento: string | null
          nome: string
          salario: number | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_inativacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          foto?: string | null
          id?: string
          loja_id?: string | null
          modelo_pagamento?: string | null
          nome: string
          salario?: number | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_inativacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          foto?: string | null
          id?: string
          loja_id?: string | null
          modelo_pagamento?: string | null
          nome?: string
          salario?: number | null
          status?: string | null
          telefone?: string | null
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
          cliente_email: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          imei: string | null
          item_venda_id: string | null
          loja_venda: string | null
          meses_garantia: number | null
          modelo: string | null
          produto_id: string | null
          status: string | null
          timeline_garantia: Json | null
          tipo_garantia: string | null
          tratativas: Json | null
          venda_id: string | null
          venda_id_ref: string | null
          vendedor_id: string | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          imei?: string | null
          item_venda_id?: string | null
          loja_venda?: string | null
          meses_garantia?: number | null
          modelo?: string | null
          produto_id?: string | null
          status?: string | null
          timeline_garantia?: Json | null
          tipo_garantia?: string | null
          tratativas?: Json | null
          venda_id?: string | null
          venda_id_ref?: string | null
          vendedor_id?: string | null
        }
        Update: {
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          imei?: string | null
          item_venda_id?: string | null
          loja_venda?: string | null
          meses_garantia?: number | null
          modelo?: string | null
          produto_id?: string | null
          status?: string | null
          timeline_garantia?: Json | null
          tipo_garantia?: string | null
          tratativas?: Json | null
          venda_id?: string | null
          venda_id_ref?: string | null
          vendedor_id?: string | null
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
          {
            foreignKeyName: "garantias_venda_id_ref_fkey"
            columns: ["venda_id_ref"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantias_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          ativa: boolean | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          comissao_percentual: number
          created_at: string | null
          endereco: string | null
          estado: string | null
          horario_funcionamento: string | null
          id: string
          nome: string
          responsavel: string | null
          status: string | null
          telefone: string | null
          tipo: string | null
        }
        Insert: {
          ativa?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          comissao_percentual: number
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          horario_funcionamento?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          status?: string | null
          telefone?: string | null
          tipo?: string | null
        }
        Update: {
          ativa?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          comissao_percentual?: number
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          horario_funcionamento?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          status?: string | null
          telefone?: string | null
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
          conclusao_servico: string | null
          created_at: string | null
          cronometro: Json | null
          custo_total: number | null
          descricao: string | null
          evidencias: Json | null
          fotos_entrada: Json | null
          garantia_id: string | null
          id: string
          imei: string | null
          imei_aparelho: string | null
          loja_id: string | null
          modelo_aparelho: string | null
          motivo_recusa_tecnico: string | null
          observacao_origem: string | null
          origem_os: string | null
          parecer_tecnico: string | null
          problema_relatado: string | null
          produto_id: string | null
          proxima_atuacao: string | null
          recusada_tecnico: boolean | null
          resumo_conclusao: string | null
          setor: string | null
          status: string | null
          tecnico_id: string | null
          timeline: Json | null
          valor_custo_tecnico: number | null
          valor_orcamento: number | null
          valor_produto_origem: number | null
          valor_servico: number | null
          valor_total: number | null
          valor_venda_tecnico: number | null
          venda_id: string | null
        }
        Insert: {
          aparelho_modelo?: string | null
          cliente_nome: string
          conclusao_servico?: string | null
          created_at?: string | null
          cronometro?: Json | null
          custo_total?: number | null
          descricao?: string | null
          evidencias?: Json | null
          fotos_entrada?: Json | null
          garantia_id?: string | null
          id?: string
          imei?: string | null
          imei_aparelho?: string | null
          loja_id?: string | null
          modelo_aparelho?: string | null
          motivo_recusa_tecnico?: string | null
          observacao_origem?: string | null
          origem_os?: string | null
          parecer_tecnico?: string | null
          problema_relatado?: string | null
          produto_id?: string | null
          proxima_atuacao?: string | null
          recusada_tecnico?: boolean | null
          resumo_conclusao?: string | null
          setor?: string | null
          status?: string | null
          tecnico_id?: string | null
          timeline?: Json | null
          valor_custo_tecnico?: number | null
          valor_orcamento?: number | null
          valor_produto_origem?: number | null
          valor_servico?: number | null
          valor_total?: number | null
          valor_venda_tecnico?: number | null
          venda_id?: string | null
        }
        Update: {
          aparelho_modelo?: string | null
          cliente_nome?: string
          conclusao_servico?: string | null
          created_at?: string | null
          cronometro?: Json | null
          custo_total?: number | null
          descricao?: string | null
          evidencias?: Json | null
          fotos_entrada?: Json | null
          garantia_id?: string | null
          id?: string
          imei?: string | null
          imei_aparelho?: string | null
          loja_id?: string | null
          modelo_aparelho?: string | null
          motivo_recusa_tecnico?: string | null
          observacao_origem?: string | null
          origem_os?: string | null
          parecer_tecnico?: string | null
          problema_relatado?: string | null
          produto_id?: string | null
          proxima_atuacao?: string | null
          recusada_tecnico?: boolean | null
          resumo_conclusao?: string | null
          setor?: string | null
          status?: string | null
          tecnico_id?: string | null
          timeline?: Json | null
          valor_custo_tecnico?: number | null
          valor_orcamento?: number | null
          valor_produto_origem?: number | null
          valor_servico?: number | null
          valor_total?: number | null
          valor_venda_tecnico?: number | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_garantia_id_fkey"
            columns: ["garantia_id"]
            isOneToOne: false
            referencedRelation: "garantias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      os_pagamentos: {
        Row: {
          comprovante: string | null
          comprovante_nome: string | null
          conta_destino: string | null
          created_at: string | null
          id: string
          meio: string | null
          os_id: string | null
          parcelas: number | null
          valor: number | null
        }
        Insert: {
          comprovante?: string | null
          comprovante_nome?: string | null
          conta_destino?: string | null
          created_at?: string | null
          id?: string
          meio?: string | null
          os_id?: string | null
          parcelas?: number | null
          valor?: number | null
        }
        Update: {
          comprovante?: string | null
          comprovante_nome?: string | null
          conta_destino?: string | null
          created_at?: string | null
          id?: string
          meio?: string | null
          os_id?: string | null
          parcelas?: number | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "os_pagamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      os_pecas: {
        Row: {
          conta_origem_pagamento: string | null
          created_at: string | null
          data_pagamento: string | null
          data_recebimento: string | null
          descricao_terceirizado: string | null
          fornecedor_id: string | null
          id: string
          imei: string | null
          motivo_rejeicao: string | null
          origem_peca: string | null
          origem_servico: string | null
          os_id: string | null
          peca: string | null
          peca_de_fornecedor: boolean | null
          peca_estoque_id: string | null
          peca_no_estoque: boolean | null
          percentual: number | null
          servico_terceirizado: boolean | null
          status_aprovacao: string | null
          unidade_servico: string | null
          valor: number | null
          valor_custo_real: number | null
          valor_total: number | null
        }
        Insert: {
          conta_origem_pagamento?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_recebimento?: string | null
          descricao_terceirizado?: string | null
          fornecedor_id?: string | null
          id?: string
          imei?: string | null
          motivo_rejeicao?: string | null
          origem_peca?: string | null
          origem_servico?: string | null
          os_id?: string | null
          peca?: string | null
          peca_de_fornecedor?: boolean | null
          peca_estoque_id?: string | null
          peca_no_estoque?: boolean | null
          percentual?: number | null
          servico_terceirizado?: boolean | null
          status_aprovacao?: string | null
          unidade_servico?: string | null
          valor?: number | null
          valor_custo_real?: number | null
          valor_total?: number | null
        }
        Update: {
          conta_origem_pagamento?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_recebimento?: string | null
          descricao_terceirizado?: string | null
          fornecedor_id?: string | null
          id?: string
          imei?: string | null
          motivo_rejeicao?: string | null
          origem_peca?: string | null
          origem_servico?: string | null
          os_id?: string | null
          peca?: string | null
          peca_de_fornecedor?: boolean | null
          peca_estoque_id?: string | null
          peca_no_estoque?: boolean | null
          percentual?: number | null
          servico_terceirizado?: boolean | null
          status_aprovacao?: string | null
          unidade_servico?: string | null
          valor?: number | null
          valor_custo_real?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "os_pecas_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          assistencia_conferida: boolean | null
          bloqueado_em_troca_garantia_id: string | null
          bloqueado_em_venda_id: string | null
          condicao: string | null
          cor: string | null
          created_at: string | null
          custo_assistencia: number | null
          emprestimo_cliente_id: string | null
          emprestimo_cliente_nome: string | null
          emprestimo_data_hora: string | null
          emprestimo_garantia_id: string | null
          emprestimo_os_id: string | null
          estoque_conferido: boolean | null
          historico_custo: Json | null
          historico_valor_recomendado: Json | null
          id: string
          imagem: string | null
          imei: string | null
          loja_atual_id: string | null
          loja_id: string | null
          lote_revisao_id: string | null
          marca: string
          modelo: string
          movimentacao_id: string | null
          origem_entrada: string | null
          pareceres: string | null
          quantidade: number | null
          retirada_pecas_id: string | null
          saude_bateria: number | null
          status: string | null
          status_emprestimo: string | null
          status_movimentacao: string | null
          status_nota: string | null
          status_retirada_pecas: string | null
          status_revisao_tecnica: string | null
          tag_retorno_assistencia: string | null
          timeline: Json | null
          tipo: string | null
          valor_custo: number | null
          valor_venda_sugerido: number | null
          venda_recomendada: number | null
        }
        Insert: {
          assistencia_conferida?: boolean | null
          bloqueado_em_troca_garantia_id?: string | null
          bloqueado_em_venda_id?: string | null
          condicao?: string | null
          cor?: string | null
          created_at?: string | null
          custo_assistencia?: number | null
          emprestimo_cliente_id?: string | null
          emprestimo_cliente_nome?: string | null
          emprestimo_data_hora?: string | null
          emprestimo_garantia_id?: string | null
          emprestimo_os_id?: string | null
          estoque_conferido?: boolean | null
          historico_custo?: Json | null
          historico_valor_recomendado?: Json | null
          id?: string
          imagem?: string | null
          imei?: string | null
          loja_atual_id?: string | null
          loja_id?: string | null
          lote_revisao_id?: string | null
          marca: string
          modelo: string
          movimentacao_id?: string | null
          origem_entrada?: string | null
          pareceres?: string | null
          quantidade?: number | null
          retirada_pecas_id?: string | null
          saude_bateria?: number | null
          status?: string | null
          status_emprestimo?: string | null
          status_movimentacao?: string | null
          status_nota?: string | null
          status_retirada_pecas?: string | null
          status_revisao_tecnica?: string | null
          tag_retorno_assistencia?: string | null
          timeline?: Json | null
          tipo?: string | null
          valor_custo?: number | null
          valor_venda_sugerido?: number | null
          venda_recomendada?: number | null
        }
        Update: {
          assistencia_conferida?: boolean | null
          bloqueado_em_troca_garantia_id?: string | null
          bloqueado_em_venda_id?: string | null
          condicao?: string | null
          cor?: string | null
          created_at?: string | null
          custo_assistencia?: number | null
          emprestimo_cliente_id?: string | null
          emprestimo_cliente_nome?: string | null
          emprestimo_data_hora?: string | null
          emprestimo_garantia_id?: string | null
          emprestimo_os_id?: string | null
          estoque_conferido?: boolean | null
          historico_custo?: Json | null
          historico_valor_recomendado?: Json | null
          id?: string
          imagem?: string | null
          imei?: string | null
          loja_atual_id?: string | null
          loja_id?: string | null
          lote_revisao_id?: string | null
          marca?: string
          modelo?: string
          movimentacao_id?: string | null
          origem_entrada?: string | null
          pareceres?: string | null
          quantidade?: number | null
          retirada_pecas_id?: string | null
          saude_bateria?: number | null
          status?: string | null
          status_emprestimo?: string | null
          status_movimentacao?: string | null
          status_nota?: string | null
          status_retirada_pecas?: string | null
          status_revisao_tecnica?: string | null
          tag_retorno_assistencia?: string | null
          timeline?: Json | null
          tipo?: string | null
          valor_custo?: number | null
          valor_venda_sugerido?: number | null
          venda_recomendada?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_loja_atual_id_fkey"
            columns: ["loja_atual_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_itens: {
        Row: {
          categoria: string | null
          created_at: string | null
          id: string
          imei: string | null
          loja_id: string | null
          produto_id: string | null
          produto_nome: string | null
          quantidade: number | null
          valor_custo: number | null
          valor_recomendado: number | null
          valor_venda: number | null
          venda_id: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          imei?: string | null
          loja_id?: string | null
          produto_id?: string | null
          produto_nome?: string | null
          quantidade?: number | null
          valor_custo?: number | null
          valor_recomendado?: number | null
          valor_venda?: number | null
          venda_id?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          imei?: string | null
          loja_id?: string | null
          produto_id?: string | null
          produto_nome?: string | null
          quantidade?: number | null
          valor_custo?: number | null
          valor_recomendado?: number | null
          valor_venda?: number | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venda_itens_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_pagamentos: {
        Row: {
          comprovante: string | null
          comprovante_nome: string | null
          conta_destino: string | null
          created_at: string | null
          descricao: string | null
          fiado_data_base: string | null
          fiado_intervalo_dias: number | null
          fiado_numero_parcelas: number | null
          fiado_tipo_recorrencia: string | null
          id: string
          is_fiado: boolean | null
          maquina_id: string | null
          meio_pagamento: string | null
          parcelas: number | null
          taxa_cartao: number | null
          valor: number | null
          valor_com_taxa: number | null
          valor_parcela: number | null
          venda_id: string | null
        }
        Insert: {
          comprovante?: string | null
          comprovante_nome?: string | null
          conta_destino?: string | null
          created_at?: string | null
          descricao?: string | null
          fiado_data_base?: string | null
          fiado_intervalo_dias?: number | null
          fiado_numero_parcelas?: number | null
          fiado_tipo_recorrencia?: string | null
          id?: string
          is_fiado?: boolean | null
          maquina_id?: string | null
          meio_pagamento?: string | null
          parcelas?: number | null
          taxa_cartao?: number | null
          valor?: number | null
          valor_com_taxa?: number | null
          valor_parcela?: number | null
          venda_id?: string | null
        }
        Update: {
          comprovante?: string | null
          comprovante_nome?: string | null
          conta_destino?: string | null
          created_at?: string | null
          descricao?: string | null
          fiado_data_base?: string | null
          fiado_intervalo_dias?: number | null
          fiado_numero_parcelas?: number | null
          fiado_tipo_recorrencia?: string | null
          id?: string
          is_fiado?: boolean | null
          maquina_id?: string | null
          meio_pagamento?: string | null
          parcelas?: number | null
          taxa_cartao?: number | null
          valor?: number | null
          valor_com_taxa?: number | null
          valor_parcela?: number | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venda_pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_trade_ins: {
        Row: {
          anexos: Json | null
          condicao: string | null
          created_at: string | null
          data_registro: string | null
          descricao: string | null
          id: string
          imei: string | null
          imei_validado: boolean | null
          modelo: string | null
          produto_id: string | null
          tipo_entrega: string | null
          valor_compra_usado: number | null
          venda_id: string | null
        }
        Insert: {
          anexos?: Json | null
          condicao?: string | null
          created_at?: string | null
          data_registro?: string | null
          descricao?: string | null
          id?: string
          imei?: string | null
          imei_validado?: boolean | null
          modelo?: string | null
          produto_id?: string | null
          tipo_entrega?: string | null
          valor_compra_usado?: number | null
          venda_id?: string | null
        }
        Update: {
          anexos?: Json | null
          condicao?: string | null
          created_at?: string | null
          data_registro?: string | null
          descricao?: string | null
          id?: string
          imei?: string | null
          imei_validado?: boolean | null
          modelo?: string | null
          produto_id?: string | null
          tipo_entrega?: string | null
          valor_compra_usado?: number | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venda_trade_ins_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_trade_ins_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          bloqueado_para_edicao: boolean | null
          cliente_cidade: string | null
          cliente_cpf: string | null
          cliente_email: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          comissao_vendedor: number | null
          created_at: string | null
          data_sinal: string | null
          data_venda: string | null
          garantia_extendida: Json | null
          hora_venda: string | null
          id: string
          local_retirada: string | null
          loja_id: string | null
          lucro: number | null
          margem: number | null
          motivo_cancelamento: string | null
          motoboy_id: string | null
          numero: number | null
          observacao_sinal: string | null
          observacoes: string | null
          origem_venda: string | null
          status_atual: string | null
          status_pagamento: string | null
          subtotal: number | null
          taxa_entrega: number | null
          timeline: Json | null
          timeline_edicoes: Json | null
          tipo_retirada: string | null
          total_trade_in: number | null
          valor_pendente_sinal: number | null
          valor_sinal: number | null
          valor_total: number
          vendedor_id: string | null
          vendedor_nome: string | null
        }
        Insert: {
          bloqueado_para_edicao?: boolean | null
          cliente_cidade?: string | null
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          comissao_vendedor?: number | null
          created_at?: string | null
          data_sinal?: string | null
          data_venda?: string | null
          garantia_extendida?: Json | null
          hora_venda?: string | null
          id?: string
          local_retirada?: string | null
          loja_id?: string | null
          lucro?: number | null
          margem?: number | null
          motivo_cancelamento?: string | null
          motoboy_id?: string | null
          numero?: number | null
          observacao_sinal?: string | null
          observacoes?: string | null
          origem_venda?: string | null
          status_atual?: string | null
          status_pagamento?: string | null
          subtotal?: number | null
          taxa_entrega?: number | null
          timeline?: Json | null
          timeline_edicoes?: Json | null
          tipo_retirada?: string | null
          total_trade_in?: number | null
          valor_pendente_sinal?: number | null
          valor_sinal?: number | null
          valor_total: number
          vendedor_id?: string | null
          vendedor_nome?: string | null
        }
        Update: {
          bloqueado_para_edicao?: boolean | null
          cliente_cidade?: string | null
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          comissao_vendedor?: number | null
          created_at?: string | null
          data_sinal?: string | null
          data_venda?: string | null
          garantia_extendida?: Json | null
          hora_venda?: string | null
          id?: string
          local_retirada?: string | null
          loja_id?: string | null
          lucro?: number | null
          margem?: number | null
          motivo_cancelamento?: string | null
          motoboy_id?: string | null
          numero?: number | null
          observacao_sinal?: string | null
          observacoes?: string | null
          origem_venda?: string | null
          status_atual?: string | null
          status_pagamento?: string | null
          subtotal?: number | null
          taxa_entrega?: number | null
          timeline?: Json | null
          timeline_edicoes?: Json | null
          tipo_retirada?: string | null
          total_trade_in?: number | null
          valor_pendente_sinal?: number | null
          valor_sinal?: number | null
          valor_total?: number
          vendedor_id?: string | null
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
          {
            foreignKeyName: "vendas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
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
