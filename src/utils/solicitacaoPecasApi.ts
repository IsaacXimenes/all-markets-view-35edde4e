// Solicitação de Peças API
// MIGRADO PARA SUPABASE - tabelas: solicitacoes_pecas, notas_assistencia, lotes_pagamento_pecas
import { supabase } from '@/integrations/supabase/client';
import { getOrdemServicoById, updateOrdemServico } from './assistenciaApi';
import { addDespesa } from './financeApi';
import { finalizarAcerto, confirmarPagamentoPorNotaId } from './consignacaoApi';

export interface SolicitacaoPeca {
  id: string;
  osId: string;
  peca: string;
  quantidade: number;
  justificativa: string;
  modeloImei: string;
  lojaSolicitante: string;
  dataSolicitacao: string;
  status: 'Pendente' | 'Aprovada' | 'Rejeitada' | 'Enviada' | 'Recebida' | 'Aguardando Aprovação' | 'Pagamento - Financeiro' | 'Pagamento Finalizado' | 'Aguardando Chegada' | 'Em Estoque' | 'Cancelada' | 'Devolvida ao Fornecedor' | 'Retida para Estoque' | 'Recusada pelo Financeiro';
  fornecedorId?: string;
  valorPeca?: number;
  responsavelCompra?: string;
  dataRecebimento?: string;
  dataEnvio?: string;
  motivoRejeicao?: string;
  contaOrigemPagamento?: string;
  dataPagamento?: string;
  formaPagamento?: 'Pix' | 'Dinheiro';
  origemPeca?: 'Fornecedor' | 'Estoque Assistência Thiago';
  observacao?: string;
  bancoDestinatario?: string;
  chavePix?: string;
  osCancelada?: boolean;
  motivoTratamento?: string;
  tratadaPor?: string;
  origemEntrada?: 'Balcao' | 'Garantia' | 'Estoque';
}

export interface LotePagamento {
  id: string;
  fornecedorId: string;
  solicitacaoIds: string[];
  valorTotal: number;
  dataCriacao: string;
  status: 'Pendente' | 'Concluido';
  responsavelFinanceiro?: string;
  formaPagamento?: string;
  contaPagamento?: string;
  dataConferencia?: string;
}

export interface DadosPagamentoEncaminhamento {
  formaPagamento: 'Pix' | 'Dinheiro';
  contaBancaria?: string;
  nomeRecebedor?: string;
  chavePix?: string;
  observacao: string;
}

export interface NotaAssistencia {
  id: string;
  solicitacaoId: string;
  fornecedor: string;
  lojaSolicitante: string;
  osId?: string;
  dataCriacao: string;
  valorTotal: number;
  status: 'Pendente' | 'Concluído';
  itens: {
    peca: string;
    quantidade: number;
    valorUnitario: number;
    osVinculada?: string;
  }[];
  responsavelFinanceiro?: string;
  formaPagamento?: string;
  contaPagamento?: string;
  dataConferencia?: string;
  loteId?: string;
  solicitacaoIds?: string[];
  formaPagamentoEncaminhamento?: string;
  contaBancariaEncaminhamento?: string;
  nomeRecebedor?: string;
  chavePixEncaminhamento?: string;
  observacaoEncaminhamento?: string;
  tipoConsignacao?: boolean;
}

// Helper to resolve origemEntrada from OS
const resolveOrigemEntrada = (osId: string): 'Balcao' | 'Garantia' | 'Estoque' | undefined => {
  const os = getOrdemServicoById(osId);
  if (!os?.origemOS) return undefined;
  if (os.origemOS === 'Garantia') return 'Garantia';
  if (os.origemOS === 'Estoque') return 'Estoque';
  return 'Balcao';
};

// ============= CACHE =============
let solicitacoes: SolicitacaoPeca[] = [];
let notasAssistencia: NotaAssistencia[] = [];
let lotesPagamento: LotePagamento[] = [];
let solicitacaoCounter = 21;
let notaAssistenciaCounter = 9;
let loteCounter = 1;
let solicitacoesCacheInit = false;
let notasCacheInit = false;
let lotesCacheInit = false;

// ============= DB MAPPERS =============
const dbToSolicitacao = (r: any): SolicitacaoPeca => ({
  id: r.id,
  osId: r.os_id || '',
  peca: r.peca || '',
  quantidade: r.quantidade || 1,
  justificativa: r.justificativa || '',
  modeloImei: r.modelo_imei || '',
  lojaSolicitante: r.loja_solicitante || '',
  dataSolicitacao: r.data_solicitacao || r.created_at,
  status: r.status || 'Pendente',
  fornecedorId: r.fornecedor_id || undefined,
  valorPeca: r.valor_peca != null ? Number(r.valor_peca) : undefined,
  responsavelCompra: r.responsavel_compra || undefined,
  dataRecebimento: r.data_recebimento || undefined,
  dataEnvio: r.data_envio || undefined,
  motivoRejeicao: r.motivo_rejeicao || undefined,
  contaOrigemPagamento: r.conta_origem_pag || undefined,
  dataPagamento: r.data_pagamento || undefined,
  formaPagamento: r.forma_pagamento || undefined,
  origemPeca: r.origem_peca || undefined,
  observacao: r.observacao || undefined,
  bancoDestinatario: r.banco_destinatario || undefined,
  chavePix: r.chave_pix || undefined,
  osCancelada: r.os_cancelada || false,
  motivoTratamento: r.motivo_tratamento || undefined,
  tratadaPor: r.tratada_por || undefined,
  origemEntrada: r.origem_entrada || undefined,
});

