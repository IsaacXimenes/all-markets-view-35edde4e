// ============= API para Lotes de Revisão de Notas de Entrada =============
// Gerencia o encaminhamento em lote de aparelhos defeituosos para assistência
// Migrado para Supabase: tabela lotes_revisao

import { supabase } from '@/integrations/supabase/client';
import { getNotaEntradaById, NotaEntrada, gerarCreditoFornecedor, registrarTimeline, atualizarAbatimentoNota } from './notaEntradaFluxoApi';
import { encaminharParaAnaliseGarantia, MetadadosEstoque } from './garantiasApi';
import { marcarProdutoRetornoAssistencia, marcarProdutoDevolvido } from './estoqueApi';
import { getOrdemServicoById } from './assistenciaApi';

// ============= TIPOS E INTERFACES =============

export interface ItemRevisao {
  id: string;
  produtoNotaId: string;
  produtoId?: string;
  marca: string;
  modelo: string;
  imei?: string;
  motivoAssistencia: string;
  observacao?: string;
  responsavelRegistro: string;
  dataRegistro: string;
  osId?: string;
  custoReparo: number;
  statusReparo: 'Pendente' | 'Em Andamento' | 'Concluido';
}

export type LoteRevisaoStatus = 'Em Revisao' | 'Encaminhado' | 'Em Andamento' | 'Finalizado';

export interface LoteRevisao {
  id: string;
  notaEntradaId: string;
  numeroNota: string;
  fornecedor: string;
  valorOriginalNota: number;
  status: LoteRevisaoStatus;
  itens: ItemRevisao[];
  dataCriacao: string;
  responsavelCriacao: string;
  dataFinalizacao?: string;
  custoTotalReparos: number;
  valorLiquidoSugerido: number;
  osIds: string[];
}

export interface AbatimentoInfo {
  valorNota: number;
  custoReparos: number;
  valorLiquido: number;
  percentualReparo: number;
  alertaCritico: boolean;
}

// ============= CACHE LAYER =============

let lotesRevisaoCache: LoteRevisao[] = [];
let cacheLoaded = false;

const mapRow = (r: any): LoteRevisao => ({
  id: r.id,
  notaEntradaId: r.nota_entrada_id || '',
  numeroNota: r.numero_nota || '',
  fornecedor: r.fornecedor || '',
  valorOriginalNota: Number(r.valor_original_nota) || 0,
  status: r.status || 'Em Revisao',
  itens: (r.itens as ItemRevisao[]) || [],
  dataCriacao: r.data_criacao || '',
  responsavelCriacao: r.responsavel_criacao || '',
  dataFinalizacao: r.data_finalizacao || undefined,
  custoTotalReparos: Number(r.custo_total_reparos) || 0,
  valorLiquidoSugerido: Number(r.valor_liquido_sugerido) || 0,
  osIds: (r.os_ids as string[]) || [],
});

const toDbRow = (lote: LoteRevisao): any => ({
  id: lote.id,
  nota_entrada_id: lote.notaEntradaId,
  numero_nota: lote.numeroNota,
  fornecedor: lote.fornecedor,
  valor_original_nota: lote.valorOriginalNota,
  status: lote.status,
  itens: lote.itens as any,
  data_criacao: lote.dataCriacao,
  responsavel_criacao: lote.responsavelCriacao,
  data_finalizacao: lote.dataFinalizacao || null,
  custo_total_reparos: lote.custoTotalReparos,
  valor_liquido_sugerido: lote.valorLiquidoSugerido,
  os_ids: lote.osIds as any,
});

const syncToDb = async (lote: LoteRevisao) => {
  const row = toDbRow(lote);
  const { error } = await supabase.from('lotes_revisao').upsert(row, { onConflict: 'id' });
  if (error) console.error('[LOTES_REVISAO] sync error', error);
};

export const initLotesRevisaoCache = async () => {
  const { data, error } = await supabase.from('lotes_revisao').select('*').order('data_criacao', { ascending: false });
  if (error) { console.error('[LOTES_REVISAO] init error', error); return; }
  lotesRevisaoCache = (data || []).map(mapRow);
  cacheLoaded = true;
};

// ============= FUNÇÕES CRUD =============

let proximoSequencialLote = 1;

