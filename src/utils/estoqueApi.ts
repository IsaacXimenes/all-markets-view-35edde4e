// Estoque API - Supabase
import { supabase } from '@/integrations/supabase/client';
import { initializeProductIds, registerProductId, generateProductId } from './idManager';

// ==================== INTERFACES ====================

export interface HistoricoValorRecomendado {
  data: string;
  usuario: string;
  valorAntigo: number | null;
  valorNovo: number;
}

export interface TimelineEntry {
  id: string;
  data: string;
  tipo: 'entrada' | 'validacao' | 'pagamento' | 'discrepancia' | 'alerta_sla' | 'parecer_estoque' | 'parecer_assistencia' | 'despesa' | 'liberacao' | 'saida_matriz' | 'retorno_matriz' | 'venda_matriz';
  titulo: string;
  descricao: string;
  responsavel?: string;
  valor?: number;
  aparelhoId?: string;
  comprovante?: string;
}

export interface Produto {
  id: string;
  imei: string;
  imagem?: string;
  marca: string;
  modelo: string;
  cor: string;
  tipo: 'Novo' | 'Seminovo';
  quantidade: number;
  valorCusto: number;
  valorVendaSugerido: number;
  vendaRecomendada?: number;
  saudeBateria: number;
  loja: string;
  lojaAtualId?: string;
  estoqueConferido: boolean;
  assistenciaConferida: boolean;
  condicao: string;
  pareceres?: string;
  historicoCusto: { data: string; fornecedor: string; valor: number }[];
  historicoValorRecomendado: HistoricoValorRecomendado[];
  statusNota: 'Pendente' | 'Concluído';
  origemEntrada: 'Base de Troca' | 'Fornecedor' | 'Emprestado - Garantia' | 'NEGOCIADO';
  timeline?: TimelineEntry[];
  custoAssistencia?: number;
  bloqueadoEmVendaId?: string;
  statusMovimentacao?: 'Em movimentação' | null;
  movimentacaoId?: string;
  statusRetiradaPecas?: 'Pendente Assistência' | 'Em Desmonte' | 'Concluída' | 'Cancelada' | null;
  retiradaPecasId?: string;
  statusEmprestimo?: 'Empréstimo - Assistência' | null;
  emprestimoGarantiaId?: string;
  emprestimoClienteId?: string;
  emprestimoClienteNome?: string;
  emprestimoOsId?: string;
  emprestimoDataHora?: string;
  bloqueadoEmTrocaGarantiaId?: string;
  statusRevisaoTecnica?: 'Em Revisao Tecnica' | null;
  loteRevisaoId?: string;
  tagRetornoAssistencia?: boolean;
}

export interface MovimentacaoMatrizItem {
  aparelhoId: string;
  imei: string;
  modelo: string;
  cor: string;
  statusItem: 'Enviado' | 'Devolvido' | 'Vendido';
  dataHoraRetorno?: string;
  responsavelRetorno?: string;
  vendaId?: string;
  vendedorId?: string;
  vendedorNome?: string;
  conferenciaAutomatica?: boolean;
}

export interface MovimentacaoMatriz {
  id: string;
  dataHoraLancamento: string;
  responsavelLancamento: string;
  lojaOrigemId: string;
  lojaDestinoId: string;
  statusMovimentacao: 'Pendente' | 'Atrasado' | 'Finalizado - Dentro do Prazo' | 'Finalizado - Atrasado';
  dataHoraLimiteRetorno: string;
  itens: MovimentacaoMatrizItem[];
  timeline: TimelineEntry[];
}

export interface ProdutoNota {
  id?: string;
  marca: string;
  modelo: string;
  cor: string;
  imei: string;
  tipo: 'Novo' | 'Seminovo';
  tipoProduto?: 'Aparelho' | 'Acessório';
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  saudeBateria: number;
  statusConferencia?: 'Pendente' | 'Conferido';
  dataConferencia?: string;
  responsavelConferencia?: string;
  capacidade?: '64 GB' | '128 GB' | '256 GB' | '512 GB' | '1 TB';
  percentualBateria?: number;
}

export interface NotaCompra {
  id: string;
  data: string;
  numeroNota: string;
  fornecedor: string;
  valorTotal: number;
  status: 'Pendente' | 'Concluído';
  origem?: 'Normal' | 'Urgência';
  statusUrgencia?: 'Aguardando Financeiro' | 'Pago - Aguardando Produtos' | 'Produtos Inseridos' | 'Concluído';
  dataPagamentoFinanceiro?: string;
  produtos: ProdutoNota[];
  pagamento?: {
    formaPagamento: string;
    parcelas: number;
    valorParcela: number;
    dataVencimento: string;
    comprovante?: string;
    contaPagamento?: string;
  };
  responsavelFinanceiro?: string;
  valorConferido?: number;
  valorPendente?: number;
  tipoPagamento?: 'Parcial' | '100% Antecipado' | 'Pós-Conferência';
  statusPagamento?: 'Aguardando Conferência' | 'Pago' | 'Parcialmente Pago';
  statusConferencia?: 'Em Conferência' | 'Conferência Completa' | 'Discrepância Detectada' | 'Finalizada com Pendência';
  dataConferenciaCompleta?: string;
  dataVencimento?: string;
  responsavelEstoque?: string;
  vendedorRegistro?: string;
  discrepancia?: boolean;
  motivoDiscrepancia?: string;
  acaoRecomendada?: 'Cobrar Fornecedor' | 'Cobrar Estoque';
  fotoComprovante?: string;
  timeline?: TimelineEntry[];
}

export interface Movimentacao {
  id: string;
  data: string;
  produto: string;
  imei: string;
  quantidade: number;
  origem: string;
  destino: string;
  responsavel: string;
  motivo: string;
  status?: 'Pendente' | 'Recebido';
  dataRecebimento?: string;
  responsavelRecebimento?: string;
}

// ==================== CONSTANTES ====================

export const LOJA_MATRIZ_ID = '3ac7e00c';
export const LOJA_ONLINE_ID = 'fcc78c1a';
export const ESTOQUE_SIA_LOJA_ID = 'dcc6547f';
export const ESTOQUE_LOJAS_IDS = {
  JK_SHOPPING: 'db894e7d',
  MATRIZ: '3ac7e00c',
  ONLINE: 'fcc78c1a',
  SHOPPING_SUL: '5b9446d5',
  AGUAS_LINDAS: '0d06e7db',
};

const ESTOQUE_SIA_ID = 'dcc6547f';

export const compartilhaEstoqueComMatriz = (lojaId: string): boolean => lojaId === LOJA_ONLINE_ID;

export const getLojaEstoqueReal = (lojaId: string): string => {
  if (compartilhaEstoqueComMatriz(lojaId)) return LOJA_MATRIZ_ID;
  return lojaId;
};