const solicitacaoToDb = (s: SolicitacaoPeca) => ({
  id: s.id,
  os_id: s.osId,
  peca: s.peca,
  quantidade: s.quantidade,
  justificativa: s.justificativa,
  modelo_imei: s.modeloImei,
  loja_solicitante: s.lojaSolicitante,
  data_solicitacao: s.dataSolicitacao,
  status: s.status,
  fornecedor_id: s.fornecedorId || null,
  valor_peca: s.valorPeca ?? null,
  responsavel_compra: s.responsavelCompra || null,
  data_recebimento: s.dataRecebimento || null,
  data_envio: s.dataEnvio || null,
  motivo_rejeicao: s.motivoRejeicao || null,
  conta_origem_pag: s.contaOrigemPagamento || null,
  data_pagamento: s.dataPagamento || null,
  forma_pagamento: s.formaPagamento || null,
  origem_peca: s.origemPeca || null,
  observacao: s.observacao || null,
  banco_destinatario: s.bancoDestinatario || null,
  chave_pix: s.chavePix || null,
  os_cancelada: s.osCancelada || false,
  motivo_tratamento: s.motivoTratamento || null,
  tratada_por: s.tratadaPor || null,
  origem_entrada: s.origemEntrada || null,
});

const dbToNota = (r: any): NotaAssistencia => ({
  id: r.id,
  solicitacaoId: r.solicitacao_id || '',
  fornecedor: r.fornecedor || '',
  lojaSolicitante: r.loja_solicitante || '',
  osId: r.os_id || undefined,
  dataCriacao: r.data_criacao || r.created_at,
  valorTotal: Number(r.valor_total) || 0,
  status: r.status || 'Pendente',
  itens: r.itens || [],
  responsavelFinanceiro: r.resp_financeiro || undefined,
  formaPagamento: r.forma_pagamento || undefined,
  contaPagamento: r.conta_pagamento || undefined,
  dataConferencia: r.data_conferencia || undefined,
  loteId: r.lote_id || undefined,
  solicitacaoIds: r.solicitacao_ids || undefined,
  formaPagamentoEncaminhamento: r.forma_pag_enc || undefined,
  contaBancariaEncaminhamento: r.conta_bancaria_enc || undefined,
  nomeRecebedor: r.nome_recebedor || undefined,
  chavePixEncaminhamento: r.chave_pix_enc || undefined,
  observacaoEncaminhamento: r.observacao_enc || undefined,
  tipoConsignacao: r.tipo_consignacao || false,
});

const notaToDb = (n: NotaAssistencia) => ({
  id: n.id,
  solicitacao_id: n.solicitacaoId,
  solicitacao_ids: n.solicitacaoIds || [],
  lote_id: n.loteId || null,
  fornecedor: n.fornecedor,
  loja_solicitante: n.lojaSolicitante,
  os_id: n.osId || null,
  data_criacao: n.dataCriacao,
  valor_total: n.valorTotal,
  status: n.status,
  itens: n.itens as any,
  resp_financeiro: n.responsavelFinanceiro || null,
  forma_pagamento: n.formaPagamento || null,
  conta_pagamento: n.contaPagamento || null,
  data_conferencia: n.dataConferencia || null,
  forma_pag_enc: n.formaPagamentoEncaminhamento || null,
  conta_bancaria_enc: n.contaBancariaEncaminhamento || null,
  nome_recebedor: n.nomeRecebedor || null,
  chave_pix_enc: n.chavePixEncaminhamento || null,
  observacao_enc: n.observacaoEncaminhamento || null,
  tipo_consignacao: n.tipoConsignacao || false,
});

const dbToLote = (r: any): LotePagamento => ({
  id: r.id,
  fornecedorId: r.fornecedor_id || '',
  solicitacaoIds: r.solicitacao_ids || [],
  valorTotal: Number(r.valor_total) || 0,
  dataCriacao: r.data_criacao || r.created_at,
  status: r.status || 'Pendente',
  responsavelFinanceiro: r.resp_financeiro || undefined,
  formaPagamento: r.forma_pagamento || undefined,
  contaPagamento: r.conta_pagamento || undefined,
  dataConferencia: r.data_conferencia || undefined,
});

const loteToDb = (l: LotePagamento) => ({
  id: l.id,
  fornecedor_id: l.fornecedorId,
  solicitacao_ids: l.solicitacaoIds as any,
  valor_total: l.valorTotal,
  data_criacao: l.dataCriacao,
  status: l.status,
  resp_financeiro: l.responsavelFinanceiro || null,
  forma_pagamento: l.formaPagamento || null,
  conta_pagamento: l.contaPagamento || null,
  data_conferencia: l.dataConferencia || null,
});

