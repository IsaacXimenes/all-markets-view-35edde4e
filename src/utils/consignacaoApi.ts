// API para gestão de Peças em Consignação
// MIGRADO PARA SUPABASE - tabelas: lotes_consignacao, itens_consignacao
import { supabase } from '@/integrations/supabase/client';
import { addPeca, getPecaById, darBaixaPeca, deletePeca, updatePeca } from './pecasApi';
import { NotaAssistencia } from './solicitacaoPecasApi';

export interface TimelineConsignacao {
  data: string;
  tipo: 'entrada' | 'consumo' | 'transferencia' | 'acerto' | 'devolucao' | 'pagamento';
  descricao: string;
  responsavel: string;
  comprovanteUrl?: string;
}

export interface ItemConsignacao {
  id: string;
  pecaId: string;
  descricao: string;
  modelo: string;
  quantidade: number;
  quantidadeOriginal: number;
  valorCusto: number;
  lojaAtualId: string;
  status: 'Disponivel' | 'Consumido' | 'Devolvido' | 'Em Acerto' | 'Em Pagamento' | 'Pago';
  osVinculada?: string;
  dataConsumo?: string;
  tecnicoConsumo?: string;
  devolvidoPor?: string;
  dataDevolucao?: string;
}

export interface PagamentoParcial {
  id: string;
  data: string;
  valor: number;
  itensIds: string[];
  notaFinanceiraId: string;
  status: 'Pendente' | 'Pago';
  comprovanteUrl?: string;
  dataPagamento?: string;
}

export interface LoteConsignacao {
  id: string;
  fornecedorId: string;
  dataCriacao: string;
  responsavelCadastro: string;
  status: 'Aberto' | 'Em Acerto' | 'Aguardando Pagamento' | 'Pago' | 'Devolvido' | 'Concluido';
  itens: ItemConsignacao[];
  timeline: TimelineConsignacao[];
  pagamentosParciais: PagamentoParcial[];
}

// ============= CACHE =============
let lotes: LoteConsignacao[] = [];
let nextLoteId = 1;
let nextItemId = 1;
let nextPagamentoId = 1;
let cacheInitialized = false;

// Referência para notas de assistência (importação circular evitada via callback)
let notasAssistenciaRef: NotaAssistencia[] = [];
let notaCounterRef = 100;

export const setNotasRef = (notas: NotaAssistencia[], counter: number) => {
  notasAssistenciaRef = notas;
  notaCounterRef = counter;
};

// ============= MAPPING =============
const mapItemFromDb = (r: any): ItemConsignacao => ({
  id: r.id,
  pecaId: r.peca_id || '',
  descricao: r.descricao || '',
  modelo: r.modelo || '',
  quantidade: r.quantidade || 0,
  quantidadeOriginal: r.quantidade_original || 0,
  valorCusto: Number(r.valor_custo) || 0,
  lojaAtualId: r.loja_atual_id || '',
  status: r.status || 'Disponivel',
  osVinculada: r.os_vinculada || undefined,
  dataConsumo: r.data_consumo || undefined,
  tecnicoConsumo: r.tecnico_consumo || undefined,
  devolvidoPor: r.devolvido_por || undefined,
  dataDevolucao: r.data_devolucao || undefined,
});

const mapLoteFromDb = (r: any, itens: ItemConsignacao[]): LoteConsignacao => ({
  id: r.id,
  fornecedorId: r.fornecedor_id || '',
  dataCriacao: r.data_criacao || r.created_at,
  responsavelCadastro: r.responsavel_cadastro || '',
  status: r.status || 'Aberto',
  itens,
  timeline: (r.timeline as TimelineConsignacao[]) || [],
  pagamentosParciais: (r.pagamentos_parciais as PagamentoParcial[]) || [],
});

const loteToDb = (l: LoteConsignacao) => ({
  id: l.id,
  fornecedor_id: l.fornecedorId,
  data_criacao: l.dataCriacao,
  responsavel_cadastro: l.responsavelCadastro,
  status: l.status,
  timeline: l.timeline as any,
  pagamentos_parciais: l.pagamentosParciais as any,
});

