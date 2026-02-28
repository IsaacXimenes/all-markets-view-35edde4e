import { create } from 'zustand';
import { LojaMockada, ColaboradorMockado, TipoLoja, RodizioColaborador } from '../types/mockData';
import { registrarInicioRodizio, registrarEncerramentoRodizio, getTimelineByEntidade, TimelineEntry } from '../utils/timelineApi';
import { supabase } from '@/integrations/supabase/client';

interface CadastroStore {
  lojas: LojaMockada[];
  colaboradores: ColaboradorMockado[];
  rodizios: RodizioColaborador[];
  inicializado: boolean;
  carregando: boolean;
  
  // Ações
  inicializarDados: () => void;
  
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
  adicionarRodizio: (rodizio: Omit<RodizioColaborador, 'id' | 'data_criacao'>) => Promise<RodizioColaborador>;
  encerrarRodizio: (id: string, usuarioId: string, usuarioNome: string) => Promise<void>;
  obterRodizioAtivoDoColaborador: (colaboradorId: string) => RodizioColaborador | undefined;
  obterRodiziosPorLojaDestino: (lojaId: string) => RodizioColaborador[];
  obterHistoricoRodiziosColaborador: (colaboradorId: string) => RodizioColaborador[];
  obterTimelineColaborador: (colaboradorId: string) => TimelineEntry[];
  colaboradorEmRodizio: (colaboradorId: string) => boolean;
  verificarExpiracaoRodizios: () => Promise<void>;
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

// Mapper: Supabase row <-> RodizioColaborador
const mapSupabaseRodizio = (row: any): RodizioColaborador => ({
  id: row.id,
  colaborador_id: row.colaborador_id,
  loja_origem_id: row.loja_origem_id,
  loja_destino_id: row.loja_destino_id,
  data_inicio: row.data_inicio,
  data_fim: row.data_fim,
  observacao: row.observacao || '',
  ativo: row.ativo ?? true,
  criado_por_id: row.criado_por_id || '',
  criado_por_nome: row.criado_por_nome || '',
  data_criacao: row.created_at || new Date().toISOString(),
});

export const useCadastroStore = create<CadastroStore>((set, get) => ({
  lojas: [],
  colaboradores: [],
  rodizios: [],
  inicializado: false,
  carregando: false,
  
  inicializarDados: () => {
    const state = get();
    if (state.inicializado || state.carregando) return;
    
    set({ carregando: true });
    
    Promise.all([
      supabase.from('lojas').select('*').order('nome'),
      supabase.from('colaboradores').select('*').order('nome'),
      supabase.from('rodizios_colaboradores').select('*').order('created_at', { ascending: false }),
    ]).then(([lojasRes, colaboradoresRes, rodiziosRes]) => {
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
      if (rodiziosRes.error) {
        console.error('Erro ao carregar rodízios do Supabase:', rodiziosRes.error);
      }
      
      const lojas = (lojasRes.data || []).map(mapSupabaseLoja);
      const colaboradores = (colaboradoresRes.data || []).map(mapSupabaseColaborador);
      const rodizios = (rodiziosRes.data || []).map(mapSupabaseRodizio);
      
      set({ lojas, colaboradores, rodizios, inicializado: true, carregando: false });
      
      setTimeout(() => get().verificarExpiracaoRodizios(), 100);
    }).catch(err => {
      console.error('Erro ao inicializar dados do Supabase:', err);
      set({ carregando: false });
    });
  },
  
  // Lojas
  obterLojas: () => get().lojas,
  obterLojasPorTipo: (tipo: TipoLoja) => get().lojas.filter(loja => loja.tipo === tipo),
  obterLojasAtivas: () => get().lojas.filter(loja => loja.ativa),
  obterLojasTipoLoja: () => get().lojas.filter(loja => loja.tipo === 'Loja' && loja.ativa),
  obterLojaMatriz: () => get().lojas.find(loja => loja.nome.toLowerCase().includes('matriz') && loja.tipo === 'Loja'),
  obterLojaOnline: () => get().lojas.find(loja => loja.nome.toLowerCase().includes('online') && loja.tipo === 'Loja'),
  obterLojaById: (id: string) => get().lojas.find(loja => loja.id === id),
  
  adicionarLoja: async (loja) => {
    const supabaseData = {
      ...mapLojaToSupabase(loja),
      comissao_percentual: loja.nome?.toLowerCase().includes('online') ? 6 : 10,
    };
    const { data, error } = await supabase.from('lojas').insert(supabaseData).select().single();
    if (error) throw error;
    const novaLoja = mapSupabaseLoja(data);
    set(state => ({ lojas: [...state.lojas, novaLoja] }));
    return novaLoja;
  },
  
  atualizarLoja: async (id, updates) => {
    const supabaseData = mapLojaToSupabase(updates);
    const { error } = await supabase.from('lojas').update(supabaseData).eq('id', id);
    if (error) throw error;
    set(state => ({ lojas: state.lojas.map(loja => loja.id === id ? { ...loja, ...updates } : loja) }));
  },
  
  deletarLoja: async (id) => {
    const { error } = await supabase.from('lojas').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ lojas: state.lojas.filter(loja => loja.id !== id) }));
  },
  
