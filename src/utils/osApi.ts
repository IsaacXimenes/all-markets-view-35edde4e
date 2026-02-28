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

// Dados seed iniciais
const SEED_DATA: ProdutoPendente[] = [
  {
    id: 'PROD-0001',
    imei: '352999888777001',
    marca: 'Apple',
    modelo: 'iPhone 13 Pro',
    cor: 'Grafite',
    tipo: 'Seminovo',
    condicao: 'Semi-novo',
    origemEntrada: 'Fornecedor',
    notaOuVendaId: 'NC-2025-0010',
    valorCusto: 3100.00,
    valorCustoOriginal: 3100.00,
    valorOrigem: 3100.00,
    saudeBateria: 86,
    loja: 'db894e7d',
    dataEntrada: '2025-12-13',
    timeline: [{ id: 'TL-001', data: '2025-12-13T09:30:00', tipo: 'entrada', titulo: 'Entrada via Fornecedor', descricao: 'Produto PROD-0001 recebido da nota NC-2025-0010 - Fornecedor TechSupply Imports', responsavel: 'Lucas Mendes' }],
    custoAssistencia: 0,
    statusGeral: 'Pendente Estoque',
    contadorEncaminhamentos: 0
  },
  {
    id: 'PROD-0002',
    imei: '352999888777002',
    marca: 'Apple',
    modelo: 'iPhone 14',
    cor: 'Azul',
    tipo: 'Seminovo',
    condicao: 'Semi-novo',
    origemEntrada: 'Base de Troca',
    notaOuVendaId: 'VEN-2025-0050',
    valorCusto: 3500.00,
    valorCustoOriginal: 3500.00,
    valorOrigem: 3500.00,
    saudeBateria: 91,
    loja: '3ac7e00c',
    dataEntrada: '2025-12-10',
    timeline: [{ id: 'TL-002', data: '2025-12-10T10:00:00', tipo: 'entrada', titulo: 'Entrada via Base de Troca', descricao: 'Produto PROD-0002 recebido como base de troca na venda VEN-2025-0050', responsavel: 'Roberto Alves' }],
    custoAssistencia: 0,
    statusGeral: 'Pendente Estoque',
    contadorEncaminhamentos: 0
  },
  {
    id: 'PROD-0003',
    imei: '352999888777003',
    marca: 'Apple',
    modelo: 'iPhone 12 Mini',
    cor: 'Branco',
    tipo: 'Seminovo',
    condicao: 'Semi-novo',
    origemEntrada: 'Fornecedor',
    notaOuVendaId: 'NC-2025-0012',
    valorCusto: 1800.00,
    valorCustoOriginal: 1800.00,
    valorOrigem: 1800.00,
    saudeBateria: 72,
    loja: '5b9446d5',
    dataEntrada: '2025-12-08',
    timeline: [{ id: 'TL-004', data: '2025-12-08T08:30:00', tipo: 'entrada', titulo: 'Entrada via Fornecedor', descricao: 'Produto PROD-0003 recebido da nota NC-2025-0012 - Fornecedor FastCell Distribuição', responsavel: 'Ana Paula' }],
    custoAssistencia: 0,
    statusGeral: 'Pendente Estoque',
    contadorEncaminhamentos: 0
  },
  {
    id: 'PROD-0004',
    imei: '352999888777004',
    marca: 'Apple',
    modelo: 'iPhone 11 Pro',
    cor: 'Verde Meia-Noite',
    tipo: 'Seminovo',
    condicao: 'Semi-novo',
    origemEntrada: 'Base de Troca',
    notaOuVendaId: 'VEN-2025-0045',
    valorCusto: 1500.00,
    valorCustoOriginal: 1500.00,
    valorOrigem: 1500.00,
    saudeBateria: 78,
    loja: '0d06e7db',
    dataEntrada: '2025-12-09',
    parecerEstoque: { id: 'PE-003', data: '2025-12-09T11:30:00', status: 'Encaminhado para conferência da Assistência', observacoes: 'Base de troca com bateria degradada, encaminhar para troca de bateria.', responsavel: 'Roberto Alves' },
    timeline: [
      { id: 'TL-006', data: '2025-12-09T10:00:00', tipo: 'entrada', titulo: 'Entrada via Base de Troca', descricao: 'Produto PROD-0004 recebido como base de troca na venda VEN-2025-0045 - Cliente Maria Silva', responsavel: 'Vendedor João' },
      { id: 'TL-007', data: '2025-12-09T11:30:00', tipo: 'parecer_estoque', titulo: 'Parecer Estoque - Encaminhado Assistência', descricao: 'PROD-0004 encaminhado para conferência da Assistência. Bateria degradada.', responsavel: 'Roberto Alves' }
    ],
    custoAssistencia: 0,
    statusGeral: 'Aguardando Recebimento Assistência',
    contadorEncaminhamentos: 1
  },
  {
    id: 'PROD-0005',
    imei: '352999888777005',
    marca: 'Apple',
    modelo: 'iPhone 13',
    cor: 'Rosa',
    tipo: 'Seminovo',
    condicao: 'Semi-novo',
    origemEntrada: 'Fornecedor',
    notaOuVendaId: 'NC-2025-0015',
    valorCusto: 2200.00,
    valorCustoOriginal: 2200.00,
    valorOrigem: 2200.00,
    saudeBateria: 82,
    loja: 'fcc78c1a',
    dataEntrada: '2025-12-11',
    parecerEstoque: { id: 'PE-004', data: '2025-12-11T15:00:00', status: 'Encaminhado para conferência da Assistência', observacoes: 'Tela com pequeno risco, encaminhar para polimento.', responsavel: 'Fernanda Lima' },
    timeline: [
      { id: 'TL-009', data: '2025-12-11T10:30:00', tipo: 'entrada', titulo: 'Entrada via Fornecedor', descricao: 'Produto PROD-0005 recebido da nota NC-2025-0015 - Fornecedor TechnoImports', responsavel: 'Vendedora Ana' },
      { id: 'TL-010', data: '2025-12-11T15:00:00', tipo: 'parecer_estoque', titulo: 'Parecer Estoque - Encaminhado Assistência', descricao: 'PROD-0005 encaminhado para conferência da Assistência. Tela com pequeno risco.', responsavel: 'Fernanda Lima' }
    ],
    custoAssistencia: 0,
    statusGeral: 'Aguardando Recebimento Assistência',
    contadorEncaminhamentos: 1
  },
  {
    id: 'PROD-0006',
    imei: '999888777666555',
    marca: 'Apple',
    modelo: 'iPhone 15 Pro Max',
    cor: 'Titânio Natural',
    tipo: 'Seminovo',
    condicao: 'Semi-novo',
    origemEntrada: 'Base de Troca',
    notaOuVendaId: 'VEN-2025-0060',
    valorCusto: 5500.00,
    valorCustoOriginal: 5500.00,
    valorOrigem: 5500.00,
    saudeBateria: 88,
    loja: 'db894e7d',
    dataEntrada: '2025-01-20',
    parecerEstoque: { id: 'PE-006', data: '2025-01-20T14:00:00', status: 'Encaminhado para conferência da Assistência', observacoes: 'Tela com defeito, encaminhar para reparo.', responsavel: 'Roberto Alves' },
    timeline: [
      { id: 'TL-020', data: '2025-01-20T10:00:00', tipo: 'entrada', titulo: 'Entrada via Base de Troca', descricao: 'Produto PROD-0006 recebido como base de troca na venda VEN-2025-0060', responsavel: 'Vendedor João' },
      { id: 'TL-021', data: '2025-01-20T14:00:00', tipo: 'parecer_estoque', titulo: 'Parecer Estoque - Encaminhado Assistência', descricao: 'Tela com defeito, encaminhar para reparo.', responsavel: 'Roberto Alves' },
      { id: 'TL-022', data: '2025-01-22T16:00:00', tipo: 'parecer_assistencia', titulo: 'Serviço Concluído no Laboratório – OS-2025-0009', descricao: 'Tela OLED substituída com sucesso. Aparelho testado e funcionando normalmente.', responsavel: 'Jeferson Sousa Cabral', valor: 450 }
    ],
    custoAssistencia: 450,
    statusGeral: 'Serviço Concluído - Validar Aparelho',
    contadorEncaminhamentos: 1
  }
];

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

    if (data && data.length > 0) {
      produtosPendentesCache = data.map(mapRowToProduto);
    } else {
      // Seed
      produtosPendentesCache = [...SEED_DATA];
      for (const p of SEED_DATA) {
        await syncToSupabase(p);
      }
    }

    // Register IDs
    produtosPendentesCache.forEach(p => registerProductId(p.id));
    cacheInitialized = true;
    console.log(`[osApi] Cache inicializado com ${produtosPendentesCache.length} produtos pendentes`);
  } catch (err) {
    console.error('[osApi] Erro ao inicializar cache, usando seed:', err);
    produtosPendentesCache = [...SEED_DATA];
    produtosPendentesCache.forEach(p => registerProductId(p.id));
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