export const getLojasPorPoolEstoque = (lojaId: string): string[] => {
  if (lojaId === LOJA_ONLINE_ID) return [LOJA_ONLINE_ID, LOJA_MATRIZ_ID];
  return [lojaId];
};

// ==================== MAPEAMENTO DB ====================

const mapProdutoFromDB = (row: any): Produto => ({
  id: row.id,
  imei: row.imei || '',
  imagem: row.imagem || undefined,
  marca: row.marca,
  modelo: row.modelo,
  cor: row.cor || '',
  tipo: row.tipo || 'Seminovo',
  quantidade: row.quantidade || 0,
  valorCusto: Number(row.valor_custo) || 0,
  valorVendaSugerido: Number(row.valor_venda_sugerido) || 0,
  vendaRecomendada: row.venda_recomendada != null ? Number(row.venda_recomendada) : undefined,
  saudeBateria: row.saude_bateria || 0,
  loja: row.loja_id || '',
  lojaAtualId: row.loja_atual_id || undefined,
  estoqueConferido: row.estoque_conferido || false,
  assistenciaConferida: row.assistencia_conferida || false,
  condicao: row.condicao || '',
  pareceres: row.pareceres || undefined,
  historicoCusto: (row.historico_custo as any[]) || [],
  historicoValorRecomendado: (row.historico_valor_recomendado as any[]) || [],
  statusNota: row.status_nota || 'Pendente',
  origemEntrada: row.origem_entrada || 'Fornecedor',
  timeline: (row.timeline as any[]) || [],
  custoAssistencia: row.custo_assistencia != null ? Number(row.custo_assistencia) : undefined,
  bloqueadoEmVendaId: row.bloqueado_em_venda_id || undefined,
  statusMovimentacao: row.status_movimentacao || null,
  movimentacaoId: row.movimentacao_id || undefined,
  statusRetiradaPecas: row.status_retirada_pecas || null,
  retiradaPecasId: row.retirada_pecas_id || undefined,
  statusEmprestimo: row.status_emprestimo || null,
  emprestimoGarantiaId: row.emprestimo_garantia_id || undefined,
  emprestimoClienteId: row.emprestimo_cliente_id || undefined,
  emprestimoClienteNome: row.emprestimo_cliente_nome || undefined,
  emprestimoOsId: row.emprestimo_os_id || undefined,
  emprestimoDataHora: row.emprestimo_data_hora || undefined,
  bloqueadoEmTrocaGarantiaId: row.bloqueado_em_troca_garantia_id || undefined,
  statusRevisaoTecnica: row.status_revisao_tecnica || null,
  loteRevisaoId: row.lote_revisao_id || undefined,
  tagRetornoAssistencia: row.tag_retorno_assistencia || false,
});

const mapProdutoToDB = (p: Partial<Produto>) => {
  const db: any = {};
  if (p.imei !== undefined) db.imei = p.imei;
  if (p.imagem !== undefined) db.imagem = p.imagem || null;
  if (p.marca !== undefined) db.marca = p.marca;
  if (p.modelo !== undefined) db.modelo = p.modelo;
  if (p.cor !== undefined) db.cor = p.cor;
  if (p.tipo !== undefined) db.tipo = p.tipo;
  if (p.quantidade !== undefined) db.quantidade = p.quantidade;
  if (p.valorCusto !== undefined) db.valor_custo = p.valorCusto;
  if (p.valorVendaSugerido !== undefined) db.valor_venda_sugerido = p.valorVendaSugerido;
  if (p.vendaRecomendada !== undefined) db.venda_recomendada = p.vendaRecomendada ?? null;
  if (p.saudeBateria !== undefined) db.saude_bateria = p.saudeBateria;
  if (p.loja !== undefined) db.loja_id = p.loja;
  if (p.lojaAtualId !== undefined) db.loja_atual_id = p.lojaAtualId || null;
  if (p.estoqueConferido !== undefined) db.estoque_conferido = p.estoqueConferido;
  if (p.assistenciaConferida !== undefined) db.assistencia_conferida = p.assistenciaConferida;
  if (p.condicao !== undefined) db.condicao = p.condicao;
  if (p.pareceres !== undefined) db.pareceres = p.pareceres || null;
  if (p.historicoCusto !== undefined) db.historico_custo = p.historicoCusto;
  if (p.historicoValorRecomendado !== undefined) db.historico_valor_recomendado = p.historicoValorRecomendado;
  if (p.statusNota !== undefined) db.status_nota = p.statusNota;
  if (p.origemEntrada !== undefined) db.origem_entrada = p.origemEntrada;
  if (p.timeline !== undefined) db.timeline = p.timeline;
  if (p.custoAssistencia !== undefined) db.custo_assistencia = p.custoAssistencia ?? 0;
  if (p.bloqueadoEmVendaId !== undefined) db.bloqueado_em_venda_id = p.bloqueadoEmVendaId || null;
  if (p.statusMovimentacao !== undefined) db.status_movimentacao = p.statusMovimentacao || null;
  if (p.movimentacaoId !== undefined) db.movimentacao_id = p.movimentacaoId || null;
  if (p.statusRetiradaPecas !== undefined) db.status_retirada_pecas = p.statusRetiradaPecas || null;
  if (p.retiradaPecasId !== undefined) db.retirada_pecas_id = p.retiradaPecasId || null;
  if (p.statusEmprestimo !== undefined) db.status_emprestimo = p.statusEmprestimo || null;
  if (p.emprestimoGarantiaId !== undefined) db.emprestimo_garantia_id = p.emprestimoGarantiaId || null;
  if (p.emprestimoClienteId !== undefined) db.emprestimo_cliente_id = p.emprestimoClienteId || null;
  if (p.emprestimoClienteNome !== undefined) db.emprestimo_cliente_nome = p.emprestimoClienteNome || null;
  if (p.emprestimoOsId !== undefined) db.emprestimo_os_id = p.emprestimoOsId || null;
  if (p.emprestimoDataHora !== undefined) db.emprestimo_data_hora = p.emprestimoDataHora || null;
  if (p.bloqueadoEmTrocaGarantiaId !== undefined) db.bloqueado_em_troca_garantia_id = p.bloqueadoEmTrocaGarantiaId || null;
  if (p.statusRevisaoTecnica !== undefined) db.status_revisao_tecnica = p.statusRevisaoTecnica || null;
  if (p.loteRevisaoId !== undefined) db.lote_revisao_id = p.loteRevisaoId || null;
  if (p.tagRetornoAssistencia !== undefined) db.tag_retorno_assistencia = p.tagRetornoAssistencia || null;
  return db;
};

