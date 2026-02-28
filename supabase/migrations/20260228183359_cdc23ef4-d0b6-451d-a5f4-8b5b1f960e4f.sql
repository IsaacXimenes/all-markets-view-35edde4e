
-- ============================================================
-- LOTE 5C: Todas as tabelas restantes para migração completa
-- ============================================================

-- 1. FIADO: dividas, pagamentos, anotações
CREATE TABLE public.dividas_fiado (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  venda_id character varying,
  cliente_id character varying,
  cliente_nome character varying,
  loja_id character varying,
  loja_nome character varying,
  valor_final numeric NOT NULL DEFAULT 0,
  qtd_vezes integer NOT NULL DEFAULT 1,
  tipo_recorrencia character varying DEFAULT 'Mensal',
  inicio_competencia character varying,
  situacao character varying DEFAULT 'Em Aberto',
  tem_anotacao_importante boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.dividas_fiado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_dividas_fiado" ON public.dividas_fiado FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.pagamentos_fiado (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  divida_id uuid REFERENCES public.dividas_fiado(id),
  valor numeric NOT NULL DEFAULT 0,
  data_pagamento timestamp with time zone DEFAULT now(),
  responsavel character varying,
  comprovante text,
  comprovante_nome character varying,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.pagamentos_fiado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pagamentos_fiado" ON public.pagamentos_fiado FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.anotacoes_fiado (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  divida_id uuid REFERENCES public.dividas_fiado(id),
  data_hora timestamp with time zone DEFAULT now(),
  usuario character varying,
  observacao text,
  importante boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.anotacoes_fiado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_anotacoes_fiado" ON public.anotacoes_fiado FOR ALL USING (true) WITH CHECK (true);

-- 2. VENDAS DIGITAIS
CREATE TABLE public.vendas_digitais (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  numero serial,
  data_hora timestamp with time zone DEFAULT now(),
  responsavel_venda_id character varying,
  responsavel_venda_nome character varying,
  cliente_nome character varying,
  cliente_id character varying,
  valor_total numeric NOT NULL DEFAULT 0,
  status character varying DEFAULT 'Pendente',
  timeline jsonb DEFAULT '[]'::jsonb,
  finalizador_id character varying,
  finalizador_nome character varying,
  data_finalizacao timestamp with time zone,
  motivo_ajuste text,
  dados_completos jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.vendas_digitais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_vendas_digitais" ON public.vendas_digitais FOR ALL USING (true) WITH CHECK (true);

-- 3. CONFERÊNCIA GESTOR
CREATE TABLE public.vendas_conferencia (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  venda_id character varying,
  data_registro timestamp with time zone DEFAULT now(),
  loja_id character varying,
  loja_nome character varying,
  vendedor_id character varying,
  vendedor_nome character varying,
  cliente_nome character varying,
  valor_total numeric DEFAULT 0,
  tipo_venda character varying DEFAULT 'Normal',
  status character varying DEFAULT 'Conferência - Gestor',
  sla_dias integer DEFAULT 0,
  timeline jsonb DEFAULT '[]'::jsonb,
  gestor_conferencia character varying,
  gestor_nome character varying,
  observacao_gestor text,
  data_conferencia timestamp with time zone,
  financeiro_responsavel character varying,
  financeiro_nome character varying,
  data_finalizacao timestamp with time zone,
  conta_destino character varying,
  dados_venda jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.vendas_conferencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_vendas_conferencia" ON public.vendas_conferencia FOR ALL USING (true) WITH CHECK (true);

-- 4. TRATATIVAS COMERCIAIS (Garantia Extendida)
CREATE TABLE public.tratativas_comerciais (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  garantia_id character varying,
  venda_id character varying,
  tipo character varying,
  data_hora timestamp with time zone DEFAULT now(),
  usuario_id character varying,
  usuario_nome character varying,
  descricao text,
  resultado_contato character varying,
  plano_id character varying,
  plano_nome character varying,
  valor_plano numeric DEFAULT 0,
  meses_plano integer,
  nova_data_fim_garantia date,
  status_adesao character varying,
  pagamento jsonb,
  confirmacao1 jsonb,
  confirmacao2 jsonb,
  venda_conferencia_id character varying,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.tratativas_comerciais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_tratativas_comerciais" ON public.tratativas_comerciais FOR ALL USING (true) WITH CHECK (true);

-- 5. CONSIGNAÇÃO
CREATE TABLE public.lotes_consignacao (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  fornecedor_id character varying,
  data_criacao timestamp with time zone DEFAULT now(),
  responsavel_cadastro character varying,
  status character varying DEFAULT 'Aberto',
  timeline jsonb DEFAULT '[]'::jsonb,
  pagamentos_parciais jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.lotes_consignacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_lotes_consignacao" ON public.lotes_consignacao FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.itens_consignacao (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  lote_id uuid REFERENCES public.lotes_consignacao(id),
  peca_id character varying,
  descricao character varying,
  modelo character varying,
  quantidade integer DEFAULT 0,
  quantidade_original integer DEFAULT 0,
  valor_custo numeric DEFAULT 0,
  loja_atual_id character varying,
  status character varying DEFAULT 'Disponivel',
  os_vinculada character varying,
  data_consumo timestamp with time zone,
  tecnico_consumo character varying,
  devolvido_por character varying,
  data_devolucao timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.itens_consignacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_itens_consignacao" ON public.itens_consignacao FOR ALL USING (true) WITH CHECK (true);

-- 6. CORES DE APARELHO
CREATE TABLE public.cores_aparelho (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  nome character varying NOT NULL,
  hexadecimal character varying DEFAULT '#000000',
  status character varying DEFAULT 'Ativo',
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.cores_aparelho ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_cores_aparelho" ON public.cores_aparelho FOR ALL USING (true) WITH CHECK (true);

-- 7. PLANOS DE GARANTIA
CREATE TABLE public.planos_garantia (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  nome character varying NOT NULL,
  tipo character varying DEFAULT 'Thiago Imports',
  condicao character varying DEFAULT 'Ambos',
  meses integer DEFAULT 0,
  valor numeric DEFAULT 0,
  modelos jsonb DEFAULT '[]'::jsonb,
  descricao text,
  status character varying DEFAULT 'Ativo',
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.planos_garantia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_planos_garantia" ON public.planos_garantia FOR ALL USING (true) WITH CHECK (true);

-- 8. VALORES RECOMENDADOS DE TROCA
CREATE TABLE public.valores_recomendados_troca (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  modelo character varying NOT NULL,
  marca character varying DEFAULT 'Apple',
  condicao character varying DEFAULT 'Semi-novo',
  valor_sugerido numeric DEFAULT 0,
  ultima_atualizacao date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.valores_recomendados_troca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_valores_recomendados_troca" ON public.valores_recomendados_troca FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.logs_valor_troca (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  valor_id character varying,
  tipo character varying,
  modelo character varying,
  usuario character varying,
  data_hora timestamp with time zone DEFAULT now(),
  detalhes text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.logs_valor_troca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_logs_valor_troca" ON public.logs_valor_troca FOR ALL USING (true) WITH CHECK (true);

-- 9. LOTES DE REVISÃO
CREATE TABLE public.lotes_revisao (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  nota_entrada_id character varying,
  numero_nota character varying,
  fornecedor character varying,
  valor_original_nota numeric DEFAULT 0,
  status character varying DEFAULT 'Em Revisao',
  itens jsonb DEFAULT '[]'::jsonb,
  data_criacao timestamp with time zone DEFAULT now(),
  responsavel_criacao character varying,
  data_finalizacao timestamp with time zone,
  custo_total_reparos numeric DEFAULT 0,
  valor_liquido_sugerido numeric DEFAULT 0,
  os_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.lotes_revisao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_lotes_revisao" ON public.lotes_revisao FOR ALL USING (true) WITH CHECK (true);

-- 10. RETIRADAS DE PEÇAS
CREATE TABLE public.retiradas_pecas (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  aparelho_id character varying,
  imei_original character varying,
  modelo_original character varying,
  cor_original character varying,
  valor_custo_aparelho numeric DEFAULT 0,
  motivo text,
  responsavel_solicitacao character varying,
  data_solicitacao timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'Pendente Assistência',
  tecnico_responsavel character varying,
  data_inicio_desmonte timestamp with time zone,
  data_conclusao timestamp with time zone,
  pecas_retiradas jsonb DEFAULT '[]'::jsonb,
  timeline jsonb DEFAULT '[]'::jsonb,
  loja_id character varying,
  logs_auditoria jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.retiradas_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_retiradas_pecas" ON public.retiradas_pecas FOR ALL USING (true) WITH CHECK (true);

-- 11. PENDÊNCIAS FINANCEIRAS
CREATE TABLE public.pendencias_financeiras (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  nota_id character varying,
  fornecedor character varying,
  valor_total numeric DEFAULT 0,
  valor_conferido numeric DEFAULT 0,
  valor_pendente numeric DEFAULT 0,
  status_pagamento character varying DEFAULT 'Aguardando Conferência',
  status_conferencia character varying DEFAULT 'Em Conferência',
  aparelhos_total integer DEFAULT 0,
  aparelhos_conferidos integer DEFAULT 0,
  percentual_conferencia integer DEFAULT 0,
  data_criacao timestamp with time zone DEFAULT now(),
  data_vencimento date,
  data_conferencia_completa timestamp with time zone,
  data_pagamento timestamp with time zone,
  sla_alerta boolean DEFAULT false,
  dias_decorridos integer DEFAULT 0,
  sla_status character varying DEFAULT 'normal',
  discrepancia boolean DEFAULT false,
  motivo_discrepancia text,
  acao_recomendada character varying,
  timeline jsonb DEFAULT '[]'::jsonb,
  origem character varying DEFAULT 'Normal',
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.pendencias_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pendencias_financeiras" ON public.pendencias_financeiras FOR ALL USING (true) WITH CHECK (true);

-- 12. NOTAS DE ENTRADA (Fluxo completo)
CREATE TABLE public.notas_entrada (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  numero_nota character varying,
  data timestamp with time zone DEFAULT now(),
  fornecedor character varying,
  status character varying DEFAULT 'Criada',
  atuacao_atual character varying DEFAULT 'Estoque',
  tipo_pagamento character varying,
  tipo_pagamento_bloqueado boolean DEFAULT false,
  qtd_informada integer DEFAULT 0,
  qtd_cadastrada integer DEFAULT 0,
  qtd_conferida integer DEFAULT 0,
  valor_total numeric DEFAULT 0,
  valor_pago numeric DEFAULT 0,
  valor_pendente numeric DEFAULT 0,
  valor_conferido numeric DEFAULT 0,
  produtos jsonb DEFAULT '[]'::jsonb,
  timeline jsonb DEFAULT '[]'::jsonb,
  alertas jsonb DEFAULT '[]'::jsonb,
  pagamentos jsonb DEFAULT '[]'::jsonb,
  data_criacao timestamp with time zone DEFAULT now(),
  data_finalizacao timestamp with time zone,
  responsavel_criacao character varying,
  responsavel_finalizacao character varying,
  observacoes text,
  forma_pagamento character varying,
  pix_banco character varying,
  pix_recebedor character varying,
  pix_chave character varying,
  urgente boolean DEFAULT false,
  rejeitada boolean DEFAULT false,
  motivo_rejeicao text,
  lote_revisao_id character varying,
  valor_abatimento numeric DEFAULT 0,
  enviado_direto_financeiro boolean DEFAULT false,
  data_envio_direto_financeiro timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.notas_entrada ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_notas_entrada" ON public.notas_entrada FOR ALL USING (true) WITH CHECK (true);

-- 13. CRÉDITOS FORNECEDOR
CREATE TABLE public.creditos_fornecedor (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  fornecedor character varying,
  valor numeric DEFAULT 0,
  nota_id character varying,
  descricao text,
  data_criacao timestamp with time zone DEFAULT now(),
  utilizado boolean DEFAULT false,
  data_utilizacao timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.creditos_fornecedor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_creditos_fornecedor" ON public.creditos_fornecedor FOR ALL USING (true) WITH CHECK (true);

-- 14. FLUXO DE VENDAS (localStorage -> Supabase)
CREATE TABLE public.fluxo_vendas (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  venda_id character varying UNIQUE NOT NULL,
  status_fluxo character varying DEFAULT 'Aguardando Conferência',
  aprovacao_lancamento jsonb,
  recebimento_gestor jsonb,
  aprovacao_gestor jsonb,
  recusa_gestor jsonb,
  devolucao_financeiro jsonb,
  aprovacao_financeiro jsonb,
  pagamento_downgrade jsonb,
  timeline_fluxo jsonb DEFAULT '[]'::jsonb,
  bloqueado_para_edicao boolean DEFAULT false,
  tipo_operacao character varying,
  saldo_devolver numeric DEFAULT 0,
  chave_pix character varying,
  conta_origem_downgrade character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.fluxo_vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_fluxo_vendas" ON public.fluxo_vendas FOR ALL USING (true) WITH CHECK (true);

-- 15. ATIVIDADES DOS GESTORES
CREATE TABLE public.atividades_gestores (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  nome character varying NOT NULL,
  tipo_horario character varying DEFAULT 'aberto',
  horario_previsto character varying,
  pontuacao_base integer DEFAULT 1,
  lojas_atribuidas jsonb DEFAULT '"todas"'::jsonb,
  ativa boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.atividades_gestores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_atividades_gestores" ON public.atividades_gestores FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.execucoes_atividades (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  atividade_id character varying NOT NULL,
  atividade_nome character varying,
  data date NOT NULL,
  loja_id character varying,
  gestor_id character varying,
  gestor_nome character varying,
  executado boolean DEFAULT false,
  horario_executado timestamp with time zone,
  pontuacao numeric DEFAULT 0,
  status character varying DEFAULT 'pendente',
  tipo_horario character varying DEFAULT 'aberto',
  horario_previsto character varying,
  colaborador_designado_id character varying,
  colaborador_designado_nome character varying,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.execucoes_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_execucoes_atividades" ON public.execucoes_atividades FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.logs_atividades (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  modulo character varying,
  atividade_id character varying,
  atividade_nome character varying,
  data date,
  gestor_id character varying,
  gestor_nome character varying,
  acao character varying,
  pontuacao numeric DEFAULT 0,
  data_hora timestamp with time zone DEFAULT now(),
  detalhes text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.logs_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_logs_atividades" ON public.logs_atividades FOR ALL USING (true) WITH CHECK (true);

-- 16. ANOTAÇÕES GESTÃO (agendaGestaoApi)
CREATE TABLE public.anotacoes_gestao (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  chave_contexto character varying NOT NULL,
  data_hora timestamp with time zone DEFAULT now(),
  usuario character varying,
  observacao text,
  importante boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.anotacoes_gestao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_anotacoes_gestao" ON public.anotacoes_gestao FOR ALL USING (true) WITH CHECK (true);

-- 17. CONFERÊNCIAS GESTÃO (gestaoAdministrativaApi)
CREATE TABLE public.conferencias_gestao (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  competencia character varying NOT NULL,
  data date NOT NULL,
  loja_id character varying NOT NULL,
  totais_por_metodo jsonb DEFAULT '{}'::jsonb,
  ajustes jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.conferencias_gestao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_conferencias_gestao" ON public.conferencias_gestao FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.logs_conferencia_gestao (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  conferencia_id character varying,
  data date,
  loja_id character varying,
  acao character varying,
  metodo_pagamento character varying,
  usuario_id character varying,
  usuario_nome character varying,
  data_hora timestamp with time zone DEFAULT now(),
  detalhes text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.logs_conferencia_gestao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_logs_conferencia_gestao" ON public.logs_conferencia_gestao FOR ALL USING (true) WITH CHECK (true);

-- 18. CONTATOS ATIVOS GARANTIA (garantiasApi - Categoria C)
CREATE TABLE public.contatos_ativos_garantia (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  garantia_id character varying,
  data_lancamento timestamp with time zone DEFAULT now(),
  cliente jsonb DEFAULT '{}'::jsonb,
  aparelho jsonb DEFAULT '{}'::jsonb,
  logistica jsonb DEFAULT '{}'::jsonb,
  garantia_estendida jsonb,
  status character varying DEFAULT 'Pendente',
  timeline jsonb DEFAULT '[]'::jsonb,
  auto_gerado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.contatos_ativos_garantia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_contatos_ativos_garantia" ON public.contatos_ativos_garantia FOR ALL USING (true) WITH CHECK (true);

-- 19. REGISTROS ANÁLISE GARANTIA (garantiasApi - Categoria C)
CREATE TABLE public.registros_analise_garantia (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  origem character varying,
  origem_id character varying,
  cliente_descricao text,
  data_chegada timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'Pendente',
  tecnico_id character varying,
  tecnico_nome character varying,
  data_aprovacao timestamp with time zone,
  usuario_aprovacao character varying,
  observacao text,
  motivo_recusa text,
  data_recusa timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.registros_analise_garantia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_registros_analise_garantia" ON public.registros_analise_garantia FOR ALL USING (true) WITH CHECK (true);

-- 20. MOVIMENTAÇÕES ENTRE CONTAS (movimentacoesEntreContasApi)
CREATE TABLE public.movimentacoes_entre_contas (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  transacao_id character varying,
  conta_origem_id character varying,
  conta_destino_id character varying,
  valor numeric DEFAULT 0,
  data_hora timestamp with time zone DEFAULT now(),
  observacao text,
  usuario_id character varying,
  usuario_nome character varying,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.movimentacoes_entre_contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_movimentacoes_entre_contas" ON public.movimentacoes_entre_contas FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.logs_movimentacoes_contas (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  movimentacao_id character varying,
  transacao_id character varying,
  data_hora timestamp with time zone DEFAULT now(),
  usuario_id character varying,
  usuario_nome character varying,
  conta_origem_id character varying,
  conta_destino_id character varying,
  valor numeric DEFAULT 0,
  observacao text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.logs_movimentacoes_contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_logs_movimentacoes_contas" ON public.logs_movimentacoes_contas FOR ALL USING (true) WITH CHECK (true);
