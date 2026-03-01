import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  eh_gestor?: boolean;
  eh_vendedor?: boolean;
  eh_estoquista?: boolean;
}

interface User {
  username: string;
  colaborador?: Colaborador;
}

interface AuthState {
  isAuthenticated: boolean;
  isAnimating: boolean;
  isFirstLogin: boolean;
  isLoading: boolean;
  user: User | null;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  setAnimating: (value: boolean) => void;
  setColaborador: (colaborador: Colaborador) => void;
}

async function fetchProfile(userId: string): Promise<{
  username: string;
  nome_completo: string;
  colaborador_id: string | null;
  cargo: string | null;
  eh_gestor: boolean;
  eh_vendedor: boolean;
  eh_estoquista: boolean;
  first_login: boolean;
} | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as any;
}

async function fetchColaborador(colaboradorId: string): Promise<Colaborador | null> {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('id, nome, cargo, eh_gestor, eh_vendedor, eh_estoquista')
    .eq('id', colaboradorId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    nome: data.nome,
    cargo: data.cargo || '',
    eh_gestor: data.eh_gestor || false,
    eh_vendedor: data.eh_vendedor || false,
    eh_estoquista: data.eh_estoquista || false,
  };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: false,
  isAnimating: false,
  isFirstLogin: false,
  isLoading: true,
  user: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          let colaborador: Colaborador | undefined;
          if (profile.colaborador_id) {
            colaborador = (await fetchColaborador(profile.colaborador_id)) || undefined;
          }
          // Fallback: use profile data if no colaborador linked
          if (!colaborador) {
            colaborador = {
              id: session.user.id,
              nome: profile.nome_completo || profile.username,
              cargo: profile.cargo || '',
              eh_gestor: profile.eh_gestor,
              eh_vendedor: profile.eh_vendedor,
              eh_estoquista: profile.eh_estoquista,
            };
          }
          set({
            isAuthenticated: true,
            isFirstLogin: profile.first_login,
            user: { username: profile.username, colaborador },
            isLoading: false,
          });
          return;
        }
      }
      
      set({ isAuthenticated: false, user: null, isLoading: false });
    } catch {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ isAuthenticated: false, user: null, isFirstLogin: false });
      } else if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          let colaborador: Colaborador | undefined;
          if (profile.colaborador_id) {
            colaborador = (await fetchColaborador(profile.colaborador_id)) || undefined;
          }
          if (!colaborador) {
            colaborador = {
              id: session.user.id,
              nome: profile.nome_completo || profile.username,
              cargo: profile.cargo || '',
              eh_gestor: profile.eh_gestor,
              eh_vendedor: profile.eh_vendedor,
              eh_estoquista: profile.eh_estoquista,
            };
          }
          set({
            isAuthenticated: true,
            isFirstLogin: profile.first_login,
            user: { username: profile.username, colaborador },
          });
        }
      }
    });
  },

  login: async (username: string, password: string) => {
    // Transliterate accented chars for email
    const emailUsername = username.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const email = `${emailUsername}@thiagoimports.com.br`;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error || !data.user) {
      return { success: false, error: 'Usuário sem permissão de acesso' };
    }

    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      return { success: false, error: 'Perfil não encontrado' };
    }

    let colaborador: Colaborador | undefined;
    if (profile.colaborador_id) {
      colaborador = (await fetchColaborador(profile.colaborador_id)) || undefined;
    }
    if (!colaborador) {
      colaborador = {
        id: data.user.id,
        nome: profile.nome_completo || profile.username,
        cargo: profile.cargo || '',
        eh_gestor: profile.eh_gestor,
        eh_vendedor: profile.eh_vendedor,
        eh_estoquista: profile.eh_estoquista,
      };
    }

    set({
      isAuthenticated: true,
      isAnimating: true,
      isFirstLogin: profile.first_login,
      user: { username: profile.username, colaborador },
    });

    return { success: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null, isAnimating: false, isFirstLogin: false });
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return false;

    // Mark first_login as false
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ first_login: false, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
    }

    set({ isFirstLogin: false });
    return true;
  },

  setAnimating: (value: boolean) => {
    set({ isAnimating: value });
  },

  setColaborador: (colaborador: Colaborador) => {
    set((state) => ({
      user: state.user ? { ...state.user, colaborador } : null
    }));
  },
}));