const mapNotaFromDB = (row: any): NotaCompra => ({
  id: row.id,
  data: row.data || '',
  numeroNota: row.numero_nota || '',
  fornecedor: row.fornecedor || '',
  valorTotal: Number(row.valor_total) || 0,
  status: row.status || 'Pendente',
  origem: (row.origem as any) || 'Normal',
  statusUrgencia: (row.dados_extras as any)?.statusUrgencia || undefined,
  dataPagamentoFinanceiro: (row.dados_extras as any)?.dataPagamentoFinanceiro || undefined,
  produtos: (row.produtos as any[]) || [],
  pagamento: (row.pagamento as any) || undefined,
  responsavelFinanceiro: (row.dados_extras as any)?.responsavelFinanceiro || undefined,
  valorConferido: (row.dados_extras as any)?.valorConferido,
  valorPendente: (row.dados_extras as any)?.valorPendente,
  tipoPagamento: (row.dados_extras as any)?.tipoPagamento,
  statusPagamento: (row.dados_extras as any)?.statusPagamento,
  statusConferencia: (row.dados_extras as any)?.statusConferencia,
  dataConferenciaCompleta: (row.dados_extras as any)?.dataConferenciaCompleta,
  dataVencimento: (row.dados_extras as any)?.dataVencimento,
  responsavelEstoque: (row.dados_extras as any)?.responsavelEstoque,
  vendedorRegistro: (row.dados_extras as any)?.vendedorRegistro,
  discrepancia: (row.dados_extras as any)?.discrepancia,
  motivoDiscrepancia: (row.dados_extras as any)?.motivoDiscrepancia,
  acaoRecomendada: (row.dados_extras as any)?.acaoRecomendada,
  fotoComprovante: (row.dados_extras as any)?.fotoComprovante,
  timeline: (row.timeline as any[]) || [],
});

const mapNotaToDB = (nota: Partial<NotaCompra> & { produtos?: any; pagamento?: any }) => {
  const db: any = {};
  if (nota.data !== undefined) db.data = nota.data;
  if (nota.numeroNota !== undefined) db.numero_nota = nota.numeroNota;
  if (nota.fornecedor !== undefined) db.fornecedor = nota.fornecedor;
  if (nota.valorTotal !== undefined) db.valor_total = nota.valorTotal;
  if (nota.status !== undefined) db.status = nota.status;
  if (nota.origem !== undefined) db.origem = nota.origem;
  if (nota.produtos !== undefined) db.produtos = nota.produtos;
  if (nota.pagamento !== undefined) db.pagamento = nota.pagamento;
  if (nota.timeline !== undefined) db.timeline = nota.timeline;
  // Pack extra fields into dados_extras
  const extras: any = {};
  if (nota.statusUrgencia !== undefined) extras.statusUrgencia = nota.statusUrgencia;
  if (nota.responsavelFinanceiro !== undefined) extras.responsavelFinanceiro = nota.responsavelFinanceiro;
  if (nota.valorConferido !== undefined) extras.valorConferido = nota.valorConferido;
  if (nota.valorPendente !== undefined) extras.valorPendente = nota.valorPendente;
  if (nota.tipoPagamento !== undefined) extras.tipoPagamento = nota.tipoPagamento;
  if (nota.statusPagamento !== undefined) extras.statusPagamento = nota.statusPagamento;
  if (nota.statusConferencia !== undefined) extras.statusConferencia = nota.statusConferencia;
  if (nota.dataConferenciaCompleta !== undefined) extras.dataConferenciaCompleta = nota.dataConferenciaCompleta;
  if (nota.dataVencimento !== undefined) extras.dataVencimento = nota.dataVencimento;
  if (nota.responsavelEstoque !== undefined) extras.responsavelEstoque = nota.responsavelEstoque;
  if (nota.vendedorRegistro !== undefined) extras.vendedorRegistro = nota.vendedorRegistro;
  if (nota.discrepancia !== undefined) extras.discrepancia = nota.discrepancia;
  if (nota.motivoDiscrepancia !== undefined) extras.motivoDiscrepancia = nota.motivoDiscrepancia;
  if (nota.acaoRecomendada !== undefined) extras.acaoRecomendada = nota.acaoRecomendada;
  if (nota.fotoComprovante !== undefined) extras.fotoComprovante = nota.fotoComprovante;
  if (nota.dataPagamentoFinanceiro !== undefined) extras.dataPagamentoFinanceiro = nota.dataPagamentoFinanceiro;
  if (Object.keys(extras).length > 0) db.dados_extras = extras;
  return db;
};

const mapMovFromDB = (row: any): Movimentacao => ({
  id: row.id,
  data: row.created_at || '',
  produto: '', // derived
  imei: '', // derived
  quantidade: row.quantidade || 1,
  origem: row.loja_origem_id || '',
  destino: row.loja_destino_id || '',
  responsavel: row.responsavel_id || '',
  motivo: row.motivo || '',
  status: row.tipo_movimentacao?.includes('Recebido') ? 'Recebido' : 'Pendente',
});

// ==================== CACHE ====================

let _produtos: Produto[] = [];
let _notas: NotaCompra[] = [];
let _movimentacoes: Movimentacao[] = [];
let _movimentacoesMatriz: MovimentacaoMatriz[] = [];
let _cacheLoaded = false;
let movMatrizIdCounter = 1;

export const initEstoqueCache = async (): Promise<void> => {
  try {
    const [prodRes, notaRes, movRes] = await Promise.all([
      supabase.from('produtos').select('*'),
      supabase.from('notas_compra').select('*'),
      supabase.from('movimentacoes_estoque').select('*'),
    ]);
    _produtos = (prodRes.data || []).map(mapProdutoFromDB);
    _notas = (notaRes.data || []).map(mapNotaFromDB);
    _movimentacoes = (movRes.data || []).map(mapMovFromDB);
    _cacheLoaded = true;
    initializeProductIds(_produtos.map(p => p.id));
  } catch (e) {
    console.error('[ESTOQUE] Erro ao carregar cache:', e);
  }
};

// ==================== STATUS HELPERS ====================

export const getStatusAparelho = (produto: Produto): string => {
  if (produto.statusRevisaoTecnica === 'Em Revisao Tecnica') return 'Em Revisão Técnica';
  if (produto.statusRetiradaPecas && produto.statusRetiradaPecas !== 'Cancelada') return 'Retirada de Peças';
  if (produto.quantidade === 0 && produto.statusNota === 'Concluído') return 'Vendido';
  if (produto.statusMovimentacao === 'Em movimentação') return 'Em movimentação';
  if (produto.statusEmprestimo === 'Empréstimo - Assistência') return 'Empréstimo';
  if (produto.bloqueadoEmTrocaGarantiaId) {
    return produto.quantidade === 0 ? 'Troca - Garantia' : 'Reservado para Troca';
  }
  if (produto.bloqueadoEmVendaId) return 'Bloqueado';
  if (produto.tagRetornoAssistencia) return 'Retorno de Assistência';
  return 'Disponível';
};

