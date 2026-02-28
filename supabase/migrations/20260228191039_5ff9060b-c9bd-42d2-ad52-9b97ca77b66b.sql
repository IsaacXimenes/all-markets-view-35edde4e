
-- Tabela: taxas_entrega
CREATE TABLE public.taxas_entrega (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  local VARCHAR NOT NULL,
  valor NUMERIC DEFAULT 0,
  status VARCHAR DEFAULT 'Ativo',
  data_criacao TIMESTAMPTZ DEFAULT now(),
  data_atualizacao TIMESTAMPTZ DEFAULT now(),
  logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.taxas_entrega ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.taxas_entrega FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tabela: base_trocas_pendentes
CREATE TABLE public.base_trocas_pendentes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  venda_id VARCHAR,
  cliente_id VARCHAR,
  cliente_nome VARCHAR,
  trade_in JSONB DEFAULT '{}'::jsonb,
  data_venda TIMESTAMPTZ,
  loja_venda VARCHAR,
  vendedor_id VARCHAR,
  vendedor_nome VARCHAR,
  status VARCHAR DEFAULT 'Aguardando Devolução',
  termo_responsabilidade JSONB,
  fotos_aparelho JSONB DEFAULT '[]'::jsonb,
  fotos_recebimento JSONB DEFAULT '[]'::jsonb,
  data_recebimento TIMESTAMPTZ,
  responsavel_recebimento_id VARCHAR,
  responsavel_recebimento_nome VARCHAR,
  observacoes_recebimento TEXT,
  sla_congelado VARCHAR,
  sla_faixa_congelada VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.base_trocas_pendentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.base_trocas_pendentes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
