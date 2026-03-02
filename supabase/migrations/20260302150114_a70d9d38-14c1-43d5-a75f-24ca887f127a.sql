
-- =============================================================
-- BLINDAGEM DE SEGURANÇA LGPD - 5 CORREÇÕES CRÍTICAS
-- =============================================================

-- =============================================
-- 1. PROFILES: Remover política permissiva "read all"
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;

-- Política restritiva: admin/acesso_geral veem todos, gestor vê da loja, demais veem só o próprio
CREATE POLICY "profiles_select_restritivo" ON public.profiles
FOR SELECT USING (
  auth.uid() = id
  OR is_acesso_geral(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'gestor'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.colaboradores c1
      JOIN public.profiles p1 ON p1.colaborador_id = c1.id
      WHERE p1.id = auth.uid()
        AND c1.loja_id = (
          SELECT c2.loja_id FROM public.colaboradores c2
          JOIN public.profiles p2 ON p2.colaborador_id = c2.id
          WHERE p2.id = profiles.id
          LIMIT 1
        )
    )
  )
);

-- =============================================
-- 2. COLABORADORES: Adicionar admin ao SELECT + criar RPC básica
-- =============================================
DROP POLICY IF EXISTS "colaboradores_select" ON public.colaboradores;

CREATE POLICY "colaboradores_select" ON public.colaboradores
FOR SELECT USING (
  is_acesso_geral(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR id = get_user_colaborador_id(auth.uid())
);

-- Função SECURITY DEFINER para retornar apenas campos não-sensíveis
CREATE OR REPLACE FUNCTION public.get_colaboradores_basicos()
RETURNS TABLE (
  id uuid,
  nome text,
  cargo text,
  loja_id uuid,
  eh_gestor boolean,
  eh_vendedor boolean,
  eh_estoquista boolean,
  ativo boolean,
  foto text,
  data_admissao text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.nome,
    c.cargo,
    c.loja_id,
    COALESCE(c.eh_gestor, false),
    COALESCE(c.eh_vendedor, false),
    COALESCE(c.eh_estoquista, false),
    COALESCE(c.ativo, true),
    c.foto,
    c.data_admissao,
    c.created_at
  FROM public.colaboradores c
  ORDER BY c.nome
$$;

-- =============================================
-- 3. CLIENTES: Substituir política ALL por 4 granulares
-- =============================================
DROP POLICY IF EXISTS "auth_all" ON public.clientes;

CREATE POLICY "clientes_select" ON public.clientes
FOR SELECT USING (
  is_acesso_geral(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'vendedor'::app_role)
);

CREATE POLICY "clientes_insert" ON public.clientes
FOR INSERT WITH CHECK (
  is_acesso_geral(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'vendedor'::app_role)
);

CREATE POLICY "clientes_update" ON public.clientes
FOR UPDATE USING (
  is_acesso_geral(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
);

CREATE POLICY "clientes_delete" ON public.clientes
FOR DELETE USING (
  is_acesso_geral(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 4. CONTAS_FINANCEIRAS: Remover acesso gestor do SELECT
-- =============================================
DROP POLICY IF EXISTS "contas_fin_select" ON public.contas_financeiras;

CREATE POLICY "contas_fin_select" ON public.contas_financeiras
FOR SELECT USING (
  is_acesso_geral(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 5. VENDAS: Adicionar admin ao SELECT
-- =============================================
DROP POLICY IF EXISTS "vendas_select" ON public.vendas;

CREATE POLICY "vendas_select" ON public.vendas
FOR SELECT USING (
  is_acesso_geral(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'gestor'::app_role) AND loja_id = get_user_loja_id(auth.uid()))
  OR vendedor_id = get_user_colaborador_id(auth.uid())
);