  // Colaboradores
  obterColaboradores: () => get().colaboradores,
  obterColaboradoresPorLoja: (lojaId: string) => get().colaboradores.filter(col => col.loja_id === lojaId),
  obterColaboradoresPorCargo: (cargo: string) => get().colaboradores.filter(col => col.cargo.toLowerCase().includes(cargo.toLowerCase())),
  obterColaboradoresAtivos: () => get().colaboradores.filter(col => col.ativo),
  obterColaboradorById: (id: string) => get().colaboradores.find(col => col.id === id),
  obterGestores: () => get().colaboradores.filter(col => col.eh_gestor && col.ativo),
  obterVendedores: () => get().colaboradores.filter(col => col.eh_vendedor && col.ativo),
  obterEstoquistas: () => get().colaboradores.filter(col => col.eh_estoquista && col.ativo),
  obterTecnicos: () => get().colaboradores.filter(col => col.cargo.toLowerCase().includes('técnico') && col.ativo),
  obterMotoboys: () => get().colaboradores.filter(col => col.cargo.toLowerCase().includes('motoboy') && col.ativo),
  obterFinanceiros: () => get().colaboradores.filter(col => (col.cargo.toLowerCase().includes('financeiro') || col.cargo.toLowerCase().includes('assistente administrativo') || col.cargo.toLowerCase().includes('gestor')) && col.ativo),
  
