// Fluxo de Vendas API - Gerenciamento do fluxo de conferência em 4 etapas
// Fluxo: Lançamento Aprovada -> Conferência Gestor -> Conferência Financeiro -> Finalizado
// MIGRADO PARA SUPABASE - tabela fluxo_vendas
import { supabase } from '@/integrations/supabase/client';
import { Venda, getVendas, getVendaById, updateVenda as updateVendaBase } from './vendasApi';
import { migrarTradeInsParaPendentes } from './osApi';
import { enviarNotificacaoVenda, DadosVendaNotificacao } from './whatsappNotificacaoApi';
import { addDespesa } from './financeApi';
import { criarDividaFiado } from './fiadoApi';
import { ativarDemandasPorVenda } from './motoboyApi';

// Novo tipo para status de venda no fluxo de conferência
export type StatusVenda = 
  | 'Aguardando Conferência'
  | 'Feito Sinal'
  | 'Conferência Gestor'
  | 'Recusada - Gestor'
  | 'Conferência Financeiro'
  | 'Conferência Fiado'
  | 'Devolvido pelo Financeiro'
  | 'Pagamento Downgrade'
  | 'Finalizado'
  | 'Cancelada';

export interface TimelineVenda {
  id: string;
  dataHora: string;
  tipo: 'criacao' | 'edicao' | 'aprovacao_lancamento' | 'recusa_gestor' | 'aprovacao_gestor' | 'devolucao_financeiro' | 'aprovacao_financeiro' | 'finalizacao';
  usuarioId: string;
  usuarioNome: string;
  descricao: string;
  alteracoes?: { campo: string; valorAnterior: any; valorNovo: any }[];
  motivo?: string;
}

export interface RegistroAprovacao {
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  motivo?: string;
}

export interface VendaComFluxo extends Venda {
  statusFluxo?: StatusVenda;
  aprovacaoLancamento?: RegistroAprovacao;
  recebimentoGestor?: RegistroAprovacao;
  aprovacaoGestor?: RegistroAprovacao;
  recusaGestor?: RegistroAprovacao;
  devolucaoFinanceiro?: RegistroAprovacao;
  aprovacaoFinanceiro?: RegistroAprovacao;
  pagamentoDowngrade?: RegistroAprovacao & { contaOrigem?: string };
  timelineFluxo?: TimelineVenda[];
  bloqueadoParaEdicao?: boolean;
  tipoOperacao?: 'Upgrade' | 'Downgrade';
  saldoDevolver?: number;
  chavePix?: string;
  contaOrigemDowngrade?: string;
}

// ============= CACHE LAYER =============
interface FluxoRecord {
  id: string;
  venda_id: string;
  status_fluxo: string | null;
  aprovacao_lancamento: any;
  recebimento_gestor: any;
  aprovacao_gestor: any;
  recusa_gestor: any;
  devolucao_financeiro: any;
  aprovacao_financeiro: any;
  pagamento_downgrade: any;
  timeline_fluxo: any;
  bloqueado_para_edicao: boolean | null;
  tipo_operacao: string | null;
  saldo_devolver: number | null;
  chave_pix: string | null;
  conta_origem_downgrade: string | null;
}

let fluxoCache: Record<string, Partial<VendaComFluxo>> = {};
let fluxoCacheInitialized = false;

// Converter registro do Supabase para formato do cache
const recordToCache = (r: FluxoRecord): Partial<VendaComFluxo> => ({
  statusFluxo: (r.status_fluxo as StatusVenda) || undefined,
  aprovacaoLancamento: r.aprovacao_lancamento || undefined,
  recebimentoGestor: r.recebimento_gestor || undefined,
  aprovacaoGestor: r.aprovacao_gestor || undefined,
  recusaGestor: r.recusa_gestor || undefined,
  devolucaoFinanceiro: r.devolucao_financeiro || undefined,
  aprovacaoFinanceiro: r.aprovacao_financeiro || undefined,
  pagamentoDowngrade: r.pagamento_downgrade || undefined,
  timelineFluxo: r.timeline_fluxo || [],
  bloqueadoParaEdicao: r.bloqueado_para_edicao || false,
  tipoOperacao: (r.tipo_operacao as 'Upgrade' | 'Downgrade') || undefined,
  saldoDevolver: r.saldo_devolver || 0,
  chavePix: r.chave_pix || undefined,
  contaOrigemDowngrade: r.conta_origem_downgrade || undefined,
});

