-- Adicionar coluna codigo para ID de exibição no formato PROD-XXXX
ALTER TABLE public.produtos ADD COLUMN codigo VARCHAR(20);

-- Criar índice único para garantir unicidade dos códigos
CREATE UNIQUE INDEX idx_produtos_codigo ON public.produtos(codigo) WHERE codigo IS NOT NULL;

-- Popular códigos sequenciais nos produtos existentes ordenados por created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.produtos
)
UPDATE public.produtos p
SET codigo = 'PROD-' || LPAD(n.rn::TEXT, 4, '0')
FROM numbered n
WHERE p.id = n.id;