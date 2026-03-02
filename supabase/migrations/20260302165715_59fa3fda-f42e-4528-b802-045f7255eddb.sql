
-- 1. Drop the recursive policy
DROP POLICY IF EXISTS "profiles_select_restritivo" ON public.profiles;

-- 2. Create SECURITY DEFINER helper to get loja_id without triggering RLS on profiles
CREATE OR REPLACE FUNCTION public.get_user_loja_id_direct(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.loja_id
  FROM public.colaboradores c
  JOIN public.profiles p ON p.colaborador_id = c.id
  WHERE p.id = _user_id
  LIMIT 1
$$;

-- 3. Create safe SELECT policy (no recursion)
CREATE POLICY "profiles_select_safe"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_acesso_geral(auth.uid())
  OR (
    public.has_role(auth.uid(), 'gestor')
    AND public.get_user_loja_id_direct(auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.id = colaborador_id
        AND c.loja_id = public.get_user_loja_id_direct(auth.uid())
    )
  )
);
