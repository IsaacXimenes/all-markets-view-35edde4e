// Stories Monitoramento API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';
import { getVendas, Venda } from './vendasApi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============= CONSTANTES =============
export const META_STORIES_PERCENTUAL = 70;

export const MOTIVOS_NAO_POSTAGEM = [
  'Cliente não possui Instagram',
  'Cliente recusou a postagem',
  'Vendedor não solicitou',
  'Story postado mas não repostado pela loja',
  'Problema técnico',
  'Outro'
] as const;

export type MotivoNaoPostagem = typeof MOTIVOS_NAO_POSTAGEM[number];

// ============= INTERFACES =============
export type StatusLote = 
  | 'Pendente Conf. Operacional' 
  | 'Aguardando Validação' 
  | 'Validado' 
  | 'Rejeitado Parcial';

export type StatusAnexo = 
  | 'Sem Anexo' 
  | 'Anexo Pendente' 
  | 'Anexado' 
  | 'Validado' 
  | 'Rejeitado';

export type SeloQualidade = 'Story Exemplo' | 'Excelente Engajamento' | null;

export interface AnexoStory {
  id: string;
  vendaMonitoramentoId: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUrl: string;
  dataUpload: string;
}

export interface VendaMonitoramento {
  id: string;
  loteId: string;
  vendaId: string;
  vendaNumero: number;
  clienteNome: string;
  vendedorId: string;
  vendedorNome: string;
  valorVenda: number;
  lojaVenda: string;
  statusAnexo: StatusAnexo;
  motivoNaoPostagem?: MotivoNaoPostagem;
  seloQualidade?: SeloQualidade;
  observacaoConferencia?: string;
  observacaoValidacao?: string;
  anexos: AnexoStory[];
}

export interface LoteMonitoramento {
  id: string;
  data: string;
  lojaId: string;
  lojaNome: string;
  totalVendas: number;
  vendasComStory: number;
  percentualStories: number;
  status: StatusLote;
  conferidoPor?: string;
  conferidoPorNome?: string;
  dataConferencia?: string;
  validadoPor?: string;
  validadoPorNome?: string;
  dataValidacao?: string;
  vendas: VendaMonitoramento[];
}

export interface IndicadoresStories {
  totalVendas: number;
  totalComStory: number;
  percentualGeral: number;
  metaAtingida: boolean;
  rankingLojas: { lojaId: string; lojaNome: string; totalVendas: number; comStory: number; percentual: number }[];
  rankingVendedores: { vendedorId: string; vendedorNome: string; totalVendas: number; comStory: number; percentual: number }[];
  motivosDistribuicao: { motivo: string; quantidade: number }[];
}

// ── Cache layer ──
let _lotesCache: Map<string, LoteMonitoramento[]> = new Map(); // keyed by competencia

const mapLote = (r: any): LoteMonitoramento => ({
  id: r.id,
  data: r.data,
  lojaId: r.loja_id || '',
  lojaNome: r.loja_nome || '',
  totalVendas: r.total_vendas || 0,
  vendasComStory: r.vendas_com_story || 0,
  percentualStories: r.percentual_stories || 0,
  status: (r.status || 'Pendente Conf. Operacional') as StatusLote,
  conferidoPor: r.conferido_por || undefined,
  conferidoPorNome: r.conferido_por_nome || undefined,
  dataConferencia: r.data_conferencia || undefined,
  validadoPor: r.validado_por || undefined,
  validadoPorNome: r.validado_por_nome || undefined,
  dataValidacao: r.data_validacao || undefined,
  vendas: (r.vendas as VendaMonitoramento[]) || [],
});

const loadLotesCompetencia = async (competencia: string): Promise<LoteMonitoramento[]> => {
  const { data, error } = await supabase
    .from('stories_lotes')
    .select('*')
    .eq('competencia', competencia)
    .order('data', { ascending: false });
  if (error) { console.error('[STORIES] load error', error); return []; }
  const lotes = (data || []).map(mapLote);
  _lotesCache.set(competencia, lotes);
  return lotes;
};

