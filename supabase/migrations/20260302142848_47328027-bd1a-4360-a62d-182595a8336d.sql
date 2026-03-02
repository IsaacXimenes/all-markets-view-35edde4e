
-- Correção de dados: sincronizar produtos com movimentações já confirmadas
-- mas com loja_atual_id desatualizado ou movimentacao_id ainda preenchido
UPDATE produtos p
SET loja_atual_id = me.loja_destino_id,
    movimentacao_id = NULL
FROM movimentacoes_estoque me
WHERE me.id = p.movimentacao_id
  AND me.tipo_movimentacao = 'Recebido'
  AND (p.loja_atual_id != me.loja_destino_id OR p.movimentacao_id IS NOT NULL);
