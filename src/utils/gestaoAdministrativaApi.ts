// Gestão Administrativa API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';
import { getVendas, Venda, Pagamento } from './vendasApi';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces
export interface TotalPorMetodo {
  bruto: number;
  conferido: boolean;
  conferidoPor?: string;
  dataConferencia?: string;
}

export interface ConferenciaDiaria {
  id: string;
  data: string;
  lojaId: string;
  lojaNome?: string;
  totaisPorMetodo: { [key: string]: TotalPorMetodo };
  vendasTotal: number;
  statusConferencia: 'Não Conferido' | 'Parcial' | 'Conferido';
  ajustes: AjusteDivergencia[];
}

export interface AjusteDivergencia {
  id: string;
  metodoPagamento: string;
  valorDiferenca: number;
  justificativa: string;
  registradoPor: string;
  registradoPorNome: string;
  dataRegistro: string;
}

export interface LogAuditoria {
  id: string;
  conferenciaId: string;
  data: string;
  lojaId: string;
  acao: 'conferencia_marcada' | 'conferencia_desmarcada' | 'ajuste_registrado';
  metodoPagamento?: string;
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  detalhes: string;
}

export interface VendaDrillDown {
  id: string;
  numero: number;
  dataHora: string;
  clienteNome: string;
  vendedorId: string;
  vendedorNome?: string;
  valor: number;
  metodoPagamento: string;
  composicao: string;
  comprovante?: string;
  comprovanteNome?: string;
}

export const METODOS_PAGAMENTO = ['Pix', 'Cartão Débito', 'Cartão Crédito', 'Dinheiro', 'Transferência', 'Fiado'];

// ── Cache layer ──
let _confCache: Map<string, { totaisPorMetodo: Record<string, TotalPorMetodo>; ajustes: AjusteDivergencia[] }> = new Map();
let _logsCache: LogAuditoria[] = [];
let _confCacheLoaded = false;

const mapLog = (r: any): LogAuditoria => ({
  id: r.id,
  conferenciaId: r.conferencia_id || '',
  data: r.data || '',
  lojaId: r.loja_id || '',
  acao: (r.acao || 'conferencia_marcada') as LogAuditoria['acao'],
  metodoPagamento: r.metodo_pagamento || undefined,
  usuarioId: r.usuario_id || '',
  usuarioNome: r.usuario_nome || '',
  dataHora: r.data_hora || '',
  detalhes: r.detalhes || '',
});

export const initGestaoAdministrativaCache = async () => {
  const [confRes, logsRes] = await Promise.all([
    supabase.from('conferencias_gestao').select('*'),
    supabase.from('logs_conferencia_gestao').select('*').order('data_hora', { ascending: false }).limit(500),
  ]);

  if (confRes.error) console.error('[GESTAO] conf init error', confRes.error);
  if (logsRes.error) console.error('[GESTAO] logs init error', logsRes.error);

  _confCache.clear();
  for (const row of confRes.data || []) {
    const key = `${row.data}_${row.loja_id}`;
    _confCache.set(key, {
      totaisPorMetodo: (row.totais_por_metodo as unknown as Record<string, TotalPorMetodo>) || {},
      ajustes: (row.ajustes as unknown as AjusteDivergencia[]) || [],
    });
  }

  _logsCache = (logsRes.data || []).map(mapLog);
  _confCacheLoaded = true;
};

// Auto-init
initGestaoAdministrativaCache();

// Helper to get conf data
const getConfData = (data: string, lojaId: string) => {
  const key = `${data}_${lojaId}`;
  return _confCache.get(key) || { totaisPorMetodo: {}, ajustes: [] };
};

