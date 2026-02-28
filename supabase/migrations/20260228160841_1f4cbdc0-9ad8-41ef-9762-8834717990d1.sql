
-- =============================================
-- LOTE 3: Criar tabelas novas
-- =============================================

-- 3.1 - Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  nome varchar NOT NULL,
  cpf varchar,
  telefone varchar,
  data_nascimento date,
  email varchar,
  cep varchar,
  endereco text,
  numero varchar,
  bairro varchar,
  cidade varchar,
  estado varchar(2),
  status varchar DEFAULT 'Ativo',
  origem_cliente varchar,
  ids_compras jsonb DEFAULT '[]'::jsonb,
  tipo_cliente varchar DEFAULT 'Pessoa Física',
  tipo_pessoa varchar DEFAULT 'PF',
  created_at timestamptz DEFAULT now()
);

-- 3.2 - Fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  nome varchar NOT NULL,
  cnpj varchar,
  endereco text,
  responsavel varchar,
  telefone varchar,
  status varchar DEFAULT 'Ativo',
  ultima_compra timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 3.3 - Contas Financeiras
CREATE TABLE IF NOT EXISTS public.contas_financeiras (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  nome varchar NOT NULL,
  tipo varchar,
  loja_vinculada varchar,
  banco varchar,
  agencia varchar,
  conta varchar,
  cnpj varchar,
  saldo_inicial numeric DEFAULT 0,
  saldo_atual numeric DEFAULT 0,
  status varchar DEFAULT 'Ativa',
  ultimo_movimento timestamptz,
  status_maquina varchar,
  nota_fiscal boolean DEFAULT false,
  habilitada boolean DEFAULT true,
  historico_alteracoes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3.4 - Máquinas de Cartão
CREATE TABLE IF NOT EXISTS public.maquinas_cartao (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  nome varchar NOT NULL,
  cnpj_vinculado varchar,
  conta_origem varchar,
  status varchar DEFAULT 'Ativa',
  percentual_maquina numeric DEFAULT 0,
  taxas jsonb DEFAULT '{}'::jsonb,
  parcelamentos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3.5 - Peças
CREATE TABLE IF NOT EXISTS public.pecas (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  descricao varchar NOT NULL,
  loja_id uuid REFERENCES public.lojas(id),
  modelo varchar,
  valor_custo numeric DEFAULT 0,
  valor_recomendado numeric DEFAULT 0,
  quantidade integer DEFAULT 1,
  data_entrada date DEFAULT CURRENT_DATE,
  origem varchar,
  nota_compra_id uuid,
  lote_consignacao_id uuid,
  status varchar DEFAULT 'Disponível',
  status_movimentacao varchar,
  movimentacao_peca_id uuid,
  fornecedor_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 3.6 - Notas de Compra
CREATE TABLE IF NOT EXISTS public.notas_compra (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  data timestamptz DEFAULT now(),
  numero_nota varchar,
  fornecedor varchar,
  valor_total numeric DEFAULT 0,
  status varchar DEFAULT 'Pendente',
  origem varchar,
  status_urgencia varchar,
  produtos jsonb DEFAULT '[]'::jsonb,
  pagamento jsonb DEFAULT '{}'::jsonb,
  timeline jsonb DEFAULT '[]'::jsonb,
  dados_extras jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3.7 - Despesas
CREATE TABLE IF NOT EXISTS public.despesas (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tipo varchar,
  data date DEFAULT CURRENT_DATE,
  descricao text,
  valor numeric DEFAULT 0,
  competencia varchar,
  conta varchar,
  observacoes text,
  loja_id uuid REFERENCES public.lojas(id),
  status varchar DEFAULT 'Pendente',
  categoria varchar,
  data_vencimento date,
  data_pagamento date,
  recorrente boolean DEFAULT false,
  periodicidade varchar,
  pago_por varchar,
  comprovante text,
  documento text,
  created_at timestamptz DEFAULT now()
);

-- 3.8 - Pagamentos Financeiros
CREATE TABLE IF NOT EXISTS public.pagamentos_financeiros (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  data timestamptz DEFAULT now(),
  descricao text,
  valor numeric DEFAULT 0,
  meio_pagamento varchar,
  conta varchar,
  loja varchar,
  status varchar DEFAULT 'Pago',
  created_at timestamptz DEFAULT now()
);

-- 3.9 - Metas por Loja
CREATE TABLE IF NOT EXISTS public.metas_lojas (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  loja_id uuid REFERENCES public.lojas(id),
  mes integer,
  ano integer,
  meta_faturamento numeric DEFAULT 0,
  meta_acessorios numeric DEFAULT 0,
  meta_garantia numeric DEFAULT 0,
  meta_assistencia numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  ultima_atualizacao timestamptz DEFAULT now()
);

-- 3.10 - Movimentações de Peças
CREATE TABLE IF NOT EXISTS public.movimentacoes_pecas (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  peca_id uuid REFERENCES public.pecas(id),
  tipo varchar,
  quantidade integer DEFAULT 1,
  data timestamptz DEFAULT now(),
  os_id uuid REFERENCES public.ordens_servico(id),
  descricao text,
  created_at timestamptz DEFAULT now()
);

-- 3.11 - Acessórios
CREATE TABLE IF NOT EXISTS public.acessorios (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  nome varchar NOT NULL,
  categoria varchar,
  marca varchar,
  valor_custo numeric DEFAULT 0,
  valor_venda numeric DEFAULT 0,
  quantidade integer DEFAULT 0,
  loja_id uuid REFERENCES public.lojas(id),
  status varchar DEFAULT 'Disponível',
  created_at timestamptz DEFAULT now()
);
