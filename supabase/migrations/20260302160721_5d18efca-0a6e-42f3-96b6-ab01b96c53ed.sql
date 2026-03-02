
-- ============================================================
-- 1. TABELA DE AUDITORIA: estoque_audit_log
-- ============================================================
CREATE TABLE public.estoque_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL,
  tipo_acao text NOT NULL,
  quantidade_antes integer,
  quantidade_depois integer,
  loja_origem_id uuid,
  loja_destino_id uuid,
  referencia_id text,
  referencia_tipo text,
  usuario_id uuid,
  usuario_nome text,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.estoque_audit_log ENABLE ROW LEVEL SECURITY;

-- SELECT: somente admin/acesso_geral
CREATE POLICY "audit_log_select" ON public.estoque_audit_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_acesso_geral(auth.uid())
  );

-- INSERT: qualquer authenticated (o sistema registra via RPCs/triggers)
CREATE POLICY "audit_log_insert" ON public.estoque_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Índices para consultas frequentes
CREATE INDEX idx_audit_log_produto ON public.estoque_audit_log(produto_id);
CREATE INDEX idx_audit_log_created ON public.estoque_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_tipo ON public.estoque_audit_log(tipo_acao);

-- ============================================================
-- 2. TRIGGER: gravar audit log automaticamente quando quantidade muda
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_produto_quantidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.quantidade IS DISTINCT FROM NEW.quantidade THEN
    INSERT INTO public.estoque_audit_log (
      produto_id, tipo_acao, quantidade_antes, quantidade_depois,
      loja_origem_id, descricao
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.quantidade > OLD.quantidade THEN 'Entrada'
        WHEN NEW.quantidade < OLD.quantidade THEN 'Saida'
        ELSE 'Ajuste'
      END,
      OLD.quantidade,
      NEW.quantidade,
      COALESCE(NEW.loja_id, OLD.loja_id),
      'Alteração automática de quantidade: ' || OLD.quantidade || ' → ' || NEW.quantidade
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_produto_quantidade
  AFTER UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_produto_quantidade();

-- ============================================================
-- 3. CHECK CONSTRAINTS: bloqueio de estoque negativo
-- ============================================================
ALTER TABLE public.produtos ADD CONSTRAINT chk_produtos_quantidade_positiva CHECK (quantidade >= 0);
ALTER TABLE public.pecas ADD CONSTRAINT chk_pecas_quantidade_positiva CHECK (quantidade >= 0);

-- ============================================================
-- 4. ATUALIZAR RPC decrementar_estoque_produto com audit log
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrementar_estoque_produto(p_produto_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected INTEGER;
  v_qtd_antes INTEGER;
BEGIN
  -- Capturar quantidade antes
  SELECT quantidade INTO v_qtd_antes FROM public.produtos WHERE id = p_produto_id;

  UPDATE public.produtos
  SET quantidade = quantidade - 1,
      status_nota = 'Concluído'
  WHERE id = p_produto_id AND quantidade >= 1;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  -- O trigger trg_audit_produto_quantidade já grava o log automaticamente
  RETURN rows_affected > 0;
END;
$$;

-- ============================================================
-- 5. ATUALIZAR RPC transferir_estoque com erro detalhado
-- ============================================================
CREATE OR REPLACE FUNCTION public.transferir_estoque(
  p_produto_id uuid,
  p_loja_origem uuid,
  p_loja_destino uuid,
  p_responsavel_id uuid,
  p_motivo text DEFAULT 'Movimentação entre lojas'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mov_id UUID;
  rows_affected INTEGER;
  v_qtd_atual INTEGER;
BEGIN
  -- Verificar saldo antes
  SELECT quantidade INTO v_qtd_atual FROM public.produtos WHERE id = p_produto_id;

  IF v_qtd_atual IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado (ID: %)', p_produto_id;
  END IF;

  IF v_qtd_atual < 1 THEN
    RAISE EXCEPTION 'Falha na Transferência: Saldo insuficiente na origem (Disponível: %)', v_qtd_atual;
  END IF;

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

  -- 4. Registrar no audit log
  INSERT INTO public.estoque_audit_log (
    produto_id, tipo_acao, quantidade_antes, quantidade_depois,
    loja_origem_id, loja_destino_id, referencia_id, referencia_tipo,
    descricao
  ) VALUES (
    p_produto_id, 'Transferencia', v_qtd_atual, v_qtd_atual,
    p_loja_origem, p_loja_destino, v_mov_id::text, 'Transferencia',
    p_motivo
  );

  RETURN v_mov_id;
END;
$$;

-- ============================================================
-- 6. ATUALIZAR RPC consumir_peca_os com audit log
-- ============================================================
CREATE OR REPLACE FUNCTION public.consumir_peca_os(
  p_peca_id uuid,
  p_quantidade integer,
  p_os_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected INTEGER;
  v_descricao TEXT;
  v_qtd_antes INTEGER;
BEGIN
  -- Capturar quantidade antes
  SELECT quantidade, descricao INTO v_qtd_antes, v_descricao FROM public.pecas WHERE id = p_peca_id;

  -- Decrementa atomicamente apenas se quantidade suficiente e peça disponível
  UPDATE public.pecas
  SET quantidade = quantidade - p_quantidade,
      status = CASE WHEN quantidade - p_quantidade = 0 THEN 'Utilizada' ELSE status END
  WHERE id = p_peca_id
    AND quantidade >= p_quantidade
    AND status = 'Disponível';

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected > 0 THEN
    -- Registrar movimentação de saída (existente)
    INSERT INTO public.movimentacoes_pecas (peca_id, tipo, quantidade, data, os_id, descricao)
    VALUES (p_peca_id, 'Saída', p_quantidade, now()::text, p_os_id,
            'Baixa atômica para OS' || COALESCE(' ' || p_os_id::text, '') || ' - ' || COALESCE(v_descricao, ''));

    -- Registrar no audit log de estoque
    INSERT INTO public.estoque_audit_log (
      produto_id, tipo_acao, quantidade_antes, quantidade_depois,
      referencia_id, referencia_tipo, descricao
    ) VALUES (
      p_peca_id, 'Saida', v_qtd_antes, v_qtd_antes - p_quantidade,
      COALESCE(p_os_id::text, ''), 'OS',
      'Consumo de peça: ' || COALESCE(v_descricao, '') || ' (Qtd: ' || p_quantidade || ')'
    );
  END IF;

  RETURN rows_affected > 0;
END;
$$;