// Converter cache para formato do Supabase
const cacheToRecord = (vendaId: string, data: Partial<VendaComFluxo>) => ({
  venda_id: vendaId,
  status_fluxo: data.statusFluxo || null,
  aprovacao_lancamento: data.aprovacaoLancamento || null,
  recebimento_gestor: data.recebimentoGestor || null,
  aprovacao_gestor: data.aprovacaoGestor || null,
  recusa_gestor: data.recusaGestor || null,
  devolucao_financeiro: data.devolucaoFinanceiro || null,
  aprovacao_financeiro: data.aprovacaoFinanceiro || null,
  pagamento_downgrade: data.pagamentoDowngrade || null,
  timeline_fluxo: data.timelineFluxo || [],
  bloqueado_para_edicao: data.bloqueadoParaEdicao || false,
  tipo_operacao: data.tipoOperacao || null,
  saldo_devolver: data.saldoDevolver || 0,
  chave_pix: data.chavePix || null,
  conta_origem_downgrade: data.contaOrigemDowngrade || null,
  updated_at: new Date().toISOString(),
});

export const initFluxoVendasCache = async () => {
  try {
    const { data, error } = await supabase.from('fluxo_vendas').select('*');
    if (error) throw error;
    fluxoCache = {};
    (data || []).forEach((r: any) => {
      fluxoCache[r.venda_id] = recordToCache(r);
    });
    fluxoCacheInitialized = true;
    console.log(`[FluxoVendas] Cache inicializado com ${Object.keys(fluxoCache).length} registros`);
  } catch (err) {
    console.error('[FluxoVendas] Erro ao inicializar cache:', err);
    fluxoCacheInitialized = true;
  }
};

// Salvar no Supabase (upsert por venda_id)
const saveFluxoToSupabase = async (vendaId: string, data: Partial<VendaComFluxo>) => {
  try {
    const record = cacheToRecord(vendaId, data);
    const { error } = await supabase.from('fluxo_vendas').upsert(record as any, { onConflict: 'venda_id' });
    if (error) console.error('[FluxoVendas] Erro upsert:', error);
  } catch (err) {
    console.error('[FluxoVendas] Erro ao salvar:', err);
  }
};

// ============= GETTERS (síncronos via cache) =============

const getFluxoData = (): Record<string, Partial<VendaComFluxo>> => fluxoCache;

export const getVendaComFluxo = (vendaId: string): VendaComFluxo | null => {
  const venda = getVendaById(vendaId);
  if (!venda) return null;

  const dadosFluxo = fluxoCache[vendaId] || {};
  const statusFluxo = dadosFluxo.statusFluxo || (venda as any).statusAtual || 'Finalizado';

  return {
    ...venda,
    statusFluxo: statusFluxo as StatusVenda,
    aprovacaoLancamento: dadosFluxo.aprovacaoLancamento,
    recebimentoGestor: dadosFluxo.recebimentoGestor,
    aprovacaoGestor: dadosFluxo.aprovacaoGestor,
    recusaGestor: dadosFluxo.recusaGestor,
    devolucaoFinanceiro: dadosFluxo.devolucaoFinanceiro,
    aprovacaoFinanceiro: dadosFluxo.aprovacaoFinanceiro,
    pagamentoDowngrade: dadosFluxo.pagamentoDowngrade,
    timelineFluxo: dadosFluxo.timelineFluxo || (venda as any).timeline || [],
    bloqueadoParaEdicao: dadosFluxo.bloqueadoParaEdicao || (venda as any).bloqueadoParaEdicao || false,
    tipoOperacao: dadosFluxo.tipoOperacao || (venda as any).tipoOperacao,
    saldoDevolver: dadosFluxo.saldoDevolver || (venda as any).saldoDevolver || 0
  };
};