// ============= SEED DATA =============
const seedSolicitacoes: SolicitacaoPeca[] = [
  { id: 'SOL-020', osId: 'OS-2025-0020', peca: 'Bateria iPhone 13 Pro', quantidade: 1, justificativa: 'Bateria com saúde em 65%, cliente relatou desligamentos', modeloImei: '999888777666001', lojaSolicitante: 'db894e7d', dataSolicitacao: '2025-01-18T10:00:00', status: 'Pendente', origemEntrada: 'Balcao' },
  { id: 'SOL-001', osId: 'OS-2025-0007', peca: 'Display OLED iPhone 14 Pro', quantidade: 1, justificativa: 'Tela com burn-in severo, necessário troca urgente para garantia', modeloImei: '789012345678901', lojaSolicitante: '3ac7e00c', dataSolicitacao: '2025-01-11T10:00:00', status: 'Pendente', origemEntrada: 'Garantia' },
  { id: 'SOL-002', osId: 'OS-2025-0006', peca: 'Câmera Traseira iPhone 13', quantidade: 1, justificativa: 'Câmera com defeito de foco automático', modeloImei: '678901234567890', lojaSolicitante: 'db894e7d', dataSolicitacao: '2025-01-16T09:30:00', status: 'Pendente', origemEntrada: 'Balcao' },
  { id: 'SOL-003', osId: 'OS-2025-0003', peca: 'Bateria iPhone 12', quantidade: 2, justificativa: 'Reposição de estoque para assistências futuras', modeloImei: '345678901234567', lojaSolicitante: 'db894e7d', dataSolicitacao: '2025-01-13T14:00:00', status: 'Aprovada', fornecedorId: 'FORN-003', valorPeca: 180, responsavelCompra: 'COL-002', dataRecebimento: '2025-01-20', dataEnvio: '2025-01-21', origemEntrada: 'Estoque' },
  { id: 'SOL-004', osId: 'OS-2025-0004', peca: 'Conector de Carga USB-C', quantidade: 3, justificativa: 'Peça com alta demanda, reposição de estoque', modeloImei: '456789012345678', lojaSolicitante: '5b9446d5', dataSolicitacao: '2025-01-14T11:00:00', status: 'Aprovada', fornecedorId: 'FORN-003', valorPeca: 45, responsavelCompra: 'COL-002', dataRecebimento: '2025-01-20', dataEnvio: '2025-01-21', origemEntrada: 'Balcao' },
  { id: 'SOL-005', osId: 'OS-2025-0001', peca: 'Tela LCD iPhone 11', quantidade: 1, justificativa: 'Troca de tela para serviço de garantia', modeloImei: '123456789012345', lojaSolicitante: 'db894e7d', dataSolicitacao: '2025-01-10T11:00:00', status: 'Recebida', fornecedorId: 'FORN-005', valorPeca: 320, responsavelCompra: 'COL-002', dataRecebimento: '2025-01-15', dataEnvio: '2025-01-16', origemEntrada: 'Garantia' },
];

const seedNotas: NotaAssistencia[] = [
  { id: 'NOTA-ASS-002', solicitacaoId: 'SOL-020', fornecedor: 'FORN-003', lojaSolicitante: 'db894e7d', osId: 'OS-2025-0020', dataCriacao: '2025-01-18T10:00:00', valorTotal: 450, status: 'Pendente', itens: [{ peca: 'Bateria iPhone 13 Pro', quantidade: 1, valorUnitario: 280 }, { peca: 'Película de vidro', quantidade: 2, valorUnitario: 85 }] },
  { id: 'NOTA-ASS-003', solicitacaoId: 'SOL-018', fornecedor: 'FORN-005', lojaSolicitante: '5b9446d5', osId: 'OS-2025-0018', dataCriacao: '2025-01-17T14:30:00', valorTotal: 890, status: 'Pendente', itens: [{ peca: 'Tela LCD iPhone 14', quantidade: 1, valorUnitario: 750 }, { peca: 'Cola B7000', quantidade: 2, valorUnitario: 35 }, { peca: 'Ferramentas Troca Tela', quantidade: 1, valorUnitario: 70 }] },
  { id: 'NOTA-ASS-004', solicitacaoId: 'SOL-015', fornecedor: 'FORN-001', lojaSolicitante: '3ac7e00c', osId: 'OS-2025-0015', dataCriacao: '2025-01-16T09:00:00', valorTotal: 1250, status: 'Pendente', itens: [{ peca: 'Módulo Câmera iPhone 15 Pro', quantidade: 1, valorUnitario: 1100 }, { peca: 'Flex Power', quantidade: 1, valorUnitario: 150 }] },
  { id: 'NOTA-ASS-005', solicitacaoId: 'SOL-012', fornecedor: 'FORN-002', lojaSolicitante: '5b9446d5', osId: 'OS-2025-0012', dataCriacao: '2025-01-15T11:00:00', valorTotal: 320, status: 'Pendente', itens: [{ peca: 'Conector de Carga iPhone 12', quantidade: 2, valorUnitario: 120 }, { peca: 'Alto-falante auricular', quantidade: 1, valorUnitario: 80 }] },
  { id: 'NOTA-ASS-006', solicitacaoId: 'SOL-010', fornecedor: 'FORN-003', lojaSolicitante: '0d06e7db', osId: 'OS-2025-0010', dataCriacao: '2025-01-14T15:00:00', valorTotal: 580, status: 'Pendente', itens: [{ peca: 'Bateria iPhone 14 Pro Max', quantidade: 1, valorUnitario: 380 }, { peca: 'Adesivo bateria', quantidade: 2, valorUnitario: 25 }, { peca: 'Parafusos Pentalobe', quantidade: 1, valorUnitario: 150 }] },
  { id: 'NOTA-ASS-001', solicitacaoId: 'SOL-005', fornecedor: 'FORN-005', lojaSolicitante: 'db894e7d', osId: 'OS-2025-0005', dataCriacao: '2025-01-12T14:00:00', valorTotal: 320, status: 'Concluído', itens: [{ peca: 'Tela LCD iPhone 11', quantidade: 1, valorUnitario: 320 }], responsavelFinanceiro: 'Fernanda Lima', formaPagamento: 'Pix', contaPagamento: 'Conta Bancária Principal', dataConferencia: '2025-01-13' },
  { id: 'NOTA-ASS-007', solicitacaoId: 'SOL-003', fornecedor: 'FORN-001', lojaSolicitante: '5b9446d5', osId: 'OS-2025-0003', dataCriacao: '2025-01-08T10:00:00', valorTotal: 420, status: 'Concluído', itens: [{ peca: 'Bateria iPhone 11', quantidade: 2, valorUnitario: 180 }, { peca: 'Adesivo bateria', quantidade: 2, valorUnitario: 30 }], responsavelFinanceiro: 'Lucas Mendes', formaPagamento: 'Transferência Bancária', contaPagamento: 'Conta Digital Administrativo', dataConferencia: '2025-01-09' },
  { id: 'NOTA-ASS-008', solicitacaoId: 'SOL-001', fornecedor: 'FORN-002', lojaSolicitante: '3ac7e00c', osId: 'OS-2025-0001', dataCriacao: '2025-01-05T09:00:00', valorTotal: 780, status: 'Concluído', itens: [{ peca: 'Módulo câmera frontal iPhone 14', quantidade: 1, valorUnitario: 450 }, { peca: 'Face ID Flex', quantidade: 1, valorUnitario: 330 }], responsavelFinanceiro: 'Fernanda Lima', formaPagamento: 'Boleto', contaPagamento: 'Conta Bancária Principal', dataConferencia: '2025-01-07' },
];

