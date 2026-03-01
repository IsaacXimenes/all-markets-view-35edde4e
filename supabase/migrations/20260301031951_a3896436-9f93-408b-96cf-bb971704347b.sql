
-- Adicionar coluna codigo
ALTER TABLE public.maquinas_cartao ADD COLUMN codigo character varying;

-- Popular as 18 maquinas existentes com MQ-001 a MQ-018 (ordenadas por nome)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY nome ASC) AS rn
  FROM public.maquinas_cartao
)
UPDATE public.maquinas_cartao m
SET codigo = 'MQ-' || LPAD(o.rn::text, 3, '0')
FROM ordered o
WHERE m.id = o.id;
