// API para Lista de Reparos (OS)
import { supabase } from '@/integrations/supabase/client';
import { Produto, addProdutoMigrado, validarAparelhoNota, verificarConferenciaNota } from './estoqueApi';
import { generateProductId, registerProductId, isProductIdRegistered } from './idManager';
import { encaminharParaAnaliseGarantia } from './garantiasApi';
import { atualizarPendencia, getPendenciaPorNota } from './pendenciasFinanceiraApi';
import { addNotification } from './notificationsApi';

export interface ParecerEstoque {
  id: string;
  data: string;
  status: 'Análise Realizada – Produto em ótimo estado' | 'Encaminhado para conferência da Assistência' | 'Produto revisado e deferido';
  observacoes: string;
  responsavel: string;
  contadorEncaminhamento?: number;
  dataConfirmacao?: string;
  hora?: string;
}

export interface ParecerAssistencia {
  id: string;
  data: string;
  status: 'Validado pela assistência' | 'Aguardando peça' | 'Ajustes realizados' | 'Recusado - Assistência';
  observacoes: string;
  responsavel: string;
  pecas?: {
    descricao: string;
    valor: number;
    fornecedor: string;
    origemPeca?: 'Fornecedor' | 'Tinha na Assistência';
  }[];
}

export interface TimelineEntry {
  id: string;
  data: string;
  tipo: 'entrada' | 'parecer_estoque' | 'parecer_assistencia' | 'despesa' | 'liberacao';
  titulo: string;
  descricao: string;
  responsavel?: string;
  valor?: number;
}

export interface ProdutoPendente {
  id: string;
  imei: string;
  imagem?: string;
  marca: string;
  modelo: string;
  cor: string;
  tipo: 'Novo' | 'Seminovo';
  condicao: 'Novo' | 'Semi-novo';
  origemEntrada: 'Base de Troca' | 'Fornecedor' | 'Emprestado - Garantia' | 'NEGOCIADO';
  notaOuVendaId?: string;
  valorCusto: number;
  valorCustoOriginal: number;
  valorOrigem: number;
  saudeBateria: number;
  loja: string;
  dataEntrada: string;
  fornecedor?: string;
  parecerEstoque?: ParecerEstoque;
  parecerAssistencia?: ParecerAssistencia;
  timeline: TimelineEntry[];
  custoAssistencia: number;
  statusGeral: 'Pendente Estoque' | 'Aguardando Recebimento Assistência' | 'Em Análise Assistência' | 'Aguardando Peça' | 'Liberado' | 'Retornado da Assistência' | 'Devolvido para Fornecedor' | 'Retirada de Peças' | 'Serviço Concluído - Validar Aparelho' | 'Retrabalho - Recusado pelo Estoque';
  contadorEncaminhamentos: number;
}

// ============= CACHE LOCAL =============
let produtosPendentesCache: ProdutoPendente[] = [];
let cacheInitialized = false;

// Seed removido - dados vêm exclusivamente do Supabase

// Helper: mapear row do Supabase para ProdutoPendente
const mapRowToProduto = (row: any): ProdutoPendente => ({
  id: row.id,
  imei: row.imei || '',
  imagem: row.imagem || undefined,
  marca: row.marca || '',
  modelo: row.modelo || '',
  cor: row.cor || '',
  tipo: row.tipo || 'Seminovo',
  condicao: row.condicao || 'Semi-novo',
  origemEntrada: row.origem_entrada || 'Fornecedor',
  notaOuVendaId: row.nota_ou_venda_id || undefined,
  valorCusto: Number(row.valor_custo) || 0,
  valorCustoOriginal: Number(row.valor_custo_original) || 0,
  valorOrigem: Number(row.valor_origem) || 0,
  saudeBateria: row.saude_bateria || 100,
  loja: row.loja || '',
  dataEntrada: row.data_entrada || new Date().toISOString().split('T')[0],
  fornecedor: row.fornecedor || undefined,
  parecerEstoque: row.parecer_estoque || undefined,
  parecerAssistencia: row.parecer_assistencia || undefined,
  timeline: row.timeline || [],
  custoAssistencia: Number(row.custo_assistencia) || 0,
  statusGeral: row.status_geral || 'Pendente Estoque',
  contadorEncaminhamentos: row.contador_encaminhamentos || 0
});

