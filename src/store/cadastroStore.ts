import { create } from 'zustand';
import { LojaMockada, ColaboradorMockado, TipoLoja, RodizioColaborador } from '../types/mockData';
import { registrarInicioRodizio, registrarEncerramentoRodizio, getTimelineByEntidade, TimelineEntry } from '../utils/timelineApi';
import { supabase } from '@/integrations/supabase/client';

const RODIZIOS_KEY = 'cadastro_rodizios';

interface CadastroStore {
  lojas: LojaMockada[];
  colaboradores: ColaboradorMockado[];
  rodizios: RodizioColaborador[];
  inicializado: boolean;
  carregando: boolean;
  
  // Ações
  inicializarDadosMockados: () => void;
  carregarDoLocalStorage: () => void;
  
  // Lojas
  obterLojas: () => LojaMockada[];
  obterLojasPorTipo: (tipo: TipoLoja) => LojaMockada[];
  obterLojasAtivas: () => LojaMockada[];
  obterLojasTipoLoja: () => LojaMockada[];
  obterLojaMatriz: () => LojaMockada | undefined;
  obterLojaOnline: () => LojaMockada | undefined;
  obterLojaById: (id: string) => LojaMockada | undefined;
  adicionarLoja: (loja: Omit<LojaMockada, 'id' | 'data_criacao'>) => Promise<LojaMockada>;
  atualizarLoja: (id: string, updates: Partial<LojaMockada>) => Promise<void>;
  deletarLoja: (id: string) => Promise<void>;
  
  // Colaboradores
  obterColaboradores: () => ColaboradorMockado[];
  obterColaboradoresPorLoja: (lojaId: string) => ColaboradorMockado[];
  obterColaboradoresPorCargo: (cargo: string) => ColaboradorMockado[];
  obterColaboradoresAtivos: () => ColaboradorMockado[];
  obterColaboradorById: (id: string) => ColaboradorMockado | undefined;
  obterGestores: () => ColaboradorMockado[];
  obterVendedores: () => ColaboradorMockado[];
  obterEstoquistas: () => ColaboradorMockado[];
  obterTecnicos: () => ColaboradorMockado[];
  obterMotoboys: () => ColaboradorMockado[];
  obterFinanceiros: () => ColaboradorMockado[];
  obterAniversariantesDaSemana: () => ColaboradorMockado[];
  adicionarColaborador: (colaborador: Omit<ColaboradorMockado, 'id' | 'data_criacao'>) => Promise<ColaboradorMockado>;
  atualizarColaborador: (id: string, updates: Partial<ColaboradorMockado>) => Promise<void>;
  deletarColaborador: (id: string) => Promise<void>;
  
  // Lookup helpers
  obterNomeLoja: (lojaId: string) => string;
  obterNomeColaborador: (colaboradorId: string) => string;
  obterContagemColaboradoresPorLoja: () => Record<string, number>;
  
  // Rodízio
  adicionarRodizio: (rodizio: Omit<RodizioColaborador, 'id' | 'data_criacao'>) => RodizioColaborador;
  encerrarRodizio: (id: string, usuarioId: string, usuarioNome: string) => void;
  obterRodizioAtivoDoColaborador: (colaboradorId: string) => RodizioColaborador | undefined;
  obterRodiziosPorLojaDestino: (lojaId: string) => RodizioColaborador[];
  obterHistoricoRodiziosColaborador: (colaboradorId: string) => RodizioColaborador[];
  obterTimelineColaborador: (colaboradorId: string) => TimelineEntry[];
  colaboradorEmRodizio: (colaboradorId: string) => boolean;
  verificarExpiracaoRodizios: () => void;
}

// Mappers: Supabase row <-> LojaMockada
const mapSupabaseLoja = (row: any): LojaMockada => ({
  id: row.id,
  nome: row.nome,
  tipo: (row.tipo as TipoLoja) || 'Loja',
  endereco: row.endereco || '',
  telefone: row.telefone || '',
  email: row.email || '',
  ativa: row.ativa ?? true,
  data_criacao: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
});

const mapLojaToSupabase = (loja: Partial<LojaMockada>) => {
  const mapped: any = {};
  if (loja.nome !== undefined) mapped.nome = loja.nome;
  if (loja.tipo !== undefined) mapped.tipo = loja.tipo;
  if (loja.endereco !== undefined) mapped.endereco = loja.endereco;
  if (loja.telefone !== undefined) mapped.telefone = loja.telefone;
  if (loja.email !== undefined) mapped.email = loja.email;
  if (loja.ativa !== undefined) mapped.ativa = loja.ativa;
  // comissao_percentual: Online 6%, demais 10%
  if (loja.nome && loja.nome.toLowerCase().includes('online')) {
    mapped.comissao_percentual = 6;
  } else if (loja.nome) {
    mapped.comissao_percentual = 10;
  }
  return mapped;
};

