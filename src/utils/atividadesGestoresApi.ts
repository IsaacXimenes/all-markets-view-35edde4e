// Atividades dos Gestores API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Interfaces
export interface AtividadeCadastro {
  id: string;
  nome: string;
  tipoHorario: 'fixo' | 'aberto';
  horarioPrevisto?: string;
  pontuacaoBase: number;
  lojasAtribuidas: string[] | 'todas';
  ativa: boolean;
}

export interface ExecucaoAtividade {
  id: string;
  atividadeId: string;
  atividadeNome: string;
  data: string;
  lojaId: string;
  gestorId: string;
  gestorNome: string;
  executado: boolean;
  horarioExecutado?: string;
  pontuacao: number;
  status: 'pendente' | 'executado' | 'executado_com_atraso';
  tipoHorario: 'fixo' | 'aberto';
  horarioPrevisto?: string;
  colaboradorDesignadoId?: string;
  colaboradorDesignadoNome?: string;
}

export interface LogAtividade {
  id: string;
  modulo: string;
  atividadeId: string;
  atividadeNome: string;
  data: string;
  gestorId: string;
  gestorNome: string;
  acao: 'marcou' | 'desmarcou';
  pontuacao: number;
  dataHora: string;
  detalhes: string;
}

// ── Cache layer ──
let _atividadesCache: AtividadeCadastro[] = [];
let _execucoesCache: ExecucaoAtividade[] = [];
let _logsCache: LogAtividade[] = [];
let _atividadesCacheLoaded = false;

const MOCK_ATIVIDADES: AtividadeCadastro[] = [
  { id: 'ATV-001', nome: 'Abertura de Caixa', tipoHorario: 'fixo', horarioPrevisto: '09:00', pontuacaoBase: 1, lojasAtribuidas: 'todas', ativa: true },
  { id: 'ATV-002', nome: 'Verificação de Estoque', tipoHorario: 'aberto', pontuacaoBase: 1, lojasAtribuidas: 'todas', ativa: true },
  { id: 'ATV-003', nome: 'Conferência de Vitrine', tipoHorario: 'fixo', horarioPrevisto: '10:00', pontuacaoBase: 1, lojasAtribuidas: 'todas', ativa: true },
  { id: 'ATV-004', nome: 'Relatório de Vendas do Dia Anterior', tipoHorario: 'fixo', horarioPrevisto: '09:30', pontuacaoBase: 1, lojasAtribuidas: 'todas', ativa: true },
  { id: 'ATV-005', nome: 'Alinhamento com Equipe', tipoHorario: 'aberto', pontuacaoBase: 1, lojasAtribuidas: 'todas', ativa: true },
  { id: 'ATV-006', nome: 'Fechamento de Caixa', tipoHorario: 'fixo', horarioPrevisto: '18:00', pontuacaoBase: 1, lojasAtribuidas: 'todas', ativa: true },
  { id: 'ATV-007', nome: 'Envio de Relatório Final', tipoHorario: 'fixo', horarioPrevisto: '18:30', pontuacaoBase: 1, lojasAtribuidas: 'todas', ativa: true },
  { id: 'ATV-008', nome: 'Conferir Lançamentos da Assistência', tipoHorario: 'fixo', horarioPrevisto: '10:00', pontuacaoBase: 1, lojasAtribuidas: 'todas', ativa: true },
];

// ── Mappers ──
const mapAtividade = (r: any): AtividadeCadastro => ({
  id: r.id,
  nome: r.nome,
  tipoHorario: (r.tipo_horario || 'aberto') as 'fixo' | 'aberto',
  horarioPrevisto: r.horario_previsto || undefined,
  pontuacaoBase: r.pontuacao_base ?? 1,
  lojasAtribuidas: r.lojas_atribuidas ?? 'todas',
  ativa: r.ativa ?? true,
});

const mapExecucao = (r: any): ExecucaoAtividade => ({
  id: r.id,
  atividadeId: r.atividade_id,
  atividadeNome: r.atividade_nome || '',
  data: r.data,
  lojaId: r.loja_id || '',
  gestorId: r.gestor_id || '',
  gestorNome: r.gestor_nome || '',
  executado: r.executado ?? false,
  horarioExecutado: r.horario_executado || undefined,
  pontuacao: Number(r.pontuacao) || 0,
  status: (r.status || 'pendente') as ExecucaoAtividade['status'],
  tipoHorario: (r.tipo_horario || 'aberto') as 'fixo' | 'aberto',
  horarioPrevisto: r.horario_previsto || undefined,
  colaboradorDesignadoId: r.colaborador_designado_id || undefined,
  colaboradorDesignadoNome: r.colaborador_designado_nome || undefined,
});

