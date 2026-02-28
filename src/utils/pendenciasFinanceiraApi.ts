// API para gerenciamento de pendências financeiras de notas de compra
// MIGRADO PARA SUPABASE - tabela pendencias_financeiras
import { supabase } from '@/integrations/supabase/client';
import { NotaCompra, TimelineEntry, getNotasCompra, getNotaById, updateNota } from './estoqueApi';
import { addNotification } from './notificationsApi';

export interface PendenciaFinanceira {
  id: string;
  notaId: string;
  fornecedor: string;
  valorTotal: number;
  valorConferido: number;
  valorPendente: number;
  statusPagamento: 'Aguardando Conferência' | 'Pago' | 'Parcial';
  statusConferencia: 'Em Conferência' | 'Conferência Completa' | 'Discrepância Detectada' | 'Finalizada com Pendência';
  aparelhosTotal: number;
  aparelhosConferidos: number;
  percentualConferencia: number;
  dataCriacao: string;
  dataVencimento: string;
  dataConferenciaCompleta?: string;
  dataPagamento?: string;
  slaAlerta: boolean;
  diasDecorridos: number;
  slaStatus: 'normal' | 'aviso' | 'critico';
  discrepancia?: boolean;
  motivoDiscrepancia?: string;
  acaoRecomendada?: 'Cobrar Fornecedor' | 'Cobrar Estoque';
  timeline: TimelineEntry[];
  origem: 'Normal' | 'Urgência';
}

// ============= CACHE =============
let pendenciasCache: PendenciaFinanceira[] = [];
let pendenciaCacheInitialized = false;