// Helper: mapear ProdutoPendente para row do Supabase
const mapProdutoToRow = (p: ProdutoPendente): any => ({
  id: p.id,
  imei: p.imei,
  imagem: p.imagem || null,
  marca: p.marca,
  modelo: p.modelo,
  cor: p.cor,
  tipo: p.tipo,
  condicao: p.condicao,
  origem_entrada: p.origemEntrada,
  nota_ou_venda_id: p.notaOuVendaId || null,
  valor_custo: p.valorCusto,
  valor_custo_original: p.valorCustoOriginal,
  valor_origem: p.valorOrigem,
  saude_bateria: p.saudeBateria,
  loja: p.loja,
  data_entrada: p.dataEntrada,
  fornecedor: p.fornecedor || null,
  parecer_estoque: p.parecerEstoque || null,
  parecer_assistencia: p.parecerAssistencia || null,
  timeline: p.timeline,
  custo_assistencia: p.custoAssistencia,
  status_geral: p.statusGeral,
  contador_encaminhamentos: p.contadorEncaminhamentos
});

// Sync helper
const syncToSupabase = async (produto: ProdutoPendente) => {
  try {
    const row = mapProdutoToRow(produto);
    await supabase.from('produtos_pendentes_os').upsert(row as any, { onConflict: 'id' });
  } catch (err) {
    console.error('[osApi] Erro ao sincronizar com Supabase:', err);
  }
};

const deleteFromSupabase = async (id: string) => {
  try {
    await supabase.from('produtos_pendentes_os').delete().eq('id', id);
  } catch (err) {
    console.error('[osApi] Erro ao deletar do Supabase:', err);
  }
};

// ============= INIT CACHE =============
export const initProdutosPendentesCache = async () => {
  if (cacheInitialized) return;
  try {
    const { data, error } = await supabase.from('produtos_pendentes_os').select('*');
    if (error) throw error;

    produtosPendentesCache = (data || []).map(mapRowToProduto);

    // Register IDs
    produtosPendentesCache.forEach(p => registerProductId(p.id));
    cacheInitialized = true;
    console.log(`[osApi] Cache inicializado com ${produtosPendentesCache.length} produtos pendentes`);
  } catch (err) {
    console.error('[osApi] Erro ao inicializar cache:', err);
    produtosPendentesCache = [];
    cacheInitialized = true;
  }
};

// Lista de produtos migrados para o estoque (referência local)
let produtosMigrados: Produto[] = [];

// ============= GET (SÍNCRONO VIA CACHE) =============
export const getProdutosPendentes = (): ProdutoPendente[] => {
  return produtosPendentesCache.filter(p => p.statusGeral !== 'Liberado');
};

export const getProdutoPendenteById = (id: string): ProdutoPendente | null => {
  return produtosPendentesCache.find(p => p.id === id) || null;
};

export const getProdutosParaAnaliseOS = (): ProdutoPendente[] => {
  return produtosPendentesCache.filter(p => 
    p.statusGeral === 'Em Análise Assistência' || p.statusGeral === 'Aguardando Peça'
  );
};

export const getProdutosMigrados = (): Produto[] => {
  return [...produtosMigrados];
};