export const getVendasComFluxo = (): VendaComFluxo[] => {
  const vendas = getVendas();
  return vendas.map(venda => {
    const dadosFluxo = fluxoCache[venda.id] || {};
    const statusFluxo = dadosFluxo.statusFluxo || (venda as any).statusAtual || 'Finalizado';
    return {
      ...venda,
      statusFluxo: statusFluxo as StatusVenda,
      aprovacaoLancamento: dadosFluxo.aprovacaoLancamento,
      aprovacaoGestor: dadosFluxo.aprovacaoGestor,
      recusaGestor: dadosFluxo.recusaGestor,
      devolucaoFinanceiro: dadosFluxo.devolucaoFinanceiro,
      aprovacaoFinanceiro: dadosFluxo.aprovacaoFinanceiro,
      timelineFluxo: dadosFluxo.timelineFluxo || (venda as any).timeline || [],
      bloqueadoParaEdicao: dadosFluxo.bloqueadoParaEdicao || (venda as any).bloqueadoParaEdicao || false
    };
  });
};

export const getVendasPorStatus = (status: StatusVenda | StatusVenda[]): VendaComFluxo[] => {
  const vendas = getVendasComFluxo();
  const statusArray = Array.isArray(status) ? status : [status];
  return vendas.filter(v => statusArray.includes(v.statusFluxo as StatusVenda));
};

// ============= MUTATIONS (async + cache + Supabase) =============

export const inicializarVendaNoFluxo = async (
  vendaId: string,
  vendedorId: string,
  vendedorNome: string,
  statusInicial?: StatusVenda
): Promise<VendaComFluxo | null> => {
  const venda = getVendaById(vendaId);
  if (!venda) return null;

  const status: StatusVenda = statusInicial || (venda as any).statusAtual || 'Aguardando Conferência';
  const isSinal = status === 'Feito Sinal';
  const vendaAny = venda as any;

  const timelineInicial: TimelineVenda = {
    id: `TL-${Date.now()}`,
    dataHora: new Date().toISOString(),
    tipo: 'criacao',
    usuarioId: vendedorId,
    usuarioNome: vendedorNome,
    descricao: isSinal 
      ? `Venda com sinal criada por ${vendedorNome}. Produtos bloqueados aguardando pagamento restante.`
      : `Venda criada por ${vendedorNome}. Aguardando conferência do lançador.`
  };

  const dados: Partial<VendaComFluxo> = {
    statusFluxo: status,
    timelineFluxo: [timelineInicial],
    bloqueadoParaEdicao: false,
    tipoOperacao: vendaAny.tipoOperacao,
    saldoDevolver: vendaAny.saldoDevolver || 0
  };

  fluxoCache[vendaId] = dados;
  await saveFluxoToSupabase(vendaId, dados);
  return getVendaComFluxo(vendaId);
};

export const aprovarLancamento = async (
  vendaId: string,
  usuarioId: string,
  usuarioNome: string
): Promise<VendaComFluxo | null> => {
  let dadosFluxo = fluxoCache[vendaId];

  if (!dadosFluxo) {
    const venda = getVendaById(vendaId);
    if (venda) {
      const vendaAny = venda as any;
      const statusAtual = vendaAny.statusAtual;
      if (statusAtual === 'Aguardando Conferência' || statusAtual === 'Recusada - Gestor') {
        dadosFluxo = {
          statusFluxo: statusAtual as StatusVenda,
          timelineFluxo: vendaAny.timeline || [],
          bloqueadoParaEdicao: vendaAny.bloqueadoParaEdicao || false
        };
        fluxoCache[vendaId] = dadosFluxo;
      } else return null;
    } else return null;
  }

  if (dadosFluxo.statusFluxo !== 'Aguardando Conferência' && dadosFluxo.statusFluxo !== 'Recusada - Gestor') return null;

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'aprovacao_lancamento',
    usuarioId, usuarioNome, descricao: `Lançamento aprovado por ${usuarioNome}. Enviado para conferência do gestor.`
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo,
    statusFluxo: 'Conferência Gestor',
    aprovacaoLancamento: { usuarioId, usuarioNome, dataHora: new Date().toISOString() },
    recebimentoGestor: { usuarioId, usuarioNome, dataHora: new Date().toISOString() },
    timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline]
  };

  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);
  return getVendaComFluxo(vendaId);
};