// ============= GERAÇÃO DE LOTES =============
export const gerarLotesDiarios = async (
  competencia: string,
  lojas: { id: string; nome: string }[]
): Promise<LoteMonitoramento[]> => {
  // Load from cache or DB
  let existentes = _lotesCache.get(competencia);
  if (!existentes) {
    existentes = await loadLotesCompetencia(competencia);
  }

  const vendas = getVendas();
  const [ano, mes] = competencia.split('-').map(Number);
  const inicioMes = startOfMonth(new Date(ano, mes - 1));
  const fimMes = endOfMonth(new Date(ano, mes - 1));
  const hoje = new Date();
  const fimReal = fimMes > hoje ? hoje : fimMes;
  if (inicioMes > hoje) return existentes;

  const dias = eachDayOfInterval({ start: inicioMes, end: fimReal });
  const lotesMap = new Map<string, LoteMonitoramento>();
  existentes.forEach(l => lotesMap.set(`${l.data}_${l.lojaId}`, l));

  const lotesToUpsert: any[] = [];

  for (const dia of dias) {
    const dataStr = format(dia, 'yyyy-MM-dd');
    for (const loja of lojas) {
      const vendasDoDia = vendas.filter(v => {
        const dv = format(new Date(v.dataHora), 'yyyy-MM-dd');
        return dv === dataStr && v.lojaVenda === loja.id && v.status !== 'Cancelada';
      });
      if (vendasDoDia.length === 0) continue;

      const mapKey = `${dataStr}_${loja.id}`;
      const loteExistente = lotesMap.get(mapKey);

      if (loteExistente) {
        const idsExistentes = new Set(loteExistente.vendas.map(v => v.vendaId));
        const novasVendas = vendasDoDia.filter(v => !idsExistentes.has(v.id));
        if (novasVendas.length > 0) {
          const novasVendasMon: VendaMonitoramento[] = novasVendas.map(v => ({
            id: `VM-${v.id}`, loteId: loteExistente.id, vendaId: v.id, vendaNumero: v.numero,
            clienteNome: v.clienteNome, vendedorId: v.vendedor, vendedorNome: '',
            valorVenda: v.total, lojaVenda: v.lojaVenda, statusAnexo: 'Sem Anexo' as StatusAnexo, anexos: [],
          }));
          loteExistente.vendas.push(...novasVendasMon);
          loteExistente.totalVendas = loteExistente.vendas.length;
          const comStory = loteExistente.vendas.filter(v => v.statusAnexo === 'Anexado' || v.statusAnexo === 'Anexo Pendente' || v.statusAnexo === 'Validado').length;
          loteExistente.vendasComStory = comStory;
          loteExistente.percentualStories = loteExistente.totalVendas > 0 ? Math.round((comStory / loteExistente.totalVendas) * 100) : 0;
          if (loteExistente.status !== 'Pendente Conf. Operacional') loteExistente.status = 'Pendente Conf. Operacional';
          lotesToUpsert.push(loteExistente);
        }
      } else {
        const vendasMon: VendaMonitoramento[] = vendasDoDia.map(v => ({
          id: `VM-${v.id}`, loteId: '', vendaId: v.id, vendaNumero: v.numero,
          clienteNome: v.clienteNome, vendedorId: v.vendedor, vendedorNome: '',
          valorVenda: v.total, lojaVenda: v.lojaVenda, statusAnexo: 'Sem Anexo' as StatusAnexo, anexos: [],
        }));
        const newLote: LoteMonitoramento = {
          id: '', data: dataStr, lojaId: loja.id, lojaNome: loja.nome,
          totalVendas: vendasMon.length, vendasComStory: 0, percentualStories: 0,
          status: 'Pendente Conf. Operacional', vendas: vendasMon,
        };
        lotesMap.set(mapKey, newLote);
        lotesToUpsert.push(newLote);
      }
    }
  }

  // Persist new/updated lotes
  for (const lote of lotesToUpsert) {
    const payload = {
      data: lote.data,
      loja_id: lote.lojaId,
      loja_nome: lote.lojaNome,
      total_vendas: lote.totalVendas,
      vendas_com_story: lote.vendasComStory,
      percentual_stories: lote.percentualStories,
      status: lote.status,
      conferido_por: lote.conferidoPor || null,
      conferido_por_nome: lote.conferidoPorNome || null,
      data_conferencia: lote.dataConferencia || null,
      validado_por: lote.validadoPor || null,
      validado_por_nome: lote.validadoPorNome || null,
      data_validacao: lote.dataValidacao || null,
      vendas: lote.vendas as any,
      competencia,
    };

    if (lote.id) {
      await supabase.from('stories_lotes').update(payload).eq('id', lote.id);
    } else {
      const { data: row } = await supabase.from('stories_lotes').insert(payload).select().single();
      if (row) {
        lote.id = row.id;
        // Update vendas loteId references
        lote.vendas.forEach((v: VendaMonitoramento) => { v.loteId = row.id; });
      }
    }
  }

  const lotes = Array.from(lotesMap.values());
  lotes.sort((a, b) => b.data.localeCompare(a.data));
  _lotesCache.set(competencia, lotes);
  return lotes;
};

