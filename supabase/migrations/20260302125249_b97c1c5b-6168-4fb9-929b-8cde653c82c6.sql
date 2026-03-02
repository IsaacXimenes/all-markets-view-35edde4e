
-- Sequências para IDs sequenciais
CREATE SEQUENCE IF NOT EXISTS os_numero_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS despesa_numero_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS pagamento_fin_numero_seq START 1001;

-- Adicionar colunas numero_sequencial
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS numero_sequencial INTEGER DEFAULT nextval('os_numero_seq');
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_sequencial INTEGER DEFAULT nextval('despesa_numero_seq');
ALTER TABLE pagamentos_financeiros ADD COLUMN IF NOT EXISTS numero_sequencial INTEGER DEFAULT nextval('pagamento_fin_numero_seq');

-- Criar índices únicos para os sequenciais
CREATE UNIQUE INDEX IF NOT EXISTS idx_os_numero_seq ON ordens_servico(numero_sequencial);
CREATE UNIQUE INDEX IF NOT EXISTS idx_despesa_numero_seq ON despesas(numero_sequencial);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pag_fin_numero_seq ON pagamentos_financeiros(numero_sequencial);

-- Corrigir RLS: remover políticas permissivas das tabelas de movimentações
DROP POLICY IF EXISTS "Authenticated users can insert movimentacoes_pecas_estoque" ON movimentacoes_pecas_estoque;
DROP POLICY IF EXISTS "Authenticated users can update movimentacoes_pecas_estoque" ON movimentacoes_pecas_estoque;
DROP POLICY IF EXISTS "Authenticated users can insert movimentacoes_acessorios_estoque" ON movimentacoes_acessorios_estoque;
DROP POLICY IF EXISTS "Authenticated users can update movimentacoes_acessorios_estoque" ON movimentacoes_acessorios_estoque;

-- Recriar com verificação de autenticação
CREATE POLICY "auth_insert_mov_pecas" ON movimentacoes_pecas_estoque FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_mov_pecas" ON movimentacoes_pecas_estoque FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_mov_acess" ON movimentacoes_acessorios_estoque FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_mov_acess" ON movimentacoes_acessorios_estoque FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