const gerarIdLote = (): string => {
  // Find max seq from cache
  const existing = lotesRevisaoCache
    .map(l => {
      const match = l.id.match(/REV-NOTA-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
  const maxSeq = existing.length > 0 ? Math.max(...existing) : 0;
  proximoSequencialLote = maxSeq + 1;
  return `REV-NOTA-${String(proximoSequencialLote).padStart(5, '0')}`;
};

export const criarLoteRevisao = async (
  notaEntradaId: string,
  itens: Omit<ItemRevisao, 'id' | 'osId' | 'custoReparo' | 'statusReparo'>[],
  responsavel: string
): Promise<LoteRevisao | null> => {
  const nota = getNotaEntradaById(notaEntradaId);
  if (!nota) return null;

  const id = gerarIdLote();

  const itensProcessados: ItemRevisao[] = itens.map((item, idx) => ({
    ...item,
    id: `${id}-ITEM-${String(idx + 1).padStart(3, '0')}`,
    custoReparo: 0,
    statusReparo: 'Pendente' as const
  }));

  const lote: LoteRevisao = {
    id,
    notaEntradaId,
    numeroNota: nota.numeroNota,
    fornecedor: nota.fornecedor,
    valorOriginalNota: nota.valorTotal,
    status: 'Em Revisao',
    itens: itensProcessados,
    dataCriacao: new Date().toISOString(),
    responsavelCriacao: responsavel,
    custoTotalReparos: 0,
    valorLiquidoSugerido: nota.valorTotal,
    osIds: []
  };

  await syncToDb(lote);
  lotesRevisaoCache.push(lote);

  // Vincular lote à nota de entrada automaticamente
  if (nota) {
    nota.loteRevisaoId = id;
  }

  return lote;
};

export const getLotesRevisao = (): LoteRevisao[] => [...lotesRevisaoCache];

export const getLoteRevisaoById = (id: string): LoteRevisao | undefined =>
  lotesRevisaoCache.find(l => l.id === id);

export const getLoteRevisaoByNotaId = (notaId: string): LoteRevisao | undefined =>
  lotesRevisaoCache.find(l => l.notaEntradaId === notaId);

export const atualizarItemRevisao = async (
  loteId: string,
  itemId: string,
  updates: Partial<ItemRevisao>
): Promise<LoteRevisao | null> => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote) return null;

  const itemIndex = lote.itens.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return null;

  lote.itens[itemIndex] = { ...lote.itens[itemIndex], ...updates };

  // Recalcular custo total
  lote.custoTotalReparos = lote.itens.reduce((acc, i) => acc + i.custoReparo, 0);
  lote.valorLiquidoSugerido = lote.valorOriginalNota - lote.custoTotalReparos;

  await syncToDb(lote);
  return lote;
};

export const encaminharLoteParaAssistencia = async (
  loteId: string,
  responsavel: string
): Promise<LoteRevisao | null> => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote || lote.status !== 'Em Revisao') return null;

  // Encaminhar cada item para Análise de Tratativas
  for (const item of lote.itens) {
    const descricao = `Lote ${lote.id} — ${item.marca} ${item.modelo}${item.imei ? ` (IMEI: ${item.imei})` : ''}`;
    const observacao = `Motivo: ${item.motivoAssistencia}${item.observacao ? `\nObs: ${item.observacao}` : ''}\nNota: ${lote.numeroNota}`;
    const metadata: MetadadosEstoque = {
      notaEntradaId: lote.notaEntradaId,
      produtoNotaId: item.produtoNotaId,
      loteRevisaoId: lote.id,
      loteRevisaoItemId: item.id,
      imeiAparelho: item.imei,
      modeloAparelho: item.modelo,
      marcaAparelho: item.marca
    };
    await encaminharParaAnaliseGarantia(item.produtoNotaId, 'Estoque', descricao, observacao, metadata);
  }

  lote.status = 'Encaminhado';
  await syncToDb(lote);

  return lote;
};

// ============= SINCRONIZAÇÃO NOTA ↔ LOTE =============