const itemToDb = (item: ItemConsignacao, loteId: string) => ({
  id: item.id,
  lote_id: loteId,
  peca_id: item.pecaId,
  descricao: item.descricao,
  modelo: item.modelo,
  quantidade: item.quantidade,
  quantidade_original: item.quantidadeOriginal,
  valor_custo: item.valorCusto,
  loja_atual_id: item.lojaAtualId,
  status: item.status,
  os_vinculada: item.osVinculada || null,
  data_consumo: item.dataConsumo || null,
  tecnico_consumo: item.tecnicoConsumo || null,
  devolvido_por: item.devolvidoPor || null,
  data_devolucao: item.dataDevolucao || null,
});

// Sync helpers
const syncLoteToDb = async (lote: LoteConsignacao) => {
  const { error } = await supabase.from('lotes_consignacao').upsert(loteToDb(lote) as any);
  if (error) { console.error('[CONSIGNACAO] Erro sync lote:', error); throw error; }
};

const syncItemToDb = async (item: ItemConsignacao, loteId: string) => {
  const { error } = await supabase.from('itens_consignacao').upsert(itemToDb(item, loteId) as any);
  if (error) { console.error('[CONSIGNACAO] Erro sync item:', error); throw error; }
};

// ============= INIT CACHE =============
export const initConsignacaoCache = async () => {
  if (cacheInitialized) return;
  try {
    const [lotesRes, itensRes] = await Promise.all([
      supabase.from('lotes_consignacao').select('*').order('created_at', { ascending: false }),
      supabase.from('itens_consignacao').select('*'),
    ]);
    if (lotesRes.error) throw lotesRes.error;
    if (itensRes.error) throw itensRes.error;

    const itensMap = new Map<string, ItemConsignacao[]>();
    (itensRes.data || []).forEach(r => {
      const item = mapItemFromDb(r);
      const loteId = r.lote_id;
      if (!itensMap.has(loteId)) itensMap.set(loteId, []);
      itensMap.get(loteId)!.push(item);
    });

    lotes = (lotesRes.data || []).map(r => mapLoteFromDb(r, itensMap.get(r.id) || []));
    nextLoteId = lotes.length + 1;
    nextItemId = (itensRes.data || []).length + 1;
    nextPagamentoId = lotes.reduce((acc, l) => acc + l.pagamentosParciais.length, 0) + 1;
    cacheInitialized = true;
    console.log(`[CONSIGNACAO] Cache: ${lotes.length} lotes, ${(itensRes.data || []).length} itens`);
  } catch (err) {
    console.error('[CONSIGNACAO] Erro init:', err);
    cacheInitialized = true;
  }
};

// ========== GETTERS ==========

export const getLotesConsignacao = (): LoteConsignacao[] => [...lotes];

export const getLoteById = (id: string): LoteConsignacao | undefined =>
  lotes.find(l => l.id === id);

// ========== CRIAR LOTE ==========

export interface CriarLoteInput {
  fornecedorId: string;
  responsavel: string;
  itens: {
    descricao: string;
    modelo: string;
    quantidade: number;
    valorCusto: number;
    lojaDestinoId: string;
  }[];
}

export const criarLoteConsignacao = async (dados: CriarLoteInput): Promise<LoteConsignacao> => {
  const loteId = `CONS-${String(nextLoteId++).padStart(3, '0')}`;

  const itensConsignacao: ItemConsignacao[] = await Promise.all(dados.itens.map(async (item) => {
    const pecaCriada = await addPeca({
      descricao: item.descricao,
      lojaId: item.lojaDestinoId,
      modelo: item.modelo,
      valorCusto: item.valorCusto,
      valorRecomendado: item.valorCusto * 1.5,
      quantidade: item.quantidade,
      dataEntrada: new Date().toISOString(),
      origem: 'Consignacao',
      status: 'Disponível',
      loteConsignacaoId: loteId,
      fornecedorId: dados.fornecedorId,
    });

    const itemId = `CONS-ITEM-${String(nextItemId++).padStart(3, '0')}`;
    return {
      id: itemId,
      pecaId: pecaCriada.id,
      descricao: item.descricao,
      modelo: item.modelo,
      quantidade: item.quantidade,
      quantidadeOriginal: item.quantidade,
      valorCusto: item.valorCusto,
      lojaAtualId: item.lojaDestinoId,
      status: 'Disponivel' as const,
    };
  }));

  const lote: LoteConsignacao = {
    id: loteId,
    fornecedorId: dados.fornecedorId,
    dataCriacao: new Date().toISOString(),
    responsavelCadastro: dados.responsavel,
    status: 'Aberto',
    itens: itensConsignacao,
    pagamentosParciais: [],
    timeline: [{
      data: new Date().toISOString(),
      tipo: 'entrada',
      descricao: `Lote criado com ${itensConsignacao.length} tipo(s) de peça(s)`,
      responsavel: dados.responsavel,
    }],
  };

  lotes.push(lote);

  // Persist to Supabase
  await syncLoteToDb(lote);
  for (const item of itensConsignacao) {
    await syncItemToDb(item, loteId);
  }

  return lote;
};