// ============= INIT CACHES =============
export const initSolicitacoesPecasCache = async () => {
  try {
    const { data, error } = await supabase.from('solicitacoes_pecas').select('*');
    if (error) throw error;
    if (!data || data.length === 0) {
      const records = seedSolicitacoes.map(solicitacaoToDb);
      const { error: insertErr } = await supabase.from('solicitacoes_pecas').insert(records as any);
      if (insertErr) console.error('[SolicitacoesPecas] Erro seed:', insertErr);
      solicitacoes = [...seedSolicitacoes];
    } else {
      solicitacoes = data.map(dbToSolicitacao);
    }
    solicitacaoCounter = Math.max(21, solicitacoes.length + 1);
    solicitacoesCacheInit = true;
    console.log(`[SolicitacoesPecas] Cache: ${solicitacoes.length} registros`);
  } catch (err) {
    console.error('[SolicitacoesPecas] Erro init:', err);
    solicitacoes = [...seedSolicitacoes];
    solicitacoesCacheInit = true;
  }
};

export const initNotasAssistenciaCache = async () => {
  try {
    const { data, error } = await supabase.from('notas_assistencia').select('*');
    if (error) throw error;
    if (!data || data.length === 0) {
      const records = seedNotas.map(notaToDb);
      const { error: insertErr } = await supabase.from('notas_assistencia').insert(records as any);
      if (insertErr) console.error('[NotasAssistencia] Erro seed:', insertErr);
      notasAssistencia = [...seedNotas];
    } else {
      notasAssistencia = data.map(dbToNota);
    }
    notaAssistenciaCounter = Math.max(9, notasAssistencia.length + 1);
    notasCacheInit = true;
    console.log(`[NotasAssistencia] Cache: ${notasAssistencia.length} registros`);
  } catch (err) {
    console.error('[NotasAssistencia] Erro init:', err);
    notasAssistencia = [...seedNotas];
    notasCacheInit = true;
  }
};

export const initLotesPagamentoCache = async () => {
  try {
    const { data, error } = await supabase.from('lotes_pagamento_pecas').select('*');
    if (error) throw error;
    lotesPagamento = (data || []).map(dbToLote);
    loteCounter = Math.max(1, lotesPagamento.length + 1);
    lotesCacheInit = true;
    console.log(`[LotesPagamento] Cache: ${lotesPagamento.length} registros`);
  } catch (err) {
    console.error('[LotesPagamento] Erro init:', err);
    lotesCacheInit = true;
  }
};

// ============= GETTERS =============
export const getSolicitacoes = () => [...solicitacoes];
export const getSolicitacaoPendentes = () => solicitacoes.filter(s => s.status === 'Pendente');
export const getSolicitacoesByOS = (osId: string) => solicitacoes.filter(s => s.osId === osId);
export const getNotasAssistencia = () => [...notasAssistencia];
export const getNotasAssistenciaPendentes = () => notasAssistencia.filter(n => n.status === 'Pendente');
export const getLotesPagamento = () => [...lotesPagamento];
export const getSolicitacaoById = (id: string) => solicitacoes.find(s => s.id === id) || null;

