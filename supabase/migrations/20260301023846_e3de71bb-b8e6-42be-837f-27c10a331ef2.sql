
-- =============================================
-- ETAPA 1: Infraestrutura de Roles
-- =============================================

-- 1.1 Criar enum app_role
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'vendedor', 'estoquista');

-- 1.2 Criar tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 1.3 Habilitar RLS na user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ETAPA 2: Funções SECURITY DEFINER
-- =============================================

-- 2.1 has_role: verifica se usuario tem determinada role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2.2 get_user_loja_id: retorna loja_id do colaborador vinculado
CREATE OR REPLACE FUNCTION public.get_user_loja_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.loja_id
  FROM public.profiles p
  JOIN public.colaboradores c ON c.id = p.colaborador_id
  WHERE p.id = _user_id
  LIMIT 1
$$;

-- 2.3 get_user_colaborador_id: retorna colaborador_id do profile
CREATE OR REPLACE FUNCTION public.get_user_colaborador_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT colaborador_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- 2.4 is_acesso_geral: verifica se pertence à loja Acesso Geral
CREATE OR REPLACE FUNCTION public.is_acesso_geral(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.colaboradores c ON c.id = p.colaborador_id
    WHERE p.id = _user_id
      AND c.loja_id = '90dc7c04-d4f8-4c95-82d7-13f600be4e31'
  )
$$;

-- =============================================
-- ETAPA 3: Políticas na tabela user_roles
-- =============================================

CREATE POLICY "Admins can manage user_roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- ETAPA 4: Popular user_roles com dados existentes
-- =============================================

INSERT INTO public.user_roles (user_id, role)
  -- Admins: usuarios da loja Acesso Geral
  SELECT p.id, 'admin'::app_role
  FROM public.profiles p
  JOIN public.colaboradores c ON p.colaborador_id = c.id
  WHERE c.loja_id = '90dc7c04-d4f8-4c95-82d7-13f600be4e31'
    AND p.colaborador_id IS NOT NULL

  UNION ALL
  -- Gestores
  SELECT p.id, 'gestor'::app_role
  FROM public.profiles p
  WHERE p.eh_gestor = true
    AND p.colaborador_id IS NOT NULL

  UNION ALL
  -- Vendedores
  SELECT p.id, 'vendedor'::app_role
  FROM public.profiles p
  WHERE p.eh_vendedor = true
    AND p.colaborador_id IS NOT NULL

  UNION ALL
  -- Estoquistas
  SELECT p.id, 'estoquista'::app_role
  FROM public.profiles p
  WHERE p.eh_estoquista = true
    AND p.colaborador_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================
-- ETAPA 5: Remover políticas auth_all genéricas
-- =============================================

DROP POLICY IF EXISTS "auth_all" ON public.colaboradores;
DROP POLICY IF EXISTS "auth_all" ON public.salarios_colaboradores;
DROP POLICY IF EXISTS "auth_all" ON public.historico_salarios;
DROP POLICY IF EXISTS "auth_all" ON public.adiantamentos;
DROP POLICY IF EXISTS "auth_all" ON public.vales;
DROP POLICY IF EXISTS "auth_all" ON public.produtos;
DROP POLICY IF EXISTS "auth_all" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "auth_all" ON public.vendas;
DROP POLICY IF EXISTS "auth_all" ON public.financeiro;
DROP POLICY IF EXISTS "auth_all" ON public.despesas;

-- =============================================
-- ETAPA 6: GRUPO 1 - RH (Salários e Dados Pessoais)
-- =============================================

-- --- colaboradores ---
CREATE POLICY "colaboradores_select"
  ON public.colaboradores FOR SELECT TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR id = public.get_user_colaborador_id(auth.uid())
  );

CREATE POLICY "colaboradores_insert"
  ON public.colaboradores FOR INSERT TO authenticated
  WITH CHECK (public.is_acesso_geral(auth.uid()));

CREATE POLICY "colaboradores_update"
  ON public.colaboradores FOR UPDATE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

CREATE POLICY "colaboradores_delete"
  ON public.colaboradores FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- --- salarios_colaboradores ---