// ========== REGISTRAR CONSUMO ==========

export const registrarConsumoConsignacao = async (
  loteId: string, itemId: string, osId: string, tecnico: string, quantidade: number = 1
): Promise<boolean> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote || lote.status === 'Concluido') return false;

  const item = lote.itens.find(i => i.id === itemId);
  if (!item || item.status !== 'Disponivel') return false;

  item.quantidade -= quantidade;
  if (item.quantidade <= 0) {
    item.quantidade = 0;
    item.status = 'Consumido';
  }
  item.osVinculada = osId;
  item.dataConsumo = new Date().toISOString();
  item.tecnicoConsumo = tecnico;

  lote.timeline.push({
    data: new Date().toISOString(),
    tipo: 'consumo',
    descricao: `${quantidade}x ${item.descricao} consumido na OS ${osId}`,
    responsavel: tecnico,
  });

  await Promise.all([syncItemToDb(item, loteId), syncLoteToDb(lote)]);
  return true;
};

// Busca consumo por pecaId (chamado pelo darBaixaPeca)
export const registrarConsumoPorPecaId = async (pecaId: string, osId: string, tecnico: string, quantidade: number = 1): Promise<void> => {
  for (const lote of lotes) {
    if (lote.status === 'Concluido') continue;
    const item = lote.itens.find(i => i.pecaId === pecaId && i.status === 'Disponivel');
    if (item) {
      await registrarConsumoConsignacao(lote.id, item.id, osId, tecnico, quantidade);
      return;
    }
  }
};

// ========== TRANSFERÊNCIA ==========

export const transferirItemConsignacao = async (
  loteId: string, itemId: string, novaLojaId: string, responsavel: string
): Promise<boolean> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote || lote.status !== 'Aberto') return false;

  const item = lote.itens.find(i => i.id === itemId);
  if (!item || item.status !== 'Disponivel') return false;

  const lojaAnterior = item.lojaAtualId;
  item.lojaAtualId = novaLojaId;

  const peca = getPecaById(item.pecaId);
  if (peca) {
    peca.lojaId = novaLojaId;
  }

  lote.timeline.push({
    data: new Date().toISOString(),
    tipo: 'transferencia',
    descricao: `${item.descricao} transferido de loja ${lojaAnterior} para ${novaLojaId}`,
    responsavel,
  });

  await Promise.all([syncItemToDb(item, loteId), syncLoteToDb(lote)]);
  return true;
};

// ========== ACERTO DE CONTAS ==========

export const iniciarAcertoContas = async (loteId: string, responsavel: string): Promise<boolean> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote || lote.status !== 'Aberto') return false;

  lote.status = 'Em Acerto';
  lote.timeline.push({
    data: new Date().toISOString(),
    tipo: 'acerto',
    descricao: `Acerto de contas iniciado.`,
    responsavel,
  });

  await syncLoteToDb(lote);
  return true;
};

export const getValorConsumido = (lote: LoteConsignacao): number => {
  return lote.itens
    .filter(i => ['Consumido', 'Em Pagamento', 'Pago'].includes(i.status))
    .reduce((acc, i) => acc + (i.quantidadeOriginal - i.quantidade) * i.valorCusto, 0)
    + lote.itens
    .filter(i => i.status === 'Em Acerto' && i.quantidade < i.quantidadeOriginal)
    .reduce((acc, i) => acc + (i.quantidadeOriginal - i.quantidade) * i.valorCusto, 0);
};

// ========== PAGAMENTO PARCIAL ==========