// Helper para injetar nota de consignação (chamado pela consignacaoApi)
export const __pushNotaConsignacao = (nota: NotaAssistencia) => {
  notasAssistencia.push(nota);
  supabase.from('notas_assistencia').insert(notaToDb(nota) as any).then(({ error }) => {
    if (error) console.error('[NotasAssistencia] Erro push consignacao:', error);
  });
};

// ============= MUTATIONS (async) =============
export const addSolicitacao = async (data: Omit<SolicitacaoPeca, 'id' | 'dataSolicitacao' | 'status'>): Promise<SolicitacaoPeca> => {
  const origemEntrada = data.origemEntrada || resolveOrigemEntrada(data.osId);
  const novaSolicitacao: SolicitacaoPeca = {
    ...data,
    id: `SOL-${String(solicitacaoCounter++).padStart(3, '0')}`,
    dataSolicitacao: new Date().toISOString(),
    status: 'Pendente',
    origemEntrada
  };
  solicitacoes.push(novaSolicitacao);
  const { error } = await supabase.from('solicitacoes_pecas').insert(solicitacaoToDb(novaSolicitacao) as any);
  if (error) console.error('[SolicitacoesPecas] Erro insert:', error);
  return novaSolicitacao;
};

const updateSolicitacaoDb = async (sol: SolicitacaoPeca) => {
  const { error } = await supabase.from('solicitacoes_pecas').update(solicitacaoToDb(sol) as any).eq('id', sol.id);
  if (error) console.error('[SolicitacoesPecas] Erro update:', error);
};

export const aprovarSolicitacao = async (id: string, dados: {
  fornecedorId: string;
  valorPeca: number;
  responsavelCompra: string;
  dataRecebimento: string;
  dataEnvio: string;
  formaPagamento?: string;
  origemPeca?: string;
  observacao?: string;
  bancoDestinatario?: string;
  chavePix?: string;
}): Promise<SolicitacaoPeca | null> => {
  const index = solicitacoes.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  solicitacoes[index] = {
    ...solicitacoes[index],
    ...dados,
    formaPagamento: dados.formaPagamento as 'Pix' | 'Dinheiro' | undefined,
    origemPeca: dados.origemPeca as 'Fornecedor' | 'Estoque Assistência Thiago' | undefined,
    status: 'Aprovada'
  };

  await updateSolicitacaoDb(solicitacoes[index]);

  const osId = solicitacoes[index].osId;
  const os = getOrdemServicoById(osId);
  if (os) {
    await updateOrdemServico(osId, {
      status: 'Aguardando Peça',
      proximaAtuacao: 'Gestor: Aprovar Peça',
      timeline: [...os.timeline, {
        data: new Date().toISOString(),
        tipo: 'peca',
        descricao: `Solicitação ${id} aprovada pela gestora da matriz`,
        responsavel: dados.responsavelCompra
      }]
    });
  }

  return solicitacoes[index];
};

export const rejeitarSolicitacao = async (id: string, motivoRejeicao?: string): Promise<SolicitacaoPeca | null> => {
  const index = solicitacoes.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  const solicitacao = solicitacoes[index];
  solicitacoes[index] = { ...solicitacao, status: 'Rejeitada', motivoRejeicao };
  await updateSolicitacaoDb(solicitacoes[index]);
  
  const osId = solicitacao.osId;
  const os = getOrdemServicoById(osId);
  if (os) {
    await updateOrdemServico(osId, {
      timeline: [...os.timeline, {
        data: new Date().toISOString(),
        tipo: 'peca',
        descricao: `Solicitação ${id} REJEITADA – ${solicitacao.peca} x ${solicitacao.quantidade} | Motivo: ${motivoRejeicao || 'Não informado'}`,
        responsavel: 'Gestora Matriz'
      }]
    });
  }
  
  return solicitacoes[index];
};