// Atualizar status do produto pendente via IMEI (sincronização OS ↔ Estoque)
export const atualizarStatusProdutoPendente = (
  imei: string, 
  novoStatus: ProdutoPendente['statusGeral'], 
  dadosOS?: { osId: string; resumo?: string; custoPecas?: number; tecnico?: string }
): ProdutoPendente | null => {
  const produto = produtosPendentesCache.find(p => p.imei === imei);
  if (!produto) {
    console.warn(`[OS API] Produto pendente com IMEI ${imei} não encontrado para atualização.`);
    return null;
  }

  produto.statusGeral = novoStatus;

  if (dadosOS) {
    produto.timeline.push({
      id: `TL-SYNC-${Date.now()}`,
      data: new Date().toISOString(),
      tipo: novoStatus === 'Serviço Concluído - Validar Aparelho' ? 'parecer_assistencia' : 'parecer_estoque',
      titulo: novoStatus === 'Serviço Concluído - Validar Aparelho'
        ? `Serviço Concluído no Laboratório – ${dadosOS.osId}`
        : `Retrabalho Solicitado – ${dadosOS.osId}`,
      descricao: dadosOS.resumo || `Status atualizado para: ${novoStatus}`,
      responsavel: dadosOS.tecnico || 'Sistema',
      valor: dadosOS.custoPecas
    });

    if (novoStatus === 'Serviço Concluído - Validar Aparelho' && dadosOS.custoPecas) {
      produto.custoAssistencia = (produto.custoAssistencia || 0) + dadosOS.custoPecas;
    }
  }

  // Sync async
  syncToSupabase(produto);
  console.log(`[OS API] Produto pendente ${produto.id} (IMEI: ${imei}) atualizado para: ${novoStatus}`);
  return produto;
};

// Calcular SLA em dias e horas
export const calcularSLA = (dataEntrada: string): { 
  dias: number; 
  horas: number; 
  texto: string; 
  cor: 'normal' | 'amarelo' | 'vermelho' 
} => {
  const hoje = new Date();
  const entrada = new Date(dataEntrada);
  const diffTime = Math.abs(hoje.getTime() - entrada.getTime());
  
  const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  let cor: 'normal' | 'amarelo' | 'vermelho' = 'normal';
  if (dias >= 5) {
    cor = 'vermelho';
  } else if (dias >= 3) {
    cor = 'amarelo';
  }
  
  const texto = dias > 0 
    ? `${dias} dia${dias > 1 ? 's' : ''} e ${horas}h`
    : `${horas}h`;
  
  return { dias, horas, texto, cor };
};