export const gerarPagamentoParcial = async (
  loteId: string,
  itemIds: string[],
  dadosPagamento: {
    formaPagamento: string;
    contaBancaria?: string;
    nomeRecebedor?: string;
    chavePix?: string;
    observacao?: string;
  },
  pushNota: (nota: NotaAssistencia) => void
): Promise<PagamentoParcial | null> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote || lote.status === 'Concluido') return null;

  const itensSelecionados = lote.itens.filter(i => itemIds.includes(i.id) && i.status === 'Consumido');
  if (itensSelecionados.length === 0) return null;

  itensSelecionados.forEach(item => { item.status = 'Em Pagamento'; });

  const valorTotal = itensSelecionados.reduce((acc, i) => {
    const qtdConsumida = i.quantidadeOriginal - i.quantidade || i.quantidadeOriginal;
    return acc + i.valorCusto * qtdConsumida;
  }, 0);

  const notaId = `NOTA-CONS-${String(notaCounterRef++).padStart(3, '0')}`;

  const nota: NotaAssistencia = {
    id: notaId,
    solicitacaoId: loteId,
    fornecedor: lote.fornecedorId,
    lojaSolicitante: itensSelecionados[0]?.lojaAtualId || '',
    dataCriacao: new Date().toISOString(),
    valorTotal,
    status: 'Pendente',
    itens: itensSelecionados.map(i => ({
      peca: i.descricao,
      quantidade: i.quantidadeOriginal - i.quantidade || i.quantidadeOriginal,
      valorUnitario: i.valorCusto,
      osVinculada: i.osVinculada,
    })),
    loteId: loteId,
    tipoConsignacao: true,
    ...(dadosPagamento && {
      formaPagamentoEncaminhamento: dadosPagamento.formaPagamento,
      contaBancariaEncaminhamento: dadosPagamento.contaBancaria,
      nomeRecebedor: dadosPagamento.nomeRecebedor,
      chavePixEncaminhamento: dadosPagamento.chavePix,
      observacaoEncaminhamento: dadosPagamento.observacao,
    }),
  };

  pushNota(nota);

  const pagamentoId = `PAG-${String(nextPagamentoId++).padStart(3, '0')}`;
  const pagamento: PagamentoParcial = {
    id: pagamentoId,
    data: new Date().toISOString(),
    valor: valorTotal,
    itensIds: itemIds,
    notaFinanceiraId: notaId,
    status: 'Pendente',
  };

  lote.pagamentosParciais.push(pagamento);

  const detalhesForma = dadosPagamento.formaPagamento || 'Não informado';
  const detalhesConta = dadosPagamento.contaBancaria ? ` | Conta: ${dadosPagamento.contaBancaria}` : '';
  const detalhesRecebedor = dadosPagamento.nomeRecebedor ? ` | Recebedor: ${dadosPagamento.nomeRecebedor}` : '';
  const detalhesPix = dadosPagamento.chavePix ? ` | Chave Pix: ${dadosPagamento.chavePix}` : '';

  lote.timeline.push({
    data: new Date().toISOString(),
    tipo: 'pagamento',
    descricao: `Pagamento parcial gerado: ${notaId} - ${itensSelecionados.length} item(ns) - R$ ${valorTotal.toFixed(2)} | Forma: ${detalhesForma}${detalhesConta}${detalhesRecebedor}${detalhesPix}`,
    responsavel: lote.responsavelCadastro,
  });

  if (lote.status === 'Aberto' || lote.status === 'Em Acerto') {
    lote.status = 'Aguardando Pagamento';
  }

  // Persist
  await syncLoteToDb(lote);
  for (const item of itensSelecionados) {
    await syncItemToDb(item, loteId);
  }

  return pagamento;
};

