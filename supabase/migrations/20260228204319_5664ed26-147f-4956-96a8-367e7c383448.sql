
-- Tabela para configuração do WhatsApp (1 registro por configuração global)
CREATE TABLE public.config_whatsapp (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  habilitado BOOLEAN DEFAULT false,
  api_url TEXT DEFAULT '',
  token TEXT DEFAULT '',
  destinatario VARCHAR DEFAULT '',
  modelo_mensagem TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.config_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.config_whatsapp AS RESTRICTIVE FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
