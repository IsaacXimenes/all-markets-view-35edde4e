ALTER TABLE public.produtos_pendentes_os ADD COLUMN codigo VARCHAR(20);
CREATE UNIQUE INDEX idx_produtos_pendentes_os_codigo ON public.produtos_pendentes_os(codigo);

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM public.produtos_pendentes_os
)
UPDATE public.produtos_pendentes_os p
SET codigo = 'PROD-' || LPAD((499 + n.rn)::TEXT, 4, '0')
FROM numbered n WHERE p.id = n.id;