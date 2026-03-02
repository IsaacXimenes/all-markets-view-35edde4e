
-- Tabela para movimentações de peças entre lojas de assistência
CREATE TABLE public.movimentacoes_pecas_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_legivel TEXT,
  peca_id TEXT,
  descricao_peca TEXT,
  modelo TEXT,
  quantidade INTEGER DEFAULT 1,
  origem TEXT,
  destino TEXT,
  responsavel TEXT,
  motivo TEXT,
  data DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Pendente',
  data_recebimento TIMESTAMPTZ,
  responsavel_recebimento TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.movimentacoes_pecas_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read movimentacoes_pecas_estoque"
  ON public.movimentacoes_pecas_estoque FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert movimentacoes_pecas_estoque"
  ON public.movimentacoes_pecas_estoque FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update movimentacoes_pecas_estoque"
  ON public.movimentacoes_pecas_estoque FOR UPDATE TO authenticated USING (true);

-- Tabela para movimentações de acessórios entre lojas
CREATE TABLE public.movimentacoes_acessorios_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_legivel TEXT,
  acessorio_id TEXT,
  nome_acessorio TEXT,
  quantidade INTEGER DEFAULT 1,
  origem TEXT,
  destino TEXT,
  responsavel TEXT,
  motivo TEXT,
  data DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Pendente',
  data_recebimento TIMESTAMPTZ,
  responsavel_recebimento TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.movimentacoes_acessorios_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read movimentacoes_acessorios_estoque"
  ON public.movimentacoes_acessorios_estoque FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert movimentacoes_acessorios_estoque"
  ON public.movimentacoes_acessorios_estoque FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update movimentacoes_acessorios_estoque"
  ON public.movimentacoes_acessorios_estoque FOR UPDATE TO authenticated USING (true);
