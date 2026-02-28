
-- =============================================
-- LOTE 2: Expandir vendas, ordens_servico, garantias + tabelas auxiliares
-- =============================================

-- 2.1 - Alterar tabela vendas
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS numero integer,
  ADD COLUMN IF NOT EXISTS hora_venda varchar,
  ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.colaboradores(id),
  ADD COLUMN IF NOT EXISTS cliente_id varchar,
  ADD COLUMN IF NOT EXISTS cliente_cpf varchar,
  ADD COLUMN IF NOT EXISTS cliente_telefone varchar,
  ADD COLUMN IF NOT EXISTS cliente_email varchar,
  ADD COLUMN IF NOT EXISTS cliente_cidade varchar,
  ADD COLUMN IF NOT EXISTS origem_venda varchar,
  ADD COLUMN IF NOT EXISTS local_retirada varchar,
  ADD COLUMN IF NOT EXISTS tipo_retirada varchar,
  ADD COLUMN IF NOT EXISTS taxa_entrega numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motoboy_id uuid,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_trade_in numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lucro numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margem numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
  ADD COLUMN IF NOT EXISTS comissao_vendedor numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_atual varchar DEFAULT 'Finalizada',
  ADD COLUMN IF NOT EXISTS bloqueado_para_edicao boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_sinal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_pendente_sinal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_sinal timestamptz,
  ADD COLUMN IF NOT EXISTS observacao_sinal text,
  ADD COLUMN IF NOT EXISTS garantia_extendida jsonb,
  ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline_edicoes jsonb DEFAULT '[]'::jsonb;

-- 2.2 - Criar tabela venda_itens
CREATE TABLE IF NOT EXISTS public.venda_itens (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  venda_id uuid REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id),
  produto_nome varchar,
  imei varchar,
  categoria varchar,
  quantidade integer DEFAULT 1,
  valor_recomendado numeric DEFAULT 0,
  valor_venda numeric DEFAULT 0,
  valor_custo numeric DEFAULT 0,
  loja_id uuid REFERENCES public.lojas(id),
  created_at timestamptz DEFAULT now()
);

-- 2.3 - Criar tabela venda_trade_ins
CREATE TABLE IF NOT EXISTS public.venda_trade_ins (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  venda_id uuid REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id),
  modelo varchar,
  descricao text,
  imei varchar,
  valor_compra_usado numeric DEFAULT 0,
  imei_validado boolean DEFAULT false,
  condicao varchar,
  tipo_entrega varchar,
  data_registro timestamptz DEFAULT now(),
  anexos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2.4 - Criar tabela venda_pagamentos
CREATE TABLE IF NOT EXISTS public.venda_pagamentos (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  venda_id uuid REFERENCES public.vendas(id) ON DELETE CASCADE,
  meio_pagamento varchar,
  valor numeric DEFAULT 0,
  conta_destino varchar,
  parcelas integer DEFAULT 1,
  valor_parcela numeric DEFAULT 0,
  descricao text,
  is_fiado boolean DEFAULT false,
  fiado_data_base date,
  fiado_numero_parcelas integer,
  fiado_tipo_recorrencia varchar,
  fiado_intervalo_dias integer,
  taxa_cartao numeric DEFAULT 0,
  valor_com_taxa numeric DEFAULT 0,
  maquina_id varchar,
  comprovante text,
  comprovante_nome varchar,
  created_at timestamptz DEFAULT now()
);

-- 2.5 - Alterar tabela ordens_servico
ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS setor varchar,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS valor_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS origem_os varchar,
  ADD COLUMN IF NOT EXISTS venda_id uuid REFERENCES public.vendas(id),
  ADD COLUMN IF NOT EXISTS garantia_id uuid REFERENCES public.garantias(id),
  ADD COLUMN IF NOT EXISTS produto_id uuid REFERENCES public.produtos(id),
  ADD COLUMN IF NOT EXISTS valor_produto_origem numeric,
  ADD COLUMN IF NOT EXISTS modelo_aparelho varchar,
  ADD COLUMN IF NOT EXISTS imei_aparelho varchar,
  ADD COLUMN IF NOT EXISTS proxima_atuacao varchar,
  ADD COLUMN IF NOT EXISTS valor_custo_tecnico numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_venda_tecnico numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_servico numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fotos_entrada jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resumo_conclusao text,
  ADD COLUMN IF NOT EXISTS observacao_origem text,
  ADD COLUMN IF NOT EXISTS recusada_tecnico boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_recusa_tecnico text,
  ADD COLUMN IF NOT EXISTS conclusao_servico text,
  ADD COLUMN IF NOT EXISTS cronometro jsonb,
  ADD COLUMN IF NOT EXISTS evidencias jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT '[]'::jsonb;

-- 2.6 - Criar tabela os_pecas
CREATE TABLE IF NOT EXISTS public.os_pecas (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  os_id uuid REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  peca varchar,
  peca_estoque_id uuid,
  imei varchar,
  valor numeric DEFAULT 0,
  percentual numeric DEFAULT 0,
  valor_total numeric DEFAULT 0,
  servico_terceirizado boolean DEFAULT false,
  descricao_terceirizado text,
  fornecedor_id uuid,
  unidade_servico varchar,
  peca_no_estoque boolean DEFAULT false,
  peca_de_fornecedor boolean DEFAULT false,
  status_aprovacao varchar DEFAULT 'Pendente',
  motivo_rejeicao text,
  conta_origem_pagamento varchar,
  data_pagamento date,
  data_recebimento date,
  origem_servico varchar,
  origem_peca varchar,
  valor_custo_real numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2.7 - Criar tabela os_pagamentos
CREATE TABLE IF NOT EXISTS public.os_pagamentos (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  os_id uuid REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  meio varchar,
  valor numeric DEFAULT 0,
  parcelas integer DEFAULT 1,
  comprovante text,
  comprovante_nome varchar,
  conta_destino varchar,
  created_at timestamptz DEFAULT now()
);

-- 2.8 - Alterar tabela garantias
ALTER TABLE public.garantias
  ADD COLUMN IF NOT EXISTS venda_id_ref uuid REFERENCES public.vendas(id),
  ADD COLUMN IF NOT EXISTS item_venda_id uuid,
  ADD COLUMN IF NOT EXISTS tipo_garantia varchar,
  ADD COLUMN IF NOT EXISTS meses_garantia integer,
  ADD COLUMN IF NOT EXISTS loja_venda varchar,
  ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.colaboradores(id),
  ADD COLUMN IF NOT EXISTS cliente_id varchar,
  ADD COLUMN IF NOT EXISTS cliente_nome varchar,
  ADD COLUMN IF NOT EXISTS cliente_telefone varchar,
  ADD COLUMN IF NOT EXISTS cliente_email varchar,
  ADD COLUMN IF NOT EXISTS tratativas jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline_garantia jsonb DEFAULT '[]'::jsonb;