export const recusarGestor = async (
  vendaId: string, usuarioId: string, usuarioNome: string, motivo: string
): Promise<VendaComFluxo | null> => {
  const dadosFluxo = fluxoCache[vendaId];
  if (!dadosFluxo || (dadosFluxo.statusFluxo !== 'Conferência Gestor' && dadosFluxo.statusFluxo !== 'Devolvido pelo Financeiro')) return null;

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'recusa_gestor',
    usuarioId, usuarioNome, descricao: `Recusado pelo gestor ${usuarioNome}. Motivo: ${motivo}`, motivo
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo, statusFluxo: 'Recusada - Gestor',
    recusaGestor: { usuarioId, usuarioNome, dataHora: new Date().toISOString(), motivo },
    timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline]
  };

  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);
  return getVendaComFluxo(vendaId);
};

export const aprovarGestor = async (
  vendaId: string, usuarioId: string, usuarioNome: string
): Promise<VendaComFluxo | null> => {
  const dadosFluxo = fluxoCache[vendaId];
  if (!dadosFluxo || (dadosFluxo.statusFluxo !== 'Conferência Gestor' && dadosFluxo.statusFluxo !== 'Devolvido pelo Financeiro')) return null;

  const venda = getVendaById(vendaId);
  const isFiado = venda?.pagamentos?.some((p: any) => p.isFiado) || false;
  const proximoStatus: StatusVenda = isFiado ? 'Conferência Fiado' : 'Conferência Financeiro';

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'aprovacao_gestor',
    usuarioId, usuarioNome, descricao: `Aprovado pelo gestor ${usuarioNome}. Enviado para ${isFiado ? 'conferência fiado' : 'conferência financeira'}.`
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo, statusFluxo: proximoStatus,
    aprovacaoGestor: { usuarioId, usuarioNome, dataHora: new Date().toISOString() },
    timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline]
  };

  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);
  return getVendaComFluxo(vendaId);
};

export const devolverFinanceiro = async (
  vendaId: string, usuarioId: string, usuarioNome: string, motivo: string
): Promise<VendaComFluxo | null> => {
  const dadosFluxo = fluxoCache[vendaId];
  if (!dadosFluxo || dadosFluxo.statusFluxo !== 'Conferência Financeiro') return null;

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'devolucao_financeiro',
    usuarioId, usuarioNome, descricao: `Devolvido pelo financeiro ${usuarioNome}. Motivo: ${motivo}`, motivo
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo, statusFluxo: 'Devolvido pelo Financeiro',
    devolucaoFinanceiro: { usuarioId, usuarioNome, dataHora: new Date().toISOString(), motivo },
    timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline]
  };

  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);
  return getVendaComFluxo(vendaId);
};

