// Salário Colaborador API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';
import { getColaboradores, Colaborador } from './cadastrosApi';
import { getComissaoColaboradorPorLoja } from './comissaoPorLojaApi';

export interface SalarioColaborador {
  id: string;
  colaboradorId: string;
  salarioFixo: number;
  ajudaCusto: number;
  percentualComissao: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricoSalario {
  id: string;
  salarioId: string;
  colaboradorId: string;
  usuarioId: string;
  usuarioNome: string;
  campoAlterado: 'Salário Fixo' | 'Ajuda de Custo' | 'Comissão';
  valorAnterior: string | null;
  valorNovo: string;
  tipoAcao: 'Criação' | 'Edição';
  createdAt: string;
}

// ── Cache layer ──
let salariosCache: SalarioColaborador[] = [];
let historicoCache: HistoricoSalario[] = [];

const mapSalarioRow = (r: any): SalarioColaborador => ({
  id: r.id,
  colaboradorId: r.colaborador_id,
  salarioFixo: Number(r.salario_fixo) || 0,
  ajudaCusto: Number(r.ajuda_custo) || 0,
  percentualComissao: Number(r.percentual_comissao) || 0,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapHistoricoRow = (r: any): HistoricoSalario => ({
  id: r.id,
  salarioId: r.salario_id || '',
  colaboradorId: r.colaborador_id || '',
  usuarioId: r.usuario_id || '',
  usuarioNome: r.usuario_nome || '',
  campoAlterado: r.campo_alterado || 'Salário Fixo',
  valorAnterior: r.valor_anterior,
  valorNovo: r.valor_novo || '',
  tipoAcao: r.tipo_acao || 'Edição',
  createdAt: r.created_at,
});

export const initSalariosCache = async () => {
  const [salRes, histRes] = await Promise.all([
    supabase.from('salarios_colaboradores').select('*'),
    supabase.from('historico_salarios').select('*').order('created_at', { ascending: false }),
  ]);
  if (salRes.data) salariosCache = salRes.data.map(mapSalarioRow);
  if (histRes.data) historicoCache = histRes.data.map(mapHistoricoRow);
};

// Auto-init
initSalariosCache();

// CRUD Operations
export const getSalarios = (): SalarioColaborador[] => [...salariosCache];

export const getSalarioById = (id: string): SalarioColaborador | undefined =>
  salariosCache.find(s => s.id === id);

export const getSalarioByColaboradorId = (colaboradorId: string): SalarioColaborador | undefined =>
  salariosCache.find(s => s.colaboradorId === colaboradorId);

export const addSalario = async (
  colaboradorId: string,
  salarioFixo: number,
  ajudaCusto: number,
  percentualComissao: number,
  usuarioId: string = 'SISTEMA',
  usuarioNome: string = 'Sistema'
): Promise<SalarioColaborador> => {
  const existente = getSalarioByColaboradorId(colaboradorId);
  if (existente) throw new Error('Já existe um salário configurado para este colaborador');

  const { data, error } = await supabase.from('salarios_colaboradores').insert({
    colaborador_id: colaboradorId,
    salario_fixo: salarioFixo,
    ajuda_custo: ajudaCusto,
    percentual_comissao: percentualComissao,
  }).select().single();
  if (error) throw error;
  const mapped = mapSalarioRow(data);
  salariosCache.push(mapped);

  // Registrar histórico
  const camposHistorico = [
    { campo: 'Salário Fixo', valor: `R$ ${salarioFixo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    { campo: 'Ajuda de Custo', valor: `R$ ${ajudaCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    { campo: 'Comissão', valor: `${percentualComissao}%` }
  ];
  for (const { campo, valor } of camposHistorico) {
    const { data: hData } = await supabase.from('historico_salarios').insert({
      salario_id: mapped.id,
      colaborador_id: colaboradorId,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      campo_alterado: campo,
      valor_anterior: null,
      valor_novo: valor,
      tipo_acao: 'Criação',
    }).select().single();
    if (hData) historicoCache.unshift(mapHistoricoRow(hData));
  }

  return mapped;
};

export const updateSalario = async (
  colaboradorId: string,
  updates: Partial<Pick<SalarioColaborador, 'salarioFixo' | 'ajudaCusto' | 'percentualComissao'>>,
  usuarioId: string = 'SISTEMA',
  usuarioNome: string = 'Sistema'
): Promise<SalarioColaborador | null> => {
  const salarioAtual = salariosCache.find(s => s.colaboradorId === colaboradorId);
  if (!salarioAtual) return null;

  const dbUpdates: any = {};
  if (updates.salarioFixo !== undefined) dbUpdates.salario_fixo = updates.salarioFixo;
  if (updates.ajudaCusto !== undefined) dbUpdates.ajuda_custo = updates.ajudaCusto;
  if (updates.percentualComissao !== undefined) dbUpdates.percentual_comissao = updates.percentualComissao;
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('salarios_colaboradores').update(dbUpdates).eq('colaborador_id', colaboradorId).select().single();
  if (error || !data) return null;
  const mapped = mapSalarioRow(data);
  const idx = salariosCache.findIndex(s => s.colaboradorId === colaboradorId);
  if (idx >= 0) salariosCache[idx] = mapped;

  // Registrar histórico
  const changes: Array<{ campo: string; anterior: string; novo: string }> = [];
  if (updates.salarioFixo !== undefined && updates.salarioFixo !== salarioAtual.salarioFixo)
    changes.push({ campo: 'Salário Fixo', anterior: `R$ ${salarioAtual.salarioFixo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, novo: `R$ ${updates.salarioFixo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` });
  if (updates.ajudaCusto !== undefined && updates.ajudaCusto !== salarioAtual.ajudaCusto)
    changes.push({ campo: 'Ajuda de Custo', anterior: `R$ ${salarioAtual.ajudaCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, novo: `R$ ${updates.ajudaCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` });
  if (updates.percentualComissao !== undefined && updates.percentualComissao !== salarioAtual.percentualComissao)
    changes.push({ campo: 'Comissão', anterior: `${salarioAtual.percentualComissao}%`, novo: `${updates.percentualComissao}%` });

  for (const c of changes) {
    const { data: hData } = await supabase.from('historico_salarios').insert({
      salario_id: salarioAtual.id,
      colaborador_id: colaboradorId,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      campo_alterado: c.campo,
      valor_anterior: c.anterior,
      valor_novo: c.novo,
      tipo_acao: 'Edição',
    }).select().single();
    if (hData) historicoCache.unshift(mapHistoricoRow(hData));
  }

  return mapped;
};

export const deleteSalario = async (colaboradorId: string): Promise<boolean> => {
  const { error } = await supabase.from('salarios_colaboradores').delete().eq('colaborador_id', colaboradorId);
  if (error) return false;
  salariosCache = salariosCache.filter(s => s.colaboradorId !== colaboradorId);
  return true;
};

// Histórico
export const getHistoricoSalario = (colaboradorId: string): HistoricoSalario[] =>
  historicoCache.filter(h => h.colaboradorId === colaboradorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getAllHistoricoSalarios = (): HistoricoSalario[] =>
  [...historicoCache].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

// Helper para obter salário com dados do colaborador
export interface SalarioComColaborador extends SalarioColaborador {
  colaborador: Colaborador;
  comissaoPorLoja?: number;
}

export const getSalariosComColaboradores = (): SalarioComColaborador[] => {
  const colaboradores = getColaboradores();
  const result: SalarioComColaborador[] = [];
  for (const s of salariosCache) {
    const colaborador = colaboradores.find(c => c.id === s.colaboradorId);
    if (!colaborador) continue;
    const comissaoPorLoja = getComissaoColaboradorPorLoja(colaborador.loja, colaborador.cargo);
    result.push({
      ...s,
      colaborador,
      comissaoPorLoja: comissaoPorLoja > 0 ? comissaoPorLoja : undefined
    });
  }
  return result;
};
