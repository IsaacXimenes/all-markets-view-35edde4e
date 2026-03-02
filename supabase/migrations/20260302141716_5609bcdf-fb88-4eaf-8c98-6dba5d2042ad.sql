
-- =====================================================
-- 1. RPC consumir_peca_os — Baixa Atômica de Peças
-- =====================================================
CREATE OR REPLACE FUNCTION public.consumir_peca_os(
  p_peca_id UUID,
  p_quantidade INTEGER,
  p_os_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected INTEGER;
  v_descricao TEXT;
BEGIN
  -- Decrementa atomicamente apenas se quantidade suficiente e peça disponível
  UPDATE public.pecas
  SET quantidade = quantidade - p_quantidade,
      status = CASE WHEN quantidade - p_quantidade = 0 THEN 'Utilizada' ELSE status END
  WHERE id = p_peca_id
    AND quantidade >= p_quantidade
    AND status = 'Disponível';

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected > 0 THEN
    -- Buscar descrição da peça para o registro
    SELECT descricao INTO v_descricao FROM public.pecas WHERE id = p_peca_id;

    -- Registrar movimentação de saída
    INSERT INTO public.movimentacoes_pecas (peca_id, tipo, quantidade, data, os_id, descricao)
    VALUES (p_peca_id, 'Saída', p_quantidade, now()::text, p_os_id, 
            'Baixa atômica para OS' || COALESCE(' ' || p_os_id::text, '') || ' - ' || COALESCE(v_descricao, ''));
  END IF;

  RETURN rows_affected > 0;
END;
$$;

-- =====================================================
-- 2. RPC transferir_estoque — Movimentação Atômica
-- =====================================================
CREATE OR REPLACE FUNCTION public.transferir_estoque(
  p_produto_id UUID,
  p_loja_origem UUID,
  p_loja_destino UUID,
  p_responsavel_id UUID,
  p_motivo TEXT DEFAULT 'Movimentação entre lojas'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mov_id UUID;
  rows_affected INTEGER;
BEGIN
  -- 1. Marcar produto como em movimentação (atomicamente)
  UPDATE public.produtos
  SET status_movimentacao = 'Em movimentação',
      loja_atual_id = p_loja_destino
  WHERE id = p_produto_id
    AND (status_movimentacao IS NULL OR status_movimentacao != 'Em movimentação');

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected = 0 THEN
    RAISE EXCEPTION 'Produto já está em movimentação ou não encontrado';
  END IF;

  -- 2. Inserir registro de movimentação
  INSERT INTO public.movimentacoes_estoque (
    produto_id, loja_origem_id, loja_destino_id, responsavel_id, motivo, tipo_movimentacao
  ) VALUES (
    p_produto_id, p_loja_origem, p_loja_destino, p_responsavel_id, p_motivo, 'Pendente'
  ) RETURNING id INTO v_mov_id;

  -- 3. Vincular movimentação ao produto
  UPDATE public.produtos SET movimentacao_id = v_mov_id WHERE id = p_produto_id;

  RETURN v_mov_id;
END;
$$;

-- =====================================================
-- 3. RPC confirmar_recebimento_movimentacao — Recepção Atômica
-- =====================================================
CREATE OR REPLACE FUNCTION public.confirmar_recebimento_movimentacao(
  p_movimentacao_id UUID,
  p_loja_destino UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_produto_id UUID;
  rows_affected INTEGER;
BEGIN
  -- 1. Marcar movimentação como recebida
  UPDATE public.movimentacoes_estoque
  SET tipo_movimentacao = 'Recebido'
  WHERE id = p_movimentacao_id
    AND tipo_movimentacao = 'Pendente'
  RETURNING produto_id INTO v_produto_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected = 0 THEN
    RETURN FALSE;
  END IF;

  -- 2. Atualizar produto atomicamente
  IF v_produto_id IS NOT NULL THEN
    UPDATE public.produtos
    SET loja_id = p_loja_destino,
        loja_atual_id = p_loja_destino,
        status_movimentacao = NULL,
        movimentacao_id = NULL
    WHERE id = v_produto_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- =====================================================
-- 4. Colunas de Idempotência
-- =====================================================
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;
ALTER TABLE public.pagamentos_financeiros ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;
ALTER TABLE public.salarios_colaboradores ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;

-- =====================================================
-- 5. Coluna de Estoque Mínimo
-- =====================================================
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS quantidade_minima INTEGER DEFAULT 0;