CREATE POLICY "salarios_select"
  ON public.salarios_colaboradores FOR SELECT TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

CREATE POLICY "salarios_insert"
  ON public.salarios_colaboradores FOR INSERT TO authenticated
  WITH CHECK (public.is_acesso_geral(auth.uid()));

CREATE POLICY "salarios_update"
  ON public.salarios_colaboradores FOR UPDATE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

CREATE POLICY "salarios_delete"
  ON public.salarios_colaboradores FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- --- historico_salarios ---
CREATE POLICY "hist_salarios_select"
  ON public.historico_salarios FOR SELECT TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

CREATE POLICY "hist_salarios_insert"
  ON public.historico_salarios FOR INSERT TO authenticated
  WITH CHECK (public.is_acesso_geral(auth.uid()));

CREATE POLICY "hist_salarios_update"
  ON public.historico_salarios FOR UPDATE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

CREATE POLICY "hist_salarios_delete"
  ON public.historico_salarios FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- --- adiantamentos ---
CREATE POLICY "adiantamentos_select"
  ON public.adiantamentos FOR SELECT TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR colaborador_id = public.get_user_colaborador_id(auth.uid())
  );

CREATE POLICY "adiantamentos_insert"
  ON public.adiantamentos FOR INSERT TO authenticated
  WITH CHECK (public.is_acesso_geral(auth.uid()));

CREATE POLICY "adiantamentos_update"
  ON public.adiantamentos FOR UPDATE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

CREATE POLICY "adiantamentos_delete"
  ON public.adiantamentos FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- --- vales ---
CREATE POLICY "vales_select"
  ON public.vales FOR SELECT TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR colaborador_id = public.get_user_colaborador_id(auth.uid())
  );

CREATE POLICY "vales_insert"
  ON public.vales FOR INSERT TO authenticated
  WITH CHECK (public.is_acesso_geral(auth.uid()));

CREATE POLICY "vales_update"
  ON public.vales FOR UPDATE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

CREATE POLICY "vales_delete"
  ON public.vales FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- =============================================
-- ETAPA 7: GRUPO 2 - Estoque e Inventário
-- =============================================

-- --- produtos ---
CREATE POLICY "produtos_select"
  ON public.produtos FOR SELECT TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR loja_id = public.get_user_loja_id(auth.uid())
  );

CREATE POLICY "produtos_insert"
  ON public.produtos FOR INSERT TO authenticated
  WITH CHECK (
    public.is_acesso_geral(auth.uid())
    OR public.has_role(auth.uid(), 'estoquista')
  );

CREATE POLICY "produtos_update"
  ON public.produtos FOR UPDATE TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR public.has_role(auth.uid(), 'estoquista')
  );

CREATE POLICY "produtos_delete"
  ON public.produtos FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- --- movimentacoes_estoque ---
CREATE POLICY "mov_estoque_select"
  ON public.movimentacoes_estoque FOR SELECT TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR loja_origem_id = public.get_user_loja_id(auth.uid())
    OR loja_destino_id = public.get_user_loja_id(auth.uid())
  );

CREATE POLICY "mov_estoque_insert"
  ON public.movimentacoes_estoque FOR INSERT TO authenticated
  WITH CHECK (
    public.is_acesso_geral(auth.uid())
    OR public.has_role(auth.uid(), 'estoquista')
  );

CREATE POLICY "mov_estoque_update"
  ON public.movimentacoes_estoque FOR UPDATE TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR public.has_role(auth.uid(), 'estoquista')
  );

CREATE POLICY "mov_estoque_delete"
  ON public.movimentacoes_estoque FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- =============================================
-- ETAPA 8: GRUPO 3 - Financeiro e Vendas
-- =============================================

-- --- vendas ---
CREATE POLICY "vendas_select"
  ON public.vendas FOR SELECT TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR (public.has_role(auth.uid(), 'gestor') AND loja_id = public.get_user_loja_id(auth.uid()))
    OR vendedor_id = public.get_user_colaborador_id(auth.uid())
  );