// ==================== PRODUTOS CRUD ====================

export const getProdutos = (): Produto[] => [..._produtos];

export const getProdutoById = (id: string): Produto | null => _produtos.find(p => p.id === id) || null;

export const getProdutoByIMEI = (imei: string): Produto | null => _produtos.find(p => p.imei === imei) || null;

export const updateProduto = async (id: string, updates: Partial<Produto>): Promise<Produto | null> => {
  const dbData = mapProdutoToDB(updates);
  const { data, error } = await supabase.from('produtos').update(dbData).eq('id', id).select().single();
  if (error || !data) { console.error('[ESTOQUE] updateProduto error:', error); return null; }
  const updated = mapProdutoFromDB(data);
  const idx = _produtos.findIndex(p => p.id === id);
  if (idx !== -1) _produtos[idx] = updated;
  return updated;
};

export const marcarProdutosComoDisponiveis = async (imeis: string[]): Promise<void> => {
  for (const imei of imeis) {
    const imeiLimpo = imei.replace(/[^0-9]/g, '');
    const produto = _produtos.find(p => p.imei.replace(/[^0-9]/g, '') === imeiLimpo);
    if (produto) {
      await updateProduto(produto.id, {
        estoqueConferido: true,
        assistenciaConferida: true,
        statusRevisaoTecnica: null,
        tagRetornoAssistencia: false,
      });
    }
  }
};

export const marcarProdutosEmRevisaoTecnica = async (imeis: string[], loteRevisaoId: string): Promise<void> => {
  for (const imei of imeis) {
    const imeiLimpo = imei.replace(/[^0-9]/g, '');
    const produto = _produtos.find(p => p.imei.replace(/[^0-9]/g, '') === imeiLimpo);
    if (produto) {
      await updateProduto(produto.id, { statusRevisaoTecnica: 'Em Revisao Tecnica', loteRevisaoId });
    }
  }
};

export const marcarProdutoRetornoAssistencia = async (imei: string): Promise<void> => {
  const imeiLimpo = imei.replace(/[^0-9]/g, '');
  const produto = _produtos.find(p => p.imei.replace(/[^0-9]/g, '') === imeiLimpo);
  if (produto) await updateProduto(produto.id, { tagRetornoAssistencia: true, statusRevisaoTecnica: null, loteRevisaoId: undefined });
};

export const marcarProdutoDevolvido = async (imei: string): Promise<void> => {
  const imeiLimpo = imei.replace(/[^0-9]/g, '');
  const produto = _produtos.find(p => p.imei.replace(/[^0-9]/g, '') === imeiLimpo);
  if (produto) await updateProduto(produto.id, { quantidade: 0, statusRevisaoTecnica: null, loteRevisaoId: undefined, statusNota: 'Concluído' });
};

export const validarRetornoAssistencia = async (imei: string, responsavel: string): Promise<boolean> => {
  const imeiLimpo = imei.replace(/[^0-9]/g, '');
  const produto = _produtos.find(p => p.imei.replace(/[^0-9]/g, '') === imeiLimpo);
  if (!produto || !produto.tagRetornoAssistencia) return false;
  const timeline = [...(produto.timeline || []), {
    id: `TL-${produto.id}-RET-${Date.now()}`, data: new Date().toISOString(), tipo: 'validacao' as const,
    titulo: 'Retorno de Assistência Validado', descricao: 'Aparelho validado pelo estoquista após retorno da assistência', responsavel,
  }];
  await updateProduto(produto.id, { tagRetornoAssistencia: false, estoqueConferido: true, assistenciaConferida: true, timeline });
  return true;
};

export const atualizarCustoAssistencia = async (produtoId: string, osId: string, custoReparo: number): Promise<Produto | null> => {
  const produto = _produtos.find(p => p.id === produtoId);
  if (!produto) return null;
  const custoAtual = produto.custoAssistencia || 0;
  const novoCusto = custoAtual + custoReparo;
  const timeline = [...(produto.timeline || []), {
    id: `TL-ASSIST-${Date.now()}`, tipo: 'parecer_assistencia' as const, data: new Date().toISOString(),
    titulo: `Investimento em Reparo (${osId})`,
    descricao: `Custo de reparo: R$ ${custoReparo.toFixed(2)} — Custo acumulado: R$ ${novoCusto.toFixed(2)}`,
    responsavel: 'Sistema', valor: custoReparo, aparelhoId: produtoId,
  }];
  return updateProduto(produtoId, { custoAssistencia: novoCusto, timeline });
};

export const getHistoricoCustosReparo = (produtoId: string): { osId: string; valor: number; data: string }[] => {
  const produto = _produtos.find(p => p.id === produtoId);
  if (!produto || !produto.timeline) return [];
  return produto.timeline
    .filter(t => t.tipo === 'parecer_assistencia' && t.titulo?.includes('Investimento em Reparo'))
    .map(t => ({ osId: t.titulo?.match(/\(([^)]+)\)/)?.[1] || '', valor: t.valor || 0, data: t.data }));
};

export const updateValorRecomendado = async (id: string, novoValor: number, usuario: string): Promise<Produto | null> => {
  const produto = _produtos.find(p => p.id === id);
  if (!produto) return null;
  const entry: HistoricoValorRecomendado = { data: new Date().toISOString().split('T')[0], usuario, valorAntigo: produto.vendaRecomendada || null, valorNovo: novoValor };
  const hist = [entry, ...(produto.historicoValorRecomendado || [])];
  return updateProduto(id, { vendaRecomendada: novoValor, historicoValorRecomendado: hist });
};

export const updateProdutoLoja = async (id: string, novaLoja: string, responsavel: string): Promise<Produto | null> => {
  const produto = _produtos.find(p => p.id === id);
  if (!produto) return null;
  const lojaAntiga = produto.loja;
  const result = await updateProduto(id, { loja: novaLoja });
  // Register movimentacao
  await supabase.from('movimentacoes_estoque').insert({
    produto_id: id, loja_origem_id: lojaAntiga, loja_destino_id: novaLoja,
    responsavel_id: responsavel, motivo: 'Transferência via tabela de produtos', tipo_movimentacao: 'Transferência',
  });
  return result;
};

// ==================== NOTAS COMPRA ====================

export const getNotasCompra = (): NotaCompra[] => [..._notas];

export const getNotaById = (id: string): NotaCompra | null => _notas.find(n => n.id === id) || null;

export const addNotaCompra = async (nota: Omit<NotaCompra, 'id' | 'status'>): Promise<NotaCompra> => {
  const dbData = mapNotaToDB({ ...nota, status: 'Pendente' });
  const { data, error } = await supabase.from('notas_compra').insert(dbData).select().single();
  if (error) throw error;
  const newNota = mapNotaFromDB(data);
  _notas.push(newNota);
  return newNota;
};

