
-- =============================================
-- CORREÇÃO 1: Sequence atômica para número de venda
-- =============================================

-- Descobrir o maior numero atual
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) INTO max_num FROM public.vendas;
  -- Criar sequence começando do próximo número
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.vendas_numero_seq START WITH %s INCREMENT BY 1 NO CYCLE', max_num + 1);
  -- Setar o DEFAULT na coluna numero
  ALTER TABLE public.vendas ALTER COLUMN numero SET DEFAULT nextval('public.vendas_numero_seq');
END $$;

-- =============================================
-- CORREÇÃO 3: RLS vendas_insert com filtro de loja
-- =============================================

-- Dropar a política atual de INSERT em vendas e recriar com filtro de loja
DROP POLICY IF EXISTS "vendas_insert" ON public.vendas;

CREATE POLICY "vendas_insert" ON public.vendas
FOR INSERT TO authenticated
WITH CHECK (
  is_acesso_geral(auth.uid())
  OR (has_role(auth.uid(), 'gestor') AND loja_id = get_user_loja_id(auth.uid()))
  OR (has_role(auth.uid(), 'vendedor') AND loja_id = get_user_loja_id(auth.uid()))
  OR has_role(auth.uid(), 'admin')
);

-- =============================================
-- CORREÇÃO 5: Campo idempotency_key para evitar duplicatas em retry
-- =============================================

ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;

-- =============================================
-- CORREÇÃO 2 (suporte): Função RPC para decremento atômico de estoque
-- =============================================

CREATE OR REPLACE FUNCTION public.decrementar_estoque_produto(p_produto_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE public.produtos
  SET quantidade = quantidade - 1,
      status_nota = 'Concluído'
  WHERE id = p_produto_id AND quantidade >= 1;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;