CREATE POLICY "vendas_insert"
  ON public.vendas FOR INSERT TO authenticated
  WITH CHECK (
    public.is_acesso_geral(auth.uid())
    OR public.has_role(auth.uid(), 'gestor')
    OR public.has_role(auth.uid(), 'vendedor')
  );

CREATE POLICY "vendas_update"
  ON public.vendas FOR UPDATE TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR (public.has_role(auth.uid(), 'gestor') AND loja_id = public.get_user_loja_id(auth.uid()))
  );

CREATE POLICY "vendas_delete"
  ON public.vendas FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- --- financeiro ---
CREATE POLICY "financeiro_select"
  ON public.financeiro FOR SELECT TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR (public.has_role(auth.uid(), 'gestor') AND loja_id = public.get_user_loja_id(auth.uid()))
  );

CREATE POLICY "financeiro_insert"
  ON public.financeiro FOR INSERT TO authenticated
  WITH CHECK (public.is_acesso_geral(auth.uid()));

CREATE POLICY "financeiro_update"
  ON public.financeiro FOR UPDATE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

CREATE POLICY "financeiro_delete"
  ON public.financeiro FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- --- despesas ---
CREATE POLICY "despesas_select"
  ON public.despesas FOR SELECT TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR (public.has_role(auth.uid(), 'gestor') AND loja_id = public.get_user_loja_id(auth.uid()))
  );

CREATE POLICY "despesas_insert"
  ON public.despesas FOR INSERT TO authenticated
  WITH CHECK (
    public.is_acesso_geral(auth.uid())
    OR public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "despesas_update"
  ON public.despesas FOR UPDATE TO authenticated
  USING (
    public.is_acesso_geral(auth.uid())
    OR (public.has_role(auth.uid(), 'gestor') AND loja_id = public.get_user_loja_id(auth.uid()))
  );

CREATE POLICY "despesas_delete"
  ON public.despesas FOR DELETE TO authenticated
  USING (public.is_acesso_geral(auth.uid()));

-- =============================================
-- ETAPA 9: Atualizar trigger handle_new_user para inserir roles
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT;
  v_parts TEXT[];
  v_first_name TEXT;
  v_last_name TEXT;
  v_colab RECORD;
BEGIN
  v_username := SPLIT_PART(NEW.email, '@', 1);
  v_parts := string_to_array(v_username, '.');
  v_first_name := v_parts[1];
  v_last_name := CASE WHEN array_length(v_parts, 1) > 1 THEN v_parts[array_length(v_parts, 1)] ELSE NULL END;

  SELECT id, nome, cargo, eh_gestor, eh_vendedor, eh_estoquista, loja_id
  INTO v_colab
  FROM public.colaboradores
  WHERE ativo = true
    AND v_last_name IS NOT NULL
    AND LOWER(nome) LIKE '%' || LOWER(v_first_name) || '%'
    AND LOWER(nome) LIKE '%' || LOWER(v_last_name) || '%'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_colab IS NOT NULL THEN
    INSERT INTO public.profiles (id, username, nome_completo, colaborador_id, cargo, eh_gestor, eh_vendedor, eh_estoquista, first_login)
    VALUES (
      NEW.id,
      v_username,
      v_colab.nome,
      v_colab.id,
      v_colab.cargo,
      COALESCE(v_colab.eh_gestor, false),
      COALESCE(v_colab.eh_vendedor, false),
      COALESCE(v_colab.eh_estoquista, false),
      true
    );

    -- Inserir roles automaticamente
    IF v_colab.loja_id = '90dc7c04-d4f8-4c95-82d7-13f600be4e31' THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    END IF;
    IF COALESCE(v_colab.eh_gestor, false) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'gestor') ON CONFLICT DO NOTHING;
    END IF;
    IF COALESCE(v_colab.eh_vendedor, false) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendedor') ON CONFLICT DO NOTHING;
    END IF;
    IF COALESCE(v_colab.eh_estoquista, false) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'estoquista') ON CONFLICT DO NOTHING;
    END IF;
  ELSE
    INSERT INTO public.profiles (id, username, nome_completo, first_login)
    VALUES (NEW.id, v_username, '', true);
  END IF;

  RETURN NEW;
END;
$function$;
