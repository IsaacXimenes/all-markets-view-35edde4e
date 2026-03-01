-- Vincular profiles aos colaboradores por match de primeiro e último nome
UPDATE profiles p
SET colaborador_id = c.id,
    eh_gestor = c.eh_gestor,
    eh_vendedor = c.eh_vendedor,
    eh_estoquista = c.eh_estoquista
FROM colaboradores c
WHERE p.colaborador_id IS NULL
  AND LOWER(SPLIT_PART(p.nome_completo, ' ', 1)) = LOWER(SPLIT_PART(c.nome, ' ', 1))
  AND LOWER(SPLIT_PART(c.nome, ' ', array_length(string_to_array(c.nome, ' '), 1)))
      = LOWER(SPLIT_PART(p.nome_completo, ' ', array_length(string_to_array(p.nome_completo, ' '), 1)));