
-- 1. conferencias_gestor
CREATE TABLE public.conferencias_gestor (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  venda_id VARCHAR NOT NULL,
  data_registro TIMESTAMPTZ,
  loja_id VARCHAR,
  loja_nome VARCHAR,
  vendedor_id VARCHAR,
  vendedor_nome VARCHAR,
  cliente_nome VARCHAR,
  valor_total NUMERIC DEFAULT 0,
  tipo_venda VARCHAR,
  status VARCHAR DEFAULT 'Conferencia - Gestor',
  sla_dias INTEGER DEFAULT 0,
  timeline JSONB DEFAULT '[]',
  gestor_conferencia VARCHAR,
  gestor_nome VARCHAR,
  observacao_gestor TEXT,
  data_conferencia TIMESTAMPTZ,
  financeiro_resp VARCHAR,
  financeiro_nome VARCHAR,
  data_finalizacao TIMESTAMPTZ,
  conta_destino VARCHAR,
  dados_venda JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conferencias_gestor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.conferencias_gestor FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 2. solicitacoes_pecas
CREATE TABLE public.solicitacoes_pecas (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  os_id VARCHAR,
  peca VARCHAR,
  quantidade INTEGER DEFAULT 1,
  justificativa TEXT,
  modelo_imei VARCHAR,
  loja_solicitante VARCHAR,
  data_solicitacao TIMESTAMPTZ DEFAULT now(),
  status VARCHAR DEFAULT 'Pendente',
  fornecedor_id VARCHAR,
  valor_peca NUMERIC DEFAULT 0,
  responsavel_compra VARCHAR,
  data_recebimento DATE,
  data_envio DATE,
  motivo_rejeicao TEXT,
  conta_origem_pag VARCHAR,
  data_pagamento DATE,
  forma_pagamento VARCHAR,
  origem_peca VARCHAR,
  observacao TEXT,
  banco_destinatario VARCHAR,
  chave_pix VARCHAR,
  os_cancelada BOOLEAN DEFAULT false,
  motivo_tratamento TEXT,
  tratada_por VARCHAR,
  origem_entrada VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.solicitacoes_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.solicitacoes_pecas FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 3. notas_assistencia
CREATE TABLE public.notas_assistencia (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  solicitacao_id VARCHAR,
  solicitacao_ids JSONB DEFAULT '[]',
  lote_id VARCHAR,
  fornecedor VARCHAR,
  loja_solicitante VARCHAR,
  os_id VARCHAR,
  data_criacao TIMESTAMPTZ DEFAULT now(),
  valor_total NUMERIC DEFAULT 0,
  status VARCHAR DEFAULT 'Pendente',
  itens JSONB DEFAULT '[]',
  resp_financeiro VARCHAR,
  forma_pagamento VARCHAR,
  conta_pagamento VARCHAR,
  data_conferencia DATE,
  forma_pag_enc VARCHAR,
  conta_bancaria_enc VARCHAR,
  nome_recebedor VARCHAR,
  chave_pix_enc VARCHAR,
  observacao_enc TEXT,
  tipo_consignacao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notas_assistencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.notas_assistencia FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 4. lotes_pagamento_pecas
CREATE TABLE public.lotes_pagamento_pecas (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  fornecedor_id VARCHAR,
  solicitacao_ids JSONB DEFAULT '[]',
  valor_total NUMERIC DEFAULT 0,
  data_criacao TIMESTAMPTZ DEFAULT now(),
  status VARCHAR DEFAULT 'Pendente',
  resp_financeiro VARCHAR,
  forma_pagamento VARCHAR,
  conta_pagamento VARCHAR,
  data_conferencia DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.lotes_pagamento_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.lotes_pagamento_pecas FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 5. produtos_pendentes_os
CREATE TABLE public.produtos_pendentes_os (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  imei VARCHAR,
  imagem TEXT,
  marca VARCHAR,
  modelo VARCHAR,
  cor VARCHAR,
  tipo VARCHAR,
  condicao VARCHAR,
  origem_entrada VARCHAR,
  nota_ou_venda_id VARCHAR,
  valor_custo NUMERIC DEFAULT 0,
  valor_custo_original NUMERIC DEFAULT 0,
  valor_origem NUMERIC DEFAULT 0,
  saude_bateria INTEGER DEFAULT 100,
  loja VARCHAR,
  data_entrada DATE,
  fornecedor VARCHAR,
  parecer_estoque JSONB,
  parecer_assistencia JSONB,
  timeline JSONB DEFAULT '[]',
  custo_assistencia NUMERIC DEFAULT 0,
  status_geral VARCHAR DEFAULT 'Pendente Estoque',
  contador_encaminhamentos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.produtos_pendentes_os ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.produtos_pendentes_os FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
