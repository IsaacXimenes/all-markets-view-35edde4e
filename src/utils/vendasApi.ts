// Vendas API - Supabase
import { supabase } from '@/integrations/supabase/client';
import { generateProductId } from './idManager';
import { getProdutos, updateProduto, addMovimentacao } from './estoqueApi';
import { subtrairEstoqueAcessorio, VendaAcessorio } from './acessoriosApi';
import { criarPagamentosDeVenda } from './financeApi';
import { addDemandaMotoboy } from './motoboyApi';
import { getColaboradorById } from './cadastrosApi';

// ==================== INTERFACES ====================
export interface ItemVenda {
  id: string;
  produtoId: string;
  produto: string;
  imei: string;
  categoria: string;
  quantidade: number;
  valorRecomendado: number;
  valorVenda: number;
  valorCusto: number;
  loja: string;
}

export interface AnexoTradeIn {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUrl: string;
}

export interface ItemTradeIn {
  id: string;
  produtoId?: string;
  modelo: string;
  descricao: string;
  imei: string;
  valorCompraUsado: number;
  imeiValidado: boolean;
  condicao: 'Novo' | 'Semi-novo';
  tipoEntrega?: 'Entregue no Ato' | 'Com o Cliente';
  termoResponsabilidade?: AnexoTradeIn;
  fotosAparelho?: AnexoTradeIn[];
  dataRegistro?: string;
  anexoConsultaIMEI?: string;
  anexoConsultaIMEINome?: string;
}

export interface Pagamento {
  id: string;
  meioPagamento: string;
  valor: number;
  contaDestino: string;
  parcelas?: number;
  valorParcela?: number;
  descricao?: string;
  isFiado?: boolean;
  fiadoDataBase?: number;
  fiadoNumeroParcelas?: number;
  fiadoTipoRecorrencia?: 'Mensal' | 'Semanal';
  fiadoIntervaloDias?: number;
  taxaCartao?: number;
  valorComTaxa?: number;
  maquinaId?: string;
  comprovante?: string;
  comprovanteNome?: string;
}

export interface TimelineEdicaoVenda {
  id: string;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  tipo: 'edicao_gestor';
  alteracoes: {
    campo: string;
    valorAnterior: any;
    valorNovo: any;
  }[];
  descricao: string;
}

export type StatusVenda = 
  | 'Aguardando Conferência'
  | 'Conferência Gestor'
  | 'Recusada - Gestor'
  | 'Conferência Financeiro'
  | 'Devolvido pelo Financeiro'
  | 'Finalizado'
  | 'Cancelada';

export interface RegistroAprovacao {
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  motivo?: string;
}

export interface TimelineVenda {
  id: string;
  dataHora: string;
  tipo: 'criacao' | 'edicao' | 'aprovacao_lancamento' | 'recusa_gestor' | 'aprovacao_gestor' | 'devolucao_financeiro' | 'aprovacao_financeiro' | 'finalizacao';
  usuarioId: string;
  usuarioNome: string;
  descricao: string;
  alteracoes?: {
    campo: string;
    valorAnterior: any;
    valorNovo: any;
  }[];
  motivo?: string;
}