export const updateNota = async (id: string, updates: Partial<NotaCompra>): Promise<NotaCompra | null> => {
  const dbData = mapNotaToDB(updates);
  // Also merge dados_extras with existing
  const existing = _notas.find(n => n.id === id);
  if (!existing) return null;
  const { data, error } = await supabase.from('notas_compra').update(dbData).eq('id', id).select().single();
  if (error || !data) return null;
  const updated = mapNotaFromDB(data);
  const idx = _notas.findIndex(n => n.id === id);
  if (idx !== -1) _notas[idx] = updated;
  return updated;
};

export const finalizarNota = async (id: string, pagamento: NotaCompra['pagamento'], responsavelFinanceiro: string): Promise<NotaCompra | null> => {
  return updateNota(id, { pagamento, responsavelFinanceiro, status: 'Concluído' } as any);
};

// ==================== MOVIMENTAÇÕES ====================

export const getMovimentacoes = (): Movimentacao[] => [..._movimentacoes];

export const addMovimentacao = async (mov: Omit<Movimentacao, 'id'>): Promise<Movimentacao> => {
  const { data, error } = await supabase.from('movimentacoes_estoque').insert({
    produto_id: null, loja_origem_id: mov.origem, loja_destino_id: mov.destino,
    responsavel_id: mov.responsavel, motivo: mov.motivo, tipo_movimentacao: 'Pendente',
  }).select().single();
  if (error) throw error;
  const newMov: Movimentacao = { ...mov, id: data.id, status: 'Pendente' };
  _movimentacoes.push(newMov);
  // Mark product in transit
  const produto = _produtos.find(p => p.imei === mov.imei);
  if (produto) {
    await updateProduto(produto.id, { statusMovimentacao: 'Em movimentação', movimentacaoId: data.id });
  }
  return newMov;
};

export const confirmarRecebimentoMovimentacao = async (movId: string, responsavel: string): Promise<Movimentacao | null> => {
  const mov = _movimentacoes.find(m => m.id === movId);
  if (!mov) return null;
  mov.status = 'Recebido';
  mov.dataRecebimento = new Date().toISOString();
  mov.responsavelRecebimento = responsavel;
  await supabase.from('movimentacoes_estoque').update({ tipo_movimentacao: 'Recebido' }).eq('id', movId);
  const produto = _produtos.find(p => p.imei === mov.imei);
  if (produto) {
    const timeline = [...(produto.timeline || []), {
      id: `TL-${produto.id}-MOV-${mov.id}`, tipo: 'entrada' as const, data: new Date().toISOString(),
      titulo: 'Movimentação Finalizada',
      descricao: `Aparelho recebido na loja de destino. Origem: ${mov.origem} → Destino: ${mov.destino}.`,
      responsavel,
    }];
    await updateProduto(produto.id, { loja: mov.destino, statusMovimentacao: null, movimentacaoId: undefined, timeline });
  }
  return mov;
};

export const getLojas = (): string[] => Object.values(ESTOQUE_LOJAS_IDS);

export const getFornecedores = (): string[] => [];

export const getEstoqueStats = () => {
  const totalProdutos = _produtos.length;
  const valorTotalEstoque = _produtos.reduce((acc, p) => acc + p.valorCusto * p.quantidade, 0);
  const produtosBateriaFraca = _produtos.filter(p => p.saudeBateria < 85).length;
  const notasPendentes = _notas.filter(n => n.status === 'Pendente').length;
  return { totalProdutos, valorTotalEstoque, produtosBateriaFraca, notasPendentes };
};

export const addProdutoMigrado = async (produto: Produto): Promise<Produto> => {
  const existente = _produtos.find(p => p.id === produto.id);
  if (existente) { Object.assign(existente, produto); return existente; }
  const dbData = mapProdutoToDB(produto);
  dbData.id = produto.id;
  await supabase.from('produtos').upsert(dbData);
  _produtos.push(produto);
  return produto;
};

export const migrarAparelhoNovoParaEstoque = async (
  produto: ProdutoNota, notaId: string, fornecedor: string, lojaDestino: string, responsavel: string
): Promise<Produto> => {
  const jaExiste = _produtos.find(p => p.imei === produto.imei);
  if (jaExiste) return jaExiste;
  const newId = generateProductId();
  const novoProduto: Produto = {
    id: newId, imei: produto.imei, marca: produto.marca, modelo: produto.modelo, cor: produto.cor,
    tipo: 'Novo', quantidade: 1, valorCusto: produto.valorUnitario, valorVendaSugerido: produto.valorUnitario * 1.8,
    saudeBateria: produto.saudeBateria || 100, loja: lojaDestino, estoqueConferido: true, assistenciaConferida: true,
    condicao: 'Lacrado', historicoCusto: [{ data: new Date().toISOString().split('T')[0], fornecedor, valor: produto.valorUnitario }],
    historicoValorRecomendado: [], statusNota: 'Concluído', origemEntrada: 'Fornecedor',
    timeline: [{ id: `TL-${Date.now()}`, data: new Date().toISOString(), tipo: 'entrada', titulo: 'Entrada Direta via Nota de Compra',
      descricao: `Aparelho NOVO ${newId} adicionado ao estoque via nota ${notaId}`, responsavel }],
  };
  const dbData = mapProdutoToDB(novoProduto);
  await supabase.from('produtos').insert(dbData);
  _produtos.push(novoProduto);
  registerProductId(newId);
  return novoProduto;
};

export const bloquearProdutosEmVenda = async (vendaId: string, produtoIds: string[]): Promise<boolean> => {
  let sucesso = true;
  for (const produtoId of produtoIds) {
    const result = await updateProduto(produtoId, { bloqueadoEmVendaId: vendaId });
    if (!result) sucesso = false;
  }
  return sucesso;
};

export const desbloquearProdutosDeVenda = async (vendaId: string): Promise<boolean> => {
  let count = 0;
  for (const produto of _produtos) {
    if (produto.bloqueadoEmVendaId === vendaId) {
      await updateProduto(produto.id, { bloqueadoEmVendaId: undefined });
      count++;
    }
  }
  return count > 0;
};

export const getProdutosDisponiveis = (): Produto[] => _produtos.filter(p => p.quantidade > 0 && !p.bloqueadoEmVendaId && !p.statusMovimentacao);

export const getProdutosDisponiveisPorLoja = (lojaId: string): Produto[] => {
  const lojasPool = getLojasPorPoolEstoque(lojaId);
  return _produtos.filter(p => {
    if (p.quantidade <= 0 || p.bloqueadoEmVendaId || p.statusMovimentacao) return false;
    const lojaEfetiva = p.lojaAtualId || p.loja;
    return lojasPool.includes(lojaEfetiva);
  });
};

