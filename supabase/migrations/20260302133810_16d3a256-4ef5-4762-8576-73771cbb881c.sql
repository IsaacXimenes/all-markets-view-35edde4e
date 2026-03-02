
-- Correção 1: Inserir role admin para 8 usuários CARGO-011/014
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('9ea44a86-6403-4285-a82c-49dc4fea51d6', 'admin'),
  ('be196555-7771-471e-8d86-da4f6d57d0a7', 'admin'),
  ('3e517aac-bd48-450d-b015-a4f2a76708ac', 'admin'),
  ('b103edfd-dd2c-4f6e-a430-72937e4f9cf5', 'admin'),
  ('d81941a9-6b62-41fe-9af1-390f87b4ce2b', 'admin'),
  ('b3342960-1085-44c4-8036-3f59f8ec0e17', 'admin'),
  ('6087b750-ab71-4344-b2eb-42ee884ecbdb', 'admin'),
  ('64751044-4386-429f-b227-f63c1ef8ea0d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Correção 3: Adicionar colunas JSONB para conferência de OS na tabela ordens_servico
ALTER TABLE public.ordens_servico 
  ADD COLUMN IF NOT EXISTS conferencia_gestor jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conferencia_financeiro jsonb DEFAULT NULL;
