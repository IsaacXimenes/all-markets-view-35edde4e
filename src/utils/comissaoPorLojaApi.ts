// Comissão por Loja API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';
import { getLojaById, getCargoNome } from './cadastrosApi';

export interface ComissaoPorLoja {
  id: string;
  lojaId: string;
  cargoId: string;
  percentualComissao: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricoComissaoPorLoja {
  id: string;
  comissaoId: string;
  usuarioId: string;
  usuarioNome: string;
  percentualAnterior: number | null;
  percentualNovo: number;
  tipoAcao: 'Criação' | 'Edição' | 'Deleção';
  createdAt: string;
}

// ── Cache layer ──
let comissoesPorLojaCache: ComissaoPorLoja[] = [];
let historicoCache: HistoricoComissaoPorLoja[] = [];

const mapRow = (r: any): ComissaoPorLoja => ({
  id: r.id,
  lojaId: r.loja_id || '',
  cargoId: r.cargo_id || '',
  percentualComissao: Number(r.percentual_comissao) || 0,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapHistRow = (r: any): HistoricoComissaoPorLoja => ({
  id: r.id,
  comissaoId: r.comissao_id || '',
  usuarioId: r.usuario_id || '',
  usuarioNome: r.usuario_nome || '',
  percentualAnterior: r.percentual_anterior,
  percentualNovo: Number(r.percentual_novo) || 0,
  tipoAcao: r.tipo_acao || 'Edição',
  createdAt: r.created_at,
});

export const initComissaoPorLojaCache = async () => {
  const [cRes, hRes] = await Promise.all([
    supabase.from('comissao_por_loja').select('*'),
    supabase.from('historico_comissao_por_loja').select('*').order('created_at', { ascending: false }),
  ]);
  if (cRes.data) comissoesPorLojaCache = cRes.data.map(mapRow);
  if (hRes.data) historicoCache = hRes.data.map(mapHistRow);
};

// Auto-init
initComissaoPorLojaCache();

// CRUD Operations
export const getComissoesPorLoja = (): ComissaoPorLoja[] => [...comissoesPorLojaCache];

export const getComissaoPorLojaById = (id: string): ComissaoPorLoja | undefined =>
  comissoesPorLojaCache.find(c => c.id === id);

export const getComissaoPorLojaECargo = (lojaId: string, cargoId: string): ComissaoPorLoja | undefined =>
  comissoesPorLojaCache.find(c => c.lojaId === lojaId && c.cargoId === cargoId);

export const addComissaoPorLoja = async (
  lojaId: string,
  cargoId: string,
  percentualComissao: number,
  usuarioId: string = 'SISTEMA',
  usuarioNome: string = 'Sistema'
): Promise<ComissaoPorLoja> => {
  const existente = getComissaoPorLojaECargo(lojaId, cargoId);
  if (existente) throw new Error('Já existe uma comissão configurada para esta loja e cargo');

  const { data, error } = await supabase.from('comissao_por_loja').insert({
    loja_id: lojaId,
    cargo_id: cargoId,
    percentual_comissao: percentualComissao,
  }).select().single();
  if (error) throw error;
  const mapped = mapRow(data);
  comissoesPorLojaCache.push(mapped);

  // Histórico
  const { data: hData } = await supabase.from('historico_comissao_por_loja').insert({
    comissao_id: mapped.id,
    usuario_id: usuarioId,
    usuario_nome: usuarioNome,
    percentual_anterior: null,
    percentual_novo: percentualComissao,
    tipo_acao: 'Criação',
  }).select().single();
  if (hData) historicoCache.unshift(mapHistRow(hData));

  return mapped;
};

export const updateComissaoPorLoja = async (
  id: string,
  percentualComissao: number,
  usuarioId: string = 'SISTEMA',
  usuarioNome: string = 'Sistema'
): Promise<ComissaoPorLoja | null> => {
  const comissaoAtual = comissoesPorLojaCache.find(c => c.id === id);
  if (!comissaoAtual) return null;

  const { data, error } = await supabase.from('comissao_por_loja').update({
    percentual_comissao: percentualComissao,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error || !data) return null;
  const mapped = mapRow(data);
  const idx = comissoesPorLojaCache.findIndex(c => c.id === id);
  if (idx >= 0) comissoesPorLojaCache[idx] = mapped;

  // Histórico
  const { data: hData } = await supabase.from('historico_comissao_por_loja').insert({
    comissao_id: id,
    usuario_id: usuarioId,
    usuario_nome: usuarioNome,
    percentual_anterior: comissaoAtual.percentualComissao,
    percentual_novo: percentualComissao,
    tipo_acao: 'Edição',
  }).select().single();
  if (hData) historicoCache.unshift(mapHistRow(hData));

  return mapped;
};

export const deleteComissaoPorLoja = async (
  id: string,
  usuarioId: string = 'SISTEMA',
  usuarioNome: string = 'Sistema'
): Promise<boolean> => {
  const comissao = comissoesPorLojaCache.find(c => c.id === id);
  if (!comissao) return false;

  // Histórico antes de deletar
  await supabase.from('historico_comissao_por_loja').insert({
    comissao_id: id,
    usuario_id: usuarioId,
    usuario_nome: usuarioNome,
    percentual_anterior: comissao.percentualComissao,
    percentual_novo: 0,
    tipo_acao: 'Deleção',
  });

  const { error } = await supabase.from('comissao_por_loja').delete().eq('id', id);
  if (error) return false;
  comissoesPorLojaCache = comissoesPorLojaCache.filter(c => c.id !== id);
  return true;
};

// Histórico
export const getHistoricoComissaoPorLoja = (comissaoId: string): HistoricoComissaoPorLoja[] =>
  historicoCache.filter(h => h.comissaoId === comissaoId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getAllHistoricoComissoes = (): HistoricoComissaoPorLoja[] =>
  [...historicoCache].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

// Helpers para exibição
export const getComissaoPorLojaComDetalhes = () => {
  return comissoesPorLojaCache.map(c => {
    const loja = getLojaById(c.lojaId);
    const cargoNome = getCargoNome(c.cargoId);
    return { ...c, lojaNome: loja?.nome || c.lojaId, cargoNome };
  });
};

// Buscar comissão do colaborador baseado em sua loja e cargo
export const getComissaoColaboradorPorLoja = (lojaId: string, cargoId: string): number => {
  const comissao = getComissaoPorLojaECargo(lojaId, cargoId);
  return comissao?.percentualComissao || 0;
};
