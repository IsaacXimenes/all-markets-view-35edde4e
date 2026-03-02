
-- Adicionar coluna codigo nas tabelas
ALTER TABLE lotes_consignacao ADD COLUMN IF NOT EXISTS codigo text;
ALTER TABLE itens_consignacao ADD COLUMN IF NOT EXISTS codigo text;

-- Alterar lote_consignacao_id em pecas para text (aceitar CONS-XXX)
ALTER TABLE pecas ALTER COLUMN lote_consignacao_id TYPE text USING lote_consignacao_id::text;