export const finalizarVenda = async (
  vendaId: string, usuarioId: string, usuarioNome: string
): Promise<VendaComFluxo | null> => {
  let dadosFluxo = fluxoCache[vendaId];

  if (!dadosFluxo) {
    const venda = getVendaById(vendaId);
    if (venda && (venda as any).statusAtual === 'Conferência Financeiro') {
      dadosFluxo = { statusFluxo: 'Conferência Financeiro', timelineFluxo: (venda as any).timeline || [], bloqueadoParaEdicao: false };
      fluxoCache[vendaId] = dadosFluxo;
    } else return null;
  }
  if (dadosFluxo.statusFluxo !== 'Conferência Financeiro') return null;

  const venda = getVendaById(vendaId);

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'finalizacao',
    usuarioId, usuarioNome, descricao: `Venda finalizada por ${usuarioNome}. Venda bloqueada para edições.`
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo, statusFluxo: 'Finalizado',
    aprovacaoFinanceiro: { usuarioId, usuarioNome, dataHora: new Date().toISOString() },
    timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline],
    bloqueadoParaEdicao: true
  };

  fluxoCache[vendaId] = updated;

  updateVendaBase(vendaId, { statusAtual: 'Finalizado', bloqueadoParaEdicao: true });
  await saveFluxoToSupabase(vendaId, updated);

  ativarDemandasPorVenda(vendaId).catch(e => console.error('[FLUXO] Erro motoboy:', e));

  if (venda && venda.tradeIns && venda.tradeIns.length > 0) {
    await migrarTradeInsParaPendentes(venda.tradeIns, vendaId, venda.lojaVenda, usuarioNome);
  }

  try {
    if (venda) {
      const formaPrincipal = venda.pagamentos && venda.pagamentos.length > 0 ? venda.pagamentos[0].meioPagamento || 'Não informado' : 'Não informado';
      const dadosNotif: DadosVendaNotificacao = {
        id_venda: vendaId, loja: venda.lojaVenda || '', vendedor: venda.vendedor || '',
        cliente: venda.clienteNome || '', valor: (venda.total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        forma_pagamento: formaPrincipal,
      };
      enviarNotificacaoVenda(dadosNotif);
    }
  } catch (err) {
    console.error('[WhatsApp] Falha ao disparar notificação:', err);
  }

  return getVendaComFluxo(vendaId);
};

export const registrarEdicaoFluxo = async (
  vendaId: string, usuarioId: string, usuarioNome: string,
  alteracoes: { campo: string; valorAnterior: any; valorNovo: any }[]
): Promise<VendaComFluxo | null> => {
  const dadosFluxo = fluxoCache[vendaId];
  if (!dadosFluxo || dadosFluxo.bloqueadoParaEdicao) return null;

  const descricaoAlteracoes = alteracoes.map(a => {
    const valorAnt = typeof a.valorAnterior === 'number' ? `R$ ${a.valorAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : String(a.valorAnterior);
    const valorNov = typeof a.valorNovo === 'number' ? `R$ ${a.valorNovo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : String(a.valorNovo);
    return `${a.campo}: ${valorAnt} → ${valorNov}`;
  }).join('; ');

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'edicao',
    usuarioId, usuarioNome, descricao: `Editado por ${usuarioNome}. ${descricaoAlteracoes}`, alteracoes
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo, timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline]
  };

  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);
  return getVendaComFluxo(vendaId);
};