// ========== AÇÕES EM MASSA - Encaminhar para Financeiro ==========
export const encaminharParaFinanceiro = async (solicitacaoIds: string[], usuarioNome: string, dadosPagamento?: DadosPagamentoEncaminhamento): Promise<NotaAssistencia[]> => {
  const notasCriadas: NotaAssistencia[] = [];
  
  for (const solId of solicitacaoIds) {
    const idx = solicitacoes.findIndex(s => s.id === solId);
    if (idx === -1 || solicitacoes[idx].status !== 'Aprovada') continue;
    
    const sol = solicitacoes[idx];
    solicitacoes[idx] = { ...sol, status: 'Pagamento - Financeiro' };
    await updateSolicitacaoDb(solicitacoes[idx]);
    
    const novaNota: NotaAssistencia = {
      id: `NOTA-ASS-${String(notaAssistenciaCounter++).padStart(3, '0')}`,
      solicitacaoId: solId,
      fornecedor: sol.fornecedorId || '',
      lojaSolicitante: sol.lojaSolicitante,
      osId: sol.osId,
      dataCriacao: new Date().toISOString(),
      valorTotal: (sol.valorPeca || 0) * sol.quantidade,
      status: 'Pendente',
      itens: [{ peca: sol.peca, quantidade: sol.quantidade, valorUnitario: sol.valorPeca || 0 }],
      ...(dadosPagamento && {
        formaPagamentoEncaminhamento: dadosPagamento.formaPagamento,
        contaBancariaEncaminhamento: dadosPagamento.contaBancaria,
        nomeRecebedor: dadosPagamento.nomeRecebedor,
        chavePixEncaminhamento: dadosPagamento.chavePix,
        observacaoEncaminhamento: dadosPagamento.observacao
      })
    };
    notasAssistencia.push(novaNota);
    notasCriadas.push(novaNota);
    const { error } = await supabase.from('notas_assistencia').insert(notaToDb(novaNota) as any);
    if (error) console.error('[NotasAssistencia] Erro insert:', error);
    
    const os = getOrdemServicoById(sol.osId);
    if (os) {
      await updateOrdemServico(sol.osId, {
        timeline: [...os.timeline, {
          data: new Date().toISOString(),
          tipo: 'peca',
          descricao: `Registro encaminhado para conferência financeira por ${usuarioNome} via ação em massa`,
          responsavel: usuarioNome
        }]
      });
    }
  }
  
  return notasCriadas;
};

// ========== Agrupar Solicitações para Pagamento (Lote) ==========
export const agruparParaPagamento = async (solicitacaoIds: string[], usuarioNome: string, dadosPagamento?: DadosPagamentoEncaminhamento): Promise<{ lote: LotePagamento; nota: NotaAssistencia } | null> => {
  const sols = solicitacaoIds.map(id => solicitacoes.find(s => s.id === id)).filter(Boolean) as SolicitacaoPeca[];
  if (sols.length < 2) return null;
  
  const fornecedorId = sols[0].fornecedorId;
  if (!fornecedorId || !sols.every(s => s.fornecedorId === fornecedorId)) return null;
  if (!sols.every(s => s.status === 'Aprovada')) return null;
  
  const valorTotal = sols.reduce((acc, s) => acc + (s.valorPeca || 0) * s.quantidade, 0);
  
  const lote: LotePagamento = {
    id: `LOTE-${String(loteCounter++).padStart(3, '0')}`,
    fornecedorId,
    solicitacaoIds: sols.map(s => s.id),
    valorTotal,
    dataCriacao: new Date().toISOString(),
    status: 'Pendente'
  };
  lotesPagamento.push(lote);
  const { error: loteErr } = await supabase.from('lotes_pagamento_pecas').insert(loteToDb(lote) as any);
  if (loteErr) console.error('[LotesPagamento] Erro insert:', loteErr);
  
  for (const sol of sols) {
    const idx = solicitacoes.findIndex(s => s.id === sol.id);
    if (idx !== -1) {
      solicitacoes[idx] = { ...solicitacoes[idx], status: 'Pagamento - Financeiro' };
      await updateSolicitacaoDb(solicitacoes[idx]);
    }
  }
  
  const nota: NotaAssistencia = {
    id: `NOTA-ASS-${String(notaAssistenciaCounter++).padStart(3, '0')}`,
    solicitacaoId: sols[0].id,
    solicitacaoIds: sols.map(s => s.id),
    loteId: lote.id,
    fornecedor: fornecedorId,
    lojaSolicitante: sols[0].lojaSolicitante,
    dataCriacao: new Date().toISOString(),
    valorTotal,
    status: 'Pendente',
    itens: sols.map(s => ({ peca: s.peca, quantidade: s.quantidade, valorUnitario: s.valorPeca || 0 })),
    ...(dadosPagamento && {
      formaPagamentoEncaminhamento: dadosPagamento.formaPagamento,
      contaBancariaEncaminhamento: dadosPagamento.contaBancaria,
      nomeRecebedor: dadosPagamento.nomeRecebedor,
      chavePixEncaminhamento: dadosPagamento.chavePix,
      observacaoEncaminhamento: dadosPagamento.observacao
    })
  };
  notasAssistencia.push(nota);
  const { error: notaErr } = await supabase.from('notas_assistencia').insert(notaToDb(nota) as any);
  if (notaErr) console.error('[NotasAssistencia] Erro insert:', notaErr);
  
  for (const sol of sols) {
    const os = getOrdemServicoById(sol.osId);
    if (os) {
      await updateOrdemServico(sol.osId, {
        timeline: [...os.timeline, {
          data: new Date().toISOString(),
          tipo: 'peca',
          descricao: `Solicitação agrupada no Lote ${lote.id} e encaminhada para conferência financeira por ${usuarioNome}`,
          responsavel: usuarioNome
        }]
      });
    }
  }
  
  return { lote, nota };
};

