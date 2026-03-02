import { useMemo, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useIsAcessoGeral } from '@/utils/permissoesUtils';
import { supabase } from '@/integrations/supabase/client';

export type UserProfile = 'admin' | 'gestor' | 'tecnico' | 'vendedor' | 'estoquista' | 'restrito';

export type ModuleName =
  | 'rh'
  | 'financeiro'
  | 'estoque'
  | 'vendas'
  | 'garantias'
  | 'assistencia'
  | 'gestao'
  | 'relatorios'
  | 'cadastros'
  | 'dados-antigo'
  | 'settings';

const MODULE_MAP: Record<UserProfile, ModuleName[]> = {
  admin: ['rh', 'financeiro', 'estoque', 'vendas', 'garantias', 'assistencia', 'gestao', 'relatorios', 'cadastros', 'dados-antigo', 'settings'],
  gestor: ['estoque', 'vendas', 'garantias', 'assistencia', 'gestao', 'relatorios', 'cadastros', 'dados-antigo', 'settings'],
  tecnico: ['assistencia', 'estoque', 'vendas', 'settings'],
  vendedor: ['vendas', 'estoque', 'dados-antigo', 'settings'],
  estoquista: ['vendas', 'estoque', 'dados-antigo', 'settings'],
  restrito: ['settings'],
};

/** Maps a route path to a module name. Returns null for always-visible routes. */
function routeToModule(path: string): ModuleName | null {
  if (path === '/') return null; // Dashboard always visible
  if (path.startsWith('/rh')) return 'rh';
  if (path.startsWith('/financeiro')) return 'financeiro';
  if (path.startsWith('/estoque')) return 'estoque';
  if (path.startsWith('/vendas')) return 'vendas';
  if (path.startsWith('/garantias')) return 'garantias';
  if (path.startsWith('/os')) return 'assistencia';
  if (path.startsWith('/gestao-administrativa')) return 'gestao';
  if (path.startsWith('/relatorios')) return 'relatorios';
  if (path.startsWith('/cadastros')) return 'cadastros';
  if (path.startsWith('/dados-sistema-antigo')) return 'dados-antigo';
  if (path.startsWith('/settings')) return 'settings';
  if (path === '/definir-senha') return null;
  if (path === '/login') return null;
  return null;
}

// Cargo codes that map to admin
const ADMIN_CARGOS = ['CARGO-001', 'CARGO-010', 'CARGO-011', 'CARGO-012', 'CARGO-014'];
const TECNICO_CARGOS = ['CARGO-005'];
const RESTRITO_CARGOS = ['CARGO-006', 'CARGO-009'];

export function useUserPermissions() {
  const user = useAuthStore((s) => s.user);
  const isAcessoGeral = useIsAcessoGeral();
  const [dbRoles, setDbRoles] = useState<string[]>([]);

  // Fetch roles from user_roles table (server-side source of truth)
  useEffect(() => {
    let cancelled = false;
    async function fetchRoles() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      if (!cancelled && data) {
        setDbRoles(data.map((r: any) => r.role));
      }
    }
    fetchRoles();
    return () => { cancelled = true; };
  }, [user]);

  const perfil: UserProfile = useMemo(() => {
    // 1. If user has admin role in user_roles OR is Acesso Geral
    if (dbRoles.includes('admin') || isAcessoGeral) return 'admin';

    // 2. Check cargo-based admin
    const cargo = user?.colaborador?.cargo || '';
    if (ADMIN_CARGOS.includes(cargo)) return 'admin';

    // 3. Gestor
    if (dbRoles.includes('gestor') || user?.colaborador?.eh_gestor) return 'gestor';

    // 4. Técnico
    if (TECNICO_CARGOS.includes(cargo)) return 'tecnico';

    // 5. Vendedor
    if (dbRoles.includes('vendedor') || user?.colaborador?.eh_vendedor) return 'vendedor';

    // 6. Estoquista
    if (dbRoles.includes('estoquista') || user?.colaborador?.eh_estoquista) return 'estoquista';

    // 7. Restrito
    if (RESTRITO_CARGOS.includes(cargo)) return 'restrito';

    // Default: restrito
    return 'restrito';
  }, [dbRoles, isAcessoGeral, user]);

  const allowedModules = useMemo(() => MODULE_MAP[perfil], [perfil]);

  const canAccessRoute = useMemo(() => {
    return (path: string): boolean => {
      const mod = routeToModule(path);
      if (mod === null) return true; // always-visible routes
      return allowedModules.includes(mod);
    };
  }, [allowedModules]);

  const canAccessModule = useMemo(() => {
    return (mod: ModuleName): boolean => allowedModules.includes(mod);
  }, [allowedModules]);

  return { perfil, allowedModules, canAccessRoute, canAccessModule };
}