export const enviarParaPagamentoDowngrade = async (
  vendaId: string, usuarioId: string, usuarioNome: string, saldoDevolver: number
): Promise<VendaComFluxo | null> => {
  const dadosFluxo = fluxoCache[vendaId];
  if (!dadosFluxo || (dadosFluxo.statusFluxo !== 'Conferência Gestor' && dadosFluxo.statusFluxo !== 'Devolvido pelo Financeiro')) return null;

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'aprovacao_gestor',
    usuarioId, usuarioNome, descricao: `Aprovado pelo gestor ${usuarioNome}. Enviado para Pagamento Downgrade. Valor a devolver: R$ ${saldoDevolver.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo, statusFluxo: 'Pagamento Downgrade', saldoDevolver,
    aprovacaoGestor: { usuarioId, usuarioNome, dataHora: new Date().toISOString() },
    timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline]
  };

  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);
  return getVendaComFluxo(vendaId);
};

export const finalizarVendaDowngrade = async (
  vendaId: string, usuarioId: string, usuarioNome: string, contaOrigem: string, observacoes?: string
): Promise<VendaComFluxo | null> => {
  const dadosFluxo = fluxoCache[vendaId];
  if (!dadosFluxo || dadosFluxo.statusFluxo !== 'Pagamento Downgrade') return null;

  const venda = getVendaById(vendaId);
  const saldoDevolver = dadosFluxo.saldoDevolver || 0;

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'finalizacao',
    usuarioId, usuarioNome, descricao: `Pagamento PIX Downgrade executado por ${usuarioNome}. Conta: ${contaOrigem}${observacoes ? `. Obs: ${observacoes}` : ''}`
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo, statusFluxo: 'Finalizado', tipoOperacao: 'Downgrade',
    saldoDevolver, contaOrigemDowngrade: contaOrigem,
    pagamentoDowngrade: { usuarioId, usuarioNome, dataHora: new Date().toISOString(), contaOrigem, motivo: observacoes },
    timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline],
    bloqueadoParaEdicao: true
  };

  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);

  ativarDemandasPorVenda(vendaId).catch(e => console.error('[FLUXO] Erro motoboy:', e));

  if (saldoDevolver > 0) {
    const hoje = new Date();
    const mesAbrev = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    const comp = `${mesAbrev[hoje.getMonth()]}-${hoje.getFullYear()}`;
    addDespesa({
      tipo: 'Variável', data: hoje.toISOString().split('T')[0],
      descricao: `Pagamento PIX Downgrade - Venda ${vendaId}`, valor: saldoDevolver,
      competencia: comp, conta: contaOrigem, observacoes: observacoes || '',
      lojaId: venda?.lojaVenda || '', status: 'Pago', categoria: 'Downgrade',
      dataVencimento: hoje.toISOString().split('T')[0], dataPagamento: hoje.toISOString().split('T')[0],
      recorrente: false, periodicidade: null, pagoPor: usuarioNome
    });
  }

  if (venda && venda.tradeIns && venda.tradeIns.length > 0) {
    await migrarTradeInsParaPendentes(venda.tradeIns, vendaId, venda.lojaVenda, usuarioNome);
  }

  return getVendaComFluxo(vendaId);
};

export const finalizarVendaFiado = async (
  vendaId: string, usuarioId: string, usuarioNome: string
): Promise<VendaComFluxo | null> => {
  const dadosFluxo = fluxoCache[vendaId];
  if (!dadosFluxo || dadosFluxo.statusFluxo !== 'Conferência Fiado') return null;

  const venda = getVendaById(vendaId);
  if (!venda) return null;

  const novaTimeline: TimelineVenda = {
    id: `TL-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'finalizacao',
    usuarioId, usuarioNome, descricao: `Venda Fiado finalizada por ${usuarioNome}. Dívida criada automaticamente.`
  };

  const updated: Partial<VendaComFluxo> = {
    ...dadosFluxo, statusFluxo: 'Finalizado',
    aprovacaoFinanceiro: { usuarioId, usuarioNome, dataHora: new Date().toISOString() },
    timelineFluxo: [...(dadosFluxo.timelineFluxo || []), novaTimeline],
    bloqueadoParaEdicao: true
  };

  fluxoCache[vendaId] = updated;

  updateVendaBase(vendaId, { statusAtual: 'Finalizado', bloqueadoParaEdicao: true });
  await saveFluxoToSupabase(vendaId, updated);

  ativarDemandasPorVenda(vendaId).catch(e => console.error('[FLUXO] Erro motoboy:', e));

  const pagFiado = venda.pagamentos?.find((p: any) => p.isFiado);
  if (pagFiado) {
    criarDividaFiado(
      vendaId, (venda as any).clienteId || '', venda.clienteNome || '',
      (venda as any).lojaId || venda.lojaVenda || '', venda.lojaVenda || '',
      pagFiado.valor || venda.total || 0, (pagFiado as any).qtdVezes || 1,
      (pagFiado as any).tipoRecorrencia || 'Mensal'
    );
  }

  if (venda.tradeIns && venda.tradeIns.length > 0) {
    await migrarTradeInsParaPendentes(venda.tradeIns, vendaId, venda.lojaVenda, usuarioNome);
  }

  return getVendaComFluxo(vendaId);
};