// ========== Finalizar Nota no Financeiro ==========
export const finalizarNotaAssistencia = async (notaId: string, dados: {
  responsavelFinanceiro: string;
  formaPagamento: string;
  contaPagamento: string;
}): Promise<NotaAssistencia | null> => {
  const notaIndex = notasAssistencia.findIndex(n => n.id === notaId);
  if (notaIndex === -1) return null;
  
  const nota = notasAssistencia[notaIndex];
  notasAssistencia[notaIndex] = { ...nota, ...dados, status: 'Concluído', dataConferencia: new Date().toISOString().split('T')[0] };
  const { error: notaErr } = await supabase.from('notas_assistencia').update(notaToDb(notasAssistencia[notaIndex]) as any).eq('id', notaId);
  if (notaErr) console.error('[NotasAssistencia] Erro update:', notaErr);
  
  const solIdsParaProcessar = nota.solicitacaoIds && nota.solicitacaoIds.length > 0 ? nota.solicitacaoIds : nota.solicitacaoId ? [nota.solicitacaoId] : [];
  const isLote = !!nota.loteId;
  
  for (const solId of solIdsParaProcessar) {
    const solIdx = solicitacoes.findIndex(s => s.id === solId);
    if (solIdx !== -1) {
      solicitacoes[solIdx].status = 'Recebida';
      await updateSolicitacaoDb(solicitacoes[solIdx]);
      
      const osId = solicitacoes[solIdx].osId;
      const os = getOrdemServicoById(osId);
      if (os) {
        await updateOrdemServico(osId, {
          status: 'Pagamento Concluído',
          proximaAtuacao: 'Técnico (Recebimento)',
          timeline: [...os.timeline, {
            data: new Date().toISOString(),
            tipo: 'peca',
            descricao: isLote
              ? `Pagamento confirmado via Lote ${nota.loteId} em ${new Date().toLocaleDateString('pt-BR')} - ${solicitacoes[solIdx].peca}`
              : `Pagamento concluído via nota ${notaId} - ${solicitacoes[solIdx].peca}. Aguardando confirmação de recebimento pelo técnico.`,
            responsavel: dados.responsavelFinanceiro
          }]
        });
      }
    }
  }

  if (nota.loteId) {
    const loteIdx = lotesPagamento.findIndex(l => l.id === nota.loteId);
    if (loteIdx !== -1) {
      lotesPagamento[loteIdx] = { ...lotesPagamento[loteIdx], ...dados, status: 'Concluido', dataConferencia: new Date().toISOString().split('T')[0] };
      const { error: loteErr } = await supabase.from('lotes_pagamento_pecas').update(loteToDb(lotesPagamento[loteIdx]) as any).eq('id', nota.loteId);
      if (loteErr) console.error('[LotesPagamento] Erro update:', loteErr);
    }
  }

  const hoje = new Date().toISOString().split('T')[0];
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const mesAtual = `${meses[new Date().getMonth()]}-${new Date().getFullYear()}`;
  await addDespesa({
    tipo: 'Variável', data: hoje,
    descricao: isLote ? `Pagamento Lote ${nota.loteId} - Nota ${notaId}` : `Pagamento Nota Assistência ${notaId}`,
    valor: nota.valorTotal, competencia: mesAtual, conta: dados.contaPagamento,
    observacoes: isLote ? `Fornecedor: ${nota.fornecedor} | Lote: ${nota.loteId} | Solicitações: ${solIdsParaProcessar.join(', ')}` : `Fornecedor: ${nota.fornecedor} | Solicitação: ${nota.solicitacaoId}`,
    lojaId: nota.lojaSolicitante, status: 'Pago', categoria: 'Assistência',
    dataVencimento: hoje, dataPagamento: hoje, recorrente: false, periodicidade: null, pagoPor: dados.responsavelFinanceiro
  });

  if (nota.tipoConsignacao && nota.solicitacaoId) {
    confirmarPagamentoPorNotaId(nota.solicitacaoId, nota.id, dados.responsavelFinanceiro, (dados as any).comprovante || undefined);
  }
  
  return notasAssistencia[notaIndex];
};

export const cancelarSolicitacao = async (id: string, observacao: string): Promise<SolicitacaoPeca | null> => {
  const index = solicitacoes.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  const solicitacao = solicitacoes[index];
  solicitacoes[index] = { ...solicitacao, status: 'Cancelada', observacao };
  await updateSolicitacaoDb(solicitacoes[index]);
  
  const osId = solicitacao.osId;
  const os = getOrdemServicoById(osId);
  if (os) {
    const outrasSolicitacoesAtivas = solicitacoes.filter(s => s.osId === osId && s.id !== id && s.status !== 'Cancelada' && s.status !== 'Rejeitada');
    const updates: any = {
      timeline: [...os.timeline, { data: new Date().toISOString(), tipo: 'peca', descricao: `Solicitação ${id} CANCELADA – ${solicitacao.peca} | Obs: ${observacao}`, responsavel: 'Usuário Sistema' }]
    };
    if (outrasSolicitacoesAtivas.length === 0) updates.status = 'Em serviço';
    await updateOrdemServico(osId, updates);
  }
  
  return solicitacoes[index];
};

