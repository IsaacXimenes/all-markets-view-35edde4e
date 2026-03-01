
-- Adicionar coluna loja_id e codigo na tabela taxas_entrega
ALTER TABLE public.taxas_entrega ADD COLUMN loja_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.taxas_entrega ADD COLUMN codigo character varying;

-- Vincular registros existentes à loja Online
UPDATE public.taxas_entrega SET loja_id = 'df3995f6-1da1-4661-a68f-20fb548a9468' WHERE loja_id IS NULL;

-- Gerar códigos sequenciais para registros existentes
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.taxas_entrega
)
UPDATE public.taxas_entrega t
SET codigo = 'TAXA-' || LPAD(n.rn::text, 4, '0')
FROM numbered n
WHERE t.id = n.id;