// Migrar produto para o estoque PRINCIPAL (via estoqueApi)
const migrarParaEstoque = (produto: ProdutoPendente, origemDeferimento: 'Estoque' | 'Assistência', responsavel: string): Produto => {
  const timelineLiberacao: TimelineEntry = {
    id: `TL-LIB-${Date.now()}`,
    data: new Date().toISOString(),
    tipo: 'liberacao',
    titulo: 'Produto Liberado para Estoque',
    descricao: `Produto liberado após ${origemDeferimento === 'Estoque' ? 'análise do estoque' : 'conferência da assistência'}`,
    responsavel
  };

  const custoReparo = produto.custoAssistencia || 0;
  const custoComposto = produto.valorCustoOriginal + custoReparo;

  const timelineCusto: TimelineEntry | null = custoReparo > 0 ? {
    id: `TL-CUSTO-${Date.now()}`,
    tipo: 'parecer_estoque',
    data: new Date().toISOString(),
    titulo: 'Custo Composto Atualizado',
    descricao: `Aquisição: R$ ${produto.valorCustoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + Reparo: R$ ${custoReparo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = Custo Final: R$ ${custoComposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    responsavel
  } : null;

  const novoProduto: Produto = {
    id: produto.id,
    imei: produto.imei,
    imagem: produto.imagem,
    marca: produto.marca,
    modelo: produto.modelo,
    cor: produto.cor,
    tipo: produto.tipo,
    quantidade: 1,
    valorCusto: custoComposto,
    valorVendaSugerido: custoComposto * 1.8,
    vendaRecomendada: null,
    saudeBateria: produto.saudeBateria,
    loja: produto.loja,
    estoqueConferido: true,
    assistenciaConferida: origemDeferimento === 'Assistência',
    condicao: produto.condicao === 'Semi-novo' ? 'Seminovo' : 'Lacrado',
    custoAssistencia: custoReparo > 0 ? custoReparo : undefined,
    historicoCusto: [
      { data: new Date().toISOString().split('T')[0], fornecedor: produto.origemEntrada, valor: produto.valorCustoOriginal },
      ...(custoReparo > 0 ? [{ data: new Date().toISOString().split('T')[0], fornecedor: 'Assistência Técnica', valor: custoReparo }] : [])
    ],
    historicoValorRecomendado: [],
    statusNota: 'Pendente',
    origemEntrada: produto.origemEntrada,
    timeline: [...produto.timeline, timelineLiberacao, ...(timelineCusto ? [timelineCusto] : [])]
  };

  addProdutoMigrado(novoProduto);
  produtosMigrados.push(novoProduto);
  console.log(`[OS API] Produto ${produto.id} migrado para estoque principal com sucesso!`);
  return novoProduto;
};

export const salvarParecerEstoque = async (
  id: string, 
  status: ParecerEstoque['status'], 
  observacoes: string, 
  responsavel: string
): Promise<{ produto: ProdutoPendente | null; migrado: boolean; produtoMigrado?: Produto }> => {
  const produto = produtosPendentesCache.find(p => p.id === id);
  if (!produto) return { produto: null, migrado: false };

  let contadorEncaminhamento = produto.contadorEncaminhamentos || 0;
  
  if (status === 'Encaminhado para conferência da Assistência') {
    contadorEncaminhamento++;
    produto.contadorEncaminhamentos = contadorEncaminhamento;
  }

  const parecer: ParecerEstoque = {
    id: `PE-${Date.now()}`,
    data: new Date().toISOString(),
    status,
    observacoes,
    responsavel,
    contadorEncaminhamento: status === 'Encaminhado para conferência da Assistência' ? contadorEncaminhamento : undefined,
    dataConfirmacao: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  produto.parecerEstoque = parecer;
  
  produto.timeline.push({
    id: `TL-${Date.now()}`,
    data: new Date().toISOString(),
    tipo: 'parecer_estoque',
    titulo: status === 'Análise Realizada – Produto em ótimo estado' 
      ? `Deferido Estoque – ${id}` 
      : status === 'Produto revisado e deferido'
        ? `Produto Revisado e Deferido – ${id}`
        : `Parecer Estoque - Encaminhado Assistência (${contadorEncaminhamento}) – ${id}`,
    descricao: `${status}. ${observacoes}`,
    responsavel
  });

  // Validação progressiva
  if (produto.notaOuVendaId && produto.notaOuVendaId.startsWith('NC-') || produto.notaOuVendaId?.startsWith('URG-')) {
    try {
      const resultado = await validarAparelhoNota(produto.notaOuVendaId!, produto.imei, { responsavel, observacoes });
      if (resultado.sucesso) {
        const conferencia = verificarConferenciaNota(produto.notaOuVendaId!);
        atualizarPendencia(produto.notaOuVendaId!, {
          valorConferido: resultado.nota?.valorConferido,
          aparelhosConferidos: conferencia.aparelhosConferidos,
          statusConferencia: resultado.conferidoCompleto 
            ? (resultado.discrepancia ? 'Discrepância Detectada' : 'Conferência Completa') 
            : 'Em Conferência',
          responsavel,
          aparelhoInfo: { modelo: `${produto.marca} ${produto.modelo}`, imei: produto.imei, valor: produto.valorCusto }
        });
      }
    } catch (error) {
      console.warn('[Validação Progressiva] Erro ao atualizar nota:', error);
    }
  }

  if (status === 'Análise Realizada – Produto em ótimo estado' || status === 'Produto revisado e deferido') {
    produto.timeline.push({
      id: `TL-${Date.now()}-lib`,
      data: new Date().toISOString(),
      tipo: 'liberacao',
      titulo: `Deferido Estoque – ID ${id} liberado para estoque`,
      descricao: `Produto ${id} aprovado pelo estoque e liberado para venda.`,
      responsavel
    });

    produto.statusGeral = 'Liberado';
    const produtoMigrado = migrarParaEstoque(produto, 'Estoque', responsavel);
    
    // Remove from cache and Supabase
    const index = produtosPendentesCache.findIndex(p => p.id === id);
    if (index !== -1) produtosPendentesCache.splice(index, 1);
    deleteFromSupabase(id);

    return { produto, migrado: true, produtoMigrado };
  } else {
    produto.statusGeral = 'Aguardando Recebimento Assistência';
    
    try {
      await encaminharParaAnaliseGarantia(produto.id, 'Estoque', `${produto.marca} ${produto.modelo} - ${produto.cor} (IMEI: ${produto.imei})`, observacoes);
    } catch (error) {
      console.warn('[salvarParecerEstoque] Erro ao encaminhar para análise:', error);
    }
    
    await syncToSupabase(produto);
    return { produto, migrado: false };
  }
};

export const salvarParecerAssistencia = (
  id: string,
  status: ParecerAssistencia['status'],
  observacoes: string,
  responsavel: string,
  pecas?: { descricao: string; valor: number; fornecedor: string; origemPeca?: 'Fornecedor' | 'Tinha na Assistência' }[]
): { produto: ProdutoPendente | null; migrado: boolean; produtoMigrado?: Produto; retornadoPendentes?: boolean } => {
  const produto = produtosPendentesCache.find(p => p.id === id);
  if (!produto) return { produto: null, migrado: false };

  const parecer: ParecerAssistencia = {
    id: `PA-${Date.now()}`,
    data: new Date().toISOString(),
    status,
    observacoes,
    responsavel,
    pecas
  };

  produto.parecerAssistencia = parecer;

  produto.timeline.push({
    id: `TL-${Date.now()}`,
    data: new Date().toISOString(),
    tipo: 'parecer_assistencia',
    titulo: `Parecer Assistência - ${status} – ${id}`,
    descricao: observacoes,
    responsavel
  });

  if (pecas && pecas.length > 0) {
    let custoTotal = 0;
    pecas.forEach(peca => {
      custoTotal += peca.valor;
      produto.timeline.push({
        id: `TL-${Date.now()}-${Math.random()}`,
        data: new Date().toISOString(),
        tipo: 'despesa',
        titulo: `Despesa - ${peca.descricao}`,
        descricao: `Fornecedor: ${peca.fornecedor} | Origem: ${peca.origemPeca || 'N/A'}`,
        valor: peca.valor,
        responsavel
      });
    });
    produto.custoAssistencia = (produto.custoAssistencia || 0) + custoTotal;
  }

  if (status === 'Validado pela assistência') {
    produto.timeline.push({
      id: `TL-${Date.now()}-ret`,
      data: new Date().toISOString(),
      tipo: 'parecer_assistencia',
      titulo: `Retornado para Revisão Final – ${id}`,
      descricao: `Produto ${id} validado pela assistência. Aguardando revisão final do Estoque para deferimento.`,
      responsavel
    });
    produto.statusGeral = 'Retornado da Assistência';
    syncToSupabase(produto);
    return { produto, migrado: false, retornadoPendentes: true };
  } else if (status === 'Aguardando peça') {
    produto.statusGeral = 'Aguardando Peça';
    syncToSupabase(produto);
    return { produto, migrado: false };
  } else {
    produto.statusGeral = 'Em Análise Assistência';
    syncToSupabase(produto);
    return { produto, migrado: false };
  }
};

export const liberarProdutoPendente = (id: string): boolean => {
  const index = produtosPendentesCache.findIndex(p => p.id === id);
  if (index === -1) return false;
  return true;
};

export const updateProdutoPendente = (id: string, dados: Partial<ProdutoPendente>): ProdutoPendente | null => {
  const index = produtosPendentesCache.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  produtosPendentesCache[index] = {
    ...produtosPendentesCache[index],
    ...dados
  };
  
  if (dados.parecerAssistencia) {
    const timelineEntry = {
      id: `TL-${Date.now()}`,
      data: dados.parecerAssistencia.data || new Date().toISOString(),
      tipo: 'parecer_assistencia' as const,
      titulo: `Parecer Assistência - ${dados.parecerAssistencia.status}`,
      descricao: dados.parecerAssistencia.observacoes || '',
      responsavel: dados.parecerAssistencia.responsavel
    };
    produtosPendentesCache[index].timeline.push(timelineEntry);
  }
  
  syncToSupabase(produtosPendentesCache[index]);
  return produtosPendentesCache[index];
};

export const addProdutoPendente = async (
  produto: Omit<ProdutoPendente, 'id' | 'timeline' | 'custoAssistencia' | 'statusGeral' | 'valorCustoOriginal' | 'contadorEncaminhamentos'>,
  forcarCriacao: boolean = false
): Promise<ProdutoPendente> => {
  if (!forcarCriacao && produto.imei) {
    const jaExiste = produtosPendentesCache.find(p => p.imei === produto.imei);
    if (jaExiste) {
      console.log(`[OS API] Produto com IMEI ${produto.imei} já existe nos pendentes (ID: ${jaExiste.id}), retornando existente.`);
      return jaExiste;
    }
  }
  
  const newId = generateProductId();
  
  const newProduto: ProdutoPendente = {
    ...produto,
    id: newId,
    valorCustoOriginal: produto.valorCusto,
    timeline: [
      {
        id: `TL-${Date.now()}`,
        data: new Date().toISOString(),
        tipo: 'entrada',
        titulo: produto.origemEntrada === 'Base de Troca' ? 'Entrada via Base de Troca' : 'Entrada via Fornecedor',
        descricao: `Produto ${newId} recebido ${produto.origemEntrada === 'Base de Troca' ? 'como base de troca' : 'via nota de compra'} - ${produto.notaOuVendaId || 'N/A'}`,
        responsavel: 'Sistema'
      }
    ],
    custoAssistencia: 0,
    statusGeral: 'Pendente Estoque',
    contadorEncaminhamentos: 0
  };

  produtosPendentesCache.push(newProduto);
  await syncToSupabase(newProduto);
  console.log(`[OS API] Novo produto pendente criado: ${newId} (IMEI: ${produto.imei || 'N/A'}, forcarCriacao: ${forcarCriacao})`);
  return newProduto;
};

// Interface para trade-in vindo da venda
interface TradeInItem {
  id: string;
  produtoId?: string;
  modelo: string;
  descricao: string;
  imei: string;
  valorCompraUsado: number;
  imeiValidado: boolean;
  condicao: 'Novo' | 'Semi-novo';
}

// Migrar trade-ins da venda finalizada para Aparelhos Pendentes - Estoque
export const migrarTradeInsParaPendentes = async (
  tradeIns: TradeInItem[],
  vendaId: string,
  lojaId: string,
  responsavel: string
): Promise<ProdutoPendente[]> => {
  const migrados: ProdutoPendente[] = [];
  
  for (const tradeIn of tradeIns) {
    const jaExiste = produtosPendentesCache.find(p => p.imei === tradeIn.imei);
    if (jaExiste) {
      console.log(`[OS API] Trade-in ${tradeIn.imei} já existe nos pendentes, ignorando duplicata.`);
      continue;
    }
    
    const newId = generateProductId();
    
    const novoProdutoPendente: ProdutoPendente = {
      id: newId,
      imei: tradeIn.imei,
      marca: 'Apple',
      modelo: tradeIn.modelo,
      cor: 'N/A',
      tipo: 'Seminovo',
      condicao: tradeIn.condicao,
      origemEntrada: 'Base de Troca',
      notaOuVendaId: vendaId,
      valorCusto: tradeIn.valorCompraUsado,
      valorCustoOriginal: tradeIn.valorCompraUsado,
      valorOrigem: tradeIn.valorCompraUsado,
      saudeBateria: 80,
      loja: lojaId,
      dataEntrada: new Date().toISOString().split('T')[0],
      timeline: [
        {
          id: `TL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          data: new Date().toISOString(),
          tipo: 'entrada',
          titulo: 'Entrada via Base de Troca - Financeiro Finalizado',
          descricao: `Produto ${newId} migrado automaticamente após finalização financeira da venda ${vendaId}. Descrição: ${tradeIn.descricao}`,
          responsavel
        }
      ],
      custoAssistencia: 0,
      statusGeral: 'Pendente Estoque',
      contadorEncaminhamentos: 0
    };
    
    produtosPendentesCache.push(novoProdutoPendente);
    registerProductId(newId);
    await syncToSupabase(novoProdutoPendente);
    migrados.push(novoProdutoPendente);
    
    console.log(`[OS API] Trade-in ${tradeIn.modelo} (IMEI: ${tradeIn.imei}) migrado para Aparelhos Pendentes - Estoque com ID ${newId}`);
  }
  
  return migrados;
};