export interface Venda {
  id: string;
  numero: number;
  dataHora: string;
  lojaVenda: string;
  vendedor: string;
  clienteId: string;
  clienteNome: string;
  clienteCpf: string;
  clienteTelefone: string;
  clienteEmail: string;
  clienteCidade: string;
  origemVenda: string;
  localRetirada: string;
  tipoRetirada: 'Retirada Balcão' | 'Entrega' | 'Retirada em Outra Loja';
  taxaEntrega: number;
  motoboyId?: string;
  itens: ItemVenda[];
  tradeIns: ItemTradeIn[];
  acessorios?: VendaAcessorio[];
  pagamentos: Pagamento[];
  subtotal: number;
  totalTradeIn: number;
  total: number;
  lucro: number;
  margem: number;
  observacoes: string;
  status: 'Concluída' | 'Cancelada' | 'Pendente';
  motivoCancelamento?: string;
  comissaoVendedor?: number;
  timelineEdicoes?: TimelineEdicaoVenda[];
  statusAtual?: StatusVenda;
  aprovacaoLancamento?: RegistroAprovacao;
  aprovacaoGestor?: RegistroAprovacao;
  recusaGestor?: RegistroAprovacao;
  devolucaoFinanceiro?: RegistroAprovacao;
  aprovacaoFinanceiro?: RegistroAprovacao;
  timeline?: TimelineVenda[];
  bloqueadoParaEdicao?: boolean;
  valorSinal?: number;
  valorPendenteSinal?: number;
  dataSinal?: string;
  observacaoSinal?: string;
  garantiaExtendida?: {
    planoId: string;
    planoNome: string;
    valor: number;
    meses: number;
    dataInicio: string;
    dataFim: string;
  } | null;
  garantiaItens?: any[];
}

export interface HistoricoCompraCliente {
  id: string;
  data: string;
  produto: string;
  valor: number;
}

// ==================== CACHE + SUPABASE ====================
let _vendasCache: Venda[] = [];
let _cacheLoaded = false;

// Mapping DB -> App
const mapVendaFromDB = (row: any): Venda => ({
  id: row.id,
  numero: row.numero || 0,
  dataHora: row.data_venda || row.created_at || '',
  lojaVenda: row.loja_id || '',
  vendedor: row.vendedor_id || '',
  clienteId: row.cliente_id || '',
  clienteNome: row.cliente_nome || '',
  clienteCpf: row.cliente_cpf || '',
  clienteTelefone: row.cliente_telefone || '',
  clienteEmail: row.cliente_email || '',
  clienteCidade: row.cliente_cidade || '',
  origemVenda: row.origem_venda || '',
  localRetirada: row.local_retirada || '',
  tipoRetirada: row.tipo_retirada || 'Retirada Balcão',
  taxaEntrega: Number(row.taxa_entrega) || 0,
  motoboyId: row.motoboy_id || undefined,
  itens: [], // loaded separately from venda_itens
  tradeIns: [], // loaded separately from venda_trade_ins
  pagamentos: [], // loaded separately from venda_pagamentos
  subtotal: Number(row.subtotal) || 0,
  totalTradeIn: Number(row.total_trade_in) || 0,
  total: Number(row.valor_total) || 0,
  lucro: Number(row.lucro) || 0,
  margem: Number(row.margem) || 0,
  observacoes: row.observacoes || '',
  status: row.status_atual === 'Cancelada' ? 'Cancelada' : 'Concluída',
  motivoCancelamento: row.motivo_cancelamento || undefined,
  comissaoVendedor: Number(row.comissao_vendedor) || 0,
  timelineEdicoes: (row.timeline_edicoes as any[]) || [],
  statusAtual: row.status_atual || 'Finalizado',
  timeline: (row.timeline as any[]) || [],
  bloqueadoParaEdicao: row.bloqueado_para_edicao || false,
  valorSinal: Number(row.valor_sinal) || 0,
  valorPendenteSinal: Number(row.valor_pendente_sinal) || 0,
  dataSinal: row.data_sinal || undefined,
  observacaoSinal: row.observacao_sinal || undefined,
  garantiaExtendida: (row.garantia_extendida as any) || null,
});

const mapItemFromDB = (row: any): ItemVenda => ({
  id: row.id,
  produtoId: row.produto_id || '',
  produto: row.produto_nome || '',
  imei: row.imei || '',
  categoria: row.categoria || '',
  quantidade: row.quantidade || 1,
  valorRecomendado: Number(row.valor_recomendado) || 0,
  valorVenda: Number(row.valor_venda) || 0,
  valorCusto: Number(row.valor_custo) || 0,
  loja: row.loja_id || '',
});