const mapLog = (r: any): LogAtividade => ({
  id: r.id,
  modulo: r.modulo || 'Atividades Gestores',
  atividadeId: r.atividade_id || '',
  atividadeNome: r.atividade_nome || '',
  data: r.data || '',
  gestorId: r.gestor_id || '',
  gestorNome: r.gestor_nome || '',
  acao: (r.acao || 'marcou') as 'marcou' | 'desmarcou',
  pontuacao: Number(r.pontuacao) || 0,
  dataHora: r.data_hora || '',
  detalhes: r.detalhes || '',
});

// ── Init caches ──
export const initAtividadesGestoresCache = async () => {
  const [atvRes, logsRes] = await Promise.all([
    supabase.from('atividades_gestores').select('*').order('created_at'),
    supabase.from('logs_atividades').select('*').order('data_hora', { ascending: false }).limit(500),
  ]);

  if (atvRes.error) console.error('[ATV] init error', atvRes.error);
  if (logsRes.error) console.error('[ATV-LOGS] init error', logsRes.error);

  _atividadesCache = (atvRes.data || []).map(mapAtividade);
  _logsCache = (logsRes.data || []).map(mapLog);

  // Seed if empty
  if (_atividadesCache.length === 0) {
    for (const mock of MOCK_ATIVIDADES) {
      const { data } = await supabase.from('atividades_gestores').insert({
        nome: mock.nome,
        tipo_horario: mock.tipoHorario,
        horario_previsto: mock.horarioPrevisto || null,
        pontuacao_base: mock.pontuacaoBase,
        lojas_atribuidas: mock.lojasAtribuidas as any,
        ativa: mock.ativa,
      }).select().single();
      if (data) _atividadesCache.push(mapAtividade(data));
    }
  }

  _atividadesCacheLoaded = true;
};

// Auto-init
initAtividadesGestoresCache();

// === CRUD Atividades ===
export const getAtividades = (): AtividadeCadastro[] => [..._atividadesCache];

export const addAtividade = async (data: Omit<AtividadeCadastro, 'id'>): Promise<AtividadeCadastro> => {
  const { data: row, error } = await supabase.from('atividades_gestores').insert({
    nome: data.nome,
    tipo_horario: data.tipoHorario,
    horario_previsto: data.horarioPrevisto || null,
    pontuacao_base: data.pontuacaoBase,
    lojas_atribuidas: data.lojasAtribuidas as any,
    ativa: data.ativa,
  }).select().single();
  if (error) throw error;
  const mapped = mapAtividade(row);
  _atividadesCache.push(mapped);
  return mapped;
};

export const updateAtividade = async (id: string, updates: Partial<AtividadeCadastro>): Promise<void> => {
  const dbUpdates: any = {};
  if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
  if (updates.tipoHorario !== undefined) dbUpdates.tipo_horario = updates.tipoHorario;
  if (updates.horarioPrevisto !== undefined) dbUpdates.horario_previsto = updates.horarioPrevisto || null;
  if (updates.pontuacaoBase !== undefined) dbUpdates.pontuacao_base = updates.pontuacaoBase;
  if (updates.lojasAtribuidas !== undefined) dbUpdates.lojas_atribuidas = updates.lojasAtribuidas as any;
  if (updates.ativa !== undefined) dbUpdates.ativa = updates.ativa;

  const { error } = await supabase.from('atividades_gestores').update(dbUpdates).eq('id', id);
  if (error) throw error;
  const idx = _atividadesCache.findIndex(a => a.id === id);
  if (idx >= 0) _atividadesCache[idx] = { ..._atividadesCache[idx], ...updates };
};

export const deleteAtividade = async (id: string): Promise<void> => {
  const { error } = await supabase.from('atividades_gestores').delete().eq('id', id);
  if (error) throw error;
  _atividadesCache = _atividadesCache.filter(a => a.id !== id);
};

// === Execução Diária ===
export const getExecucoesDoDia = (data: string, lojaId?: string): ExecucaoAtividade[] => {
  let execucoes = _execucoesCache.filter(e => e.data === data);

  const atividades = getAtividades().filter(a => a.ativa);
  const atividadesParaLoja = atividades.filter(a => {
    if (a.lojasAtribuidas === 'todas') return true;
    return lojaId ? (a.lojasAtribuidas as string[]).includes(lojaId) : true;
  });

  // Criar execuções faltantes em memória (serão persistidas ao toggle)
  for (const atv of atividadesParaLoja) {
    const existe = execucoes.find(e => e.atividadeId === atv.id && (!lojaId || e.lojaId === lojaId));
    if (!existe && lojaId) {
      const nova: ExecucaoAtividade = {
        id: `EXEC-${atv.id}-${lojaId}-${data}`,
        atividadeId: atv.id,
        atividadeNome: atv.nome,
        data,
        lojaId,
        gestorId: '',
        gestorNome: '',
        executado: false,
        pontuacao: 0,
        status: 'pendente',
        tipoHorario: atv.tipoHorario,
        horarioPrevisto: atv.horarioPrevisto,
      };
      execucoes.push(nova);
    }
  }

  if (lojaId) return execucoes.filter(e => e.lojaId === lojaId);
  return execucoes;
};