export const calcularSLASolicitacao = (dataSolicitacao: string): number => {
  const data = new Date(dataSolicitacao);
  const hoje = new Date();
  return Math.floor(Math.abs(hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
};

export { formatCurrency } from '@/utils/formatUtils';

// ========== Desvincular Nota de Lote ==========
export const desvincularNotaDeLote = async (solicitacaoId: string, motivo: string, responsavel: string): Promise<SolicitacaoPeca | null> => {
  const solIdx = solicitacoes.findIndex(s => s.id === solicitacaoId);
  if (solIdx === -1) return null;
  const sol = solicitacoes[solIdx];

  const notaIdx = notasAssistencia.findIndex(n => n.loteId && n.solicitacaoIds?.includes(solicitacaoId) && n.status === 'Pendente');
  if (notaIdx === -1) return null;
  const nota = notasAssistencia[notaIdx];
  const loteId = nota.loteId!;

  const loteIdx = lotesPagamento.findIndex(l => l.id === loteId);
  if (loteIdx === -1) return null;
  const lote = lotesPagamento[loteIdx];
  if (lote.status !== 'Pendente') return null;

  lote.solicitacaoIds = lote.solicitacaoIds.filter(id => id !== solicitacaoId);
  const novosSolIds = (nota.solicitacaoIds || []).filter(id => id !== solicitacaoId);
  const novaItens = nota.itens.filter(item => item.peca !== sol.peca);
  const novoValor = novaItens.reduce((acc, item) => acc + item.valorUnitario * item.quantidade, 0);

  if (novosSolIds.length <= 1) {
    if (novosSolIds.length === 1) {
      notasAssistencia[notaIdx] = { ...nota, solicitacaoIds: novosSolIds, solicitacaoId: novosSolIds[0], loteId: undefined, itens: novaItens, valorTotal: novoValor };
      await supabase.from('notas_assistencia').update(notaToDb(notasAssistencia[notaIdx]) as any).eq('id', nota.id);
    } else {
      notasAssistencia.splice(notaIdx, 1);
      await supabase.from('notas_assistencia').delete().eq('id', nota.id);
    }
    lotesPagamento.splice(loteIdx, 1);
    await supabase.from('lotes_pagamento_pecas').delete().eq('id', loteId);
  } else {
    lote.valorTotal = novoValor;
    lotesPagamento[loteIdx] = lote;
    await supabase.from('lotes_pagamento_pecas').update(loteToDb(lote) as any).eq('id', loteId);
    notasAssistencia[notaIdx] = { ...nota, solicitacaoIds: novosSolIds, itens: novaItens, valorTotal: novoValor };
    await supabase.from('notas_assistencia').update(notaToDb(notasAssistencia[notaIdx]) as any).eq('id', nota.id);
  }

  solicitacoes[solIdx] = { ...sol, status: 'Recusada pelo Financeiro' };
  await updateSolicitacaoDb(solicitacoes[solIdx]);

  const os = getOrdemServicoById(sol.osId);
  if (os) {
    await updateOrdemServico(sol.osId, {
      timeline: [...os.timeline, { data: new Date().toISOString(), tipo: 'financeiro', descricao: `Nota removida do Lote ${loteId} pelo Financeiro em ${new Date().toLocaleString('pt-BR')} - Motivo: ${motivo}`, responsavel }]
    });
  }

  return solicitacoes[solIdx];
};

export const getLoteById = (loteId: string): LotePagamento | null => {
  return lotesPagamento.find(l => l.id === loteId) || null;
};

export const marcarSolicitacoesOSCancelada = async (osId: string): Promise<void> => {
  for (let idx = 0; idx < solicitacoes.length; idx++) {
    const sol = solicitacoes[idx];
    if (sol.osId === osId && ['Pendente', 'Aprovada', 'Enviada', 'Recebida', 'Pagamento - Financeiro', 'Pagamento Finalizado', 'Aguardando Chegada', 'Em Estoque'].includes(sol.status)) {
      solicitacoes[idx] = { ...sol, osCancelada: true };
      await updateSolicitacaoDb(solicitacoes[idx]);
    }
  }
};

export const tratarPecaOSCancelada = async (
  id: string, decisao: 'devolver' | 'reter', motivo: string, responsavel: string
): Promise<SolicitacaoPeca | null> => {
  const index = solicitacoes.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  const sol = solicitacoes[index];
  if (!sol.osCancelada && sol.status !== 'Cancelada') return null;

  if (decisao === 'devolver') {
    solicitacoes[index] = { ...sol, status: 'Devolvida ao Fornecedor', motivoTratamento: motivo, tratadaPor: responsavel };
  } else {
    solicitacoes[index] = { ...sol, status: 'Retida para Estoque', motivoTratamento: motivo, tratadaPor: responsavel };
  }
  await updateSolicitacaoDb(solicitacoes[index]);

  const os = getOrdemServicoById(sol.osId);
  if (os) {
    const descricaoTimeline = decisao === 'devolver'
      ? `Peça "${sol.peca}" devolvida ao fornecedor por ${responsavel} - Motivo: ${motivo}`
      : `Peça "${sol.peca}" retida para estoque próprio por ${responsavel} - Motivo: ${motivo}`;
    await updateOrdemServico(sol.osId, {
      timeline: [...os.timeline, { data: new Date().toISOString(), tipo: 'peca', descricao: descricaoTimeline, responsavel }]
    });
  }

  return solicitacoes[index];
};

export const isPecaPaga = (sol: SolicitacaoPeca): boolean => {
  if (sol.status === 'Recebida' || sol.status === 'Pagamento Finalizado') return true;
  const nota = notasAssistencia.find(n => n.solicitacaoId === sol.id && n.status === 'Concluído');
  if (nota) return true;
  return false;
};