const mapTradeInFromDB = (row: any): ItemTradeIn => ({
  id: row.id,
  produtoId: row.produto_id || undefined,
  modelo: row.modelo || '',
  descricao: row.descricao || '',
  imei: row.imei || '',
  valorCompraUsado: Number(row.valor_compra_usado) || 0,
  imeiValidado: row.imei_validado || false,
  condicao: row.condicao || 'Semi-novo',
  tipoEntrega: row.tipo_entrega || undefined,
  dataRegistro: row.data_registro || undefined,
  anexoConsultaIMEI: undefined,
  anexoConsultaIMEINome: undefined,
});

const mapPagamentoFromDB = (row: any): Pagamento => ({
  id: row.id,
  meioPagamento: row.meio_pagamento || '',
  valor: Number(row.valor) || 0,
  contaDestino: row.conta_destino || '',
  parcelas: row.parcelas || 1,
  valorParcela: Number(row.valor_parcela) || 0,
  descricao: row.descricao || undefined,
  isFiado: row.is_fiado || false,
  fiadoDataBase: row.fiado_data_base ? new Date(row.fiado_data_base).getDate() : undefined,
  fiadoNumeroParcelas: row.fiado_numero_parcelas || undefined,
  fiadoTipoRecorrencia: row.fiado_tipo_recorrencia || undefined,
  fiadoIntervaloDias: row.fiado_intervalo_dias || undefined,
  taxaCartao: Number(row.taxa_cartao) || 0,
  valorComTaxa: Number(row.valor_com_taxa) || 0,
  maquinaId: row.maquina_id || undefined,
  comprovante: row.comprovante || undefined,
  comprovanteNome: row.comprovante_nome || undefined,
});

