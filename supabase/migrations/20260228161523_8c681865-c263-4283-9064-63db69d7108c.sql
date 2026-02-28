
-- Adicionar colunas faltantes para compatibilidade com LojaMockada e ColaboradorMockado

-- Lojas: falta email
ALTER TABLE public.lojas
  ADD COLUMN IF NOT EXISTS email varchar;

-- Colaboradores: faltam campos do ColaboradorMockado
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS salario_fixo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ajuda_custo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comissao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eh_gestor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS eh_vendedor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS eh_estoquista boolean DEFAULT false;
