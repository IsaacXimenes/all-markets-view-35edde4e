// Comissões API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';
import { getColaboradores } from './cadastrosApi';
import { LOJA_ONLINE_ID } from './calculoComissaoVenda';

export interface ComissaoColaborador {
  colaboradorId: string;
  salarioFixo: number;
  percentualComissao: number;
}

export interface HistoricoComissao {
  id: string;
  colaboradorId: string;
  dataAlteracao: string;
  usuarioAlterou: string;
  fixoAnterior: number;
  fixoNovo: number;
  comissaoAnterior: number;
  comissaoNova: number;
}

// ── Cache layer ──
let comissoesCache: ComissaoColaborador[] = [];
let historicoCache: HistoricoComissao[] = [];
let cacheInitialized = false;

export const initComissoesCache = async () => {
  // Comissões vêm direto dos colaboradores (salario_fixo + comissao)
  const colaboradores = getColaboradores();
  comissoesCache = colaboradores.map(col => ({
    colaboradorId: col.id,
    salarioFixo: col.salario || 0,
    percentualComissao: 10 // Fixo 10% lojas físicas
  }));

  // Histórico do Supabase
  const { data } = await supabase.from('comissoes_historico').select('*').order('data_alteracao', { ascending: false });
  if (data) {
    historicoCache = data.map((r: any) => ({
      id: r.id,
      colaboradorId: r.colaborador_id || '',
      dataAlteracao: r.data_alteracao,
      usuarioAlterou: r.usuario_alterou || '',
      fixoAnterior: Number(r.fixo_anterior) || 0,
      fixoNovo: Number(r.fixo_novo) || 0,
      comissaoAnterior: Number(r.comissao_anterior) || 0,
      comissaoNova: Number(r.comissao_nova) || 0,
    }));
  }
  cacheInitialized = true;
};

// Auto-init
initComissoesCache();

// Buscar comissão de um colaborador
export const getComissaoColaborador = (colaboradorId: string): { fixo: number; comissao: number } => {
  const comissao = comissoesCache.find(c => c.colaboradorId === colaboradorId);
  return { fixo: comissao?.salarioFixo || 0, comissao: comissao?.percentualComissao || 0 };
};

export const getAllComissoes = (): ComissaoColaborador[] => comissoesCache;

// Atualizar comissão
export const updateComissaoColaborador = async (
  colaboradorId: string,
  fixo: number,
  percentualComissao: number,
  usuarioAlterou: string = 'Sistema'
): Promise<void> => {
  const existente = comissoesCache.find(c => c.colaboradorId === colaboradorId);

  // Registrar histórico no Supabase
  if (existente) {
    const { data } = await supabase.from('comissoes_historico').insert({
      colaborador_id: colaboradorId,
      data_alteracao: new Date().toISOString(),
      usuario_alterou: usuarioAlterou,
      fixo_anterior: existente.salarioFixo,
      fixo_novo: fixo,
      comissao_anterior: existente.percentualComissao,
      comissao_nova: percentualComissao,
    }).select().single();
    if (data) historicoCache.unshift({
      id: data.id,
      colaboradorId: data.colaborador_id || '',
      dataAlteracao: data.data_alteracao,
      usuarioAlterou: data.usuario_alterou || '',
      fixoAnterior: Number(data.fixo_anterior) || 0,
      fixoNovo: Number(data.fixo_novo) || 0,
      comissaoAnterior: Number(data.comissao_anterior) || 0,
      comissaoNova: Number(data.comissao_nova) || 0,
    });
  }

  // Atualizar cache
  const index = comissoesCache.findIndex(c => c.colaboradorId === colaboradorId);
  if (index >= 0) {
    comissoesCache[index] = { colaboradorId, salarioFixo: fixo, percentualComissao };
  } else {
    comissoesCache.push({ colaboradorId, salarioFixo: fixo, percentualComissao });
  }
};

// Calcular comissão de uma venda
export const calcularComissaoVenda = (vendedorId: string, lucroVenda: number, lojaVendaId?: string): number => {
  if (lucroVenda <= 0) return 0;
  const percentual = lojaVendaId === LOJA_ONLINE_ID ? 6 : 10;
  return lucroVenda * (percentual / 100);
};

export const addHistoricoComissao = (registro: HistoricoComissao): void => {
  historicoCache.unshift(registro);
};

export const getHistoricoComissao = (colaboradorId: string): HistoricoComissao[] =>
  historicoCache.filter(h => h.colaboradorId === colaboradorId);

export const getAllHistoricoComissoes = (): HistoricoComissao[] => historicoCache;