export const sincronizarNotaComLote = (
  loteId: string,
  responsavel: string
): NotaEntrada | null => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote) return null;

  const nota = getNotaEntradaById(lote.notaEntradaId);
  if (!nota) return null;

  const custoTotalConcluidos = lote.itens
    .filter(i => i.statusReparo === 'Concluido')
    .reduce((acc, i) => acc + i.custoReparo, 0);

  atualizarAbatimentoNota(nota.id, custoTotalConcluidos);

  const isFinalizado = lote.status === 'Finalizado';
  const acao = isFinalizado
    ? `Retorno da Assistência - Lote ${lote.id} finalizado. Custo de reparos: R$ ${custoTotalConcluidos.toFixed(2)}. Abatimento aplicado.`
    : `Assistência - Item concluído no Lote ${lote.id}. Custo acumulado: R$ ${custoTotalConcluidos.toFixed(2)}.`;

  registrarTimeline(
    nota,
    responsavel,
    'Sistema',
    acao,
    nota.status,
    custoTotalConcluidos,
    `Valor original: R$ ${nota.valorTotal.toFixed(2)} | Valor líquido: R$ ${(nota.valorTotal - custoTotalConcluidos).toFixed(2)}`
  );

  if (isFinalizado && nota.tipoPagamento === 'Pagamento 100% Antecipado' && custoTotalConcluidos > 0) {
    gerarCreditoFornecedor(
      nota.fornecedor,
      custoTotalConcluidos,
      nota.id,
      `Crédito por custo de reparos - Lote ${lote.id}`
    );

    registrarTimeline(
      nota,
      'Sistema',
      'Sistema',
      `Crédito gerado para fornecedor: R$ ${custoTotalConcluidos.toFixed(2)}`,
      nota.status,
      custoTotalConcluidos,
      `Nota 100% antecipada - custo de reparos convertido em crédito ao fornecedor`
    );
  }

  return nota;
};

export const finalizarLoteRevisao = async (
  loteId: string,
  responsavel: string
): Promise<LoteRevisao | null> => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote) return null;

  lote.status = 'Finalizado';
  lote.dataFinalizacao = new Date().toISOString();
  lote.custoTotalReparos = lote.itens.reduce((acc, i) => acc + i.custoReparo, 0);
  lote.valorLiquidoSugerido = lote.valorOriginalNota - lote.custoTotalReparos;

  sincronizarNotaComLote(loteId, responsavel);

  await syncToDb(lote);
  return lote;
};

// ============= LOGÍSTICA REVERSA =============

export type ResultadoReparo = 'Consertado' | 'Devolucao ao Fornecedor';

export interface ResultadoItemRevisao {
  itemId: string;
  resultado: ResultadoReparo;
}

export const finalizarLoteComLogisticaReversa = async (
  loteId: string,
  resultados: ResultadoItemRevisao[],
  responsavel: string
): Promise<LoteRevisao | null> => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote) return null;

  lote.status = 'Finalizado';
  lote.dataFinalizacao = new Date().toISOString();
  lote.custoTotalReparos = lote.itens.reduce((acc, i) => acc + i.custoReparo, 0);
  lote.valorLiquidoSugerido = lote.valorOriginalNota - lote.custoTotalReparos;

  let valorAbatimentoDevolucao = 0;
  resultados.forEach(res => {
    const item = lote.itens.find(i => i.id === res.itemId);
    if (!item) return;

    if (res.resultado === 'Consertado') {
      item.statusReparo = 'Concluido';
      if (item.imei) {
        marcarProdutoRetornoAssistencia(item.imei);
      }
    } else if (res.resultado === 'Devolucao ao Fornecedor') {
      item.statusReparo = 'Concluido';
      const custoAparelho = lote.valorOriginalNota / lote.itens.length;
      valorAbatimentoDevolucao += custoAparelho;

      if (item.imei) {
        marcarProdutoDevolvido(item.imei);
      }

      const notaEntrada = getNotaEntradaById(lote.notaEntradaId);
      if (notaEntrada && notaEntrada.tipoPagamento === 'Pagamento 100% Antecipado') {
        gerarCreditoFornecedor(
          lote.fornecedor,
          custoAparelho,
          lote.notaEntradaId,
          `Devolução ao fornecedor - ${item.marca} ${item.modelo} (Lote ${lote.id})`
        );
      }
    }
  });

  if (valorAbatimentoDevolucao > 0) {
    lote.valorLiquidoSugerido -= valorAbatimentoDevolucao;
  }

  sincronizarNotaComLote(loteId, responsavel);

  await syncToDb(lote);
  return lote;
};