// ============= GETTERS =============
export const getLotes = (competencia: string, lojaId?: string, status?: StatusLote): LoteMonitoramento[] => {
  let lotes = _lotesCache.get(competencia) || [];
  if (lojaId && lojaId !== 'todas') lotes = lotes.filter(l => l.lojaId === lojaId);
  if (status) lotes = lotes.filter(l => l.status === status);
  return lotes;
};

export const getLoteById = (competencia: string, loteId: string): LoteMonitoramento | undefined => {
  const lotes = _lotesCache.get(competencia) || [];
  return lotes.find(l => l.id === loteId);
};

// ============= CONFERÊNCIA OPERACIONAL =============
export const salvarConferenciaOperacional = async (
  competencia: string,
  loteId: string,
  vendasAtualizadas: VendaMonitoramento[],
  responsavelId: string,
  responsavelNome: string
): Promise<void> => {
  const lotes = _lotesCache.get(competencia) || [];
  const idx = lotes.findIndex(l => l.id === loteId);
  if (idx === -1) return;

  const comStory = vendasAtualizadas.filter(v => v.statusAnexo === 'Anexado' || v.statusAnexo === 'Anexo Pendente').length;

  lotes[idx] = {
    ...lotes[idx],
    vendas: vendasAtualizadas,
    vendasComStory: comStory,
    percentualStories: lotes[idx].totalVendas > 0 ? Math.round((comStory / lotes[idx].totalVendas) * 100) : 0,
    status: 'Aguardando Validação',
    conferidoPor: responsavelId,
    conferidoPorNome: responsavelNome,
    dataConferencia: new Date().toISOString(),
  };

  await supabase.from('stories_lotes').update({
    vendas: vendasAtualizadas as any,
    vendas_com_story: comStory,
    percentual_stories: lotes[idx].percentualStories,
    status: 'Aguardando Validação',
    conferido_por: responsavelId,
    conferido_por_nome: responsavelNome,
    data_conferencia: new Date().toISOString(),
  }).eq('id', loteId);

  _lotesCache.set(competencia, lotes);
};

// ============= VALIDAÇÃO ADMINISTRATIVA =============
export const salvarValidacao = async (
  competencia: string,
  loteId: string,
  vendasValidadas: VendaMonitoramento[],
  responsavelId: string,
  responsavelNome: string
): Promise<void> => {
  const lotes = _lotesCache.get(competencia) || [];
  const idx = lotes.findIndex(l => l.id === loteId);
  if (idx === -1) return;

  const comStoryValidado = vendasValidadas.filter(v => v.statusAnexo === 'Validado').length;
  const temRejeitado = vendasValidadas.some(v => v.statusAnexo === 'Rejeitado');

  lotes[idx] = {
    ...lotes[idx],
    vendas: vendasValidadas,
    vendasComStory: comStoryValidado,
    percentualStories: lotes[idx].totalVendas > 0 ? Math.round((comStoryValidado / lotes[idx].totalVendas) * 100) : 0,
    status: temRejeitado ? 'Rejeitado Parcial' : 'Validado',
    validadoPor: responsavelId,
    validadoPorNome: responsavelNome,
    dataValidacao: new Date().toISOString(),
  };

  await supabase.from('stories_lotes').update({
    vendas: vendasValidadas as any,
    vendas_com_story: comStoryValidado,
    percentual_stories: lotes[idx].percentualStories,
    status: lotes[idx].status,
    validado_por: responsavelId,
    validado_por_nome: responsavelNome,
    data_validacao: new Date().toISOString(),
  }).eq('id', loteId);

  _lotesCache.set(competencia, lotes);
};

