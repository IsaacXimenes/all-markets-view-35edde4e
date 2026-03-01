import { useCadastroStore } from '@/store/cadastroStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Verifica se o colaborador logado pertence à loja "Acesso Geral" (tipo Administrativo).
 * Colaboradores de Acesso Geral podem selecionar responsáveis manualmente nos formulários,
 * ao invés de ficarem travados no próprio nome.
 */
export function isUsuarioAcessoGeral(): boolean {
  const user = useAuthStore.getState().user;
  if (!user?.colaborador?.loja_id) return false;
  
  const { lojas } = useCadastroStore.getState();
  const acessoGeral = lojas.find(l => l.nome === 'Acesso Geral');
  return acessoGeral?.id === user.colaborador.loja_id;
}

/**
 * Hook para uso em componentes React.
 * Retorna true se o usuário logado pertence à loja "Acesso Geral".
 */
export function useIsAcessoGeral(): boolean {
  const user = useAuthStore(state => state.user);
  const lojas = useCadastroStore(state => state.lojas);
  
  if (!user?.colaborador?.loja_id) return false;
  const acessoGeral = lojas.find(l => l.nome === 'Acesso Geral');
  return acessoGeral?.id === user.colaborador.loja_id;
}