export const confirmarPagamentoParcial = async (loteId: string, pagamentoId: string, responsavel: string, comprovanteUrl?: string): Promise<boolean> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote) return false;

  const pagamento = lote.pagamentosParciais.find(p => p.id === pagamentoId);
  if (!pagamento || pagamento.status === 'Pago') return false;

  pagamento.status = 'Pago';
  pagamento.comprovanteUrl = comprovanteUrl;
  pagamento.dataPagamento = new Date().toISOString();

  const itensAtualizados: ItemConsignacao[] = [];
  lote.itens.forEach(item => {
    if (pagamento.itensIds.includes(item.id) && item.status === 'Em Pagamento') {
      item.status = 'Pago';
      itensAtualizados.push(item);
    }
  });

  lote.timeline.push({
    data: new Date().toISOString(),
    tipo: 'pagamento',
    descricao: `Pagamento ${pagamento.notaFinanceiraId} confirmado pelo financeiro - R$ ${pagamento.valor.toFixed(2)}`,
    responsavel,
    comprovanteUrl,
  });

  const todosPagos = lote.pagamentosParciais.every(p => p.status === 'Pago');
  const todosItensFinalizados = lote.itens.every(i => ['Pago', 'Devolvido'].includes(i.status));
  if (todosPagos && todosItensFinalizados) {
    lote.status = 'Concluido';
    lote.timeline.push({
      data: new Date().toISOString(),
      tipo: 'acerto',
      descricao: 'Todos os pagamentos confirmados. Lote concluído automaticamente.',
      responsavel,
    });
  }

  await syncLoteToDb(lote);
  for (const item of itensAtualizados) {
    await syncItemToDb(item, loteId);
  }

  return true;
};

// ========== FINALIZAR LOTE ==========

export const finalizarLote = async (
  loteId: string,
  responsavel: string,
  dadosPagamento: {
    formaPagamento: string;
    contaBancaria?: string;
    nomeRecebedor?: string;
    chavePix?: string;
    observacao?: string;
  },
  pushNota: (nota: NotaAssistencia) => void
): Promise<boolean> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote || lote.status === 'Concluido') return false;

  const agora = new Date().toISOString();

  // Gerar pagamento parcial final para itens consumidos remanescentes
  const consumidosRemanescentes = lote.itens.filter(i => i.status === 'Consumido');
  if (consumidosRemanescentes.length > 0) {
    await gerarPagamentoParcial(loteId, consumidosRemanescentes.map(i => i.id), dadosPagamento, pushNota);
  }

  // Marcar sobras como Devolvido
  const itensDevolvidos: ItemConsignacao[] = [];
  lote.itens.filter(i => i.status === 'Disponivel').forEach(item => {
    item.status = 'Devolvido';
    item.dataDevolucao = agora;
    item.devolvidoPor = responsavel;
    if (item.pecaId) {
      updatePeca(item.pecaId, { status: 'Devolvida', quantidade: 0 });
    }
    lote.timeline.push({
      data: agora,
      tipo: 'devolucao',
      descricao: `${item.descricao} (${item.quantidade} un.) devolvido ao fornecedor no fechamento`,
      responsavel,
    });
    itensDevolvidos.push(item);
  });

  const temPagamentosPendentes = lote.pagamentosParciais.some(p => p.status === 'Pendente');
  lote.status = temPagamentosPendentes ? 'Aguardando Pagamento' : 'Concluido';
  lote.timeline.push({
    data: agora,
    tipo: 'acerto',
    descricao: temPagamentosPendentes 
      ? 'Lote finalizado. Aguardando confirmação de pagamento pelo financeiro.' 
      : 'Lote finalizado e devoluções confirmadas.',
    responsavel,
  });

  await syncLoteToDb(lote);
  for (const item of itensDevolvidos) {
    await syncItemToDb(item, loteId);
  }

  return true;
};

// ========== DEVOLUÇÃO ==========

export const confirmarDevolucaoItem = async (loteId: string, itemId: string, responsavel: string): Promise<boolean> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote) return false;

  const item = lote.itens.find(i => i.id === itemId);
  if (!item || item.status === 'Consumido' || item.status === 'Devolvido') return false;

  item.status = 'Devolvido';
  item.devolvidoPor = responsavel;
  item.dataDevolucao = new Date().toISOString();

  if (item.pecaId) {
    updatePeca(item.pecaId, { status: 'Devolvida', quantidade: 0 });
  }

  lote.timeline.push({
    data: new Date().toISOString(),
    tipo: 'devolucao',
    descricao: `${item.descricao} (${item.quantidade} un.) devolvido ao fornecedor`,
    responsavel,
  });

  const todosFinalizados = lote.itens.every(i => ['Consumido', 'Devolvido', 'Em Pagamento', 'Pago'].includes(i.status));
  if (todosFinalizados && lote.status === 'Aberto') {
    lote.status = 'Devolvido';
  }

  await Promise.all([syncItemToDb(item, loteId), syncLoteToDb(lote)]);
  return true;
};

// ========== FINANCEIRO (legado) ==========