// ============= INDICADORES =============
export const calcularIndicadores = (competencia: string, lojaId?: string): IndicadoresStories => {
  const lotes = getLotes(competencia, lojaId);
  let totalVendas = 0, totalComStory = 0;
  const lojaMap = new Map<string, { lojaNome: string; total: number; comStory: number }>();
  const vendedorMap = new Map<string, { vendedorNome: string; total: number; comStory: number }>();
  const motivosMap = new Map<string, number>();

  for (const lote of lotes) {
    totalVendas += lote.totalVendas;
    for (const v of lote.vendas) {
      const isStory = v.statusAnexo === 'Validado' || v.statusAnexo === 'Anexado' || v.statusAnexo === 'Anexo Pendente';
      if (isStory) totalComStory++;
      const lojaData = lojaMap.get(lote.lojaId) || { lojaNome: lote.lojaNome, total: 0, comStory: 0 };
      lojaData.total++; if (isStory) lojaData.comStory++;
      lojaMap.set(lote.lojaId, lojaData);
      const vendData = vendedorMap.get(v.vendedorId) || { vendedorNome: v.vendedorNome || v.vendedorId, total: 0, comStory: 0 };
      vendData.total++; if (isStory) vendData.comStory++;
      vendedorMap.set(v.vendedorId, vendData);
      if (!isStory && v.motivoNaoPostagem) motivosMap.set(v.motivoNaoPostagem, (motivosMap.get(v.motivoNaoPostagem) || 0) + 1);
    }
  }

  const percentualGeral = totalVendas > 0 ? Math.round((totalComStory / totalVendas) * 100) : 0;
  return {
    totalVendas, totalComStory, percentualGeral, metaAtingida: percentualGeral >= META_STORIES_PERCENTUAL,
    rankingLojas: Array.from(lojaMap.entries()).map(([lojaId, d]) => ({
      lojaId, lojaNome: d.lojaNome, totalVendas: d.total, comStory: d.comStory,
      percentual: d.total > 0 ? Math.round((d.comStory / d.total) * 100) : 0,
    })).sort((a, b) => b.percentual - a.percentual),
    rankingVendedores: Array.from(vendedorMap.entries()).map(([vendedorId, d]) => ({
      vendedorId, vendedorNome: d.vendedorNome, totalVendas: d.total, comStory: d.comStory,
      percentual: d.total > 0 ? Math.round((d.comStory / d.total) * 100) : 0,
    })).sort((a, b) => b.percentual - a.percentual),
    motivosDistribuicao: Array.from(motivosMap.entries()).map(([motivo, quantidade]) => ({ motivo, quantidade })).sort((a, b) => b.quantidade - a.quantidade),
  };
};

// ============= HELPERS =============
export const getCompetenciasDisponiveisStories = (): { value: string; label: string }[] => {
  const competencias: { value: string; label: string }[] = [];
  const hoje = new Date();
  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const value = format(data, 'yyyy-MM');
    const label = format(data, 'MMMM/yyyy', { locale: ptBR });
    competencias.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return competencias;
};

export const getPercentualColor = (percentual: number): 'green' | 'yellow' | 'red' => {
  if (percentual >= META_STORIES_PERCENTUAL) return 'green';
  if (percentual >= 50) return 'yellow';
  return 'red';
};

export const getStatusLoteColor = (status: StatusLote): string => {
  switch (status) {
    case 'Pendente Conf. Operacional': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    case 'Aguardando Validação': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'Validado': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Rejeitado Parcial': return 'bg-red-500/20 text-red-700 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

export const getStatusLoteRowClass = (status: StatusLote): string => {
  switch (status) {
    case 'Pendente Conf. Operacional': return 'bg-yellow-500/10';
    case 'Aguardando Validação': return 'bg-blue-500/10';
    case 'Validado': return 'bg-green-500/10';
    case 'Rejeitado Parcial': return 'bg-red-500/10';
    default: return '';
  }
};