export const isProdutoBloqueado = (produtoId: string): boolean => {
  const produto = _produtos.find(p => p.id === produtoId);
  return produto?.bloqueadoEmVendaId !== undefined;
};

export const abaterProdutoDoEstoque = async (produtoId: string, lojaVendaId: string): Promise<boolean> => {
  const produto = _produtos.find(p => p.id === produtoId);
  if (!produto) return false;
  const lojaEstoqueReal = getLojaEstoqueReal(lojaVendaId);
  const lojaEfetiva = produto.lojaAtualId || produto.loja;
  if (lojaEfetiva === lojaEstoqueReal && produto.quantidade > 0) {
    await updateProduto(produtoId, { quantidade: produto.quantidade - 1 });
    return true;
  }
  return false;
};

// ==================== VALIDAÇÃO PROGRESSIVA ====================

export const validarAparelhoNota = async (
  notaId: string, aparelhoImei: string, dados: { responsavel: string; observacoes?: string }
): Promise<{ sucesso: boolean; nota?: NotaCompra; percentualConferencia?: number; conferidoCompleto?: boolean; discrepancia?: boolean }> => {
  const nota = _notas.find(n => n.id === notaId);
  if (!nota) return { sucesso: false };
  const aparelhoIndex = nota.produtos.findIndex(p => p.imei === aparelhoImei);
  if (aparelhoIndex === -1) return { sucesso: false };
  const aparelho = nota.produtos[aparelhoIndex];
  if (aparelho.statusConferencia === 'Conferido') return { sucesso: false };
  if (!aparelho.id) aparelho.id = `PROD-${nota.id}-${String(aparelhoIndex + 1).padStart(3, '0')}`;
  aparelho.statusConferencia = 'Conferido';
  aparelho.dataConferencia = new Date().toISOString();
  aparelho.responsavelConferencia = dados.responsavel;
  nota.produtos[aparelhoIndex] = aparelho;
  const aparelhosConferidos = nota.produtos.filter(p => p.statusConferencia === 'Conferido');
  const valorConferido = aparelhosConferidos.reduce((acc, p) => acc + p.valorTotal, 0);
  const percentualConferencia = Math.round((aparelhosConferidos.length / nota.produtos.length) * 100);
  const conferidoCompleto = aparelhosConferidos.length === nota.produtos.length;
  let discrepancia = false;
  if (conferidoCompleto) {
    const tolerancia = nota.valorTotal * 0.001;
    if (Math.abs(valorConferido - nota.valorTotal) > tolerancia) discrepancia = true;
  }
  const timeline = [...(nota.timeline || []), {
    id: `TL-${notaId}-${Date.now()}`, data: new Date().toISOString(), tipo: 'validacao' as const,
    titulo: 'Aparelho Validado',
    descricao: `${aparelho.marca} ${aparelho.modelo} conferido. Progresso: ${aparelhosConferidos.length}/${nota.produtos.length} (${percentualConferencia}%)`,
    responsavel: dados.responsavel, aparelhoId: aparelho.id, valor: aparelho.valorTotal,
  }];
  await updateNota(notaId, {
    produtos: nota.produtos, valorConferido, valorPendente: nota.valorTotal - valorConferido,
    responsavelEstoque: dados.responsavel, discrepancia,
    statusConferencia: conferidoCompleto ? (discrepancia ? 'Discrepância Detectada' : 'Conferência Completa') : 'Em Conferência',
    timeline,
  } as any);
  return { sucesso: true, nota, percentualConferencia, conferidoCompleto, discrepancia };
};

export const verificarConferenciaNota = (notaId: string) => {
  const nota = _notas.find(n => n.id === notaId);
  if (!nota) return { conferido: false, percentual: 0, discrepancia: false, aparelhosConferidos: 0, aparelhosTotal: 0 };
  const conf = nota.produtos.filter(p => p.statusConferencia === 'Conferido').length;
  const total = nota.produtos.length;
  return { conferido: conf === total, percentual: Math.round((conf / total) * 100), discrepancia: nota.discrepancia || false, motivo: nota.motivoDiscrepancia, aparelhosConferidos: conf, aparelhosTotal: total };
};

export const validarAparelhosEmLote = async (
  notaId: string, aparelhoImeis: string[], responsavel: string, observacoes?: string
): Promise<{ sucesso: boolean; validados: number; erros: string[]; nota?: NotaCompra }> => {
  const erros: string[] = []; let validados = 0;
  for (const imei of aparelhoImeis) {
    const r = await validarAparelhoNota(notaId, imei, { responsavel, observacoes });
    if (r.sucesso) validados++; else erros.push(`Falha ao validar IMEI ${imei}`);
  }
  return { sucesso: validados > 0, validados, erros, nota: _notas.find(n => n.id === notaId) || undefined };
};

// ==================== INTEGRAÇÃO FINANCEIRO ====================

export const criarNotaComPendencia = async (notaData: Omit<NotaCompra, 'id' | 'status'>): Promise<NotaCompra> => {
  const novaNota = await addNotaCompra({ ...notaData, valorConferido: 0, valorPendente: notaData.valorTotal, statusConferencia: 'Em Conferência', statusPagamento: 'Aguardando Conferência' } as any);
  try {
    const { criarPendenciaFinanceira } = await import('./pendenciasFinanceiraApi');
    criarPendenciaFinanceira(novaNota);
  } catch (e) { console.warn('[ESTOQUE] pendenciasFinanceiraApi not available'); }
  return novaNota;
};

export const atualizarStatusPagamento = async (notaId: string, status: 'Aguardando Conferência' | 'Pago' | 'Parcialmente Pago'): Promise<NotaCompra | null> => {
  const updates: any = { statusPagamento: status };
  if (status === 'Pago') updates.status = 'Concluído';
  const timeline = [{ id: `TL-${notaId}-${Date.now()}`, data: new Date().toISOString(), tipo: 'pagamento' as const, titulo: 'Status de Pagamento Atualizado', descricao: `Status alterado para: ${status}`, responsavel: 'Sistema' }];
  const nota = _notas.find(n => n.id === notaId);
  if (nota) updates.timeline = [...(nota.timeline || []), ...timeline];
  return updateNota(notaId, updates);
};