export const loadExecucoesDoDia = async (data: string): Promise<void> => {
  const { data: rows, error } = await supabase
    .from('execucoes_atividades')
    .select('*')
    .eq('data', data);
  if (error) { console.error('[EXEC] load error', error); return; }
  // Remove old entries for this date, add fresh ones
  _execucoesCache = _execucoesCache.filter(e => e.data !== data);
  _execucoesCache.push(...(rows || []).map(mapExecucao));
};

export const toggleExecucao = async (
  data: string,
  atividadeId: string,
  lojaId: string,
  gestorId: string,
  gestorNome: string
): Promise<ExecucaoAtividade> => {
  // Find or create in cache
  let exec = _execucoesCache.find(e => e.atividadeId === atividadeId && e.lojaId === lojaId && e.data === data);
  const atividade = getAtividades().find(a => a.id === atividadeId);
  const agora = new Date();
  const novoExecutado = exec ? !exec.executado : true;

  let pontuacao = 0;
  let status: ExecucaoAtividade['status'] = 'pendente';

  if (novoExecutado && atividade) {
    if (atividade.tipoHorario === 'fixo' && atividade.horarioPrevisto) {
      const [h, m] = atividade.horarioPrevisto.split(':').map(Number);
      const limitDate = new Date();
      limitDate.setHours(h, m, 59, 999);
      if (agora <= limitDate) {
        pontuacao = atividade.pontuacaoBase;
        status = 'executado';
      } else {
        pontuacao = atividade.pontuacaoBase * 0.5;
        status = 'executado_com_atraso';
      }
    } else {
      pontuacao = atividade?.pontuacaoBase ?? 1;
      status = 'executado';
    }
  }

  const updatedFields = {
    executado: novoExecutado,
    horario_executado: novoExecutado ? agora.toISOString() : null,
    pontuacao,
    status,
    gestor_id: gestorId,
    gestor_nome: gestorNome,
  };

  if (exec && !exec.id.startsWith('EXEC-')) {
    // Existing DB record - update
    const { data: row, error } = await supabase
      .from('execucoes_atividades')
      .update(updatedFields)
      .eq('id', exec.id)
      .select().single();
    if (error) throw error;
    const mapped = mapExecucao(row);
    const idx = _execucoesCache.findIndex(e => e.id === exec!.id);
    if (idx >= 0) _execucoesCache[idx] = mapped;
    exec = mapped;
  } else {
    // New - insert
    const { data: row, error } = await supabase
      .from('execucoes_atividades')
      .insert({
        atividade_id: atividadeId,
        atividade_nome: atividade?.nome || '',
        data,
        loja_id: lojaId,
        tipo_horario: atividade?.tipoHorario || 'aberto',
        horario_previsto: atividade?.horarioPrevisto || null,
        ...updatedFields,
      })
      .select().single();
    if (error) throw error;
    const mapped = mapExecucao(row);
    // Remove placeholder
    _execucoesCache = _execucoesCache.filter(e => !(e.atividadeId === atividadeId && e.lojaId === lojaId && e.data === data));
    _execucoesCache.push(mapped);
    exec = mapped;
  }

  // Log
  const logEntry = {
    modulo: 'Atividades Gestores',
    atividade_id: atividadeId,
    atividade_nome: exec.atividadeNome,
    data,
    gestor_id: gestorId,
    gestor_nome: gestorNome,
    acao: novoExecutado ? 'marcou' : 'desmarcou',
    pontuacao,
    data_hora: agora.toISOString(),
    detalhes: novoExecutado
      ? `Atividade "${exec.atividadeNome}" marcada como executada. Pontuação: ${pontuacao}. Status: ${status === 'executado_com_atraso' ? 'Executado com Atraso' : 'Executado'}${exec.colaboradorDesignadoNome ? `. Colaborador designado: ${exec.colaboradorDesignadoNome}` : ''}`
      : `Atividade "${exec.atividadeNome}" desmarcada. Pontuação zerada.`,
  };

  const { data: logRow } = await supabase.from('logs_atividades').insert(logEntry).select().single();
  if (logRow) _logsCache.unshift(mapLog(logRow));

  return exec;
};

