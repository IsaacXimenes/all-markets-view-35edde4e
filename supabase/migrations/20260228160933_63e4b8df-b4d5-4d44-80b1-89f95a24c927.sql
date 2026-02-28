
-- =============================================
-- LOTE 4: Habilitar RLS em TODAS as tabelas com policies permissivas temporárias
-- (serão restringidas na Fase 3 quando autenticação for implementada)
-- =============================================

-- Tabelas existentes
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garantias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Tabelas novas do lote 2
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_pagamentos ENABLE ROW LEVEL SECURITY;

-- Tabelas novas do lote 3
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maquinas_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acessorios ENABLE ROW LEVEL SECURITY;

-- Policies permissivas temporárias (acesso total via anon key para não quebrar o sistema)
-- Serão substituídas por policies restritivas na Fase 3

CREATE POLICY "allow_all_lojas" ON public.lojas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_colaboradores" ON public.colaboradores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ordens_servico" ON public.ordens_servico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_garantias" ON public.garantias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_financeiro" ON public.financeiro FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_movimentacoes_estoque" ON public.movimentacoes_estoque FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_venda_itens" ON public.venda_itens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_venda_trade_ins" ON public.venda_trade_ins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_venda_pagamentos" ON public.venda_pagamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_os_pecas" ON public.os_pecas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_os_pagamentos" ON public.os_pagamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contas_financeiras" ON public.contas_financeiras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_maquinas_cartao" ON public.maquinas_cartao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pecas" ON public.pecas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notas_compra" ON public.notas_compra FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_despesas" ON public.despesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pagamentos_financeiros" ON public.pagamentos_financeiros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_metas_lojas" ON public.metas_lojas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_movimentacoes_pecas" ON public.movimentacoes_pecas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_acessorios" ON public.acessorios FOR ALL USING (true) WITH CHECK (true);