export const sincronizarValidacaoComFinanceiro = async (notaId: string, aparelhoInfo: { modelo: string; imei: string; valor: number }, responsavel: string): Promise<void> => {
  const nota = _notas.find(n => n.id === notaId);
  if (!nota) return;
  const aparelhosConferidos = nota.produtos.filter(p => p.statusConferencia === 'Conferido').length;
  const valorConferido = nota.produtos.filter(p => p.statusConferencia === 'Conferido').reduce((acc, p) => acc + p.valorTotal, 0);
  try {
    const { atualizarPendencia } = await import('./pendenciasFinanceiraApi');
    atualizarPendencia(notaId, { valorConferido, aparelhosConferidos, statusConferencia: nota.statusConferencia, responsavel, aparelhoInfo });
  } catch (e) { console.warn('[ESTOQUE] pendenciasFinanceiraApi not available'); }
};

// ==================== MOVIMENTAÇÃO MATRIZ ====================

export const getMatrizLojaId = (): string => ESTOQUE_LOJAS_IDS.MATRIZ;
export const getEstoqueSiaId = (): string => ESTOQUE_SIA_ID;

const generateMovMatrizId = (): string => {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `MM-${dateStr}-${String(movMatrizIdCounter++).padStart(4, '0')}`;
};

export const getMovimentacoesMatriz = (filtros?: { status?: string; lojaDestinoId?: string; dataInicio?: string; dataFim?: string }): MovimentacaoMatriz[] => {
  verificarRetornosAtrasados();
  let result = [..._movimentacoesMatriz];
  if (filtros?.status) result = result.filter(m => m.statusMovimentacao === filtros.status);
  if (filtros?.lojaDestinoId) result = result.filter(m => m.lojaDestinoId === filtros.lojaDestinoId);
  if (filtros?.dataInicio) result = result.filter(m => m.dataHoraLancamento >= filtros.dataInicio!);
  if (filtros?.dataFim) result = result.filter(m => m.dataHoraLancamento <= filtros.dataFim!);
  return result.sort((a, b) => new Date(b.dataHoraLancamento).getTime() - new Date(a.dataHoraLancamento).getTime());
};

export const getMovimentacaoMatrizById = (id: string): MovimentacaoMatriz | null => _movimentacoesMatriz.find(m => m.id === id) || null;

export const criarMovimentacaoMatriz = async (dados: {
  lojaDestinoId: string; responsavelLancamento: string;
  itens: Array<{ aparelhoId: string; imei: string; modelo: string; cor: string }>;
}): Promise<MovimentacaoMatriz> => {
  const agora = new Date();
  const limite = new Date(agora);
  limite.setHours(22, 0, 0, 0);
  if (agora.getHours() >= 22) limite.setDate(limite.getDate() + 1);
  const novaMovimentacao: MovimentacaoMatriz = {
    id: generateMovMatrizId(), dataHoraLancamento: agora.toISOString(),
    responsavelLancamento: dados.responsavelLancamento, lojaOrigemId: ESTOQUE_SIA_ID,
    lojaDestinoId: dados.lojaDestinoId, statusMovimentacao: 'Pendente', dataHoraLimiteRetorno: limite.toISOString(),
    itens: dados.itens.map(item => ({ ...item, statusItem: 'Enviado' as const })),
    timeline: [{ id: `TL-${Date.now()}`, data: agora.toISOString(), tipo: 'saida_matriz' as const, titulo: 'Movimentação Criada',
      descricao: `${dados.itens.length} aparelho(s) enviado(s) para Loja - Matriz`, responsavel: dados.responsavelLancamento }],
  };
  for (const item of dados.itens) {
    await updateProduto(item.aparelhoId, { lojaAtualId: dados.lojaDestinoId, movimentacaoId: novaMovimentacao.id, statusMovimentacao: null });
  }
  _movimentacoesMatriz.push(novaMovimentacao);
  return novaMovimentacao;
};

export const registrarRetornoItemMatriz = async (movimentacaoId: string, aparelhoId: string, responsavelRetorno: string
): Promise<{ sucesso: boolean; mensagem: string; movimentacao?: MovimentacaoMatriz }> => {
  const movimentacao = _movimentacoesMatriz.find(m => m.id === movimentacaoId);
  if (!movimentacao) return { sucesso: false, mensagem: 'Movimentação não encontrada' };
  const item = movimentacao.itens.find(i => i.aparelhoId === aparelhoId);
  if (!item) return { sucesso: false, mensagem: 'Item não encontrado na movimentação' };
  if (item.statusItem === 'Devolvido') return { sucesso: false, mensagem: 'Item já foi devolvido' };
  if (item.statusItem === 'Vendido') return { sucesso: false, mensagem: 'Item foi vendido na loja destino' };
  const agoraISO = new Date().toISOString();
  item.statusItem = 'Devolvido'; item.dataHoraRetorno = agoraISO; item.responsavelRetorno = responsavelRetorno;
  await updateProduto(aparelhoId, { lojaAtualId: undefined, movimentacaoId: undefined });
  movimentacao.timeline.unshift({ id: `TL-${Date.now()}-ret`, data: agoraISO, tipo: 'retorno_matriz', titulo: 'Item Conferido',
    descricao: `${item.modelo} ${item.cor} conferido e devolvido`, responsavel: responsavelRetorno });
  const todosFinalizados = movimentacao.itens.every(i => i.statusItem === 'Devolvido' || i.statusItem === 'Vendido');
  if (todosFinalizados) {
    const limite = new Date(movimentacao.dataHoraLimiteRetorno);
    movimentacao.statusMovimentacao = (movimentacao.statusMovimentacao === 'Atrasado' || new Date() >= limite) ? 'Finalizado - Atrasado' : 'Finalizado - Dentro do Prazo';
  }
  return { sucesso: true, mensagem: 'Retorno registrado com sucesso', movimentacao };
};

export const desfazerRetornoItemMatriz = async (movimentacaoId: string, aparelhoId: string, responsavel: string
): Promise<{ sucesso: boolean; mensagem: string; movimentacao?: MovimentacaoMatriz }> => {
  const movimentacao = _movimentacoesMatriz.find(m => m.id === movimentacaoId);
  if (!movimentacao) return { sucesso: false, mensagem: 'Movimentação não encontrada' };
  const item = movimentacao.itens.find(i => i.aparelhoId === aparelhoId);
  if (!item || item.statusItem !== 'Devolvido') return { sucesso: false, mensagem: 'Item não está com status Devolvido' };
  item.statusItem = 'Enviado'; item.dataHoraRetorno = undefined; item.responsavelRetorno = undefined;
  await updateProduto(aparelhoId, { lojaAtualId: movimentacao.lojaDestinoId, movimentacaoId: movimentacaoId });
  movimentacao.timeline.unshift({ id: `TL-${Date.now()}-undo`, data: new Date().toISOString(), tipo: 'saida_matriz', titulo: 'Conferência Desfeita',
    descricao: `${item.modelo} ${item.cor} retornado para Pendentes`, responsavel });
  if (movimentacao.statusMovimentacao.startsWith('Finalizado')) {
    const limite = new Date(movimentacao.dataHoraLimiteRetorno);
    movimentacao.statusMovimentacao = new Date() >= limite ? 'Atrasado' : 'Pendente';
  }
  return { sucesso: true, mensagem: 'Conferência desfeita com sucesso', movimentacao };
};