export const initVendasCache = async (): Promise<void> => {
  try {
    // Load vendas
    const { data: vendasRows, error: vendasErr } = await supabase
      .from('vendas')
      .select('*')
      .order('created_at', { ascending: false });
    if (vendasErr) throw vendasErr;

    const vendaIds = (vendasRows || []).map(v => v.id);

    // Load related data in parallel
    const [itensRes, tradeInsRes, pagamentosRes] = await Promise.all([
      vendaIds.length > 0 
        ? supabase.from('venda_itens').select('*').in('venda_id', vendaIds)
        : Promise.resolve({ data: [], error: null }),
      vendaIds.length > 0
        ? supabase.from('venda_trade_ins').select('*').in('venda_id', vendaIds)
        : Promise.resolve({ data: [], error: null }),
      vendaIds.length > 0
        ? supabase.from('venda_pagamentos').select('*').in('venda_id', vendaIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const itensMap = new Map<string, ItemVenda[]>();
    (itensRes.data || []).forEach(row => {
      const vendaId = row.venda_id;
      if (!vendaId) return;
      if (!itensMap.has(vendaId)) itensMap.set(vendaId, []);
      itensMap.get(vendaId)!.push(mapItemFromDB(row));
    });

    const tradeInsMap = new Map<string, ItemTradeIn[]>();
    (tradeInsRes.data || []).forEach(row => {
      const vendaId = row.venda_id;
      if (!vendaId) return;
      if (!tradeInsMap.has(vendaId)) tradeInsMap.set(vendaId, []);
      tradeInsMap.get(vendaId)!.push(mapTradeInFromDB(row));
    });

    const pagamentosMap = new Map<string, Pagamento[]>();
    (pagamentosRes.data || []).forEach(row => {
      const vendaId = row.venda_id;
      if (!vendaId) return;
      if (!pagamentosMap.has(vendaId)) pagamentosMap.set(vendaId, []);
      pagamentosMap.get(vendaId)!.push(mapPagamentoFromDB(row));
    });

    _vendasCache = (vendasRows || []).map(row => {
      const venda = mapVendaFromDB(row);
      venda.itens = itensMap.get(row.id) || [];
      venda.tradeIns = tradeInsMap.get(row.id) || [];
      venda.pagamentos = pagamentosMap.get(row.id) || [];
      return venda;
    });

    _cacheLoaded = true;
    console.log(`[VENDAS] Cache carregado: ${_vendasCache.length} vendas`);
  } catch (err) {
    console.error('[VENDAS] Erro ao carregar cache:', err);
    _vendasCache = [];
    _cacheLoaded = true;
  }
};

// ==================== GETTERS (síncronos via cache) ====================
export const getVendas = (): Venda[] => {
  return [..._vendasCache];
};

export const getVendaById = (id: string): Venda | null => {
  return _vendasCache.find(v => v.id === id) || null;
};

export const getHistoricoComprasCliente = (clienteId: string): HistoricoCompraCliente[] => {
  // Build from vendas cache
  return _vendasCache
    .filter(v => v.clienteId === clienteId && v.status === 'Concluída')
    .flatMap(v => v.itens.map(i => ({
      id: i.id,
      data: v.dataHora,
      produto: i.produto,
      valor: i.valorVenda
    })));
};

export const getNextVendaNumber = (): { id: string; numero: number } => {
  const maxNumero = _vendasCache.reduce((max, v) => Math.max(max, v.numero || 0), 0);
  const nextNum = maxNumero + 1;
  const year = new Date().getFullYear();
  return {
    id: `VEN-${year}-${String(nextNum).padStart(4, '0')}`,
    numero: nextNum
  };
};

// ==================== MUTAÇÕES (async) ====================

const extrairMarca = (modelo: string): string => {
  const modeloLower = modelo.toLowerCase();
  if (modeloLower.includes('iphone') || modeloLower.includes('apple')) return 'Apple';
  if (modeloLower.includes('samsung') || modeloLower.includes('galaxy')) return 'Samsung';
  if (modeloLower.includes('motorola') || modeloLower.includes('moto')) return 'Motorola';
  if (modeloLower.includes('xiaomi') || modeloLower.includes('redmi') || modeloLower.includes('poco')) return 'Xiaomi';
  return 'Outra';
};

export const addVenda = async (venda: Omit<Venda, 'id' | 'numero'>): Promise<Venda> => {
  const { id: newId, numero: newNumero } = getNextVendaNumber();

  // Gerar IDs para trade-ins que ainda não têm
  const tradeInsComIds = venda.tradeIns.map(ti => {
    if (!ti.produtoId) ti.produtoId = generateProductId();
    return ti;
  });

  // Insert venda principal
  const { data: vendaRow, error: vendaErr } = await supabase.from('vendas').insert({
    numero: newNumero,
    data_venda: venda.dataHora || new Date().toISOString(),
    loja_id: venda.lojaVenda || null,
    vendedor_id: venda.vendedor || null,
    vendedor_nome: (venda as any).vendedorNome || '',
    cliente_id: venda.clienteId || null,
    cliente_nome: venda.clienteNome || null,
    cliente_cpf: venda.clienteCpf || null,
    cliente_telefone: venda.clienteTelefone || null,
    cliente_email: venda.clienteEmail || null,
    cliente_cidade: venda.clienteCidade || null,
    origem_venda: venda.origemVenda || null,
    local_retirada: venda.localRetirada || null,
    tipo_retirada: venda.tipoRetirada || null,
    taxa_entrega: venda.taxaEntrega || 0,
    motoboy_id: venda.motoboyId || null,
    subtotal: venda.subtotal || 0,
    total_trade_in: venda.totalTradeIn || 0,
    valor_total: venda.total || 0,
    lucro: venda.lucro || 0,
    margem: venda.margem || 0,
    observacoes: venda.observacoes || null,
    status_atual: venda.statusAtual || 'Aguardando Conferência',
    comissao_vendedor: venda.comissaoVendedor || 0,
    timeline: (venda.timeline as any) || [],
    timeline_edicoes: (venda.timelineEdicoes as any) || [],
    bloqueado_para_edicao: false,
    valor_sinal: venda.valorSinal || 0,
    valor_pendente_sinal: venda.valorPendenteSinal || 0,
    data_sinal: venda.dataSinal || null,
    observacao_sinal: venda.observacaoSinal || null,
    garantia_extendida: (venda.garantiaExtendida as any) || null,
    hora_venda: (venda as any).horaVenda || null,
    status_pagamento: 'Pendente',
  }).select().single();

  if (vendaErr || !vendaRow) throw vendaErr || new Error('Falha ao inserir venda');

  const vendaId = vendaRow.id;

  // Insert itens, trade-ins, pagamentos in parallel
  const insertItens = venda.itens.length > 0
    ? supabase.from('venda_itens').insert(venda.itens.map(i => ({
        venda_id: vendaId,
        produto_id: i.produtoId || null,
        produto_nome: i.produto,
        imei: i.imei || null,
        categoria: i.categoria || null,
        quantidade: i.quantidade || 1,
        valor_recomendado: i.valorRecomendado || 0,
        valor_venda: i.valorVenda || 0,
        valor_custo: i.valorCusto || 0,
        loja_id: i.loja || null,
      })))
    : Promise.resolve({ error: null });

  const insertTradeIns = tradeInsComIds.length > 0
    ? supabase.from('venda_trade_ins').insert(tradeInsComIds.map(t => ({
        venda_id: vendaId,
        produto_id: t.produtoId || null,
        modelo: t.modelo || null,
        descricao: t.descricao || null,
        imei: t.imei || null,
        valor_compra_usado: t.valorCompraUsado || 0,
        imei_validado: t.imeiValidado || false,
        condicao: t.condicao || null,
        tipo_entrega: t.tipoEntrega || null,
        anexos: [] as any,
      })))
    : Promise.resolve({ error: null });

  const insertPagamentos = venda.pagamentos.length > 0
    ? supabase.from('venda_pagamentos').insert(venda.pagamentos.map(p => ({
        venda_id: vendaId,
        meio_pagamento: p.meioPagamento || null,
        valor: p.valor || 0,
        conta_destino: p.contaDestino || null,
        parcelas: p.parcelas || 1,
        valor_parcela: p.valorParcela || 0,
        descricao: p.descricao || null,
        is_fiado: p.isFiado || false,
        fiado_data_base: p.fiadoDataBase ? `2026-01-${String(p.fiadoDataBase).padStart(2, '0')}` : null,
        fiado_numero_parcelas: p.fiadoNumeroParcelas || null,
        fiado_tipo_recorrencia: p.fiadoTipoRecorrencia || null,
        fiado_intervalo_dias: p.fiadoIntervaloDias || null,
        taxa_cartao: p.taxaCartao || 0,
        valor_com_taxa: p.valorComTaxa || 0,
        maquina_id: p.maquinaId || null,
        comprovante: p.comprovante || null,
        comprovante_nome: p.comprovanteNome || null,
      })))
    : Promise.resolve({ error: null });

  await Promise.all([insertItens, insertTradeIns, insertPagamentos]);

  // Build local venda object
  const newVenda: Venda = {
    ...venda,
    id: vendaId,
    numero: newNumero,
    tradeIns: tradeInsComIds,
  };

  _vendasCache.unshift(newVenda);

  // ========== INTEGRAÇÃO: Redução de Estoque de Aparelhos ==========
  for (const item of venda.itens) {
    const produto = getProdutos().find(p => p.id === item.produtoId);
    if (produto) {
      await updateProduto(item.produtoId, { 
        statusNota: 'Concluído',
        quantidade: 0
      });
      await addMovimentacao({
        data: new Date().toISOString().split('T')[0],
        produto: produto.modelo,
        imei: produto.imei,
        quantidade: 1,
        origem: produto.loja,
        destino: venda.origemVenda === 'Troca Garantia' ? 'Troca Direta - Garantia' : 'Vendido',
        responsavel: 'Sistema de Vendas',
        motivo: `Venda ${vendaId} - Cliente: ${venda.clienteNome}`
      });
    }
  }

  // ========== INTEGRAÇÃO: Redução de Estoque de Acessórios ==========
  if (venda.acessorios && venda.acessorios.length > 0) {
    for (const acessorio of venda.acessorios) {
      await subtrairEstoqueAcessorio(acessorio.acessorioId, acessorio.quantidade);
    }
  }

  // ========== INTEGRAÇÃO: Criar Pagamentos no Financeiro ==========
  if (venda.pagamentos && venda.pagamentos.length > 0) {
    try {
      criarPagamentosDeVenda({
        id: vendaId,
        clienteNome: venda.clienteNome,
        valorTotal: venda.total,
        lojaVenda: venda.lojaVenda,
        pagamentos: venda.pagamentos.map(p => ({
          meio: p.meioPagamento as any,
          valor: p.valor,
          contaId: p.contaDestino
        }))
      });
    } catch (error) {
      console.error(`[VENDAS] Erro ao registrar pagamentos no financeiro:`, error);
    }
  }

  // ========== INTEGRAÇÃO: Registrar Demanda de Motoboy ==========
  if (venda.tipoRetirada === 'Entrega' && venda.motoboyId) {
    try {
      const colaboradorMotoboy = getColaboradorById(venda.motoboyId);
      const motoboyNome = colaboradorMotoboy?.nome || 'Motoboy';
      const localEntrega = (venda as any).localEntregaNome || venda.clienteCidade || 'Endereço Cliente';
      addDemandaMotoboy({
        motoboyId: venda.motoboyId,
        motoboyNome,
        data: venda.dataHora ? venda.dataHora.split('T')[0] : new Date().toISOString().split('T')[0],
        tipo: 'Entrega',
        descricao: `Entrega Venda #${vendaId} - Cliente ${venda.clienteNome}`,
        lojaOrigem: venda.lojaVenda,
        lojaDestino: localEntrega,
        status: 'Pendente',
        valorDemanda: venda.taxaEntrega || 0,
        vendaId: vendaId
      });
    } catch (error) {
      console.error(`[VENDAS] Erro ao registrar demanda de motoboy:`, error);
    }
  }

  return newVenda;
};

export const cancelarVenda = async (id: string, motivo: string): Promise<Venda | null> => {
  const venda = _vendasCache.find(v => v.id === id);
  if (!venda || venda.status === 'Cancelada') return venda || null;

  // Reverter estoque
  for (const item of venda.itens) {
    const produto = getProdutos().find(p => p.id === item.produtoId);
    if (produto) {
      await updateProduto(item.produtoId, { quantidade: 1 });
      await addMovimentacao({
        data: new Date().toISOString().split('T')[0],
        produto: produto.modelo,
        imei: produto.imei,
        quantidade: 1,
        origem: 'Cancelamento de Venda',
        destino: produto.loja,
        responsavel: 'Sistema',
        motivo: `Cancelamento da venda ${id}: ${motivo}`
      });
    }
  }

  await supabase.from('vendas').update({
    status_atual: 'Cancelada',
    motivo_cancelamento: motivo,
  }).eq('id', id);

  venda.status = 'Cancelada';
  venda.statusAtual = 'Cancelada';
  venda.motivoCancelamento = motivo;

  return venda;
};

export const registrarEdicaoVenda = (
  vendaId: string,
  usuarioId: string,
  usuarioNome: string,
  alteracoes: { campo: string; valorAnterior: any; valorNovo: any }[]
): void => {
  const venda = _vendasCache.find(v => v.id === vendaId);
  if (!venda) return;

  const descricao = alteracoes.map(a => {
    const valorAnt = typeof a.valorAnterior === 'number' 
      ? `R$ ${a.valorAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
      : a.valorAnterior;
    const valorNov = typeof a.valorNovo === 'number' 
      ? `R$ ${a.valorNovo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
      : a.valorNovo;
    return `${a.campo}: ${valorAnt} → ${valorNov}`;
  }).join('; ');

  const novaEdicao: TimelineEdicaoVenda = {
    id: `EDIT-${Date.now()}`,
    dataHora: new Date().toISOString(),
    usuarioId,
    usuarioNome,
    tipo: 'edicao_gestor',
    alteracoes,
    descricao
  };

  if (!venda.timelineEdicoes) venda.timelineEdicoes = [];
  venda.timelineEdicoes.push(novaEdicao);

  // Persist async
  supabase.from('vendas').update({
    timeline_edicoes: venda.timelineEdicoes as any,
  }).eq('id', vendaId).then(() => {});
};

export const updateVenda = async (vendaId: string, updates: Partial<Venda>): Promise<Venda | null> => {
  const index = _vendasCache.findIndex(v => v.id === vendaId);
  if (index === -1) return null;

  _vendasCache[index] = { ..._vendasCache[index], ...updates };

  // Map to DB fields
  const db: any = {};
  if (updates.statusAtual !== undefined) db.status_atual = updates.statusAtual;
  if (updates.bloqueadoParaEdicao !== undefined) db.bloqueado_para_edicao = updates.bloqueadoParaEdicao;
  if (updates.timeline !== undefined) db.timeline = updates.timeline as any;
  if (updates.timelineEdicoes !== undefined) db.timeline_edicoes = updates.timelineEdicoes as any;
  if (updates.observacoes !== undefined) db.observacoes = updates.observacoes;
  if (updates.lucro !== undefined) db.lucro = updates.lucro;
  if (updates.margem !== undefined) db.margem = updates.margem;
  if (updates.total !== undefined) db.valor_total = updates.total;
  if (updates.subtotal !== undefined) db.subtotal = updates.subtotal;
  if (updates.totalTradeIn !== undefined) db.total_trade_in = updates.totalTradeIn;
  if (updates.comissaoVendedor !== undefined) db.comissao_vendedor = updates.comissaoVendedor;
  if (updates.motivoCancelamento !== undefined) db.motivo_cancelamento = updates.motivoCancelamento;
  if (updates.valorSinal !== undefined) db.valor_sinal = updates.valorSinal;
  if (updates.valorPendenteSinal !== undefined) db.valor_pendente_sinal = updates.valorPendenteSinal;
  if (updates.garantiaExtendida !== undefined) db.garantia_extendida = updates.garantiaExtendida as any;

  if (Object.keys(db).length > 0) {
    await supabase.from('vendas').update(db).eq('id', vendaId);
  }

  return _vendasCache[index];
};

export { formatCurrency } from '@/utils/formatUtils';

export const exportVendasToCSV = (data: Venda[], filename: string) => {
  if (data.length === 0) return;
  const csvData = data.map(v => ({
    'ID': v.id,
    'Data/Hora': new Date(v.dataHora).toLocaleString('pt-BR'),
    'Loja': v.lojaVenda,
    'Vendedor': v.vendedor,
    'Cliente': v.clienteNome,
    'CPF': v.clienteCpf,
    'Origem': v.origemVenda,
    'Subtotal': v.subtotal,
    'Base de Troca': v.totalTradeIn,
    'Total': v.total,
    'Lucro': v.lucro,
    'Margem %': v.margem.toFixed(2),
    'Status': v.status
  }));
  const headers = Object.keys(csvData[0]).join(',');
  const rows = csvData.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const buscarVendaPorImei = (imei: string): { venda: Venda; item: ItemVenda; } | null => {
  const imeiLimpo = imei.replace(/\D/g, '');
  for (const venda of _vendasCache) {
    if (venda.status !== 'Concluída') continue;
    const item = venda.itens.find(i => i.imei === imeiLimpo);
    if (item) return { venda, item };
  }
  return null;
};

// Auto-init
initVendasCache().catch(e => console.error('Erro ao inicializar cache vendas:', e));
