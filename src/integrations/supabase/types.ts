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
      acessorios: {
        Row: {
          categoria: string | null
          created_at: string | null
          id: string
          loja_id: string | null
          marca: string | null
          nome: string
          quantidade: number | null
          status: string | null
          valor_custo: number | null
          valor_venda: number | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          loja_id?: string | null
          marca?: string | null
          nome: string
          quantidade?: number | null
          status?: string | null
          valor_custo?: number | null
          valor_venda?: number | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          loja_id?: string | null
          marca?: string | null
          nome?: string
          quantidade?: number | null
          status?: string | null
          valor_custo?: number | null
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acessorios_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      adiantamentos: {
        Row: {
          colaborador_id: string | null
          conta_saida_id: string | null
          created_at: string | null
          data_lancamento: string
          historico: Json | null
          id: string
          inicio_competencia: string | null
          lancado_por: string | null
          lancado_por_nome: string | null
          loja_id: string | null
          observacao: string | null
          quantidade_vezes: number
          valor_final: number
        }
        Insert: {
          colaborador_id?: string | null
          conta_saida_id?: string | null
          created_at?: string | null
          data_lancamento?: string
          historico?: Json | null
          id?: string
          inicio_competencia?: string | null
          lancado_por?: string | null
          lancado_por_nome?: string | null
          loja_id?: string | null
          observacao?: string | null
          quantidade_vezes?: number
          valor_final?: number
        }
        Update: {
          colaborador_id?: string | null
          conta_saida_id?: string | null
          created_at?: string | null
          data_lancamento?: string
          historico?: Json | null
          id?: string
          inicio_competencia?: string | null
          lancado_por?: string | null
          lancado_por_nome?: string | null
          loja_id?: string | null
          observacao?: string | null
          quantidade_vezes?: number
          valor_final?: number
        }
        Relationships: []
      }
      anotacoes_fiado: {
        Row: {
          created_at: string | null
          data_hora: string | null
          divida_id: string | null
          id: string
          importante: boolean | null
          observacao: string | null
          usuario: string | null
        }
        Insert: {
          created_at?: string | null
          data_hora?: string | null
          divida_id?: string | null
          id?: string
          importante?: boolean | null
          observacao?: string | null
          usuario?: string | null
        }
        Update: {
          created_at?: string | null
          data_hora?: string | null
          divida_id?: string | null
          id?: string
          importante?: boolean | null
          observacao?: string | null
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anotacoes_fiado_divida_id_fkey"
            columns: ["divida_id"]
            isOneToOne: false
            referencedRelation: "dividas_fiado"
            referencedColumns: ["id"]
          },
        ]
      }
      anotacoes_gestao: {
        Row: {
          chave_contexto: string
          created_at: string | null
          data_hora: string | null
          id: string
          importante: boolean | null
          observacao: string | null
          usuario: string | null
        }
        Insert: {
          chave_contexto: string
          created_at?: string | null
          data_hora?: string | null
          id?: string
          importante?: boolean | null
          observacao?: string | null
          usuario?: string | null
        }
        Update: {
          chave_contexto?: string
          created_at?: string | null
          data_hora?: string | null
          id?: string
          importante?: boolean | null
          observacao?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      atividades_gestores: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          horario_previsto: string | null
          id: string
          lojas_atribuidas: Json | null
          nome: string
          pontuacao_base: number | null
          tipo_horario: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          horario_previsto?: string | null
          id?: string
          lojas_atribuidas?: Json | null
          nome: string
          pontuacao_base?: number | null
          tipo_horario?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          horario_previsto?: string | null
          id?: string
          lojas_atribuidas?: Json | null
          nome?: string
          pontuacao_base?: number | null
          tipo_horario?: string | null
        }
        Relationships: []
      }
      base_trocas_pendentes: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          data_recebimento: string | null
          data_venda: string | null
          fotos_aparelho: Json | null
          fotos_recebimento: Json | null
          id: string
          loja_venda: string | null
          observacoes_recebimento: string | null
          responsavel_recebimento_id: string | null
          responsavel_recebimento_nome: string | null
          sla_congelado: string | null
          sla_faixa_congelada: string | null
          status: string | null
          termo_responsabilidade: Json | null
          trade_in: Json | null
          venda_id: string | null
          vendedor_id: string | null
          vendedor_nome: string | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          data_venda?: string | null
          fotos_aparelho?: Json | null
          fotos_recebimento?: Json | null
          id?: string
          loja_venda?: string | null
          observacoes_recebimento?: string | null
          responsavel_recebimento_id?: string | null
          responsavel_recebimento_nome?: string | null
          sla_congelado?: string | null
          sla_faixa_congelada?: string | null
          status?: string | null
          termo_responsabilidade?: Json | null
          trade_in?: Json | null
          venda_id?: string | null
          vendedor_id?: string | null
          vendedor_nome?: string | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          data_venda?: string | null
          fotos_aparelho?: Json | null
          fotos_recebimento?: Json | null
          id?: string
          loja_venda?: string | null
          observacoes_recebimento?: string | null
          responsavel_recebimento_id?: string | null
          responsavel_recebimento_nome?: string | null
          sla_congelado?: string | null
          sla_faixa_congelada?: string | null
          status?: string | null
          termo_responsabilidade?: Json | null
          trade_in?: Json | null
          venda_id?: string | null
          vendedor_id?: string | null
          vendedor_nome?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          ids_compras: Json | null
          nome: string
          numero: string | null
          origem_cliente: string | null
          status: string | null
          telefone: string | null
          tipo_cliente: string | null
          tipo_pessoa: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          ids_compras?: Json | null
          nome: string
          numero?: string | null
          origem_cliente?: string | null
          status?: string | null
          telefone?: string | null
          tipo_cliente?: string | null
          tipo_pessoa?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          ids_compras?: Json | null
          nome?: string
          numero?: string | null
          origem_cliente?: string | null
          status?: string | null
          telefone?: string | null
          tipo_cliente?: string | null
          tipo_pessoa?: string | null
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          ajuda_custo: number | null
          ativo: boolean | null
          cargo: string | null
          comissao: number | null
          cpf: string | null
          created_at: string | null
          data_admissao: string | null
          data_inativacao: string | null
          data_nascimento: string | null
          eh_estoquista: boolean | null
          eh_gestor: boolean | null
          eh_vendedor: boolean | null
          email: string | null
          foto: string | null
          id: string
          loja_id: string | null
          modelo_pagamento: string | null
          nome: string
          salario: number | null
          salario_fixo: number | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          ajuda_custo?: number | null
          ativo?: boolean | null
          cargo?: string | null
          comissao?: number | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_inativacao?: string | null
          data_nascimento?: string | null
          eh_estoquista?: boolean | null
          eh_gestor?: boolean | null
          eh_vendedor?: boolean | null
          email?: string | null
          foto?: string | null
          id?: string
          loja_id?: string | null
          modelo_pagamento?: string | null
          nome: string
          salario?: number | null
          salario_fixo?: number | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          ajuda_custo?: number | null
          ativo?: boolean | null
          cargo?: string | null
          comissao?: number | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_inativacao?: string | null
          data_nascimento?: string | null
          eh_estoquista?: boolean | null
          eh_gestor?: boolean | null
          eh_vendedor?: boolean | null
          email?: string | null
          foto?: string | null
          id?: string
          loja_id?: string | null
          modelo_pagamento?: string | null
          nome?: string
          salario?: number | null
          salario_fixo?: number | null
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
      comissao_por_loja: {
        Row: {
          cargo_id: string | null
          created_at: string | null
          id: string
          loja_id: string | null
          percentual_comissao: number | null
          updated_at: string | null
        }
        Insert: {
          cargo_id?: string | null
          created_at?: string | null
          id?: string
          loja_id?: string | null
          percentual_comissao?: number | null
          updated_at?: string | null
        }
        Update: {
          cargo_id?: string | null
          created_at?: string | null
          id?: string
          loja_id?: string | null
          percentual_comissao?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comissoes_historico: {
        Row: {
          colaborador_id: string | null
          comissao_anterior: number | null
          comissao_nova: number | null
          created_at: string | null
          data_alteracao: string | null
          fixo_anterior: number | null
          fixo_novo: number | null
          id: string
          usuario_alterou: string | null
        }
        Insert: {
          colaborador_id?: string | null
          comissao_anterior?: number | null
          comissao_nova?: number | null
          created_at?: string | null
          data_alteracao?: string | null
          fixo_anterior?: number | null
          fixo_novo?: number | null
          id?: string
          usuario_alterou?: string | null
        }
        Update: {
          colaborador_id?: string | null
          comissao_anterior?: number | null
          comissao_nova?: number | null
          created_at?: string | null
          data_alteracao?: string | null
          fixo_anterior?: number | null
          fixo_novo?: number | null
          id?: string
          usuario_alterou?: string | null
        }
        Relationships: []
      }
      conferencias_gestao: {
        Row: {
          ajustes: Json | null
          competencia: string
          created_at: string | null
          data: string
          id: string
          loja_id: string
          totais_por_metodo: Json | null
          updated_at: string | null
        }
        Insert: {
          ajustes?: Json | null
          competencia: string
          created_at?: string | null
          data: string
          id?: string
          loja_id: string
          totais_por_metodo?: Json | null
          updated_at?: string | null
        }
        Update: {
          ajustes?: Json | null
          competencia?: string
          created_at?: string | null
          data?: string
          id?: string
          loja_id?: string
          totais_por_metodo?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contas_financeiras: {
        Row: {
          agencia: string | null
          banco: string | null
          cnpj: string | null
          conta: string | null
          created_at: string | null
          habilitada: boolean | null
          historico_alteracoes: Json | null
          id: string
          loja_vinculada: string | null
          nome: string
          nota_fiscal: boolean | null
          saldo_atual: number | null
          saldo_inicial: number | null
          status: string | null
          status_maquina: string | null
          tipo: string | null
          ultimo_movimento: string | null
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          cnpj?: string | null
          conta?: string | null
          created_at?: string | null
          habilitada?: boolean | null
          historico_alteracoes?: Json | null
          id?: string
          loja_vinculada?: string | null
          nome: string
          nota_fiscal?: boolean | null
          saldo_atual?: number | null
          saldo_inicial?: number | null
          status?: string | null
          status_maquina?: string | null
          tipo?: string | null
          ultimo_movimento?: string | null
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          cnpj?: string | null
          conta?: string | null
          created_at?: string | null
          habilitada?: boolean | null
          historico_alteracoes?: Json | null
          id?: string
          loja_vinculada?: string | null
          nome?: string
          nota_fiscal?: boolean | null
          saldo_atual?: number | null
          saldo_inicial?: number | null
          status?: string | null
          status_maquina?: string | null
          tipo?: string | null
          ultimo_movimento?: string | null
        }
        Relationships: []
      }
      contatos_ativos_garantia: {
        Row: {
          aparelho: Json | null
          auto_gerado: boolean | null
          cliente: Json | null
          created_at: string | null
          data_lancamento: string | null
          garantia_estendida: Json | null
          garantia_id: string | null
          id: string
          logistica: Json | null
          status: string | null
          timeline: Json | null
        }
        Insert: {
          aparelho?: Json | null
          auto_gerado?: boolean | null
          cliente?: Json | null
          created_at?: string | null
          data_lancamento?: string | null
          garantia_estendida?: Json | null
          garantia_id?: string | null
          id?: string
          logistica?: Json | null
          status?: string | null
          timeline?: Json | null
        }
        Update: {
          aparelho?: Json | null
          auto_gerado?: boolean | null
          cliente?: Json | null
          created_at?: string | null
          data_lancamento?: string | null
          garantia_estendida?: Json | null
          garantia_id?: string | null
          id?: string
          logistica?: Json | null
          status?: string | null
          timeline?: Json | null
        }
        Relationships: []
      }
      cores_aparelho: {
        Row: {
          created_at: string | null
          hexadecimal: string | null
          id: string
          nome: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          hexadecimal?: string | null
          id?: string
          nome: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          hexadecimal?: string | null
          id?: string
          nome?: string
          status?: string | null
        }
        Relationships: []
      }
      creditos_fornecedor: {
        Row: {
          created_at: string | null
          data_criacao: string | null
          data_utilizacao: string | null
          descricao: string | null
          fornecedor: string | null
          id: string
          nota_id: string | null
          utilizado: boolean | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_criacao?: string | null
          data_utilizacao?: string | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nota_id?: string | null
          utilizado?: boolean | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_criacao?: string | null
          data_utilizacao?: string | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nota_id?: string | null
          utilizado?: boolean | null
          valor?: number | null
        }
        Relationships: []
      }
      demandas_motoboy: {
        Row: {
          created_at: string | null
          data: string | null
          descricao: string | null
          id: string
          loja_destino: string | null
          loja_origem: string | null
          motoboy_id: string | null
          motoboy_nome: string | null
          status: string | null
          tipo: string | null
          valor_demanda: number | null
          venda_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          id?: string
          loja_destino?: string | null
          loja_origem?: string | null
          motoboy_id?: string | null
          motoboy_nome?: string | null
          status?: string | null
          tipo?: string | null
          valor_demanda?: number | null
          venda_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          id?: string
          loja_destino?: string | null
          loja_origem?: string | null
          motoboy_id?: string | null
          motoboy_nome?: string | null
          status?: string | null
          tipo?: string | null
          valor_demanda?: number | null
          venda_id?: string | null
        }
        Relationships: []
      }
      despesas: {
        Row: {
          categoria: string | null
          competencia: string | null
          comprovante: string | null
          conta: string | null
          created_at: string | null
          data: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          documento: string | null
          id: string
          loja_id: string | null
          observacoes: string | null
          pago_por: string | null
          periodicidade: string | null
          recorrente: boolean | null
          status: string | null
          tipo: string | null
          valor: number | null
        }
        Insert: {
          categoria?: string | null
          competencia?: string | null
          comprovante?: string | null
          conta?: string | null
          created_at?: string | null
          data?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          documento?: string | null
          id?: string
          loja_id?: string | null
          observacoes?: string | null
          pago_por?: string | null
          periodicidade?: string | null
          recorrente?: boolean | null
          status?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Update: {
          categoria?: string | null
          competencia?: string | null
          comprovante?: string | null
          conta?: string | null
          created_at?: string | null
          data?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          documento?: string | null
          id?: string
          loja_id?: string | null
          observacoes?: string | null
          pago_por?: string | null
          periodicidade?: string | null
          recorrente?: boolean | null
          status?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "despesas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      dividas_fiado: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          id: string
          inicio_competencia: string | null
          loja_id: string | null
          loja_nome: string | null
          qtd_vezes: number
          situacao: string | null
          tem_anotacao_importante: boolean | null
          tipo_recorrencia: string | null
          valor_final: number
          venda_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          id?: string
          inicio_competencia?: string | null
          loja_id?: string | null
          loja_nome?: string | null
          qtd_vezes?: number
          situacao?: string | null
          tem_anotacao_importante?: boolean | null
          tipo_recorrencia?: string | null
          valor_final?: number
          venda_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          id?: string
          inicio_competencia?: string | null
          loja_id?: string | null
          loja_nome?: string | null
          qtd_vezes?: number
          situacao?: string | null
          tem_anotacao_importante?: boolean | null
          tipo_recorrencia?: string | null
          valor_final?: number
          venda_id?: string | null
        }
        Relationships: []
      }
      execucoes_atividades: {
        Row: {
          atividade_id: string
          atividade_nome: string | null
          colaborador_designado_id: string | null
          colaborador_designado_nome: string | null
          created_at: string | null
          data: string
          executado: boolean | null
          gestor_id: string | null
          gestor_nome: string | null
          horario_executado: string | null
          horario_previsto: string | null
          id: string
          loja_id: string | null
          pontuacao: number | null
          status: string | null
          tipo_horario: string | null
        }
        Insert: {
          atividade_id: string
          atividade_nome?: string | null
          colaborador_designado_id?: string | null
          colaborador_designado_nome?: string | null
          created_at?: string | null
          data: string
          executado?: boolean | null
          gestor_id?: string | null
          gestor_nome?: string | null
          horario_executado?: string | null
          horario_previsto?: string | null
          id?: string
          loja_id?: string | null
          pontuacao?: number | null
          status?: string | null
          tipo_horario?: string | null
        }
        Update: {
          atividade_id?: string
          atividade_nome?: string | null
          colaborador_designado_id?: string | null
          colaborador_designado_nome?: string | null
          created_at?: string | null
          data?: string
          executado?: boolean | null
          gestor_id?: string | null
          gestor_nome?: string | null
          horario_executado?: string | null
          horario_previsto?: string | null
          id?: string
          loja_id?: string | null
          pontuacao?: number | null
          status?: string | null
          tipo_horario?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          arquivo: Json | null
          colaborador_id: string | null
          created_at: string | null
          data_hora: string
          gestor_id: string | null
          gestor_nome: string | null
          id: string
          referencia_anterior: string | null
          texto: string | null
          tipo: string | null
        }
        Insert: {
          arquivo?: Json | null
          colaborador_id?: string | null
          created_at?: string | null
          data_hora?: string
          gestor_id?: string | null
          gestor_nome?: string | null
          id?: string
          referencia_anterior?: string | null
          texto?: string | null
          tipo?: string | null
        }
        Update: {
          arquivo?: Json | null
          colaborador_id?: string | null
          created_at?: string | null
          data_hora?: string
          gestor_id?: string | null
          gestor_nome?: string | null
          id?: string
          referencia_anterior?: string | null
          texto?: string | null
          tipo?: string | null
        }
        Relationships: []
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
      fluxo_vendas: {
        Row: {
          aprovacao_financeiro: Json | null
          aprovacao_gestor: Json | null
          aprovacao_lancamento: Json | null
          bloqueado_para_edicao: boolean | null
          chave_pix: string | null
          conta_origem_downgrade: string | null
          created_at: string | null
          devolucao_financeiro: Json | null
          id: string
          pagamento_downgrade: Json | null
          recebimento_gestor: Json | null
          recusa_gestor: Json | null
          saldo_devolver: number | null
          status_fluxo: string | null
          timeline_fluxo: Json | null
          tipo_operacao: string | null
          updated_at: string | null
          venda_id: string
        }
        Insert: {
          aprovacao_financeiro?: Json | null
          aprovacao_gestor?: Json | null
          aprovacao_lancamento?: Json | null
          bloqueado_para_edicao?: boolean | null
          chave_pix?: string | null
          conta_origem_downgrade?: string | null
          created_at?: string | null
          devolucao_financeiro?: Json | null
          id?: string
          pagamento_downgrade?: Json | null
          recebimento_gestor?: Json | null
          recusa_gestor?: Json | null
          saldo_devolver?: number | null
          status_fluxo?: string | null
          timeline_fluxo?: Json | null
          tipo_operacao?: string | null
          updated_at?: string | null
          venda_id: string
        }
        Update: {
          aprovacao_financeiro?: Json | null
          aprovacao_gestor?: Json | null
          aprovacao_lancamento?: Json | null
          bloqueado_para_edicao?: boolean | null
          chave_pix?: string | null
          conta_origem_downgrade?: string | null
          created_at?: string | null
          devolucao_financeiro?: Json | null
          id?: string
          pagamento_downgrade?: Json | null
          recebimento_gestor?: Json | null
          recusa_gestor?: Json | null
          saldo_devolver?: number | null
          status_fluxo?: string | null
          timeline_fluxo?: Json | null
          tipo_operacao?: string | null
          updated_at?: string | null
          venda_id?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          cnpj: string | null
          created_at: string | null
          endereco: string | null
          id: string
          nome: string
          responsavel: string | null
          status: string | null
          telefone: string | null
          ultima_compra: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          status?: string | null
          telefone?: string | null
          ultima_compra?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          status?: string | null
          telefone?: string | null
          ultima_compra?: string | null
        }
        Relationships: []
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
      historico_comissao_por_loja: {
        Row: {
          comissao_id: string | null
          created_at: string | null
          id: string
          percentual_anterior: number | null
          percentual_novo: number | null
          tipo_acao: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          comissao_id?: string | null
          created_at?: string | null
          id?: string
          percentual_anterior?: number | null
          percentual_novo?: number | null
          tipo_acao?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          comissao_id?: string | null
          created_at?: string | null
          id?: string
          percentual_anterior?: number | null
          percentual_novo?: number | null
          tipo_acao?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: []
      }
      historico_salarios: {
        Row: {
          campo_alterado: string | null
          colaborador_id: string | null
          created_at: string | null
          id: string
          salario_id: string | null
          tipo_acao: string | null
          usuario_id: string | null
          usuario_nome: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado?: string | null
          colaborador_id?: string | null
          created_at?: string | null
          id?: string
          salario_id?: string | null
          tipo_acao?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string | null
          colaborador_id?: string | null
          created_at?: string | null
          id?: string
          salario_id?: string | null
          tipo_acao?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      itens_consignacao: {
        Row: {
          created_at: string | null
          data_consumo: string | null
          data_devolucao: string | null
          descricao: string | null
          devolvido_por: string | null
          id: string
          loja_atual_id: string | null
          lote_id: string | null
          modelo: string | null
          os_vinculada: string | null
          peca_id: string | null
          quantidade: number | null
          quantidade_original: number | null
          status: string | null
          tecnico_consumo: string | null
          valor_custo: number | null
        }
        Insert: {
          created_at?: string | null
          data_consumo?: string | null
          data_devolucao?: string | null
          descricao?: string | null
          devolvido_por?: string | null
          id?: string
          loja_atual_id?: string | null
          lote_id?: string | null
          modelo?: string | null
          os_vinculada?: string | null
          peca_id?: string | null
          quantidade?: number | null
          quantidade_original?: number | null
          status?: string | null
          tecnico_consumo?: string | null
          valor_custo?: number | null
        }
        Update: {
          created_at?: string | null
          data_consumo?: string | null
          data_devolucao?: string | null
          descricao?: string | null
          devolvido_por?: string | null
          id?: string
          loja_atual_id?: string | null
          lote_id?: string | null
          modelo?: string | null
          os_vinculada?: string | null
          peca_id?: string | null
          quantidade?: number | null
          quantidade_original?: number | null
          status?: string | null
          tecnico_consumo?: string | null
          valor_custo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_consignacao_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_consignacao"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_atividades: {
        Row: {
          acao: string | null
          atividade_id: string | null
          atividade_nome: string | null
          created_at: string | null
          data: string | null
          data_hora: string | null
          detalhes: string | null
          gestor_id: string | null
          gestor_nome: string | null
          id: string
          modulo: string | null
          pontuacao: number | null
        }
        Insert: {
          acao?: string | null
          atividade_id?: string | null
          atividade_nome?: string | null
          created_at?: string | null
          data?: string | null
          data_hora?: string | null
          detalhes?: string | null
          gestor_id?: string | null
          gestor_nome?: string | null
          id?: string
          modulo?: string | null
          pontuacao?: number | null
        }
        Update: {
          acao?: string | null
          atividade_id?: string | null
          atividade_nome?: string | null
          created_at?: string | null
          data?: string | null
          data_hora?: string | null
          detalhes?: string | null
          gestor_id?: string | null
          gestor_nome?: string | null
          id?: string
          modulo?: string | null
          pontuacao?: number | null
        }
        Relationships: []
      }
      logs_conferencia_gestao: {
        Row: {
          acao: string | null
          conferencia_id: string | null
          created_at: string | null
          data: string | null
          data_hora: string | null
          detalhes: string | null
          id: string
          loja_id: string | null
          metodo_pagamento: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao?: string | null
          conferencia_id?: string | null
          created_at?: string | null
          data?: string | null
          data_hora?: string | null
          detalhes?: string | null
          id?: string
          loja_id?: string | null
          metodo_pagamento?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string | null
          conferencia_id?: string | null
          created_at?: string | null
          data?: string | null
          data_hora?: string | null
          detalhes?: string | null
          id?: string
          loja_id?: string | null
          metodo_pagamento?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: []
      }
      logs_movimentacoes_contas: {
        Row: {
          conta_destino_id: string | null
          conta_origem_id: string | null
          created_at: string | null
          data_hora: string | null
          id: string
          movimentacao_id: string | null
          observacao: string | null
          transacao_id: string | null
          usuario_id: string | null
          usuario_nome: string | null
          valor: number | null
        }
        Insert: {
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string | null
          data_hora?: string | null
          id?: string
          movimentacao_id?: string | null
          observacao?: string | null
          transacao_id?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor?: number | null
        }
        Update: {
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string | null
          data_hora?: string | null
          id?: string
          movimentacao_id?: string | null
          observacao?: string | null
          transacao_id?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      logs_valor_troca: {
        Row: {
          created_at: string | null
          data_hora: string | null
          detalhes: string | null
          id: string
          modelo: string | null
          tipo: string | null
          usuario: string | null
          valor_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_hora?: string | null
          detalhes?: string | null
          id?: string
          modelo?: string | null
          tipo?: string | null
          usuario?: string | null
          valor_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_hora?: string | null
          detalhes?: string | null
          id?: string
          modelo?: string | null
          tipo?: string | null
          usuario?: string | null
          valor_id?: string | null
        }
        Relationships: []
      }
      lojas: {
        Row: {
          ativa: boolean | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          comissao_percentual: number
          created_at: string | null
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
      lotes_consignacao: {
        Row: {
          created_at: string | null
          data_criacao: string | null
          fornecedor_id: string | null
          id: string
          pagamentos_parciais: Json | null
          responsavel_cadastro: string | null
          status: string | null
          timeline: Json | null
        }
        Insert: {
          created_at?: string | null
          data_criacao?: string | null
          fornecedor_id?: string | null
          id?: string
          pagamentos_parciais?: Json | null
          responsavel_cadastro?: string | null
          status?: string | null
          timeline?: Json | null
        }
        Update: {
          created_at?: string | null
          data_criacao?: string | null
          fornecedor_id?: string | null
          id?: string
          pagamentos_parciais?: Json | null
          responsavel_cadastro?: string | null
          status?: string | null
          timeline?: Json | null
        }
        Relationships: []
      }
      lotes_revisao: {
        Row: {
          created_at: string | null
          custo_total_reparos: number | null
          data_criacao: string | null
          data_finalizacao: string | null
          fornecedor: string | null
          id: string
          itens: Json | null
          nota_entrada_id: string | null
          numero_nota: string | null
          os_ids: Json | null
          responsavel_criacao: string | null
          status: string | null
          valor_liquido_sugerido: number | null
          valor_original_nota: number | null
        }
        Insert: {
          created_at?: string | null
          custo_total_reparos?: number | null
          data_criacao?: string | null
          data_finalizacao?: string | null
          fornecedor?: string | null
          id?: string
          itens?: Json | null
          nota_entrada_id?: string | null
          numero_nota?: string | null
          os_ids?: Json | null
          responsavel_criacao?: string | null
          status?: string | null
          valor_liquido_sugerido?: number | null
          valor_original_nota?: number | null
        }
        Update: {
          created_at?: string | null
          custo_total_reparos?: number | null
          data_criacao?: string | null
          data_finalizacao?: string | null
          fornecedor?: string | null
          id?: string
          itens?: Json | null
          nota_entrada_id?: string | null
          numero_nota?: string | null
          os_ids?: Json | null
          responsavel_criacao?: string | null
          status?: string | null
          valor_liquido_sugerido?: number | null
          valor_original_nota?: number | null
        }
        Relationships: []
      }
      maquinas_cartao: {
        Row: {
          cnpj_vinculado: string | null
          conta_origem: string | null
          created_at: string | null
          id: string
          nome: string
          parcelamentos: Json | null
          percentual_maquina: number | null
          status: string | null
          taxas: Json | null
        }
        Insert: {
          cnpj_vinculado?: string | null
          conta_origem?: string | null
          created_at?: string | null
          id?: string
          nome: string
          parcelamentos?: Json | null
          percentual_maquina?: number | null
          status?: string | null
          taxas?: Json | null
        }
        Update: {
          cnpj_vinculado?: string | null
          conta_origem?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          parcelamentos?: Json | null
          percentual_maquina?: number | null
          status?: string | null
          taxas?: Json | null
        }
        Relationships: []
      }
      metas_lojas: {
        Row: {
          ano: number | null
          created_at: string | null
          id: string
          loja_id: string | null
          mes: number | null
          meta_acessorios: number | null
          meta_assistencia: number | null
          meta_faturamento: number | null
          meta_garantia: number | null
          ultima_atualizacao: string | null
        }
        Insert: {
          ano?: number | null
          created_at?: string | null
          id?: string
          loja_id?: string | null
          mes?: number | null
          meta_acessorios?: number | null
          meta_assistencia?: number | null
          meta_faturamento?: number | null
          meta_garantia?: number | null
          ultima_atualizacao?: string | null
        }
        Update: {
          ano?: number | null
          created_at?: string | null
          id?: string
          loja_id?: string | null
          mes?: number | null
          meta_acessorios?: number | null
          meta_assistencia?: number | null
          meta_faturamento?: number | null
          meta_garantia?: number | null
          ultima_atualizacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metas_lojas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_entre_contas: {
        Row: {
          conta_destino_id: string | null
          conta_origem_id: string | null
          created_at: string | null
          data_hora: string | null
          id: string
          observacao: string | null
          transacao_id: string | null
          usuario_id: string | null
          usuario_nome: string | null
          valor: number | null
        }
        Insert: {
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string | null
          data_hora?: string | null
          id?: string
          observacao?: string | null
          transacao_id?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor?: number | null
        }
        Update: {
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string | null
          data_hora?: string | null
          id?: string
          observacao?: string | null
          transacao_id?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor?: number | null
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
      movimentacoes_pecas: {
        Row: {
          created_at: string | null
          data: string | null
          descricao: string | null
          id: string
          os_id: string | null
          peca_id: string | null
          quantidade: number | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          id?: string
          os_id?: string | null
          peca_id?: string | null
          quantidade?: number | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          id?: string
          os_id?: string | null
          peca_id?: string | null
          quantidade?: number | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_pecas_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_compra: {
        Row: {
          created_at: string | null
          dados_extras: Json | null
          data: string | null
          fornecedor: string | null
          id: string
          numero_nota: string | null
          origem: string | null
          pagamento: Json | null
          produtos: Json | null
          status: string | null
          status_urgencia: string | null
          timeline: Json | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          dados_extras?: Json | null
          data?: string | null
          fornecedor?: string | null
          id?: string
          numero_nota?: string | null
          origem?: string | null
          pagamento?: Json | null
          produtos?: Json | null
          status?: string | null
          status_urgencia?: string | null
          timeline?: Json | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          dados_extras?: Json | null
          data?: string | null
          fornecedor?: string | null
          id?: string
          numero_nota?: string | null
          origem?: string | null
          pagamento?: Json | null
          produtos?: Json | null
          status?: string | null
          status_urgencia?: string | null
          timeline?: Json | null
          valor_total?: number | null
        }
        Relationships: []
      }
      notas_entrada: {
        Row: {
          alertas: Json | null
          atuacao_atual: string | null
          created_at: string | null
          data: string | null
          data_criacao: string | null
          data_envio_direto_financeiro: string | null
          data_finalizacao: string | null
          enviado_direto_financeiro: boolean | null
          forma_pagamento: string | null
          fornecedor: string | null
          id: string
          lote_revisao_id: string | null
          motivo_rejeicao: string | null
          numero_nota: string | null
          observacoes: string | null
          pagamentos: Json | null
          pix_banco: string | null
          pix_chave: string | null
          pix_recebedor: string | null
          produtos: Json | null
          qtd_cadastrada: number | null
          qtd_conferida: number | null
          qtd_informada: number | null
          rejeitada: boolean | null
          responsavel_criacao: string | null
          responsavel_finalizacao: string | null
          status: string | null
          timeline: Json | null
          tipo_pagamento: string | null
          tipo_pagamento_bloqueado: boolean | null
          urgente: boolean | null
          valor_abatimento: number | null
          valor_conferido: number | null
          valor_pago: number | null
          valor_pendente: number | null
          valor_total: number | null
        }
        Insert: {
          alertas?: Json | null
          atuacao_atual?: string | null
          created_at?: string | null
          data?: string | null
          data_criacao?: string | null
          data_envio_direto_financeiro?: string | null
          data_finalizacao?: string | null
          enviado_direto_financeiro?: boolean | null
          forma_pagamento?: string | null
          fornecedor?: string | null
          id?: string
          lote_revisao_id?: string | null
          motivo_rejeicao?: string | null
          numero_nota?: string | null
          observacoes?: string | null
          pagamentos?: Json | null
          pix_banco?: string | null
          pix_chave?: string | null
          pix_recebedor?: string | null
          produtos?: Json | null
          qtd_cadastrada?: number | null
          qtd_conferida?: number | null
          qtd_informada?: number | null
          rejeitada?: boolean | null
          responsavel_criacao?: string | null
          responsavel_finalizacao?: string | null
          status?: string | null
          timeline?: Json | null
          tipo_pagamento?: string | null
          tipo_pagamento_bloqueado?: boolean | null
          urgente?: boolean | null
          valor_abatimento?: number | null
          valor_conferido?: number | null
          valor_pago?: number | null
          valor_pendente?: number | null
          valor_total?: number | null
        }
        Update: {
          alertas?: Json | null
          atuacao_atual?: string | null
          created_at?: string | null
          data?: string | null
          data_criacao?: string | null
          data_envio_direto_financeiro?: string | null
          data_finalizacao?: string | null
          enviado_direto_financeiro?: boolean | null
          forma_pagamento?: string | null
          fornecedor?: string | null
          id?: string
          lote_revisao_id?: string | null
          motivo_rejeicao?: string | null
          numero_nota?: string | null
          observacoes?: string | null
          pagamentos?: Json | null
          pix_banco?: string | null
          pix_chave?: string | null
          pix_recebedor?: string | null
          produtos?: Json | null
          qtd_cadastrada?: number | null
          qtd_conferida?: number | null
          qtd_informada?: number | null
          rejeitada?: boolean | null
          responsavel_criacao?: string | null
          responsavel_finalizacao?: string | null
          status?: string | null
          timeline?: Json | null
          tipo_pagamento?: string | null
          tipo_pagamento_bloqueado?: boolean | null
          urgente?: boolean | null
          valor_abatimento?: number | null
          valor_conferido?: number | null
          valor_pago?: number | null
          valor_pendente?: number | null
          valor_total?: number | null
        }
        Relationships: []
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
      pagamentos_fiado: {
        Row: {
          comprovante: string | null
          comprovante_nome: string | null
          created_at: string | null
          data_pagamento: string | null
          divida_id: string | null
          id: string
          responsavel: string | null
          valor: number
        }
        Insert: {
          comprovante?: string | null
          comprovante_nome?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          divida_id?: string | null
          id?: string
          responsavel?: string | null
          valor?: number
        }
        Update: {
          comprovante?: string | null
          comprovante_nome?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          divida_id?: string | null
          id?: string
          responsavel?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_fiado_divida_id_fkey"
            columns: ["divida_id"]
            isOneToOne: false
            referencedRelation: "dividas_fiado"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_financeiros: {
        Row: {
          conta: string | null
          created_at: string | null
          data: string | null
          descricao: string | null
          id: string
          loja: string | null
          meio_pagamento: string | null
          status: string | null
          valor: number | null
        }
        Insert: {
          conta?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          id?: string
          loja?: string | null
          meio_pagamento?: string | null
          status?: string | null
          valor?: number | null
        }
        Update: {
          conta?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          id?: string
          loja?: string | null
          meio_pagamento?: string | null
          status?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      pecas: {
        Row: {
          created_at: string | null
          data_entrada: string | null
          descricao: string
          fornecedor_id: string | null
          id: string
          loja_id: string | null
          lote_consignacao_id: string | null
          modelo: string | null
          movimentacao_peca_id: string | null
          nota_compra_id: string | null
          origem: string | null
          quantidade: number | null
          status: string | null
          status_movimentacao: string | null
          valor_custo: number | null
          valor_recomendado: number | null
        }
        Insert: {
          created_at?: string | null
          data_entrada?: string | null
          descricao: string
          fornecedor_id?: string | null
          id?: string
          loja_id?: string | null
          lote_consignacao_id?: string | null
          modelo?: string | null
          movimentacao_peca_id?: string | null
          nota_compra_id?: string | null
          origem?: string | null
          quantidade?: number | null
          status?: string | null
          status_movimentacao?: string | null
          valor_custo?: number | null
          valor_recomendado?: number | null
        }
        Update: {
          created_at?: string | null
          data_entrada?: string | null
          descricao?: string
          fornecedor_id?: string | null
          id?: string
          loja_id?: string | null
          lote_consignacao_id?: string | null
          modelo?: string | null
          movimentacao_peca_id?: string | null
          nota_compra_id?: string | null
          origem?: string | null
          quantidade?: number | null
          status?: string | null
          status_movimentacao?: string | null
          valor_custo?: number | null
          valor_recomendado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pecas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      pendencias_financeiras: {
        Row: {
          acao_recomendada: string | null
          aparelhos_conferidos: number | null
          aparelhos_total: number | null
          created_at: string | null
          data_conferencia_completa: string | null
          data_criacao: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          dias_decorridos: number | null
          discrepancia: boolean | null
          fornecedor: string | null
          id: string
          motivo_discrepancia: string | null
          nota_id: string | null
          origem: string | null
          percentual_conferencia: number | null
          sla_alerta: boolean | null
          sla_status: string | null
          status_conferencia: string | null
          status_pagamento: string | null
          timeline: Json | null
          valor_conferido: number | null
          valor_pendente: number | null
          valor_total: number | null
        }
        Insert: {
          acao_recomendada?: string | null
          aparelhos_conferidos?: number | null
          aparelhos_total?: number | null
          created_at?: string | null
          data_conferencia_completa?: string | null
          data_criacao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dias_decorridos?: number | null
          discrepancia?: boolean | null
          fornecedor?: string | null
          id?: string
          motivo_discrepancia?: string | null
          nota_id?: string | null
          origem?: string | null
          percentual_conferencia?: number | null
          sla_alerta?: boolean | null
          sla_status?: string | null
          status_conferencia?: string | null
          status_pagamento?: string | null
          timeline?: Json | null
          valor_conferido?: number | null
          valor_pendente?: number | null
          valor_total?: number | null
        }
        Update: {
          acao_recomendada?: string | null
          aparelhos_conferidos?: number | null
          aparelhos_total?: number | null
          created_at?: string | null
          data_conferencia_completa?: string | null
          data_criacao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dias_decorridos?: number | null
          discrepancia?: boolean | null
          fornecedor?: string | null
          id?: string
          motivo_discrepancia?: string | null
          nota_id?: string | null
          origem?: string | null
          percentual_conferencia?: number | null
          sla_alerta?: boolean | null
          sla_status?: string | null
          status_conferencia?: string | null
          status_pagamento?: string | null
          timeline?: Json | null
          valor_conferido?: number | null
          valor_pendente?: number | null
          valor_total?: number | null
        }
        Relationships: []
      }
      planos_garantia: {
        Row: {
          condicao: string | null
          created_at: string | null
          descricao: string | null
          id: string
          meses: number | null
          modelos: Json | null
          nome: string
          status: string | null
          tipo: string | null
          valor: number | null
        }
        Insert: {
          condicao?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          meses?: number | null
          modelos?: Json | null
          nome: string
          status?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Update: {
          condicao?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          meses?: number | null
          modelos?: Json | null
          nome?: string
          status?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Relationships: []
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
      registros_analise_garantia: {
        Row: {
          cliente_descricao: string | null
          created_at: string | null
          data_aprovacao: string | null
          data_chegada: string | null
          data_recusa: string | null
          id: string
          metadata: Json | null
          motivo_recusa: string | null
          observacao: string | null
          origem: string | null
          origem_id: string | null
          status: string | null
          tecnico_id: string | null
          tecnico_nome: string | null
          usuario_aprovacao: string | null
        }
        Insert: {
          cliente_descricao?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_chegada?: string | null
          data_recusa?: string | null
          id?: string
          metadata?: Json | null
          motivo_recusa?: string | null
          observacao?: string | null
          origem?: string | null
          origem_id?: string | null
          status?: string | null
          tecnico_id?: string | null
          tecnico_nome?: string | null
          usuario_aprovacao?: string | null
        }
        Update: {
          cliente_descricao?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_chegada?: string | null
          data_recusa?: string | null
          id?: string
          metadata?: Json | null
          motivo_recusa?: string | null
          observacao?: string | null
          origem?: string | null
          origem_id?: string | null
          status?: string | null
          tecnico_id?: string | null
          tecnico_nome?: string | null
          usuario_aprovacao?: string | null
        }
        Relationships: []
      }
      remuneracoes_motoboy: {
        Row: {
          competencia: string | null
          comprovante: string | null
          comprovante_nome: string | null
          conta_id: string | null
          conta_nome: string | null
          created_at: string | null
          data_pagamento: string | null
          id: string
          motoboy_id: string | null
          motoboy_nome: string | null
          observacoes_pagamento: string | null
          pago_por: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          qtd_demandas: number | null
          status: string | null
          valor_total: number | null
        }
        Insert: {
          competencia?: string | null
          comprovante?: string | null
          comprovante_nome?: string | null
          conta_id?: string | null
          conta_nome?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          motoboy_id?: string | null
          motoboy_nome?: string | null
          observacoes_pagamento?: string | null
          pago_por?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          qtd_demandas?: number | null
          status?: string | null
          valor_total?: number | null
        }
        Update: {
          competencia?: string | null
          comprovante?: string | null
          comprovante_nome?: string | null
          conta_id?: string | null
          conta_nome?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          motoboy_id?: string | null
          motoboy_nome?: string | null
          observacoes_pagamento?: string | null
          pago_por?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          qtd_demandas?: number | null
          status?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      retiradas_pecas: {
        Row: {
          aparelho_id: string | null
          cor_original: string | null
          created_at: string | null
          data_conclusao: string | null
          data_inicio_desmonte: string | null
          data_solicitacao: string | null
          id: string
          imei_original: string | null
          logs_auditoria: Json | null
          loja_id: string | null
          modelo_original: string | null
          motivo: string | null
          pecas_retiradas: Json | null
          responsavel_solicitacao: string | null
          status: string | null
          tecnico_responsavel: string | null
          timeline: Json | null
          valor_custo_aparelho: number | null
        }
        Insert: {
          aparelho_id?: string | null
          cor_original?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio_desmonte?: string | null
          data_solicitacao?: string | null
          id?: string
          imei_original?: string | null
          logs_auditoria?: Json | null
          loja_id?: string | null
          modelo_original?: string | null
          motivo?: string | null
          pecas_retiradas?: Json | null
          responsavel_solicitacao?: string | null
          status?: string | null
          tecnico_responsavel?: string | null
          timeline?: Json | null
          valor_custo_aparelho?: number | null
        }
        Update: {
          aparelho_id?: string | null
          cor_original?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio_desmonte?: string | null
          data_solicitacao?: string | null
          id?: string
          imei_original?: string | null
          logs_auditoria?: Json | null
          loja_id?: string | null
          modelo_original?: string | null
          motivo?: string | null
          pecas_retiradas?: Json | null
          responsavel_solicitacao?: string | null
          status?: string | null
          tecnico_responsavel?: string | null
          timeline?: Json | null
          valor_custo_aparelho?: number | null
        }
        Relationships: []
      }
      salarios_colaboradores: {
        Row: {
          ajuda_custo: number | null
          colaborador_id: string
          created_at: string | null
          id: string
          percentual_comissao: number | null
          salario_fixo: number | null
          updated_at: string | null
        }
        Insert: {
          ajuda_custo?: number | null
          colaborador_id: string
          created_at?: string | null
          id?: string
          percentual_comissao?: number | null
          salario_fixo?: number | null
          updated_at?: string | null
        }
        Update: {
          ajuda_custo?: number | null
          colaborador_id?: string
          created_at?: string | null
          id?: string
          percentual_comissao?: number | null
          salario_fixo?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stories_lotes: {
        Row: {
          competencia: string
          conferido_por: string | null
          conferido_por_nome: string | null
          created_at: string | null
          data: string
          data_conferencia: string | null
          data_validacao: string | null
          id: string
          loja_id: string
          loja_nome: string | null
          percentual_stories: number | null
          status: string | null
          total_vendas: number | null
          validado_por: string | null
          validado_por_nome: string | null
          vendas: Json | null
          vendas_com_story: number | null
        }
        Insert: {
          competencia: string
          conferido_por?: string | null
          conferido_por_nome?: string | null
          created_at?: string | null
          data: string
          data_conferencia?: string | null
          data_validacao?: string | null
          id?: string
          loja_id: string
          loja_nome?: string | null
          percentual_stories?: number | null
          status?: string | null
          total_vendas?: number | null
          validado_por?: string | null
          validado_por_nome?: string | null
          vendas?: Json | null
          vendas_com_story?: number | null
        }
        Update: {
          competencia?: string
          conferido_por?: string | null
          conferido_por_nome?: string | null
          created_at?: string | null
          data?: string
          data_conferencia?: string | null
          data_validacao?: string | null
          id?: string
          loja_id?: string
          loja_nome?: string | null
          percentual_stories?: number | null
          status?: string | null
          total_vendas?: number | null
          validado_por?: string | null
          validado_por_nome?: string | null
          vendas?: Json | null
          vendas_com_story?: number | null
        }
        Relationships: []
      }
      taxas_entrega: {
        Row: {
          created_at: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          id: string
          local: string
          logs: Json | null
          status: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          local: string
          logs?: Json | null
          status?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          local?: string
          logs?: Json | null
          status?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      tratativas_comerciais: {
        Row: {
          confirmacao1: Json | null
          confirmacao2: Json | null
          created_at: string | null
          data_hora: string | null
          descricao: string | null
          garantia_id: string | null
          id: string
          meses_plano: number | null
          nova_data_fim_garantia: string | null
          pagamento: Json | null
          plano_id: string | null
          plano_nome: string | null
          resultado_contato: string | null
          status_adesao: string | null
          tipo: string | null
          usuario_id: string | null
          usuario_nome: string | null
          valor_plano: number | null
          venda_conferencia_id: string | null
          venda_id: string | null
        }
        Insert: {
          confirmacao1?: Json | null
          confirmacao2?: Json | null
          created_at?: string | null
          data_hora?: string | null
          descricao?: string | null
          garantia_id?: string | null
          id?: string
          meses_plano?: number | null
          nova_data_fim_garantia?: string | null
          pagamento?: Json | null
          plano_id?: string | null
          plano_nome?: string | null
          resultado_contato?: string | null
          status_adesao?: string | null
          tipo?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor_plano?: number | null
          venda_conferencia_id?: string | null
          venda_id?: string | null
        }
        Update: {
          confirmacao1?: Json | null
          confirmacao2?: Json | null
          created_at?: string | null
          data_hora?: string | null
          descricao?: string | null
          garantia_id?: string | null
          id?: string
          meses_plano?: number | null
          nova_data_fim_garantia?: string | null
          pagamento?: Json | null
          plano_id?: string | null
          plano_nome?: string | null
          resultado_contato?: string | null
          status_adesao?: string | null
          tipo?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor_plano?: number | null
          venda_conferencia_id?: string | null
          venda_id?: string | null
        }
        Relationships: []
      }
      vales: {
        Row: {
          colaborador_id: string | null
          created_at: string | null
          data_lancamento: string
          historico: Json | null
          id: string
          inicio_competencia: string | null
          lancado_por: string | null
          lancado_por_nome: string | null
          loja_id: string | null
          observacao: string | null
          quantidade_vezes: number
          valor_final: number
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string | null
          data_lancamento?: string
          historico?: Json | null
          id?: string
          inicio_competencia?: string | null
          lancado_por?: string | null
          lancado_por_nome?: string | null
          loja_id?: string | null
          observacao?: string | null
          quantidade_vezes?: number
          valor_final?: number
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string | null
          data_lancamento?: string
          historico?: Json | null
          id?: string
          inicio_competencia?: string | null
          lancado_por?: string | null
          lancado_por_nome?: string | null
          loja_id?: string | null
          observacao?: string | null
          quantidade_vezes?: number
          valor_final?: number
        }
        Relationships: []
      }
      valores_recomendados_troca: {
        Row: {
          condicao: string | null
          created_at: string | null
          id: string
          marca: string | null
          modelo: string
          ultima_atualizacao: string | null
          valor_sugerido: number | null
        }
        Insert: {
          condicao?: string | null
          created_at?: string | null
          id?: string
          marca?: string | null
          modelo: string
          ultima_atualizacao?: string | null
          valor_sugerido?: number | null
        }
        Update: {
          condicao?: string | null
          created_at?: string | null
          id?: string
          marca?: string | null
          modelo?: string
          ultima_atualizacao?: string | null
          valor_sugerido?: number | null
        }
        Relationships: []
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
      vendas_conferencia: {
        Row: {
          cliente_nome: string | null
          conta_destino: string | null
          created_at: string | null
          dados_venda: Json | null
          data_conferencia: string | null
          data_finalizacao: string | null
          data_registro: string | null
          financeiro_nome: string | null
          financeiro_responsavel: string | null
          gestor_conferencia: string | null
          gestor_nome: string | null
          id: string
          loja_id: string | null
          loja_nome: string | null
          observacao_gestor: string | null
          sla_dias: number | null
          status: string | null
          timeline: Json | null
          tipo_venda: string | null
          valor_total: number | null
          venda_id: string | null
          vendedor_id: string | null
          vendedor_nome: string | null
        }
        Insert: {
          cliente_nome?: string | null
          conta_destino?: string | null
          created_at?: string | null
          dados_venda?: Json | null
          data_conferencia?: string | null
          data_finalizacao?: string | null
          data_registro?: string | null
          financeiro_nome?: string | null
          financeiro_responsavel?: string | null
          gestor_conferencia?: string | null
          gestor_nome?: string | null
          id?: string
          loja_id?: string | null
          loja_nome?: string | null
          observacao_gestor?: string | null
          sla_dias?: number | null
          status?: string | null
          timeline?: Json | null
          tipo_venda?: string | null
          valor_total?: number | null
          venda_id?: string | null
          vendedor_id?: string | null
          vendedor_nome?: string | null
        }
        Update: {
          cliente_nome?: string | null
          conta_destino?: string | null
          created_at?: string | null
          dados_venda?: Json | null
          data_conferencia?: string | null
          data_finalizacao?: string | null
          data_registro?: string | null
          financeiro_nome?: string | null
          financeiro_responsavel?: string | null
          gestor_conferencia?: string | null
          gestor_nome?: string | null
          id?: string
          loja_id?: string | null
          loja_nome?: string | null
          observacao_gestor?: string | null
          sla_dias?: number | null
          status?: string | null
          timeline?: Json | null
          tipo_venda?: string | null
          valor_total?: number | null
          venda_id?: string | null
          vendedor_id?: string | null
          vendedor_nome?: string | null
        }
        Relationships: []
      }
      vendas_digitais: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          dados_completos: Json | null
          data_finalizacao: string | null
          data_hora: string | null
          finalizador_id: string | null
          finalizador_nome: string | null
          id: string
          motivo_ajuste: string | null
          numero: number
          responsavel_venda_id: string | null
          responsavel_venda_nome: string | null
          status: string | null
          timeline: Json | null
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          dados_completos?: Json | null
          data_finalizacao?: string | null
          data_hora?: string | null
          finalizador_id?: string | null
          finalizador_nome?: string | null
          id?: string
          motivo_ajuste?: string | null
          numero?: number
          responsavel_venda_id?: string | null
          responsavel_venda_nome?: string | null
          status?: string | null
          timeline?: Json | null
          valor_total?: number
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          dados_completos?: Json | null
          data_finalizacao?: string | null
          data_hora?: string | null
          finalizador_id?: string | null
          finalizador_nome?: string | null
          id?: string
          motivo_ajuste?: string | null
          numero?: number
          responsavel_venda_id?: string | null
          responsavel_venda_nome?: string | null
          status?: string | null
          timeline?: Json | null
          valor_total?: number
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