  obterAniversariantesDaSemana: () => {
    const hoje = new Date();
    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);
    return get().colaboradores.filter(col => {
      if (!col.ativo) return false;
      const [, mesNasc, diaNasc] = col.data_admissao.split('-').map(Number);
      const aniversarioEsteAno = new Date(hoje.getFullYear(), mesNasc - 1, diaNasc);
      if (aniversarioEsteAno < hoje) aniversarioEsteAno.setFullYear(hoje.getFullYear() + 1);
      return aniversarioEsteAno >= hoje && aniversarioEsteAno <= umaSemana;
    });
  },
  
  adicionarColaborador: async (colaborador) => {
    const supabaseData = mapColaboradorToSupabase(colaborador);
    const { data, error } = await supabase.from('colaboradores').insert(supabaseData).select().single();
    if (error) throw error;
    const novoColaborador = mapSupabaseColaborador(data);
    set(state => ({ colaboradores: [...state.colaboradores, novoColaborador] }));
    return novoColaborador;
  },
  
  atualizarColaborador: async (id, updates) => {
    const supabaseData = mapColaboradorToSupabase(updates);
    const { error } = await supabase.from('colaboradores').update(supabaseData).eq('id', id);
    if (error) throw error;
    set(state => ({ colaboradores: state.colaboradores.map(col => col.id === id ? { ...col, ...updates } : col) }));
  },
  
  deletarColaborador: async (id) => {
    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ colaboradores: state.colaboradores.filter(col => col.id !== id) }));
  },
  
  // Lookup helpers
  obterNomeLoja: (lojaId: string) => {
    if (lojaId === 'geral-dinheiro') return 'Geral - Dinheiro';
    if (lojaId === 'geral-assistencia') return 'Geral - Assistência';
    return get().lojas.find(l => l.id === lojaId)?.nome || lojaId;
  },
  obterNomeColaborador: (colaboradorId: string) => get().colaboradores.find(c => c.id === colaboradorId)?.nome || colaboradorId,
  obterContagemColaboradoresPorLoja: () => {
    const contagem: Record<string, number> = {};
    get().colaboradores.filter(c => c.ativo).forEach(col => {
      contagem[col.loja_id] = (contagem[col.loja_id] || 0) + 1;
    });
    return contagem;
  },
  
  // ===== RODÍZIO (Supabase) =====
  
  adicionarRodizio: async (rodizio) => {
    const state = get();
    const colaborador = state.obterColaboradorById(rodizio.colaborador_id);
    const lojaOrigem = state.obterNomeLoja(rodizio.loja_origem_id);
    const lojaDestino = state.obterNomeLoja(rodizio.loja_destino_id);
    
    const { data, error } = await supabase.from('rodizios_colaboradores').insert({
      colaborador_id: rodizio.colaborador_id,
      loja_origem_id: rodizio.loja_origem_id,
      loja_destino_id: rodizio.loja_destino_id,
      data_inicio: rodizio.data_inicio,
      data_fim: rodizio.data_fim,
      observacao: rodizio.observacao || '',
      ativo: rodizio.ativo ?? true,
      criado_por_id: rodizio.criado_por_id || '',
      criado_por_nome: rodizio.criado_por_nome || '',
    }).select().single();
    
    if (error) throw error;
    
    const novoRodizio = mapSupabaseRodizio(data);
    set(state => ({ rodizios: [novoRodizio, ...state.rodizios] }));
    
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
  
  encerrarRodizio: async (id, usuarioId, usuarioNome) => {
    const state = get();
    const rodizio = state.rodizios.find(r => r.id === id);
    if (!rodizio) return;
    
    const { error } = await supabase.from('rodizios_colaboradores').update({ ativo: false }).eq('id', id);
    if (error) throw error;
    
    set(state => ({
      rodizios: state.rodizios.map(r => r.id === id ? { ...r, ativo: false } : r)
    }));
    
    registrarEncerramentoRodizio(
      rodizio.colaborador_id,
      'Encerrado manualmente',
      usuarioId,
      usuarioNome
    );
  },
  
  obterRodizioAtivoDoColaborador: (colaboradorId) => {
    const hoje = new Date().toISOString().split('T')[0];
    return get().rodizios.find(r => r.colaborador_id === colaboradorId && r.ativo && r.data_inicio <= hoje && r.data_fim >= hoje);
  },
  
  obterRodiziosPorLojaDestino: (lojaId) => {
    const hoje = new Date().toISOString().split('T')[0];
    return get().rodizios.filter(r => r.loja_destino_id === lojaId && r.ativo && r.data_inicio <= hoje && r.data_fim >= hoje);
  },
  
  obterHistoricoRodiziosColaborador: (colaboradorId) => {
    return get().rodizios
      .filter(r => r.colaborador_id === colaboradorId)
      .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
  },
  
  obterTimelineColaborador: (colaboradorId) => getTimelineByEntidade(colaboradorId),
  colaboradorEmRodizio: (colaboradorId) => !!get().obterRodizioAtivoDoColaborador(colaboradorId),
  
  verificarExpiracaoRodizios: async () => {
    const hoje = new Date().toISOString().split('T')[0];
    const state = get();
    
    const rodiziosExpirados = state.rodizios.filter(r => r.ativo && r.data_fim < hoje);
    
    if (rodiziosExpirados.length > 0) {
      // Update all expired in DB
      const ids = rodiziosExpirados.map(r => r.id);
      await supabase.from('rodizios_colaboradores').update({ ativo: false }).in('id', ids);
      
      rodiziosExpirados.forEach(r => {
        registrarEncerramentoRodizio(
          r.colaborador_id,
          'Encerrado automaticamente - período finalizado',
          'sistema',
          'Sistema'
        );
      });
      
      set(state => ({
        rodizios: state.rodizios.map(r => r.ativo && r.data_fim < hoje ? { ...r, ativo: false } : r)
      }));
    }
  }
}));