// Interface para produtos de nota de entrada
interface ProdutoNota {
  marca: string;
  modelo: string;
  cor: string;
  imei: string;
  tipo: string;
  tipoProduto?: 'Aparelho' | 'Acessório';
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  saudeBateria?: number;
}

// Migrar produtos de nota de entrada para Aparelhos Pendentes - Estoque
export const migrarProdutosNotaParaPendentes = async (
  produtos: ProdutoNota[],
  notaId: string,
  fornecedor: string,
  lojaDestino: string,
  responsavel: string,
  origemEntrada: 'Fornecedor' | 'Base de Troca' | 'Emprestado - Garantia' | 'NEGOCIADO' = 'Fornecedor'
): Promise<ProdutoPendente[]> => {
  const migrados: ProdutoPendente[] = [];
  
  for (const produto of produtos) {
    if (produto.tipoProduto === 'Acessório') {
      console.log(`[OS API] Produto ${produto.modelo} é acessório, ignorando migração para pendentes.`);
      continue;
    }
    
    const jaExiste = produtosPendentesCache.find(p => p.imei === produto.imei);
    if (jaExiste) {
      console.log(`[OS API] Produto ${produto.imei} já existe nos pendentes, ignorando duplicata.`);
      continue;
    }
    
    const newId = generateProductId();
    
    const novoProduto: ProdutoPendente = {
      id: newId,
      imei: produto.imei,
      marca: produto.marca,
      modelo: produto.modelo,
      cor: produto.cor,
      tipo: produto.tipo === 'Novo' ? 'Novo' : 'Seminovo',
      condicao: produto.tipo === 'Novo' ? 'Novo' : 'Semi-novo',
      origemEntrada: origemEntrada,
      notaOuVendaId: notaId,
      valorCusto: produto.valorUnitario,
      valorCustoOriginal: produto.valorUnitario,
      valorOrigem: produto.valorUnitario,
      saudeBateria: produto.saudeBateria || 100,
      loja: lojaDestino,
      dataEntrada: new Date().toISOString().split('T')[0],
      fornecedor: fornecedor,
      timeline: [
        {
          id: `TL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          data: new Date().toISOString(),
          tipo: 'entrada',
          titulo: 'Entrada via Nota de Compra - Financeiro Aprovado',
          descricao: `Produto ${newId} recebido via nota ${notaId} do fornecedor ${fornecedor}`,
          responsavel
        }
      ],
      custoAssistencia: 0,
      statusGeral: 'Pendente Estoque',
      contadorEncaminhamentos: 0
    };
    
    produtosPendentesCache.push(novoProduto);
    registerProductId(newId);
    await syncToSupabase(novoProduto);
    migrados.push(novoProduto);
    
    console.log(`[OS API] Produto ${produto.marca} ${produto.modelo} (IMEI: ${produto.imei}) migrado para Aparelhos Pendentes com ID ${newId}`);
  }
  
  return migrados;
};