export const calcularSLAPendencia = (dataCriacao: string): { dias: number; status: 'normal' | 'aviso' | 'critico'; alerta: boolean } => {
  const dataInicio = new Date(dataCriacao);
  const hoje = new Date();
  const dias = Math.ceil(Math.abs(hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
  if (dias >= 5) return { dias, status: 'critico', alerta: true };
  if (dias >= 3) return { dias, status: 'aviso', alerta: true };
  return { dias, status: 'normal', alerta: false };
};

const dbToPendencia = (r: any): PendenciaFinanceira => ({
  id: r.id,
  notaId: r.nota_id || '',
  fornecedor: r.fornecedor || '',
  valorTotal: Number(r.valor_total) || 0,
  valorConferido: Number(r.valor_conferido) || 0,
  valorPendente: Number(r.valor_pendente) || 0,
  statusPagamento: r.status_pagamento || 'Aguardando Conferência',
  statusConferencia: r.status_conferencia || 'Em Conferência',
  aparelhosTotal: r.aparelhos_total || 0,
  aparelhosConferidos: r.aparelhos_conferidos || 0,
  percentualConferencia: r.percentual_conferencia || 0,
  dataCriacao: r.data_criacao || r.created_at,
  dataVencimento: r.data_vencimento || '',
  dataConferenciaCompleta: r.data_conferencia_completa || undefined,
  dataPagamento: r.data_pagamento || undefined,
  slaAlerta: r.sla_alerta || false,
  diasDecorridos: r.dias_decorridos || 0,
  slaStatus: r.sla_status || 'normal',
  discrepancia: r.discrepancia || false,
  motivoDiscrepancia: r.motivo_discrepancia || undefined,
  acaoRecomendada: r.acao_recomendada || undefined,
  timeline: r.timeline || [],
  origem: r.origem || 'Normal',
});

const pendenciaToDb = (p: PendenciaFinanceira) => ({
  id: p.id,
  nota_id: p.notaId,
  fornecedor: p.fornecedor,
  valor_total: p.valorTotal,
  valor_conferido: p.valorConferido,
  valor_pendente: p.valorPendente,
  status_pagamento: p.statusPagamento,
  status_conferencia: p.statusConferencia,
  aparelhos_total: p.aparelhosTotal,
  aparelhos_conferidos: p.aparelhosConferidos,
  percentual_conferencia: p.percentualConferencia,
  data_criacao: p.dataCriacao,
  data_vencimento: p.dataVencimento,
  data_conferencia_completa: p.dataConferenciaCompleta || null,
  data_pagamento: p.dataPagamento || null,
  sla_alerta: p.slaAlerta,
  dias_decorridos: p.diasDecorridos,
  sla_status: p.slaStatus,
  discrepancia: p.discrepancia || false,
  motivo_discrepancia: p.motivoDiscrepancia || null,
  acao_recomendada: p.acaoRecomendada || null,
  timeline: p.timeline,
  origem: p.origem,
});

export const initPendenciasFinanceirasCache = async () => {
  try {
    const { data, error } = await supabase.from('pendencias_financeiras').select('*');
    if (error) throw error;
    pendenciasCache = (data || []).map(dbToPendencia);
    pendenciaCacheInitialized = true;
    console.log(`[PendenciasFinanceiras] Cache: ${pendenciasCache.length} registros`);
  } catch (err) {
    console.error('[PendenciasFinanceiras] Erro init:', err);
    pendenciaCacheInitialized = true;
  }
};

// ============= MUTATIONS (async) =============
export const criarPendenciaFinanceira = async (nota: NotaCompra): Promise<PendenciaFinanceira> => {
  const id = `PEND-${nota.id}`;
  const aparelhosTotal = nota.produtos.filter(p => p.tipoProduto !== 'Acessório').length || nota.produtos.length;
  const aparelhosConferidos = nota.produtos.filter(p => p.statusConferencia === 'Conferido').length;
  const percentualConferencia = aparelhosTotal > 0 ? Math.round((aparelhosConferidos / aparelhosTotal) * 100) : 0;
  const sla = calcularSLAPendencia(nota.data);

  const valorConferido = nota.valorConferido ?? nota.produtos.filter(p => p.statusConferencia === 'Conferido').reduce((acc, p) => acc + p.valorTotal, 0);
  const valorPendente = nota.valorTotal - valorConferido;

  let statusConferencia: PendenciaFinanceira['statusConferencia'] = 'Em Conferência';
  if (percentualConferencia === 100) {
    statusConferencia = nota.discrepancia ? 'Discrepância Detectada' : 'Conferência Completa';
  }

  const novaPendencia: PendenciaFinanceira = {
    id, notaId: nota.id, fornecedor: nota.fornecedor,
    valorTotal: nota.valorTotal, valorConferido, valorPendente,
    statusPagamento: 'Aguardando Conferência', statusConferencia,
    aparelhosTotal, aparelhosConferidos, percentualConferencia,
    dataCriacao: nota.data, dataVencimento: nota.dataVencimento || calcularDataVencimento(nota.data, 30),
    slaAlerta: sla.alerta, diasDecorridos: sla.dias, slaStatus: sla.status,
    timeline: nota.timeline || [{ id: `TL-${nota.id}-001`, data: new Date().toISOString(), tipo: 'entrada', titulo: 'Pendência Criada', descricao: `Pendência financeira criada para nota ${nota.id}`, responsavel: 'Sistema' }],
    origem: nota.origem || 'Normal'
  };

  const { error } = await supabase.from('pendencias_financeiras').insert(pendenciaToDb(novaPendencia) as any);
  if (error) {
    console.error('[PendenciasFinanceiras] Erro insert:', error);
    throw error;
  }
  pendenciasCache.push(novaPendencia);

  addNotification({ type: 'nota_pendencia', title: 'Nova pendência financeira', description: `Nota ${nota.id} de ${nota.fornecedor} aguardando conferência - ${formatCurrency(nota.valorTotal)}`, targetUsers: ['financeiro', 'gestor'] });
  return novaPendencia;
};

export const atualizarPendencia = async (
  notaId: string, dados: { valorConferido?: number; aparelhosConferidos?: number; statusConferencia?: PendenciaFinanceira['statusConferencia']; responsavel?: string; aparelhoInfo?: { modelo: string; imei: string; valor: number } }
): Promise<PendenciaFinanceira | null> => {
  const index = pendenciasCache.findIndex(p => p.notaId === notaId);
  if (index === -1) return null;

  const pendencia = { ...pendenciasCache[index] };

  if (dados.valorConferido !== undefined) {
    pendencia.valorConferido = dados.valorConferido;
    pendencia.valorPendente = pendencia.valorTotal - dados.valorConferido;
  }
  if (dados.aparelhosConferidos !== undefined) {
    pendencia.aparelhosConferidos = dados.aparelhosConferidos;
    pendencia.percentualConferencia = Math.round((dados.aparelhosConferidos / pendencia.aparelhosTotal) * 100);
  }
  if (dados.statusConferencia) {
    pendencia.statusConferencia = dados.statusConferencia;
    if (dados.statusConferencia === 'Conferência Completa') {
      pendencia.dataConferenciaCompleta = new Date().toISOString();
      addNotification({ type: 'conferencia_completa', title: 'Nota pronta para pagamento', description: `Nota ${notaId} com 100% conferidos - ${formatCurrency(pendencia.valorTotal)}`, targetUsers: ['financeiro'] });
    }
    if (dados.statusConferencia === 'Discrepância Detectada') {
      pendencia.discrepancia = true;
      addNotification({ type: 'discrepancia', title: 'Discrepância detectada', description: `Nota ${notaId} apresenta discrepância.`, targetUsers: ['financeiro', 'gestor'] });
    }
  }

  const sla = calcularSLAPendencia(pendencia.dataCriacao);
  pendencia.diasDecorridos = sla.dias;
  pendencia.slaStatus = sla.status;
  pendencia.slaAlerta = sla.alerta;

  if (dados.responsavel) {
    const descricao = dados.aparelhoInfo
      ? `${dados.aparelhoInfo.modelo} (IMEI: ${dados.aparelhoInfo.imei}) conferido - ${formatCurrency(dados.aparelhoInfo.valor)}. Progresso: ${pendencia.aparelhosConferidos}/${pendencia.aparelhosTotal} (${pendencia.percentualConferencia}%)`
      : `${pendencia.aparelhosConferidos}/${pendencia.aparelhosTotal} aparelhos conferidos (${pendencia.percentualConferencia}%)`;
    pendencia.timeline = [{ id: `TL-${notaId}-${String(pendencia.timeline.length + 1).padStart(3, '0')}`, data: new Date().toISOString(), tipo: 'validacao', titulo: 'Aparelho Validado', descricao, responsavel: dados.responsavel }, ...pendencia.timeline];
    addNotification({ type: 'aparelho_validado', title: `Progresso - ${notaId}`, description: `${pendencia.aparelhosConferidos}/${pendencia.aparelhosTotal} validados (${pendencia.percentualConferencia}%)`, targetUsers: ['financeiro'] });
  }

  const { error } = await supabase.from('pendencias_financeiras').update(pendenciaToDb(pendencia) as any).eq('id', pendencia.id);
  if (error) {
    console.error('[PendenciasFinanceiras] Erro update:', error);
    throw error;
  }
  pendenciasCache[index] = pendencia;
  return pendencia;
};

export const finalizarPagamentoPendencia = async (
  notaId: string, pagamento: { formaPagamento: string; parcelas: number; contaPagamento: string; comprovante?: string; dataVencimento?: string; observacoes?: string; responsavel: string }
): Promise<PendenciaFinanceira | null> => {
  const index = pendenciasCache.findIndex(p => p.notaId === notaId);
  if (index === -1) return null;

  const pendencia = { ...pendenciasCache[index] };
  pendencia.statusPagamento = 'Pago';
  pendencia.dataPagamento = new Date().toISOString();
  pendencia.timeline = [{ id: `TL-${notaId}-${String(pendencia.timeline.length + 1).padStart(3, '0')}`, data: new Date().toISOString(), tipo: 'pagamento', titulo: 'Pagamento Confirmado', descricao: `Pagamento de ${formatCurrency(pendencia.valorTotal)} via ${pagamento.formaPagamento}. ${pagamento.observacoes || ''}`, responsavel: pagamento.responsavel, valor: pendencia.valorTotal, comprovante: pagamento.comprovante }, ...pendencia.timeline];

  const { error } = await supabase.from('pendencias_financeiras').update(pendenciaToDb(pendencia) as any).eq('id', pendencia.id);
  if (error) {
    console.error('[PendenciasFinanceiras] Erro update pagamento:', error);
    throw error;
  }
  pendenciasCache[index] = pendencia;

  const nota = getNotaById(notaId);
  if (nota) {
    updateNota(notaId, { status: 'Concluído', statusPagamento: 'Pago', pagamento: { formaPagamento: pagamento.formaPagamento, parcelas: pagamento.parcelas, valorParcela: pendencia.valorTotal / pagamento.parcelas, dataVencimento: pagamento.dataVencimento || new Date().toISOString().split('T')[0], comprovante: pagamento.comprovante, contaPagamento: pagamento.contaPagamento }, responsavelFinanceiro: pagamento.responsavel });
  }

  addNotification({ type: 'pagamento_confirmado', title: 'Pagamento confirmado', description: `Nota ${notaId} paga - ${formatCurrency(pendencia.valorTotal)}`, targetUsers: ['estoque'] });
  return pendencia;
};

export const forcarFinalizacaoPendencia = async (
  notaId: string, pagamento: { formaPagamento: string; parcelas: number; contaPagamento: string; comprovante?: string; dataVencimento?: string; observacoes?: string; responsavel: string }
): Promise<PendenciaFinanceira | null> => {
  const index = pendenciasCache.findIndex(p => p.notaId === notaId);
  if (index === -1) return null;

  const pendencia = { ...pendenciasCache[index] };
  const valorNaoConferido = pendencia.valorTotal - pendencia.valorConferido;
  pendencia.statusConferencia = 'Finalizada com Pendência';
  pendencia.statusPagamento = 'Pago';
  pendencia.dataPagamento = new Date().toISOString();
  pendencia.timeline = [{ id: `TL-${notaId}-${String(pendencia.timeline.length + 1).padStart(3, '0')}`, data: new Date().toISOString(), tipo: 'pagamento', titulo: 'Finalizada com Pendência', descricao: `Pagamento forçado com ${pendencia.percentualConferencia}% conferido. Valor não conferido: ${formatCurrency(valorNaoConferido)}. ${pagamento.observacoes || ''}`, responsavel: pagamento.responsavel, valor: pendencia.valorTotal, comprovante: pagamento.comprovante }, ...pendencia.timeline];

  const { error } = await supabase.from('pendencias_financeiras').update(pendenciaToDb(pendencia) as any).eq('id', pendencia.id);
  if (error) {
    console.error('[PendenciasFinanceiras] Erro update forçado:', error);
    throw error;
  }
  pendenciasCache[index] = pendencia;

  const nota = getNotaById(notaId);
  if (nota) {
    updateNota(notaId, { status: 'Concluído', statusPagamento: 'Pago', statusConferencia: 'Finalizada com Pendência', pagamento: { formaPagamento: pagamento.formaPagamento, parcelas: pagamento.parcelas, valorParcela: pendencia.valorTotal / pagamento.parcelas, dataVencimento: pagamento.dataVencimento || new Date().toISOString().split('T')[0], comprovante: pagamento.comprovante, contaPagamento: pagamento.contaPagamento }, responsavelFinanceiro: pagamento.responsavel });
  }

  addNotification({ type: 'pagamento_confirmado', title: 'Pagamento forçado confirmado', description: `Nota ${notaId} finalizada com ${pendencia.percentualConferencia}% - ${formatCurrency(pendencia.valorTotal)}`, targetUsers: ['estoque', 'gestor'] });
  return pendencia;
};

// ============= GETTERS =============
export const getPendencias = (): PendenciaFinanceira[] =>
  pendenciasCache.map(p => { const sla = calcularSLAPendencia(p.dataCriacao); return { ...p, diasDecorridos: sla.dias, slaStatus: sla.status, slaAlerta: sla.alerta }; });

export const getPendenciaPorNota = (notaId: string): PendenciaFinanceira | null => {
  const p = pendenciasCache.find(p => p.notaId === notaId);
  if (!p) return null;
  const sla = calcularSLAPendencia(p.dataCriacao);
  return { ...p, diasDecorridos: sla.dias, slaStatus: sla.status, slaAlerta: sla.alerta };
};

export const verificarSLAPendencias = (): void => {
  pendenciasCache.forEach(p => {
    if (p.statusPagamento === 'Pago') return;
    const sla = calcularSLAPendencia(p.dataCriacao);
    if (sla.status === 'critico' && !p.slaAlerta) {
      addNotification({ type: 'sla_critico', title: 'SLA Crítico!', description: `Nota ${p.notaId} há ${sla.dias} dias sem pagamento`, targetUsers: ['financeiro', 'gestor'] });
    }
  });
};

// Helpers
const calcularDataVencimento = (dataBase: string, dias: number): string => {
  const data = new Date(dataBase);
  data.setDate(data.getDate() + dias);
  return data.toISOString().split('T')[0];
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
