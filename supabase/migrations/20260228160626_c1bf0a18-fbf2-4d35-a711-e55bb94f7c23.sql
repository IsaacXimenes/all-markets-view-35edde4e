
-- =============================================
-- LOTE 1: Expandir lojas, colaboradores, produtos
-- =============================================

-- 1.1 - Alterar tabela lojas
ALTER TABLE public.lojas
  ADD COLUMN IF NOT EXISTS cnpj varchar,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS telefone varchar,
  ADD COLUMN IF NOT EXISTS cep varchar,
  ADD COLUMN IF NOT EXISTS cidade varchar,
  ADD COLUMN IF NOT EXISTS estado varchar(2),
  ADD COLUMN IF NOT EXISTS responsavel varchar,
  ADD COLUMN IF NOT EXISTS horario_funcionamento varchar,
  ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'Ativo',
  ADD COLUMN IF NOT EXISTS ativa boolean DEFAULT true;

-- 1.2 - Alterar tabela colaboradores
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS cpf varchar,
  ADD COLUMN IF NOT EXISTS email varchar,
  ADD COLUMN IF NOT EXISTS telefone varchar,
  ADD COLUMN IF NOT EXISTS data_admissao date,
  ADD COLUMN IF NOT EXISTS data_inativacao date,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS modelo_pagamento varchar,
  ADD COLUMN IF NOT EXISTS salario numeric,
  ADD COLUMN IF NOT EXISTS foto text,
  ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'Ativo';

-- 1.3 - Alterar tabela produtos
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS quantidade integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS condicao varchar,
  ADD COLUMN IF NOT EXISTS pareceres text,
  ADD COLUMN IF NOT EXISTS origem_entrada varchar,
  ADD COLUMN IF NOT EXISTS status_nota varchar,
  ADD COLUMN IF NOT EXISTS estoque_conferido boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assistencia_conferida boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS venda_recomendada numeric,
  ADD COLUMN IF NOT EXISTS historico_custo jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS historico_valor_recomendado jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custo_assistencia numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_movimentacao varchar,
  ADD COLUMN IF NOT EXISTS movimentacao_id uuid,
  ADD COLUMN IF NOT EXISTS status_retirada_pecas varchar,
  ADD COLUMN IF NOT EXISTS retirada_pecas_id uuid,
  ADD COLUMN IF NOT EXISTS loja_atual_id uuid REFERENCES public.lojas(id),
  ADD COLUMN IF NOT EXISTS bloqueado_em_venda_id uuid,
  ADD COLUMN IF NOT EXISTS status_emprestimo varchar,
  ADD COLUMN IF NOT EXISTS emprestimo_garantia_id uuid,
  ADD COLUMN IF NOT EXISTS emprestimo_cliente_id varchar,
  ADD COLUMN IF NOT EXISTS emprestimo_cliente_nome varchar,
  ADD COLUMN IF NOT EXISTS emprestimo_os_id uuid,
  ADD COLUMN IF NOT EXISTS emprestimo_data_hora timestamptz,
  ADD COLUMN IF NOT EXISTS bloqueado_em_troca_garantia_id uuid,
  ADD COLUMN IF NOT EXISTS status_revisao_tecnica varchar,
  ADD COLUMN IF NOT EXISTS lote_revisao_id uuid,
  ADD COLUMN IF NOT EXISTS tag_retorno_assistencia varchar,
  ADD COLUMN IF NOT EXISTS imagem text;
