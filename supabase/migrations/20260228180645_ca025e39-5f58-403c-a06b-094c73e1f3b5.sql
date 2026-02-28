
-- =============================================
-- LOTE 5B: Tabelas de RH e Módulos Secundários
-- =============================================

-- 1. Vales
CREATE TABLE public.vales (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  data_lancamento timestamp with time zone NOT NULL DEFAULT now(),
  lancado_por uuid NULL,
  lancado_por_nome varchar NULL,
  loja_id uuid NULL,
  colaborador_id uuid NULL,
  observacao text NULL,
  valor_final numeric NOT NULL DEFAULT 0,
  quantidade_vezes integer NOT NULL DEFAULT 1,
  inicio_competencia varchar NULL,
  historico jsonb NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.vales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_vales" ON public.vales FOR ALL USING (true) WITH CHECK (true);

-- 2. Adiantamentos
CREATE TABLE public.adiantamentos (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  data_lancamento timestamp with time zone NOT NULL DEFAULT now(),
  lancado_por uuid NULL,
  lancado_por_nome varchar NULL,
  loja_id uuid NULL,
  colaborador_id uuid NULL,
  observacao text NULL,
  valor_final numeric NOT NULL DEFAULT 0,
  quantidade_vezes integer NOT NULL DEFAULT 1,
  inicio_competencia varchar NULL,
  conta_saida_id varchar NULL,
  historico jsonb NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.adiantamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_adiantamentos" ON public.adiantamentos FOR ALL USING (true) WITH CHECK (true);

-- 3. Feedbacks (Advertências/Suspensões)
CREATE TABLE public.feedbacks (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  colaborador_id uuid NULL,
  tipo varchar NULL,
  texto text NULL,
  gestor_id uuid NULL,
  gestor_nome varchar NULL,
  data_hora timestamp with time zone NOT NULL DEFAULT now(),
  referencia_anterior varchar NULL,
  arquivo jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_feedbacks" ON public.feedbacks FOR ALL USING (true) WITH CHECK (true);

-- 4. Salários Colaboradores
CREATE TABLE public.salarios_colaboradores (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  colaborador_id uuid NOT NULL,
  salario_fixo numeric NULL DEFAULT 0,
  ajuda_custo numeric NULL DEFAULT 0,
  percentual_comissao numeric NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.salarios_colaboradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_salarios_colaboradores" ON public.salarios_colaboradores FOR ALL USING (true) WITH CHECK (true);

-- 5. Histórico Salários
CREATE TABLE public.historico_salarios (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  salario_id uuid NULL,
  colaborador_id uuid NULL,
  usuario_id varchar NULL,
  usuario_nome varchar NULL,
  campo_alterado varchar NULL,
  valor_anterior varchar NULL,
  valor_novo varchar NULL,
  tipo_acao varchar NULL,
  created_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.historico_salarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_historico_salarios" ON public.historico_salarios FOR ALL USING (true) WITH CHECK (true);

-- 6. Comissão por Loja
CREATE TABLE public.comissao_por_loja (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  loja_id uuid NULL,
  cargo_id varchar NULL,
  percentual_comissao numeric NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.comissao_por_loja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_comissao_por_loja" ON public.comissao_por_loja FOR ALL USING (true) WITH CHECK (true);

-- 7. Histórico Comissão por Loja
CREATE TABLE public.historico_comissao_por_loja (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  comissao_id uuid NULL,
  usuario_id varchar NULL,
  usuario_nome varchar NULL,
  percentual_anterior numeric NULL,
  percentual_novo numeric NULL DEFAULT 0,
  tipo_acao varchar NULL,
  created_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.historico_comissao_por_loja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_historico_comissao_por_loja" ON public.historico_comissao_por_loja FOR ALL USING (true) WITH CHECK (true);

-- 8. Histórico Comissões (comissoesApi)
CREATE TABLE public.comissoes_historico (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  colaborador_id uuid NULL,
  data_alteracao timestamp with time zone NULL DEFAULT now(),
  usuario_alterou varchar NULL,
  fixo_anterior numeric NULL DEFAULT 0,
  fixo_novo numeric NULL DEFAULT 0,
  comissao_anterior numeric NULL DEFAULT 0,
  comissao_nova numeric NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.comissoes_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_comissoes_historico" ON public.comissoes_historico FOR ALL USING (true) WITH CHECK (true);

-- 9. Demandas Motoboy
CREATE TABLE public.demandas_motoboy (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  motoboy_id uuid NULL,
  motoboy_nome varchar NULL,
  data date NULL DEFAULT CURRENT_DATE,
  tipo varchar NULL,
  descricao text NULL,
  loja_origem varchar NULL,
  loja_destino varchar NULL,
  status varchar NULL DEFAULT 'Pendente',
  valor_demanda numeric NULL DEFAULT 0,
  venda_id varchar NULL,
  created_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.demandas_motoboy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_demandas_motoboy" ON public.demandas_motoboy FOR ALL USING (true) WITH CHECK (true);

-- 10. Remunerações Motoboy
CREATE TABLE public.remuneracoes_motoboy (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  motoboy_id uuid NULL,
  motoboy_nome varchar NULL,
  competencia varchar NULL,
  periodo_inicio date NULL,
  periodo_fim date NULL,
  qtd_demandas integer NULL DEFAULT 0,
  valor_total numeric NULL DEFAULT 0,
  status varchar NULL DEFAULT 'Pendente',
  data_pagamento date NULL,
  conta_id varchar NULL,
  conta_nome varchar NULL,
  comprovante text NULL,
  comprovante_nome varchar NULL,
  pago_por varchar NULL,
  observacoes_pagamento text NULL,
  created_at timestamp with time zone NULL DEFAULT now()
);
ALTER TABLE public.remuneracoes_motoboy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_remuneracoes_motoboy" ON public.remuneracoes_motoboy FOR ALL USING (true) WITH CHECK (true);
