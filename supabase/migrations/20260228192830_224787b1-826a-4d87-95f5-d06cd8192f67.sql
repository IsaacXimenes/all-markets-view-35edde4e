
-- Table for stories monitoramento lotes
CREATE TABLE public.stories_lotes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  data date NOT NULL,
  loja_id character varying NOT NULL,
  loja_nome character varying,
  total_vendas integer DEFAULT 0,
  vendas_com_story integer DEFAULT 0,
  percentual_stories integer DEFAULT 0,
  status character varying DEFAULT 'Pendente Conf. Operacional',
  conferido_por character varying,
  conferido_por_nome character varying,
  data_conferencia timestamp with time zone,
  validado_por character varying,
  validado_por_nome character varying,
  data_validacao timestamp with time zone,
  vendas jsonb DEFAULT '[]'::jsonb,
  competencia character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.stories_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.stories_lotes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE UNIQUE INDEX idx_stories_lotes_unique ON public.stories_lotes (data, loja_id);
CREATE INDEX idx_stories_lotes_competencia ON public.stories_lotes (competencia);
