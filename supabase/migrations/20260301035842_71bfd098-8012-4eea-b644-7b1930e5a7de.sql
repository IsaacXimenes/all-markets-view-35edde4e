
-- =============================================
-- FASE 2: Blindagem RLS - Tabelas Críticas
-- Substituir policies "auth_all" permissivas
-- =============================================

-- 1. config_whatsapp → ADMIN ONLY
DROP POLICY IF EXISTS "auth_all" ON public.config_whatsapp;
CREATE POLICY "config_whatsapp_select" ON public.config_whatsapp FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "config_whatsapp_insert" ON public.config_whatsapp FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "config_whatsapp_update" ON public.config_whatsapp FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "config_whatsapp_delete" ON public.config_whatsapp FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 2. contas_financeiras → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.contas_financeiras;
CREATE POLICY "contas_fin_select" ON public.contas_financeiras FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "contas_fin_insert" ON public.contas_financeiras FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "contas_fin_update" ON public.contas_financeiras FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "contas_fin_delete" ON public.contas_financeiras FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 3. movimentacoes_entre_contas → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.movimentacoes_entre_contas;
CREATE POLICY "mov_contas_select" ON public.movimentacoes_entre_contas FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "mov_contas_insert" ON public.movimentacoes_entre_contas FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "mov_contas_update" ON public.movimentacoes_entre_contas FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "mov_contas_delete" ON public.movimentacoes_entre_contas FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 4. venda_pagamentos → GESTOR/ADMIN (vendedor vê via venda)
DROP POLICY IF EXISTS "auth_all" ON public.venda_pagamentos;
CREATE POLICY "venda_pag_select" ON public.venda_pagamentos FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'vendedor'));
CREATE POLICY "venda_pag_insert" ON public.venda_pagamentos FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'vendedor'));
CREATE POLICY "venda_pag_update" ON public.venda_pagamentos FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor'));
CREATE POLICY "venda_pag_delete" ON public.venda_pagamentos FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 5. comissao_por_loja → ADMIN/ACESSO GERAL
DROP POLICY IF EXISTS "auth_all" ON public.comissao_por_loja;
CREATE POLICY "comissao_loja_select" ON public.comissao_por_loja FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "comissao_loja_insert" ON public.comissao_por_loja FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "comissao_loja_update" ON public.comissao_por_loja FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "comissao_loja_delete" ON public.comissao_por_loja FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 6. comissoes_historico → ADMIN/ACESSO GERAL
DROP POLICY IF EXISTS "auth_all" ON public.comissoes_historico;
CREATE POLICY "comissoes_hist_select" ON public.comissoes_historico FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "comissoes_hist_insert" ON public.comissoes_historico FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "comissoes_hist_update" ON public.comissoes_historico FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "comissoes_hist_delete" ON public.comissoes_historico FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 7. conferencias_gestor → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.conferencias_gestor;
CREATE POLICY "conf_gestor_select" ON public.conferencias_gestor FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "conf_gestor_insert" ON public.conferencias_gestor FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'vendedor'));
CREATE POLICY "conf_gestor_update" ON public.conferencias_gestor FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor'));
CREATE POLICY "conf_gestor_delete" ON public.conferencias_gestor FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 8. conferencias_gestao → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.conferencias_gestao;
CREATE POLICY "conf_gestao_select" ON public.conferencias_gestao FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "conf_gestao_insert" ON public.conferencias_gestao FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "conf_gestao_update" ON public.conferencias_gestao FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "conf_gestao_delete" ON public.conferencias_gestao FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 9. dividas_fiado → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.dividas_fiado;
CREATE POLICY "dividas_select" ON public.dividas_fiado FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "dividas_insert" ON public.dividas_fiado FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'vendedor'));
CREATE POLICY "dividas_update" ON public.dividas_fiado FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor'));
CREATE POLICY "dividas_delete" ON public.dividas_fiado FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 10. garantias → GESTOR/ADMIN + loja filter
DROP POLICY IF EXISTS "auth_all" ON public.garantias;
CREATE POLICY "garantias_select" ON public.garantias FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'vendedor') OR has_role(auth.uid(), 'estoquista'));
CREATE POLICY "garantias_insert" ON public.garantias FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'vendedor'));
CREATE POLICY "garantias_update" ON public.garantias FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor'));
CREATE POLICY "garantias_delete" ON public.garantias FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 11. notas_entrada → ESTOQUISTA/GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.notas_entrada;
CREATE POLICY "notas_entrada_select" ON public.notas_entrada FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'estoquista'));
CREATE POLICY "notas_entrada_insert" ON public.notas_entrada FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'estoquista') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "notas_entrada_update" ON public.notas_entrada FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'estoquista') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "notas_entrada_delete" ON public.notas_entrada FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 12. maquinas_cartao → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.maquinas_cartao;
CREATE POLICY "maquinas_select" ON public.maquinas_cartao FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'vendedor'));
CREATE POLICY "maquinas_insert" ON public.maquinas_cartao FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "maquinas_update" ON public.maquinas_cartao FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "maquinas_delete" ON public.maquinas_cartao FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 13. ordens_servico → Todos autenticados podem ler (necessário para assistência)
DROP POLICY IF EXISTS "auth_all" ON public.ordens_servico;
CREATE POLICY "os_select" ON public.ordens_servico FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'estoquista') OR has_role(auth.uid(), 'vendedor'));
CREATE POLICY "os_insert" ON public.ordens_servico FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'estoquista'));
CREATE POLICY "os_update" ON public.ordens_servico FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'estoquista'));
CREATE POLICY "os_delete" ON public.ordens_servico FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 14. vendas_conferencia → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.vendas_conferencia;
CREATE POLICY "vendas_conf_select" ON public.vendas_conferencia FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "vendas_conf_insert" ON public.vendas_conferencia FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'vendedor'));
CREATE POLICY "vendas_conf_update" ON public.vendas_conferencia FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor'));
CREATE POLICY "vendas_conf_delete" ON public.vendas_conferencia FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 15. historico_comissao_por_loja → ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.historico_comissao_por_loja;
CREATE POLICY "hist_comissao_select" ON public.historico_comissao_por_loja FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "hist_comissao_insert" ON public.historico_comissao_por_loja FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 16. remuneracoes_motoboy → ADMIN/GESTOR
DROP POLICY IF EXISTS "auth_all" ON public.remuneracoes_motoboy;
CREATE POLICY "remun_motoboy_select" ON public.remuneracoes_motoboy FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "remun_motoboy_insert" ON public.remuneracoes_motoboy FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "remun_motoboy_update" ON public.remuneracoes_motoboy FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "remun_motoboy_delete" ON public.remuneracoes_motoboy FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 17. pagamentos_financeiros → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.pagamentos_financeiros;
CREATE POLICY "pag_fin_select" ON public.pagamentos_financeiros FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "pag_fin_insert" ON public.pagamentos_financeiros FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "pag_fin_update" ON public.pagamentos_financeiros FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "pag_fin_delete" ON public.pagamentos_financeiros FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 18. pendencias_financeiras → GESTOR/ADMIN
DROP POLICY IF EXISTS "auth_all" ON public.pendencias_financeiras;
CREATE POLICY "pend_fin_select" ON public.pendencias_financeiras FOR SELECT TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "pend_fin_insert" ON public.pendencias_financeiras FOR INSERT TO authenticated
  WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "pend_fin_update" ON public.pendencias_financeiras FOR UPDATE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "pend_fin_delete" ON public.pendencias_financeiras FOR DELETE TO authenticated
  USING (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'admin'));