// Função principal: consolidar vendas por dia
export const consolidarVendasPorDia = (
  competencia: string,
  lojaId?: string,
  vendedorId?: string,
  todasLojasIds?: string[]
): ConferenciaDiaria[] => {
  const vendas = getVendas();
  const [ano, mes] = competencia.split('-').map(Number);
  const inicioMes = startOfMonth(new Date(ano, mes - 1));
  const fimMes = endOfMonth(new Date(ano, mes - 1));

  const vendasFiltradas = vendas.filter(v => {
    const dataVenda = new Date(v.dataHora);
    if (!isWithinInterval(dataVenda, { start: inicioMes, end: fimMes })) return false;
    if (v.status === 'Cancelada') return false;
    if (lojaId && lojaId !== 'todas' && v.lojaVenda !== lojaId) return false;
    if (vendedorId && vendedorId !== 'todos' && v.vendedor !== vendedorId) return false;
    return true;
  });

  const vendasPorDiaLoja = new Map<string, Venda[]>();
  vendasFiltradas.forEach(v => {
    const dataStr = format(new Date(v.dataHora), 'yyyy-MM-dd');
    const key = `${dataStr}_${v.lojaVenda}`;
    const existing = vendasPorDiaLoja.get(key) || [];
    vendasPorDiaLoja.set(key, [...existing, v]);
  });

  const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
  const lojasPresentes = new Set<string>();
  vendasFiltradas.forEach(v => lojasPresentes.add(v.lojaVenda));
  if (lojaId && lojaId !== 'todas') lojasPresentes.add(lojaId);
  if (todasLojasIds && (!lojaId || lojaId === 'todas')) todasLojasIds.forEach(id => lojasPresentes.add(id));

  const conferencias: ConferenciaDiaria[] = [];

  for (const dia of diasDoMes) {
    const dataStr = format(dia, 'yyyy-MM-dd');
    for (const lojaReal of Array.from(lojasPresentes)) {
      const key = `${dataStr}_${lojaReal}`;
      const vendasDoDiaLoja = vendasPorDiaLoja.get(key) || [];

      const confData = getConfData(dataStr, lojaReal);
      const totaisPorMetodo: Record<string, TotalPorMetodo> = {};

      METODOS_PAGAMENTO.forEach(metodo => {
        let total = 0;
        vendasDoDiaLoja.forEach(v => {
          v.pagamentos.forEach(p => {
            if (p.meioPagamento === metodo) total += p.valor;
          });
        });

        const conferenciaSalva = confData.totaisPorMetodo[metodo];
        const valorMudou = conferenciaSalva && conferenciaSalva.bruto !== total;

        totaisPorMetodo[metodo] = {
          bruto: total,
          conferido: valorMudou ? false : (conferenciaSalva?.conferido ?? false),
          conferidoPor: valorMudou ? undefined : conferenciaSalva?.conferidoPor,
          dataConferencia: valorMudou ? undefined : conferenciaSalva?.dataConferencia,
        };
      });

      const vendasTotal = vendasDoDiaLoja.reduce((acc, v) => acc + v.total, 0);
      const metodosComValor = Object.entries(totaisPorMetodo).filter(([_, d]) => d.bruto > 0);
      const metodosConferidos = metodosComValor.filter(([_, d]) => d.conferido);

      let statusConferencia: 'Não Conferido' | 'Parcial' | 'Conferido' = 'Não Conferido';
      if (metodosComValor.length > 0) {
        if (metodosConferidos.length === metodosComValor.length) statusConferencia = 'Conferido';
        else if (metodosConferidos.length > 0) statusConferencia = 'Parcial';
      }

      conferencias.push({
        id: `CONF-${dataStr}-${lojaReal}`,
        data: dataStr,
        lojaId: lojaReal,
        totaisPorMetodo,
        vendasTotal,
        statusConferencia,
        ajustes: confData.ajustes,
      });
    }
  }

  return conferencias.sort((a, b) => b.data.localeCompare(a.data));
};

// Obter vendas detalhadas para drill-down
export const getVendasPorDiaMetodo = (data: string, lojaId: string, metodoPagamento: string): VendaDrillDown[] => {
  const vendas = getVendas();
  const resultado: VendaDrillDown[] = [];
  vendas.forEach(v => {
    const dataVenda = format(new Date(v.dataHora), 'yyyy-MM-dd');
    if (dataVenda !== data) return;
    if (v.status === 'Cancelada') return;
    if (lojaId && lojaId !== 'todas' && v.lojaVenda !== lojaId) return;
    v.pagamentos.forEach(p => {
      if (p.meioPagamento === metodoPagamento) {
        const itensDesc = v.itens?.map(i => i.produto).join(' + ') || '';
        const acessoriosDesc = v.acessorios?.map(a => a.descricao).filter(Boolean).join(' + ') || '';
        const composicao = [itensDesc, acessoriosDesc].filter(Boolean).join(' + ');
        resultado.push({
          id: v.id, numero: v.numero, dataHora: v.dataHora, clienteNome: v.clienteNome,
          vendedorId: v.vendedor, valor: p.valor, metodoPagamento: p.meioPagamento,
          composicao: composicao || 'Sem itens',
          comprovante: (p as any).comprovante, comprovanteNome: (p as any).comprovanteNome,
        });
      }
    });
  });
  return resultado;
};

export const getVendasDoDia = (data: string, lojaId: string): Venda[] => {
  const vendas = getVendas();
  return vendas.filter(v => {
    const dataVenda = format(new Date(v.dataHora), 'yyyy-MM-dd');
    if (dataVenda !== data) return false;
    if (v.status === 'Cancelada') return false;
    if (lojaId && lojaId !== 'todas' && v.lojaVenda !== lojaId) return false;
    return true;
  });
};

