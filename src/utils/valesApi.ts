// Vales API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';

export interface HistoricoAlteracao {
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  tipoAcao: 'Criação' | 'Edição';
}

export interface Vale {
  id: string;
  dataLancamento: string;
  lancadoPor: string;
  lancadoPorNome: string;
  lojaId: string;
  colaboradorId: string;
  observacao: string;
  valorFinal: number;
  quantidadeVezes: number;
  inicioCompetencia: string;
  historico: HistoricoAlteracao[];
}

// ── Cache layer ──
let valesCache: Vale[] = [];
let cacheLoaded = false;

const mapRow = (r: any): Vale => ({
  id: r.id,
  dataLancamento: r.data_lancamento,
  lancadoPor: r.lancado_por || '',
  lancadoPorNome: r.lancado_por_nome || '',
  lojaId: r.loja_id || '',
  colaboradorId: r.colaborador_id || '',
  observacao: r.observacao || '',
  valorFinal: Number(r.valor_final) || 0,
  quantidadeVezes: r.quantidade_vezes || 1,
  inicioCompetencia: r.inicio_competencia || '',
  historico: (r.historico as HistoricoAlteracao[]) || [],
});

export const initValesCache = async () => {
  const { data, error } = await supabase.from('vales').select('*').order('data_lancamento', { ascending: false });
  if (error) { console.error('[VALES] init error', error); return; }
  valesCache = (data || []).map(mapRow);
  cacheLoaded = true;
};

// Auto-init
initValesCache();

// API Functions
export const getVales = (): Vale[] => {
  return [...valesCache].sort((a, b) =>
    new Date(b.dataLancamento).getTime() - new Date(a.dataLancamento).getTime()
  );
};

export const getValeById = (id: string): Vale | undefined => {
  return valesCache.find(v => v.id === id);
};

export const addVale = async (vale: Omit<Vale, 'id'>): Promise<Vale> => {
  const { data, error } = await supabase.from('vales').insert({
    data_lancamento: vale.dataLancamento,
    lancado_por: vale.lancadoPor || null,
    lancado_por_nome: vale.lancadoPorNome,
    loja_id: vale.lojaId || null,
    colaborador_id: vale.colaboradorId || null,
    observacao: vale.observacao,
    valor_final: vale.valorFinal,
    quantidade_vezes: vale.quantidadeVezes,
    inicio_competencia: vale.inicioCompetencia,
    historico: vale.historico as any,
  }).select().single();
  if (error) throw error;
  const mapped = mapRow(data);
  valesCache.push(mapped);
  return mapped;
};

export const updateVale = async (id: string, updates: Partial<Vale>): Promise<Vale | undefined> => {
  const dbUpdates: any = {};
  if (updates.observacao !== undefined) dbUpdates.observacao = updates.observacao;
  if (updates.valorFinal !== undefined) dbUpdates.valor_final = updates.valorFinal;
  if (updates.quantidadeVezes !== undefined) dbUpdates.quantidade_vezes = updates.quantidadeVezes;
  if (updates.inicioCompetencia !== undefined) dbUpdates.inicio_competencia = updates.inicioCompetencia;
  if (updates.historico !== undefined) dbUpdates.historico = updates.historico as any;
  if (updates.lojaId !== undefined) dbUpdates.loja_id = updates.lojaId;
  if (updates.colaboradorId !== undefined) dbUpdates.colaborador_id = updates.colaboradorId;

  const { data, error } = await supabase.from('vales').update(dbUpdates).eq('id', id).select().single();
  if (error || !data) return undefined;
  const mapped = mapRow(data);
  const idx = valesCache.findIndex(v => v.id === id);
  if (idx >= 0) valesCache[idx] = mapped;
  return mapped;
};

export const deleteVale = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('vales').delete().eq('id', id);
  if (error) return false;
  valesCache = valesCache.filter(v => v.id !== id);
  return true;
};

// Helper para calcular valor da parcela
export const calcularValorParcela = (valorFinal: number, quantidadeVezes: number): number => {
  if (quantidadeVezes <= 0) return 0;
  return valorFinal / quantidadeVezes;
};

// Helper para gerar próximos 24 meses
export const getProximosMeses = (): string[] => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const hoje = new Date();
  const resultado: string[] = [];
  for (let i = 0; i < 24; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    resultado.push(`${mes}-${ano}`);
  }
  return resultado;
};

// Helper para calcular situação das parcelas
export const calcularSituacaoParcelas = (inicioCompetencia: string, quantidadeVezes: number): { pagas: number; total: number; percentual: number } => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [mesStr, anoStr] = inicioCompetencia.split('-');
  const mesIndex = meses.indexOf(mesStr);
  const ano = parseInt(anoStr);
  if (mesIndex === -1 || isNaN(ano)) {
    return { pagas: 0, total: quantidadeVezes, percentual: 0 };
  }
  const dataInicio = new Date(ano, mesIndex, 1);
  const hoje = new Date();
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  let parcelasPagas = 0;
  for (let i = 0; i < quantidadeVezes; i++) {
    const mesParcela = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + i, 1);
    if (mesParcela <= mesAtual) parcelasPagas++;
  }
  const percentual = (parcelasPagas / quantidadeVezes) * 100;
  return { pagas: parcelasPagas, total: quantidadeVezes, percentual };
};

// Helper para converter competência em data para filtro
export const competenciaParaData = (competencia: string): Date | null => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [mesStr, anoStr] = competencia.split('-');
  const mesIndex = meses.indexOf(mesStr);
  const ano = parseInt(anoStr);
  if (mesIndex === -1 || isNaN(ano)) return null;
  return new Date(ano, mesIndex, 1);
};