export const getItensConsertados = (loteId: string): ItemRevisao[] => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote || lote.status !== 'Finalizado') return [];
  return lote.itens.filter(i => i.statusReparo === 'Concluido');
};

export const calcularAbatimento = (loteId: string): AbatimentoInfo | null => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote) return null;

  const custoReparos = lote.itens.reduce((acc, i) => acc + i.custoReparo, 0);
  const percentualReparo = lote.valorOriginalNota > 0
    ? (custoReparos / lote.valorOriginalNota) * 100
    : 0;

  return {
    valorNota: lote.valorOriginalNota,
    custoReparos,
    valorLiquido: lote.valorOriginalNota - custoReparos,
    percentualReparo,
    alertaCritico: percentualReparo > 15
  };
};

// ============= TIMELINE DA NOTA COM EVENTOS TÉCNICOS =============

export const registrarEventoTecnicoNaNota = (
  loteId: string,
  osId: string,
  tipoEvento: 'assuncao' | 'finalizacao' | 'retorno' | 'abatimento',
  responsavel: string,
  dados?: { resumo?: string; custo?: number }
): void => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote) return;

  const nota = getNotaEntradaById(lote.notaEntradaId);
  if (!nota) return;

  const marcador = `OS:${osId}|EVENTO:${tipoEvento}`;
  const jáRegistrado = nota.timeline?.some(t => t.detalhes?.includes(marcador));
  if (jáRegistrado) return;

  const mensagens: Record<string, string> = {
    assuncao: `Técnico assumiu o serviço na OS ${osId}`,
    finalizacao: `Serviço finalizado na OS ${osId}. ${dados?.resumo ? `Parecer: ${dados.resumo}` : ''} ${dados?.custo ? `Custo peças: R$ ${dados.custo.toFixed(2)}` : ''}`.trim(),
    retorno: `Aparelho retornou da assistência (OS ${osId}) para validação do estoque`,
    abatimento: `Abatimento aplicado na nota referente à OS ${osId}. Valor: R$ ${(dados?.custo || 0).toFixed(2)}`
  };

  registrarTimeline(
    nota,
    responsavel,
    'Sistema',
    mensagens[tipoEvento] || `Evento técnico: ${tipoEvento}`,
    nota.status,
    dados?.custo,
    marcador
  );
};

// ============= RECONCILIAÇÃO RETROATIVA =============

export const reconciliarLoteComOS = async (
  loteId: string,
  responsavel: string
): Promise<boolean> => {
  const lote = lotesRevisaoCache.find(l => l.id === loteId);
  if (!lote) return false;

  let reconciliou = false;
  const statusConcluidos = [
    'Serviço concluído', 'Serviço Concluído - Validar Aparelho',
    'Conferência do Gestor', 'Aguardando Financeiro', 'Liquidado',
    'Concluído', 'Finalizado'
  ];

  lote.itens.forEach(item => {
    if (!item.osId) return;
    if (item.statusReparo === 'Concluido') return;

    const os = getOrdemServicoById(item.osId);
    if (!os) return;

    if (statusConcluidos.includes(os.status)) {
      item.statusReparo = 'Concluido';
      item.custoReparo = os.valorCustoTecnico || 0;
      reconciliou = true;

      registrarEventoTecnicoNaNota(loteId, os.id, 'finalizacao', responsavel, {
        resumo: os.resumoConclusao || 'Reconciliação automática',
        custo: os.valorCustoTecnico || 0
      });
    }
  });

  if (reconciliou) {
    lote.custoTotalReparos = lote.itens.reduce((acc, i) => acc + i.custoReparo, 0);
    lote.valorLiquidoSugerido = lote.valorOriginalNota - lote.custoTotalReparos;

    sincronizarNotaComLote(loteId, responsavel);

    const allDone = lote.itens.every(i => i.statusReparo === 'Concluido');
    if (allDone && lote.status !== 'Finalizado') {
      lote.status = 'Finalizado';
      lote.dataFinalizacao = new Date().toISOString();
    }

    await syncToDb(lote);
  }

  return reconciliou;
};
