
-- Tabela profiles vinculada a auth.users e colaboradores
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR NOT NULL UNIQUE,
  nome_completo VARCHAR NOT NULL DEFAULT '',
  colaborador_id UUID REFERENCES public.colaboradores(id),
  cargo VARCHAR,
  eh_gestor BOOLEAN DEFAULT false,
  eh_vendedor BOOLEAN DEFAULT false,
  eh_estoquista BOOLEAN DEFAULT false,
  first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer usuario autenticado pode ler todos os profiles (necessario para buscar dados do colaborador)
CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Usuarios so podem atualizar o proprio profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role pode inserir (via trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Trigger para auto-criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, nome_completo)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