export const gerarLoteFinanceiro = (loteId: string, dadosPagamento?: {
  formaPagamento: string;
  contaBancaria?: string;
  nomeRecebedor?: string;
  chavePix?: string;
  observacao?: string;
}): NotaAssistencia | null => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote) return null;

  const valorTotal = getValorConsumido(lote);
  const itensConsumidos = lote.itens.filter(i =>
    i.status === 'Consumido' || (i.quantidade < i.quantidadeOriginal)
  );

  const nota: NotaAssistencia = {
    id: `NOTA-CONS-${String(notaCounterRef++).padStart(3, '0')}`,
    solicitacaoId: loteId,
    fornecedor: lote.fornecedorId,
    lojaSolicitante: itensConsumidos[0]?.lojaAtualId || '',
    dataCriacao: new Date().toISOString(),
    valorTotal,
    status: 'Pendente',
    itens: itensConsumidos.map(i => ({
      peca: i.descricao,
      quantidade: i.quantidadeOriginal - i.quantidade || i.quantidadeOriginal,
      valorUnitario: i.valorCusto,
      osVinculada: i.osVinculada,
    })),
    loteId: loteId,
    tipoConsignacao: true,
    ...(dadosPagamento && {
      formaPagamentoEncaminhamento: dadosPagamento.formaPagamento,
      contaBancariaEncaminhamento: dadosPagamento.contaBancaria,
      nomeRecebedor: dadosPagamento.nomeRecebedor,
      chavePixEncaminhamento: dadosPagamento.chavePix,
      observacaoEncaminhamento: dadosPagamento.observacao,
    }),
  };

  lote.timeline.push({
    data: new Date().toISOString(),
    tipo: 'pagamento',
    descricao: `Lote financeiro gerado: ${nota.id} - Valor: R$ ${valorTotal.toFixed(2)}`,
    responsavel: lote.responsavelCadastro,
  });

  // Sync timeline update
  syncLoteToDb(lote);

  return nota;
};

// Confirmar pagamento por notaFinanceiraId (chamado pelo Financeiro)
export const confirmarPagamentoPorNotaId = async (
  loteId: string, notaFinanceiraId: string, responsavel: string, comprovanteUrl?: string
): Promise<boolean> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote) return false;

  const pagamento = lote.pagamentosParciais.find(p => p.notaFinanceiraId === notaFinanceiraId);
  if (!pagamento || pagamento.status === 'Pago') return false;

  return confirmarPagamentoParcial(loteId, pagamento.id, responsavel, comprovanteUrl);
};

export const finalizarAcerto = async (loteId: string): Promise<boolean> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote || lote.status !== 'Em Acerto') return false;

  const agora = new Date().toISOString();
  const itensAtualizados: ItemConsignacao[] = [];

  lote.itens.filter(i => i.status === 'Em Acerto').forEach(item => {
    item.status = 'Devolvido';
    item.dataDevolucao = agora;
    item.devolvidoPor = 'Financeiro';
    if (item.pecaId) {
      updatePeca(item.pecaId, { status: 'Devolvida', quantidade: 0 });
    }
    lote.timeline.push({
      data: agora,
      tipo: 'devolucao',
      descricao: `${item.descricao} (${item.quantidade} un.) devolvido automaticamente ao fornecedor`,
      responsavel: 'Financeiro',
    });
    itensAtualizados.push(item);
  });

  lote.status = 'Pago';
  lote.timeline.push({
    data: agora,
    tipo: 'pagamento',
    descricao: 'Acerto finalizado. Pagamento confirmado pelo financeiro.',
    responsavel: 'Financeiro',
  });

  await syncLoteToDb(lote);
  for (const item of itensAtualizados) {
    await syncItemToDb(item, loteId);
  }

  return true;
};

// ========== EDITAR LOTE ==========

export interface EditarLoteInput {
  fornecedorId?: string;
  itens?: {
    id: string;
    descricao: string;
    modelo: string;
    quantidade: number;
    valorCusto: number;
    lojaDestinoId: string;
  }[];
  novosItens?: {
    descricao: string;
    modelo: string;
    quantidade: number;
    valorCusto: number;
    lojaDestinoId: string;
  }[];
  itensRemovidos?: string[];
}