// Mappers: Supabase row <-> ColaboradorMockado
const mapSupabaseColaborador = (row: any): ColaboradorMockado => ({
  id: row.id,
  nome: row.nome,
  cpf: row.cpf || '',
  email: row.email || '',
  telefone: row.telefone || '',
  loja_id: row.loja_id || '',
  cargo: row.cargo || '',
  data_admissao: row.data_admissao || '',
  salario_fixo: Number(row.salario_fixo) || 0,
  ajuda_custo: Number(row.ajuda_custo) || 0,
  comissao: Number(row.comissao) || 0,
  eh_gestor: row.eh_gestor ?? false,
  eh_vendedor: row.eh_vendedor ?? false,
  eh_estoquista: row.eh_estoquista ?? false,
  ativo: row.ativo ?? true,
  data_criacao: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
});

const mapColaboradorToSupabase = (col: Partial<ColaboradorMockado>) => {
  const mapped: any = {};
  if (col.nome !== undefined) mapped.nome = col.nome;
  if (col.cpf !== undefined) mapped.cpf = col.cpf;
  if (col.email !== undefined) mapped.email = col.email;
  if (col.telefone !== undefined) mapped.telefone = col.telefone;
  if (col.loja_id !== undefined) mapped.loja_id = col.loja_id || null;
  if (col.cargo !== undefined) mapped.cargo = col.cargo;
  if (col.data_admissao !== undefined) mapped.data_admissao = col.data_admissao || null;
  if (col.salario_fixo !== undefined) mapped.salario_fixo = col.salario_fixo;
  if (col.ajuda_custo !== undefined) mapped.ajuda_custo = col.ajuda_custo;
  if (col.comissao !== undefined) mapped.comissao = col.comissao;
  if (col.eh_gestor !== undefined) mapped.eh_gestor = col.eh_gestor;
  if (col.eh_vendedor !== undefined) mapped.eh_vendedor = col.eh_vendedor;
  if (col.eh_estoquista !== undefined) mapped.eh_estoquista = col.eh_estoquista;
  if (col.ativo !== undefined) mapped.ativo = col.ativo;
  return mapped;
};