// ============= HELPERS (síncronos) =============
export const podeEditarVenda = (venda: VendaComFluxo): boolean => !venda.bloqueadoParaEdicao && venda.statusFluxo !== 'Finalizado';
export const podeRecusarVenda = (venda: VendaComFluxo): boolean => venda.statusFluxo === 'Conferência Gestor' || venda.statusFluxo === 'Devolvido pelo Financeiro';
export const podeDevolverVenda = (venda: VendaComFluxo): boolean => venda.statusFluxo === 'Conferência Financeiro';
export const podeAprovarLancamento = (venda: VendaComFluxo): boolean => venda.statusFluxo === 'Aguardando Conferência' || venda.statusFluxo === 'Recusada - Gestor';
export const podeAprovarGestor = (venda: VendaComFluxo): boolean => venda.statusFluxo === 'Conferência Gestor' || venda.statusFluxo === 'Devolvido pelo Financeiro';
export const podeFinalizarVenda = (venda: VendaComFluxo): boolean => venda.statusFluxo === 'Conferência Financeiro';

export const getCorBadgeStatus = (status: StatusVenda): { bg: string; text: string; border: string } => {
  switch (status) {
    case 'Aguardando Conferência': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Feito Sinal': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'Conferência Gestor': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'Recusada - Gestor': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'Conferência Financeiro': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    case 'Conferência Fiado': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'Devolvido pelo Financeiro': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'Pagamento Downgrade': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'Finalizado': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'Cancelada': return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  }
};

export const exportFluxoToCSV = (data: VendaComFluxo[], filename: string) => {
  if (data.length === 0) return;
  const csvData = data.map(v => ({
    'ID': v.id, 'Data/Hora': new Date(v.dataHora).toLocaleString('pt-BR'),
    'Cliente': v.clienteNome, 'Valor Total': v.total,
    'Status Fluxo': v.statusFluxo || 'N/A', 'Tipo Operação': v.tipoOperacao || 'Upgrade',
    'Saldo Devolver': v.saldoDevolver || 0,
    'Lançador': v.aprovacaoLancamento?.usuarioNome || '-',
    'Data Lançamento': v.aprovacaoLancamento?.dataHora ? new Date(v.aprovacaoLancamento.dataHora).toLocaleString('pt-BR') : '-',
    'Gestor': v.aprovacaoGestor?.usuarioNome || '-',
    'Data Gestor': v.aprovacaoGestor?.dataHora ? new Date(v.aprovacaoGestor.dataHora).toLocaleString('pt-BR') : '-',
    'Financeiro': v.aprovacaoFinanceiro?.usuarioNome || '-',
    'Data Financeiro': v.aprovacaoFinanceiro?.dataHora ? new Date(v.aprovacaoFinanceiro.dataHora).toLocaleString('pt-BR') : '-'
  }));
  const headers = Object.keys(csvData[0]).join(',');
  const rows = csvData.map(item => Object.values(item).map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============= CONFERENCE DATA HELPERS (replacing localStorage) =============

export interface ConferenciaFinanceiroData {
  validacoesPagamento?: Array<{
    metodoPagamento: string;
    validadoGestor?: boolean;
    validadoFinanceiro: boolean;
    dataValidacaoGestor?: string;
    dataValidacaoFinanceiro?: string;
    conferidoPor?: string;
    contaDestinoId?: string;
  }>;
  observacaoFinanceiro?: {
    texto: string;
    dataHora: string;
    usuarioId: string;
    usuarioNome: string;
  };
  historicoConferencias?: Array<{
    metodoPagamento: string;
    contaDestino: string;
    valor: number;
    conferidoPor: string;
    dataHora: string;
  }>;
  dataFinalizacao?: string;
  contaDestinoId?: string;
  rejeicao?: {
    motivo: string;
    dataHora: string;
    usuarioId: string;
    usuarioNome: string;
  };
  notaEmitida?: boolean;
  dataEmissaoNota?: string;
}

export interface ConferenciaGestorData {
  validacoesPagamento?: Array<{
    metodoPagamento: string;
    validadoGestor: boolean;
    dataValidacao?: string;
  }>;
  observacao?: {
    texto: string;
    dataHora: string;
    usuarioId: string;
    usuarioNome: string;
  };
}

/** Get financial conference data from fluxo_vendas.aprovacao_financeiro JSONB */
export const getConferenciaFinanceiroData = (vendaId: string): ConferenciaFinanceiroData => {
  const dados = fluxoCache[vendaId];
  const af = dados?.aprovacaoFinanceiro as any;
  if (!af) return {};
  return {
    validacoesPagamento: af.validacoesPagamento,
    observacaoFinanceiro: af.observacaoFinanceiro,
    historicoConferencias: af.historicoConferencias,
    dataFinalizacao: af.dataFinalizacao,
    contaDestinoId: af.contaDestinoId,
    rejeicao: af.rejeicao,
    notaEmitida: af.notaEmitida,
    dataEmissaoNota: af.dataEmissaoNota,
  };
};

/** Save financial conference data to fluxo_vendas.aprovacao_financeiro JSONB */
export const salvarConferenciaFinanceiroData = async (vendaId: string, conferencia: Partial<ConferenciaFinanceiroData>) => {
  const dados = fluxoCache[vendaId] || {};
  const existingAf = (dados.aprovacaoFinanceiro || {}) as any;
  const updatedAf = { ...existingAf, ...conferencia };
  const updated = { ...dados, aprovacaoFinanceiro: updatedAf };
  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);
};

/** Get gestor conference data from fluxo_vendas.aprovacao_gestor JSONB */
export const getConferenciaGestorData = (vendaId: string): ConferenciaGestorData => {
  const dados = fluxoCache[vendaId];
  const ag = dados?.aprovacaoGestor as any;
  if (!ag) return {};
  return {
    validacoesPagamento: ag.validacoesPagamento,
    observacao: ag.observacao,
  };
};

/** Save gestor conference data to fluxo_vendas.aprovacao_gestor JSONB */
export const salvarConferenciaGestorData = async (vendaId: string, conferencia: Partial<ConferenciaGestorData>) => {
  const dados = fluxoCache[vendaId] || {};
  const existingAg = (dados.aprovacaoGestor || {}) as any;
  const updatedAg = { ...existingAg, ...conferencia };
  const updated = { ...dados, aprovacaoGestor: updatedAg };
  fluxoCache[vendaId] = updated;
  await saveFluxoToSupabase(vendaId, updated);
};

/** Check if NFE was issued for a sale (from JSONB) */
export const isNotaEmitidaFromDB = (vendaId: string): boolean => {
  return getConferenciaFinanceiroData(vendaId).notaEmitida || false;
};

/** Get NFE issue date (from JSONB) */
export const getDataEmissaoNotaFromDB = (vendaId: string): string | undefined => {
  return getConferenciaFinanceiroData(vendaId).dataEmissaoNota;
};

/** Get total NFE value emitted per account for a period */
export const getNotasEmitidasPorContaFromDB = (mes: number, ano: number): Record<string, number> => {
  const result: Record<string, number> = {};
  const todasVendas = getVendasComFluxo().filter(v => v.statusFluxo === 'Finalizado');
  todasVendas.forEach(v => {
    const af = (v.aprovacaoFinanceiro as any) || {};
    if (!af.notaEmitida || !af.dataEmissaoNota) return;
    const d = new Date(af.dataEmissaoNota);
    if (d.getMonth() !== mes || d.getFullYear() !== ano) return;
    const validacoes = af.validacoesPagamento || [];
    validacoes.forEach((val: any) => {
      if (val.contaDestinoId && val.validadoFinanceiro) {
        const pag = v.pagamentos?.find((p: any) => p.meioPagamento === val.metodoPagamento);
        result[val.contaDestinoId] = (result[val.contaDestinoId] || 0) + (pag?.valor || 0);
      }
    });
  });
  return result;
};