// Marcar/Desmarcar conferência
export const toggleConferencia = async (
  competencia: string,
  data: string,
  lojaId: string,
  metodoPagamento: string,
  usuarioId: string,
  usuarioNome: string,
  valorBruto: number
): Promise<void> => {
  const confData = getConfData(data, lojaId);
  const estadoAtual = confData.totaisPorMetodo[metodoPagamento]?.conferido ?? false;
  const novoEstado = !estadoAtual;

  confData.totaisPorMetodo[metodoPagamento] = {
    bruto: valorBruto,
    conferido: novoEstado,
    conferidoPor: novoEstado ? usuarioId : undefined,
    dataConferencia: novoEstado ? new Date().toISOString() : undefined,
  };

  const key = `${data}_${lojaId}`;
  _confCache.set(key, confData);

  // Upsert to Supabase
  await supabase.from('conferencias_gestao').upsert({
    data,
    loja_id: lojaId,
    competencia,
    totais_por_metodo: confData.totaisPorMetodo as any,
    ajustes: confData.ajustes as any,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'data,loja_id' }).select();

  // Log
  const logEntry = {
    conferencia_id: `CONF-${data}-${lojaId}`,
    data,
    loja_id: lojaId,
    acao: novoEstado ? 'conferencia_marcada' : 'conferencia_desmarcada',
    metodo_pagamento: metodoPagamento,
    usuario_id: usuarioId,
    usuario_nome: usuarioNome,
    data_hora: new Date().toISOString(),
    detalhes: `${novoEstado ? 'Conferência marcada' : 'Conferência desmarcada'} para ${metodoPagamento} - Valor: R$ ${valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  };
  const { data: logRow } = await supabase.from('logs_conferencia_gestao').insert(logEntry).select().single();
  if (logRow) _logsCache.unshift(mapLog(logRow));
};

// Registrar ajuste/divergência
export const registrarAjuste = async (
  competencia: string,
  data: string,
  lojaId: string,
  ajuste: Omit<AjusteDivergencia, 'id' | 'dataRegistro'>
): Promise<AjusteDivergencia> => {
  const confData = getConfData(data, lojaId);

  const novoAjuste: AjusteDivergencia = {
    ...ajuste,
    id: `AJU-${Date.now()}`,
    dataRegistro: new Date().toISOString(),
  };

  confData.ajustes.push(novoAjuste);
  const key = `${data}_${lojaId}`;
  _confCache.set(key, confData);

  // Upsert to Supabase
  await supabase.from('conferencias_gestao').upsert({
    data,
    loja_id: lojaId,
    competencia,
    totais_por_metodo: confData.totaisPorMetodo as any,
    ajustes: confData.ajustes as any,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'data,loja_id' }).select();

  // Log
  const logEntry = {
    conferencia_id: `CONF-${data}-${lojaId}`,
    data,
    loja_id: lojaId,
    acao: 'ajuste_registrado',
    metodo_pagamento: ajuste.metodoPagamento,
    usuario_id: ajuste.registradoPor,
    usuario_nome: ajuste.registradoPorNome,
    data_hora: new Date().toISOString(),
    detalhes: `Ajuste registrado para ${ajuste.metodoPagamento} - Diferença: R$ ${ajuste.valorDiferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${ajuste.justificativa}`,
  };
  const { data: logRow } = await supabase.from('logs_conferencia_gestao').insert(logEntry).select().single();
  if (logRow) _logsCache.unshift(mapLog(logRow));

  return novoAjuste;
};

// Obter logs de auditoria
export const getLogsAuditoria = (competencia?: string, lojaId?: string): LogAuditoria[] => {
  return _logsCache.filter(log => {
    if (competencia) {
      const logCompetencia = log.data.substring(0, 7);
      if (logCompetencia !== competencia) return false;
    }
    if (lojaId && lojaId !== 'todas' && log.lojaId !== lojaId) return false;
    return true;
  });
};

// Calcular resumo para cards
export const calcularResumoConferencia = (conferencias: ConferenciaDiaria[]) => {
  let totalBruto = 0, totalConferido = 0, totalPendente = 0, diasNaoConferidos = 0;
  conferencias.forEach(conf => {
    totalBruto += conf.vendasTotal;
    Object.values(conf.totaisPorMetodo).forEach(metodo => {
      if (metodo.bruto > 0) {
        if (metodo.conferido) totalConferido += metodo.bruto;
        else totalPendente += metodo.bruto;
      }
    });
    if (conf.statusConferencia === 'Não Conferido' && conf.vendasTotal > 0) diasNaoConferidos++;
  });
  return { totalBruto, totalConferido, totalPendente, diasNaoConferidos };
};

export const formatarDataExibicao = (data: string): string => {
  const dataObj = parse(data, 'yyyy-MM-dd', new Date());
  return format(dataObj, 'dd/MM', { locale: ptBR });
};

export const getCompetenciasDisponiveis = (): { value: string; label: string }[] => {
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