export const useCadastroStore = create<CadastroStore>((set, get) => ({
  lojas: [],
  colaboradores: [],
  rodizios: [],
  inicializado: false,
  carregando: false,
  
  inicializarDadosMockados: () => {
    const state = get();
    if (state.inicializado || state.carregando) return;
    
    set({ carregando: true });
    
    // Carregar rodízios do localStorage (não migrados ainda)
    const rodiziosStorage = localStorage.getItem(RODIZIOS_KEY);
    const rodizios = rodiziosStorage ? JSON.parse(rodiziosStorage) as RodizioColaborador[] : [];
    
    // Carregar lojas e colaboradores do Supabase
    Promise.all([
      supabase.from('lojas').select('*').order('nome'),
      supabase.from('colaboradores').select('*').order('nome'),
    ]).then(([lojasRes, colaboradoresRes]) => {
      if (lojasRes.error) {
        console.error('Erro ao carregar lojas do Supabase:', lojasRes.error);
        set({ carregando: false });
        return;
      }
      if (colaboradoresRes.error) {
        console.error('Erro ao carregar colaboradores do Supabase:', colaboradoresRes.error);
        set({ carregando: false });
        return;
      }
      
      const lojas = (lojasRes.data || []).map(mapSupabaseLoja);
      const colaboradores = (colaboradoresRes.data || []).map(mapSupabaseColaborador);
      
      set({ lojas, colaboradores, rodizios, inicializado: true, carregando: false });
      
      // Verificar rodízios expirados
      setTimeout(() => get().verificarExpiracaoRodizios(), 100);
    }).catch(err => {
      console.error('Erro ao inicializar dados do Supabase:', err);
      set({ carregando: false });
    });
  },
  
  carregarDoLocalStorage: () => {
    // Agora redireciona para inicializar do Supabase
    get().inicializarDadosMockados();
  },
  
  // Lojas
  obterLojas: () => get().lojas,
  
  obterLojasPorTipo: (tipo: TipoLoja) => {
    return get().lojas.filter(loja => loja.tipo === tipo);
  },
  
  obterLojasAtivas: () => {
    return get().lojas.filter(loja => loja.ativa);
  },
  
  obterLojasTipoLoja: () => {
    return get().lojas.filter(loja => loja.tipo === 'Loja' && loja.ativa);
  },
  
  obterLojaMatriz: () => {
    return get().lojas.find(loja => loja.nome.toLowerCase().includes('matriz') && loja.tipo === 'Loja');
  },
  
  obterLojaOnline: () => {
    return get().lojas.find(loja => loja.nome.toLowerCase().includes('online') && loja.tipo === 'Loja');
  },
  
  obterLojaById: (id: string) => {
    return get().lojas.find(loja => loja.id === id);
  },
  
  adicionarLoja: async (loja) => {
    const supabaseData = {
      ...mapLojaToSupabase(loja),
      comissao_percentual: loja.nome?.toLowerCase().includes('online') ? 6 : 10,
    };
    
    const { data, error } = await supabase.from('lojas').insert(supabaseData).select().single();
    
    if (error) {
      console.error('Erro ao adicionar loja:', error);
      throw error;
    }
    
    const novaLoja = mapSupabaseLoja(data);
    set(state => ({ lojas: [...state.lojas, novaLoja] }));
    return novaLoja;
  },
  
  atualizarLoja: async (id, updates) => {
    const supabaseData = mapLojaToSupabase(updates);
    
    const { error } = await supabase.from('lojas').update(supabaseData).eq('id', id);
    
    if (error) {
      console.error('Erro ao atualizar loja:', error);
      throw error;
    }
    
    set(state => ({
      lojas: state.lojas.map(loja => 
        loja.id === id ? { ...loja, ...updates } : loja
      )
    }));
  },
  
  deletarLoja: async (id) => {
    const { error } = await supabase.from('lojas').delete().eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar loja:', error);
      throw error;
    }
    
    set(state => ({
      lojas: state.lojas.filter(loja => loja.id !== id)
    }));
  },
  
  // Colaboradores
  obterColaboradores: () => get().colaboradores,
  
  obterColaboradoresPorLoja: (lojaId: string) => {
    return get().colaboradores.filter(col => col.loja_id === lojaId);
  },
  
  obterColaboradoresPorCargo: (cargo: string) => {
    return get().colaboradores.filter(col => 
      col.cargo.toLowerCase().includes(cargo.toLowerCase())
    );
  },
  
  obterColaboradoresAtivos: () => {
    return get().colaboradores.filter(col => col.ativo);
  },
  
  obterColaboradorById: (id: string) => {
    return get().colaboradores.find(col => col.id === id);
  },
  
  obterGestores: () => {
    return get().colaboradores.filter(col => col.eh_gestor && col.ativo);
  },
  
  obterVendedores: () => {
    return get().colaboradores.filter(col => col.eh_vendedor && col.ativo);
  },
  
  obterEstoquistas: () => {
    return get().colaboradores.filter(col => col.eh_estoquista && col.ativo);
  },
  
  obterTecnicos: () => {
    return get().colaboradores.filter(col => 
      col.cargo.toLowerCase().includes('técnico') && col.ativo
    );
  },
  
  obterMotoboys: () => {
    return get().colaboradores.filter(col => 
      col.cargo.toLowerCase().includes('motoboy') && col.ativo
    );
  },
  
  obterFinanceiros: () => {
    return get().colaboradores.filter(col => 
      (col.cargo.toLowerCase().includes('financeiro') || 
       col.cargo.toLowerCase().includes('assistente administrativo') || 
       col.cargo.toLowerCase().includes('gestor')) && col.ativo
    );
  },
  
  obterAniversariantesDaSemana: () => {
    const hoje = new Date();
    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);
    
    return get().colaboradores.filter(col => {
      if (!col.ativo) return false;
      
      const [, mesNasc, diaNasc] = col.data_admissao.split('-').map(Number);
      const aniversarioEsteAno = new Date(hoje.getFullYear(), mesNasc - 1, diaNasc);
      
      if (aniversarioEsteAno < hoje) {
        aniversarioEsteAno.setFullYear(hoje.getFullYear() + 1);
      }
      
      return aniversarioEsteAno >= hoje && aniversarioEsteAno <= umaSemana;
    });
  },
  
  adicionarColaborador: async (colaborador) => {
    const supabaseData = mapColaboradorToSupabase(colaborador);
    
    const { data, error } = await supabase.from('colaboradores').insert(supabaseData).select().single();
    
    if (error) {
      console.error('Erro ao adicionar colaborador:', error);
      throw error;
    }
    
    const novoColaborador = mapSupabaseColaborador(data);
    set(state => ({ colaboradores: [...state.colaboradores, novoColaborador] }));
    return novoColaborador;
  },
  
  atualizarColaborador: async (id, updates) => {
    const supabaseData = mapColaboradorToSupabase(updates);
    
    const { error } = await supabase.from('colaboradores').update(supabaseData).eq('id', id);
    
    if (error) {
      console.error('Erro ao atualizar colaborador:', error);
      throw error;
    }
    
    set(state => ({
      colaboradores: state.colaboradores.map(col => 
        col.id === id ? { ...col, ...updates } : col
      )
    }));
  },
  
  deletarColaborador: async (id) => {
    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar colaborador:', error);
      throw error;
    }
    
    set(state => ({
      colaboradores: state.colaboradores.filter(col => col.id !== id)
    }));
  },
  
  // Lookup helpers
  obterNomeLoja: (lojaId: string) => {
    if (lojaId === 'geral-dinheiro') return 'Geral - Dinheiro';
    if (lojaId === 'geral-assistencia') return 'Geral - Assistência';
    const loja = get().lojas.find(l => l.id === lojaId);
    return loja?.nome || lojaId;
  },
  
  obterNomeColaborador: (colaboradorId: string) => {
    const colaborador = get().colaboradores.find(c => c.id === colaboradorId);
    return colaborador?.nome || colaboradorId;
  },
  
  obterContagemColaboradoresPorLoja: () => {
    const contagem: Record<string, number> = {};
    get().colaboradores.filter(c => c.ativo).forEach(col => {
      contagem[col.loja_id] = (contagem[col.loja_id] || 0) + 1;
    });
    return contagem;
  },
  
  // ===== RODÍZIO (ainda em localStorage) =====
  
  adicionarRodizio: (rodizio) => {
    const state = get();
    const colaborador = state.obterColaboradorById(rodizio.colaborador_id);
    const lojaOrigem = state.obterNomeLoja(rodizio.loja_origem_id);
    const lojaDestino = state.obterNomeLoja(rodizio.loja_destino_id);
    
    const novoRodizio: RodizioColaborador = {
      ...rodizio,
      id: `ROD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      data_criacao: new Date().toISOString()
    };
    
    set(state => {
      const novosRodizios = [...state.rodizios, novoRodizio];
      localStorage.setItem(RODIZIOS_KEY, JSON.stringify(novosRodizios));
      return { rodizios: novosRodizios };
    });
    
    const dataInicioFormatada = new Date(rodizio.data_inicio).toLocaleDateString('pt-BR');
    const dataFimFormatada = new Date(rodizio.data_fim).toLocaleDateString('pt-BR');
    
    registrarInicioRodizio(
      rodizio.colaborador_id,
      colaborador?.nome || '',
      lojaOrigem,
      lojaDestino,
      dataInicioFormatada,
      dataFimFormatada,
      rodizio.observacao,
      rodizio.criado_por_id,
      rodizio.criado_por_nome
    );
    
    return novoRodizio;
  },
  
  encerrarRodizio: (id, usuarioId, usuarioNome) => {
    const state = get();
    const rodizio = state.rodizios.find(r => r.id === id);
    if (!rodizio) return;
    
    set(state => {
      const novosRodizios = state.rodizios.map(r => 
        r.id === id ? { ...r, ativo: false } : r
      );
      localStorage.setItem(RODIZIOS_KEY, JSON.stringify(novosRodizios));
      return { rodizios: novosRodizios };
    });
    
    registrarEncerramentoRodizio(
      rodizio.colaborador_id,
      'Encerrado manualmente',
      usuarioId,
      usuarioNome
    );
  },
  
  obterRodizioAtivoDoColaborador: (colaboradorId) => {
    const hoje = new Date().toISOString().split('T')[0];
    return get().rodizios.find(r => 
      r.colaborador_id === colaboradorId && 
      r.ativo && 
      r.data_inicio <= hoje && 
      r.data_fim >= hoje
    );
  },
  
  obterRodiziosPorLojaDestino: (lojaId) => {
    const hoje = new Date().toISOString().split('T')[0];
    return get().rodizios.filter(r => 
      r.loja_destino_id === lojaId && 
      r.ativo && 
      r.data_inicio <= hoje && 
      r.data_fim >= hoje
    );
  },
  
  obterHistoricoRodiziosColaborador: (colaboradorId) => {
    return get().rodizios
      .filter(r => r.colaborador_id === colaboradorId)
      .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
  },
  
  obterTimelineColaborador: (colaboradorId) => {
    return getTimelineByEntidade(colaboradorId);
  },
  
  colaboradorEmRodizio: (colaboradorId) => {
    return !!get().obterRodizioAtivoDoColaborador(colaboradorId);
  },
  
  verificarExpiracaoRodizios: () => {
    const hoje = new Date().toISOString().split('T')[0];
    const state = get();
    
    const rodiziosExpirados = state.rodizios.filter(r => 
      r.ativo && r.data_fim < hoje
    );
    
    if (rodiziosExpirados.length > 0) {
      rodiziosExpirados.forEach(r => {
        registrarEncerramentoRodizio(
          r.colaborador_id,
          'Encerrado automaticamente - período finalizado',
          'sistema',
          'Sistema'
        );
      });
      
      set(state => {
        const novosRodizios = state.rodizios.map(r => 
          r.ativo && r.data_fim < hoje ? { ...r, ativo: false } : r
        );
        localStorage.setItem(RODIZIOS_KEY, JSON.stringify(novosRodizios));
        return { rodizios: novosRodizios };
      });
    }
  }
}));