export const editarLoteConsignacao = async (loteId: string, dados: EditarLoteInput, responsavel: string): Promise<LoteConsignacao | null> => {
  const lote = lotes.find(l => l.id === loteId);
  if (!lote || lote.status !== 'Aberto') return null;

  const alteracoes: string[] = [];

  if (dados.fornecedorId && dados.fornecedorId !== lote.fornecedorId) {
    alteracoes.push(`Fornecedor alterado`);
    lote.fornecedorId = dados.fornecedorId;
  }

  // Remover itens
  if (dados.itensRemovidos && dados.itensRemovidos.length > 0) {
    for (const itemId of dados.itensRemovidos) {
      const item = lote.itens.find(i => i.id === itemId);
      if (item && item.status === 'Disponivel') {
        if (item.pecaId) { deletePeca(item.pecaId); }
        alteracoes.push(`Item removido: ${item.descricao}`);
        // Remove from DB
        await supabase.from('itens_consignacao').delete().eq('id', itemId);
      }
    }
    lote.itens = lote.itens.filter(i => !dados.itensRemovidos!.includes(i.id));
  }

  // Editar itens existentes
  if (dados.itens) {
    for (const editItem of dados.itens) {
      const item = lote.itens.find(i => i.id === editItem.id);
      if (!item || item.status !== 'Disponivel') continue;

      const changes: string[] = [];
      if (item.descricao !== editItem.descricao) changes.push(`desc: ${item.descricao} → ${editItem.descricao}`);
      if (item.modelo !== editItem.modelo) changes.push(`modelo: ${item.modelo} → ${editItem.modelo}`);
      if (item.quantidade !== editItem.quantidade) changes.push(`qtd: ${item.quantidade} → ${editItem.quantidade}`);
      if (item.valorCusto !== editItem.valorCusto) changes.push(`valor: R$${item.valorCusto} → R$${editItem.valorCusto}`);
      if (item.lojaAtualId !== editItem.lojaDestinoId) changes.push(`loja alterada`);

      item.descricao = editItem.descricao;
      item.modelo = editItem.modelo;
      item.quantidade = editItem.quantidade;
      item.quantidadeOriginal = editItem.quantidade;
      item.valorCusto = editItem.valorCusto;
      item.lojaAtualId = editItem.lojaDestinoId;

      if (item.pecaId) {
        updatePeca(item.pecaId, {
          descricao: editItem.descricao,
          modelo: editItem.modelo,
          quantidade: editItem.quantidade,
          valorCusto: editItem.valorCusto,
          lojaId: editItem.lojaDestinoId,
        });
      }

      if (changes.length > 0) {
        alteracoes.push(`${editItem.descricao}: ${changes.join(', ')}`);
      }
      await syncItemToDb(item, loteId);
    }
  }

  // Adicionar novos itens
  if (dados.novosItens && dados.novosItens.length > 0) {
    for (const novoItem of dados.novosItens) {
      const pecaCriada = await addPeca({
        descricao: novoItem.descricao,
        lojaId: novoItem.lojaDestinoId,
        modelo: novoItem.modelo,
        valorCusto: novoItem.valorCusto,
        valorRecomendado: novoItem.valorCusto * 1.5,
        quantidade: novoItem.quantidade,
        dataEntrada: new Date().toISOString(),
        origem: 'Consignacao',
        status: 'Disponível',
        loteConsignacaoId: loteId,
        fornecedorId: lote.fornecedorId,
      });

      const itemId = `CONS-ITEM-${String(nextItemId++).padStart(3, '0')}`;
      const newItem: ItemConsignacao = {
        id: itemId,
        pecaId: pecaCriada.id,
        descricao: novoItem.descricao,
        modelo: novoItem.modelo,
        quantidade: novoItem.quantidade,
        quantidadeOriginal: novoItem.quantidade,
        valorCusto: novoItem.valorCusto,
        lojaAtualId: novoItem.lojaDestinoId,
        status: 'Disponivel',
      };
      lote.itens.push(newItem);
      alteracoes.push(`Novo item: ${novoItem.descricao} (${novoItem.quantidade} un.)`);
      await syncItemToDb(newItem, loteId);
    }
  }

  if (alteracoes.length > 0) {
    lote.timeline.push({
      data: new Date().toISOString(),
      tipo: 'entrada',
      descricao: `Lote editado: ${alteracoes.join('; ')}`,
      responsavel,
    });
  }

  await syncLoteToDb(lote);
  return lote;
};
