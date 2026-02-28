
-- Tabela para rodízios de colaboradores entre lojas
CREATE TABLE public.rodizios_colaboradores (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  colaborador_id uuid NOT NULL,
  loja_origem_id uuid NOT NULL,
  loja_destino_id uuid NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  observacao text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por_id character varying,
  criado_por_nome character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rodizios_colaboradores ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "auth_all" ON public.rodizios_colaboradores
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