export const verificarStatusMovimentacoesMatriz = (): void => {
  const agora = new Date();
  _movimentacoesMatriz.forEach(mov => {
    if (mov.statusMovimentacao === 'Pendente' && agora >= new Date(mov.dataHoraLimiteRetorno)) {
      mov.statusMovimentacao = 'Atrasado';
      mov.timeline.unshift({ id: `TL-${Date.now()}-atraso`, data: agora.toISOString(), tipo: 'alerta_sla', titulo: 'Status: Atrasado',
        descricao: 'O prazo limite de 22:00 foi ultrapassado', responsavel: 'Sistema' });
    }
  });
};

export const verificarRetornosAtrasados = verificarStatusMovimentacoesMatriz;

export const marcarItemVendidoMatriz = (imei: string): { sucesso: boolean; movimentacaoId?: string } => {
  for (const mov of _movimentacoesMatriz) {
    if (!mov.statusMovimentacao.startsWith('Finalizado')) {
      const item = mov.itens.find(i => i.imei === imei && i.statusItem === 'Enviado');
      if (item) {
        item.statusItem = 'Vendido';
        mov.timeline.unshift({ id: `TL-${Date.now()}-venda`, data: new Date().toISOString(), tipo: 'venda_matriz', titulo: 'Item Vendido',
          descricao: `${item.modelo} ${item.cor} vendido na loja destino`, responsavel: 'Sistema' });
        const todosFinalizados = mov.itens.every(i => i.statusItem === 'Devolvido' || i.statusItem === 'Vendido');
        if (todosFinalizados) {
          const limite = new Date(mov.dataHoraLimiteRetorno);
          mov.statusMovimentacao = (mov.statusMovimentacao === 'Atrasado' || new Date() >= limite) ? 'Finalizado - Atrasado' : 'Finalizado - Dentro do Prazo';
        }
        return { sucesso: true, movimentacaoId: mov.id };
      }
    }
  }
  return { sucesso: false };
};

export const getProdutosDisponivelMatriz = (): Produto[] => {
  return _produtos.filter(p => p.loja === ESTOQUE_SIA_ID && !p.lojaAtualId && !p.statusMovimentacao && !p.bloqueadoEmVendaId && p.statusNota === 'Concluído');
};

// ==================== CONFERÊNCIA AUTOMÁTICA VIA VENDA ====================
import { buscarVendaPorImei } from './vendasApi';

export const conferirProdutoMovimentacaoMatrizPorVenda = async (
  produtoId: string, vendaId: string, vendedorId: string, vendedorNome: string
): Promise<{ sucesso: boolean }> => {
  const produto = _produtos.find(p => p.id === produtoId);
  if (!produto || !produto.movimentacaoId) return { sucesso: false };
  const movimentacao = _movimentacoesMatriz.find(m => m.id === produto.movimentacaoId);
  if (!movimentacao || movimentacao.statusMovimentacao.startsWith('Finalizado')) return { sucesso: false };
  const item = movimentacao.itens.find(i => i.aparelhoId === produtoId);
  if (!item || item.statusItem !== 'Enviado') return { sucesso: false };
  item.statusItem = 'Vendido'; item.dataHoraRetorno = new Date().toISOString();
  item.vendaId = vendaId; item.vendedorId = vendedorId; item.vendedorNome = vendedorNome; item.conferenciaAutomatica = true;
  movimentacao.timeline.unshift({ id: `TL-${Date.now()}-venda-auto`, data: new Date().toISOString(), tipo: 'venda_matriz',
    titulo: 'Conferido Automaticamente via Venda', descricao: `${item.modelo} ${item.cor} - Venda ${vendaId} por ${vendedorNome}`, responsavel: 'Sistema', aparelhoId: produtoId });
  await updateProduto(produtoId, { movimentacaoId: undefined });
  const todosFinalizados = movimentacao.itens.every(i => i.statusItem === 'Devolvido' || i.statusItem === 'Vendido');
  if (todosFinalizados) {
    const limite = new Date(movimentacao.dataHoraLimiteRetorno);
    movimentacao.statusMovimentacao = (movimentacao.statusMovimentacao === 'Atrasado' || new Date() >= limite) ? 'Finalizado - Atrasado' : 'Finalizado - Dentro do Prazo';
  }
  return { sucesso: true };
};

export const conferirItensAutomaticamentePorVenda = (
  movimentacaoId: string, obterNomeColaborador: (id: string) => string
): { movimentacao: MovimentacaoMatriz | null; itensConferidos: Array<{ imei: string; vendaId: string; vendedor: string }> } => {
  const movimentacao = _movimentacoesMatriz.find(m => m.id === movimentacaoId);
  if (!movimentacao || movimentacao.statusMovimentacao.startsWith('Finalizado')) return { movimentacao: movimentacao || null, itensConferidos: [] };
  const itensConferidos: Array<{ imei: string; vendaId: string; vendedor: string }> = [];
  movimentacao.itens.forEach(item => {
    if (item.statusItem !== 'Enviado') return;
    const resultado = buscarVendaPorImei(item.imei);
    if (resultado) {
      const { venda } = resultado;
      const vendedorNome = obterNomeColaborador(venda.vendedor) || 'Vendedor Desconhecido';
      item.statusItem = 'Vendido'; item.dataHoraRetorno = new Date().toISOString();
      item.vendaId = venda.id; item.vendedorId = venda.vendedor; item.vendedorNome = vendedorNome; item.conferenciaAutomatica = true;
      itensConferidos.push({ imei: item.imei, vendaId: venda.id, vendedor: vendedorNome });
      movimentacao.timeline.unshift({ id: `TL-${Date.now()}-auto-${item.imei}`, data: new Date().toISOString(), tipo: 'venda_matriz',
        titulo: 'Conferido Automaticamente via Venda', descricao: `${item.modelo} ${item.cor} - Venda ${venda.id} por ${vendedorNome}`, responsavel: 'Sistema', aparelhoId: item.aparelhoId });
    }
  });
  const todosFinalizados = movimentacao.itens.every(i => i.statusItem === 'Devolvido' || i.statusItem === 'Vendido');
  if (todosFinalizados && itensConferidos.length > 0) {
    const limite = new Date(movimentacao.dataHoraLimiteRetorno);
    movimentacao.statusMovimentacao = (movimentacao.statusMovimentacao === 'Atrasado' || new Date() >= limite) ? 'Finalizado - Atrasado' : 'Finalizado - Dentro do Prazo';
  }
  return { movimentacao, itensConferidos };
};