// === Atualizar Colaborador Designado ===
export const atualizarColaboradorExecucao = async (
  data: string,
  atividadeId: string,
  lojaId: string,
  colaboradorId: string,
  colaboradorNome: string
): Promise<void> => {
  const exec = _execucoesCache.find(e => e.atividadeId === atividadeId && e.lojaId === lojaId && e.data === data);
  if (!exec) return;

  if (!exec.id.startsWith('EXEC-')) {
    await supabase.from('execucoes_atividades').update({
      colaborador_designado_id: colaboradorId || null,
      colaborador_designado_nome: colaboradorNome || null,
    }).eq('id', exec.id);
  }

  const idx = _execucoesCache.findIndex(e => e.id === exec.id);
  if (idx >= 0) {
    _execucoesCache[idx] = {
      ..._execucoesCache[idx],
      colaboradorDesignadoId: colaboradorId || undefined,
      colaboradorDesignadoNome: colaboradorNome || undefined,
    };
  }
};

// === Logs ===
export const getLogsAtividades = (): LogAtividade[] => [..._logsCache];

// === Dashboard helpers ===
export const calcularResumoExecucao = (execucoes: ExecucaoAtividade[]) => {
  const total = execucoes.length;
  const executados = execucoes.filter(e => e.executado).length;
  const pontuacaoObtida = execucoes.reduce((acc, e) => acc + e.pontuacao, 0);
  const pontuacaoMaxima = execucoes.reduce((acc, e) => {
    const atv = getAtividades().find(a => a.id === e.atividadeId);
    return acc + (atv?.pontuacaoBase ?? 1);
  }, 0);
  const percentual = total > 0 ? Math.round((executados / total) * 100) : 0;
  return { total, executados, pontuacaoObtida, pontuacaoMaxima, percentual };
};

export interface RankingGestor {
  gestorId: string;
  gestorNome: string;
  pontuacaoTotal: number;
  atividadesExecutadas: number;
  atividadesTotal: number;
  percentual: number;
}

export const calcularRankingGestores = async (dataInicio: string, dataFim: string, lojaId?: string): Promise<RankingGestor[]> => {
  const { data: rows } = await supabase
    .from('execucoes_atividades')
    .select('*')
    .gte('data', dataInicio)
    .lte('data', dataFim);

  const execucoes: ExecucaoAtividade[] = (rows || []).map(mapExecucao);
  const ranking = new Map<string, RankingGestor>();

  for (const exec of execucoes) {
    if (lojaId && exec.lojaId !== lojaId) continue;
    if (!exec.gestorId) continue;

    const existing = ranking.get(exec.gestorId) || {
      gestorId: exec.gestorId,
      gestorNome: exec.gestorNome,
      pontuacaoTotal: 0,
      atividadesExecutadas: 0,
      atividadesTotal: 0,
      percentual: 0,
    };

    existing.atividadesTotal++;
    if (exec.executado) {
      existing.atividadesExecutadas++;
      existing.pontuacaoTotal += exec.pontuacao;
    }
    existing.percentual = existing.atividadesTotal > 0
      ? Math.round((existing.atividadesExecutadas / existing.atividadesTotal) * 100) : 0;
    ranking.set(exec.gestorId, existing);
  }

  return Array.from(ranking.values()).sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);
};

export interface ExecucaoPorLoja {
  lojaId: string;
  lojaNome: string;
  executadas: number;
  total: number;
  percentual: number;
  pontuacaoMedia: number;
}

export const calcularExecucaoPorLoja = async (dataInicio: string, dataFim: string, getLojaNome: (id: string) => string): Promise<ExecucaoPorLoja[]> => {
  const { data: rows } = await supabase
    .from('execucoes_atividades')
    .select('*')
    .gte('data', dataInicio)
    .lte('data', dataFim);

  const execucoes: ExecucaoAtividade[] = (rows || []).map(mapExecucao);
  const porLoja = new Map<string, { executadas: number; total: number; pontuacao: number }>();

  for (const exec of execucoes) {
    const existing = porLoja.get(exec.lojaId) || { executadas: 0, total: 0, pontuacao: 0 };
    existing.total++;
    if (exec.executado) {
      existing.executadas++;
      existing.pontuacao += exec.pontuacao;
    }
    porLoja.set(exec.lojaId, existing);
  }

  return Array.from(porLoja.entries()).map(([lojaId, d]) => ({
    lojaId,
    lojaNome: getLojaNome(lojaId),
    executadas: d.executadas,
    total: d.total,
    percentual: d.total > 0 ? Math.round((d.executadas / d.total) * 100) : 0,
    pontuacaoMedia: d.total > 0 ? Math.round((d.pontuacao / d.total) * 100) / 100 : 0,
  })).sort((a, b) => b.percentual - a.percentual);
};
