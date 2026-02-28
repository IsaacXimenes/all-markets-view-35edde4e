// Assistência API - Supabase
import { supabase } from '@/integrations/supabase/client';
import { getClientes, getLojas, getColaboradoresByPermissao, getFornecedores, addCliente, Cliente } from './cadastrosApi';
import { getPecaById, getPecaByDescricao, updatePeca } from './pecasApi';
import { formatCurrency } from './formatUtils';
import { marcarSolicitacoesOSCancelada } from './solicitacaoPecasApi';

export interface PecaServico {
  id: string;
  peca: string;
  pecaEstoqueId?: string;
  imei?: string;
  valor: number;
  percentual: number;
  valorTotal: number;
  servicoTerceirizado: boolean;
  descricaoTerceirizado?: string;
  fornecedorId?: string;
  unidadeServico: string;
  pecaNoEstoque: boolean;
  pecaDeFornecedor: boolean;
  statusAprovacao?: 'Pendente' | 'Aguardando Aprovação' | 'Aprovado' | 'Rejeitado' | 'Pagamento - Financeiro' | 'Pagamento Finalizado' | 'Aguardando Chegada' | 'Em Estoque' | 'Utilizado' | 'Não Utilizado';
  motivoRejeicao?: string;
  contaOrigemPagamento?: string;
  dataPagamento?: string;
  dataRecebimento?: string;
  origemServico?: 'Balcao' | 'Garantia' | 'Estoque';
  origemPeca?: 'Consignado' | 'Estoque Thiago' | 'Retirada de Pecas' | 'Fornecedor';
  valorCustoReal?: number;
}

export interface Pagamento {
  id: string;
  meio: string;
  valor: number;
  parcelas?: number;
  comprovante?: string;
  comprovanteNome?: string;
  contaDestino?: string;
}

export interface TimelineOS {
  data: string;
  fotos?: string[];
  tipo: 'registro' | 'status' | 'peca' | 'pagamento' | 'aprovacao' | 'rejeicao' | 'financeiro' | 'baixa_estoque' | 'foto' | 'conclusao_servico' | 'validacao_financeiro';
  descricao: string;
  responsavel: string;
  motivo?: string;
}

export interface OrdemServico {
  id: string;
  dataHora: string;
  clienteId: string;
  setor: 'GARANTIA' | 'ASSISTÊNCIA' | 'TROCA';
  tecnicoId: string;
  lojaId: string;
  status: 'Em Aberto' | 'Serviço concluído' | 'Em serviço' | 'Aguardando Peça' | 'Solicitação Enviada' | 'Em Análise' | 'Peça Recebida' | 'Aguardando Aprovação do Gestor' | 'Rejeitado pelo Gestor' | 'Pagamento - Financeiro' | 'Pagamento Finalizado' | 'Pagamento Concluído' | 'Aguardando Chegada da Peça' | 'Peça em Estoque / Aguardando Reparo' | 'Aguardando Recebimento' | 'Em Execução' | 'Aguardando Pagamento' | 'Aguardando Conferência' | 'Concluído' | 'Finalizado' | 'Aguardando Análise' | 'Solicitação de Peça' | 'Pendente de Pagamento' | 'Aguardando Financeiro' | 'Liquidado' | 'Recusada pelo Técnico' | 'Conferência do Gestor' | 'Serviço Concluído - Validar Aparelho' | 'Retrabalho - Recusado pelo Estoque' | 'Cancelada';
  pecas: PecaServico[];
  pagamentos: Pagamento[];
  descricao: string;
  timeline: TimelineOS[];
  valorTotal: number;
  custoTotal: number;
  origemOS?: 'Venda' | 'Garantia' | 'Estoque' | 'Balcão';
  vendaId?: string;
  garantiaId?: string;
  produtoId?: string;
  valorProdutoOrigem?: number;
  modeloAparelho?: string;
  imeiAparelho?: string;
  idVendaAntiga?: string;
  proximaAtuacao?: 'Técnico: Avaliar/Executar' | 'Vendedor: Registrar Pagamento' | 'Financeiro: Conferir Lançamento' | 'Gestor: Aprovar Peça' | 'Logística: Enviar Peça' | 'Concluído' | 'Técnico' | 'Gestor (Suprimentos)' | 'Técnico (Recebimento)' | 'Gestor/Vendedor' | 'Gestor (Conferência)' | 'Financeiro' | 'Atendente' | 'Gestor' | 'Gestor (Estoque)' | '-';
  valorCustoTecnico?: number;
  valorVendaTecnico?: number;
  valorServico?: number;
  fotosEntrada?: string[];
  resumoConclusao?: string;
  observacaoOrigem?: string;
  recusadaTecnico?: boolean;
  motivoRecusaTecnico?: string;
  conclusaoServico?: string;
  loteRevisaoId?: string;
  loteRevisaoItemId?: string;
  itensLoteRevisao?: {
    itemId: string;
    marca: string;
    modelo: string;
    imei?: string;
    motivoAssistencia: string;
    parecerTecnico?: string;
    custoReparo: number;
    statusReparo: 'Pendente' | 'Em Andamento' | 'Concluido';
  }[];
  cronometro?: CronometroOS;
  evidencias?: { nome: string; tipo: string; dataAnexo: string; usuario: string }[];
}

export interface CronometroOS {
  status: 'parado' | 'em_andamento' | 'pausado' | 'finalizado';
  iniciadoEm?: string;
  pausas: { inicio: string; fim?: string }[];
  finalizadoEm?: string;
  tempoLiquidoMs: number;
  editadoPor?: string;
  tempoManualMs?: number;
}

// ==================== CACHE ====================
let _osCache: OrdemServico[] = [];
let _osCacheInitialized = false;

// ==================== MAPPERS ====================

const mapPecaFromDB = (row: any): PecaServico => ({
  id: row.id,
  peca: row.peca || '',
  pecaEstoqueId: row.peca_estoque_id || undefined,
  imei: row.imei || undefined,
  valor: Number(row.valor) || 0,
  percentual: Number(row.percentual) || 0,
  valorTotal: Number(row.valor_total) || 0,
  servicoTerceirizado: row.servico_terceirizado || false,
  descricaoTerceirizado: row.descricao_terceirizado || undefined,
  fornecedorId: row.fornecedor_id || undefined,
  unidadeServico: row.unidade_servico || '',
  pecaNoEstoque: row.peca_no_estoque || false,
  pecaDeFornecedor: row.peca_de_fornecedor || false,
  statusAprovacao: row.status_aprovacao || undefined,
  motivoRejeicao: row.motivo_rejeicao || undefined,
  contaOrigemPagamento: row.conta_origem_pagamento || undefined,
  dataPagamento: row.data_pagamento || undefined,
  dataRecebimento: row.data_recebimento || undefined,
  origemServico: row.origem_servico || undefined,
  origemPeca: row.origem_peca || undefined,
  valorCustoReal: row.valor_custo_real != null ? Number(row.valor_custo_real) : undefined,
});

const mapPagamentoFromDB = (row: any): Pagamento => ({
  id: row.id,
  meio: row.meio || '',
  valor: Number(row.valor) || 0,
  parcelas: row.parcelas || undefined,
  comprovante: row.comprovante || undefined,
  comprovanteNome: row.comprovante_nome || undefined,
  contaDestino: row.conta_destino || undefined,
});

const mapOSFromDB = (row: any, pecas: PecaServico[], pagamentos: Pagamento[]): OrdemServico => ({
  id: row.id,
  dataHora: row.created_at || new Date().toISOString(),
  clienteId: row.cliente_nome || '', // OS uses cliente_nome directly
  setor: (row.setor || 'ASSISTÊNCIA') as any,
  tecnicoId: row.tecnico_id || '',
  lojaId: row.loja_id || '',
  status: row.status || 'Em Aberto',
  pecas,
  pagamentos,
  descricao: row.descricao || row.problema_relatado || '',
  timeline: Array.isArray(row.timeline) ? row.timeline : [],
  valorTotal: Number(row.valor_total) || 0,
  custoTotal: Number(row.custo_total) || 0,
  origemOS: row.origem_os || undefined,
  vendaId: row.venda_id || undefined,
  garantiaId: row.garantia_id || undefined,
  produtoId: row.produto_id || undefined,
  valorProdutoOrigem: row.valor_produto_origem != null ? Number(row.valor_produto_origem) : undefined,
  modeloAparelho: row.modelo_aparelho || row.aparelho_modelo || undefined,
  imeiAparelho: row.imei_aparelho || row.imei || undefined,
  proximaAtuacao: row.proxima_atuacao || undefined,
  valorCustoTecnico: row.valor_custo_tecnico != null ? Number(row.valor_custo_tecnico) : undefined,
  valorVendaTecnico: row.valor_venda_tecnico != null ? Number(row.valor_venda_tecnico) : undefined,
  valorServico: row.valor_servico != null ? Number(row.valor_servico) : undefined,
  fotosEntrada: Array.isArray(row.fotos_entrada) ? row.fotos_entrada : [],
  resumoConclusao: row.resumo_conclusao || undefined,
  observacaoOrigem: row.observacao_origem || undefined,
  recusadaTecnico: row.recusada_tecnico || false,
  motivoRecusaTecnico: row.motivo_recusa_tecnico || undefined,
  conclusaoServico: row.conclusao_servico || undefined,
  cronometro: row.cronometro || undefined,
  evidencias: Array.isArray(row.evidencias) ? row.evidencias : [],
});

// ==================== INIT CACHE ====================

export const initAssistenciaCache = async (): Promise<void> => {
  try {
    const { data: osRows, error: osError } = await supabase
      .from('ordens_servico')
      .select('*')
      .order('created_at', { ascending: false });

    if (osError) throw osError;

    if (!osRows || osRows.length === 0) {
      _osCache = [];
      _osCacheInitialized = true;
      return;
    }

    const osIds = osRows.map(r => r.id);

    // Fetch pecas and pagamentos in parallel
    const [pecasResult, pagResult] = await Promise.all([
      supabase.from('os_pecas').select('*').in('os_id', osIds),
      supabase.from('os_pagamentos').select('*').in('os_id', osIds),
    ]);

    const pecasByOS = new Map<string, PecaServico[]>();
    (pecasResult.data || []).forEach(row => {
      const osId = row.os_id;
      if (!osId) return;
      if (!pecasByOS.has(osId)) pecasByOS.set(osId, []);
      pecasByOS.get(osId)!.push(mapPecaFromDB(row));
    });

    const pagsByOS = new Map<string, Pagamento[]>();
    (pagResult.data || []).forEach(row => {
      const osId = row.os_id;
      if (!osId) return;
      if (!pagsByOS.has(osId)) pagsByOS.set(osId, []);
      pagsByOS.get(osId)!.push(mapPagamentoFromDB(row));
    });

    _osCache = osRows.map(row => mapOSFromDB(
      row,
      pecasByOS.get(row.id) || [],
      pagsByOS.get(row.id) || []
    ));

    _osCacheInitialized = true;
    console.log(`[ASSISTÊNCIA] Cache inicializado: ${_osCache.length} OS`);
  } catch (error) {
    console.error('[ASSISTÊNCIA] Erro ao inicializar cache:', error);
    _osCache = [];
    _osCacheInitialized = true;
  }
};

// Auto-init
initAssistenciaCache();

// ==================== ID MANAGEMENT ====================

export const isOSIdRegistered = (id: string): boolean => {
  return _osCache.some(os => os.id === id);
};

export const getNextOSNumber = (): { numero: number; id: string } => {
  // Generate UUID-based ID - the DB will handle it
  const id = crypto.randomUUID();
  return { numero: _osCache.length + 1, id };
};

// ==================== CRUD ====================

export const getOrdensServico = () => [..._osCache];

export const getOrdemServicoById = (id: string) => _osCache.find(os => os.id === id);

export const addOrdemServico = async (os: Omit<OrdemServico, 'id'>): Promise<OrdemServico> => {
  const { data, error } = await supabase
    .from('ordens_servico')
    .insert({
      cliente_nome: os.clienteId, // OS stores clienteId as cliente_nome
      setor: os.setor,
      tecnico_id: os.tecnicoId || null,
      loja_id: os.lojaId || null,
      status: os.status,
      descricao: os.descricao,
      problema_relatado: os.descricao,
      timeline: os.timeline as any,
      valor_total: os.valorTotal,
      custo_total: os.custoTotal,
      origem_os: os.origemOS || null,
      venda_id: os.vendaId || null,
      garantia_id: os.garantiaId || null,
      produto_id: os.produtoId || null,
      valor_produto_origem: os.valorProdutoOrigem || null,
      modelo_aparelho: os.modeloAparelho || null,
      aparelho_modelo: os.modeloAparelho || null,
      imei_aparelho: os.imeiAparelho || null,
      imei: os.imeiAparelho || null,
      proxima_atuacao: os.proximaAtuacao || null,
      valor_custo_tecnico: os.valorCustoTecnico || 0,
      valor_venda_tecnico: os.valorVendaTecnico || 0,
      valor_servico: os.valorServico || 0,
      fotos_entrada: os.fotosEntrada as any || [],
      resumo_conclusao: os.resumoConclusao || null,
      observacao_origem: os.observacaoOrigem || null,
      recusada_tecnico: os.recusadaTecnico || false,
      motivo_recusa_tecnico: os.motivoRecusaTecnico || null,
      conclusao_servico: os.conclusaoServico || null,
      cronometro: os.cronometro as any || null,
      evidencias: os.evidencias as any || [],
    })
    .select()
    .single();

  if (error) throw error;

  // Insert pecas
  if (os.pecas.length > 0) {
    await supabase.from('os_pecas').insert(
      os.pecas.map(p => ({
        os_id: data.id,
        peca: p.peca,
        peca_estoque_id: p.pecaEstoqueId || null,
        imei: p.imei || null,
        valor: p.valor,
        percentual: p.percentual,
        valor_total: p.valorTotal,
        servico_terceirizado: p.servicoTerceirizado,
        descricao_terceirizado: p.descricaoTerceirizado || null,
        fornecedor_id: p.fornecedorId || null,
        unidade_servico: p.unidadeServico,
        peca_no_estoque: p.pecaNoEstoque,
        peca_de_fornecedor: p.pecaDeFornecedor,
        status_aprovacao: p.statusAprovacao || 'Pendente',
        origem_servico: p.origemServico || null,
        origem_peca: p.origemPeca || null,
        valor_custo_real: p.valorCustoReal || 0,
      }))
    );
  }

  // Insert pagamentos
  if (os.pagamentos.length > 0) {
    await supabase.from('os_pagamentos').insert(
      os.pagamentos.map(p => ({
        os_id: data.id,
        meio: p.meio,
        valor: p.valor,
        parcelas: p.parcelas || 1,
        comprovante: p.comprovante || null,
        comprovante_nome: p.comprovanteNome || null,
        conta_destino: p.contaDestino || null,
      }))
    );
  }

  const newOS: OrdemServico = { ...os, id: data.id };
  _osCache.unshift(newOS);
  return newOS;
};

// Função para reduzir estoque de peças quando OS é concluída
const reduzirEstoquePecas = async (pecas: PecaServico[]): Promise<void> => {
  for (const peca of pecas) {
    if (peca.pecaNoEstoque && !peca.servicoTerceirizado) {
      let pecaEstoque = getPecaById(peca.id);
      if (!pecaEstoque) {
        pecaEstoque = getPecaByDescricao(peca.peca);
      }
      if (pecaEstoque && pecaEstoque.quantidade > 0) {
        await updatePeca(pecaEstoque.id, {
          quantidade: pecaEstoque.quantidade - 1,
          status: pecaEstoque.quantidade - 1 === 0 ? 'Utilizada' : pecaEstoque.status
        });
        console.log(`[ASSISTÊNCIA] Peça ${peca.peca} reduzida do estoque`);
      }
    }
  }
};

export const updateOrdemServico = async (id: string, updates: Partial<OrdemServico>): Promise<OrdemServico | null> => {
  const index = _osCache.findIndex(os => os.id === id);
  if (index === -1) return null;

  const osAnterior = _osCache[index];

  // Build DB update
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
  if (updates.timeline !== undefined) dbUpdates.timeline = updates.timeline;
  if (updates.valorTotal !== undefined) dbUpdates.valor_total = updates.valorTotal;
  if (updates.custoTotal !== undefined) dbUpdates.custo_total = updates.custoTotal;
  if (updates.proximaAtuacao !== undefined) dbUpdates.proxima_atuacao = updates.proximaAtuacao;
  if (updates.valorCustoTecnico !== undefined) dbUpdates.valor_custo_tecnico = updates.valorCustoTecnico;
  if (updates.valorVendaTecnico !== undefined) dbUpdates.valor_venda_tecnico = updates.valorVendaTecnico;
  if (updates.valorServico !== undefined) dbUpdates.valor_servico = updates.valorServico;
  if (updates.resumoConclusao !== undefined) dbUpdates.resumo_conclusao = updates.resumoConclusao;
  if (updates.observacaoOrigem !== undefined) dbUpdates.observacao_origem = updates.observacaoOrigem;
  if (updates.recusadaTecnico !== undefined) dbUpdates.recusada_tecnico = updates.recusadaTecnico;
  if (updates.motivoRecusaTecnico !== undefined) dbUpdates.motivo_recusa_tecnico = updates.motivoRecusaTecnico;
  if (updates.conclusaoServico !== undefined) dbUpdates.conclusao_servico = updates.conclusaoServico;
  if (updates.tecnicoId !== undefined) dbUpdates.tecnico_id = updates.tecnicoId;
  if (updates.lojaId !== undefined) dbUpdates.loja_id = updates.lojaId;
  if (updates.setor !== undefined) dbUpdates.setor = updates.setor;
  if (updates.fotosEntrada !== undefined) dbUpdates.fotos_entrada = updates.fotosEntrada;
  if (updates.cronometro !== undefined) dbUpdates.cronometro = updates.cronometro;
  if (updates.evidencias !== undefined) dbUpdates.evidencias = updates.evidencias;
  if (updates.modeloAparelho !== undefined) { dbUpdates.modelo_aparelho = updates.modeloAparelho; dbUpdates.aparelho_modelo = updates.modeloAparelho; }
  if (updates.imeiAparelho !== undefined) { dbUpdates.imei_aparelho = updates.imeiAparelho; dbUpdates.imei = updates.imeiAparelho; }
  if (updates.origemOS !== undefined) dbUpdates.origem_os = updates.origemOS;
  if (updates.vendaId !== undefined) dbUpdates.venda_id = updates.vendaId;
  if (updates.garantiaId !== undefined) dbUpdates.garantia_id = updates.garantiaId;
  if (updates.produtoId !== undefined) dbUpdates.produto_id = updates.produtoId;
  if (updates.valorProdutoOrigem !== undefined) dbUpdates.valor_produto_origem = updates.valorProdutoOrigem;
  if ((updates as any).parecer !== undefined) dbUpdates.parecer_tecnico = (updates as any).parecer;

  if (Object.keys(dbUpdates).length > 0) {
    const { error } = await supabase.from('ordens_servico').update(dbUpdates).eq('id', id);
    if (error) { console.error('[ASSISTÊNCIA] Erro ao atualizar OS:', error); throw error; }
  }

  // Update pecas if provided
  if (updates.pecas) {
    await supabase.from('os_pecas').delete().eq('os_id', id);
    if (updates.pecas.length > 0) {
      await supabase.from('os_pecas').insert(
        updates.pecas.map(p => ({
          id: p.id.startsWith('PC-') ? undefined : p.id, // let DB generate if legacy ID
          os_id: id,
          peca: p.peca,
          peca_estoque_id: p.pecaEstoqueId || null,
          imei: p.imei || null,
          valor: p.valor,
          percentual: p.percentual,
          valor_total: p.valorTotal,
          servico_terceirizado: p.servicoTerceirizado,
          descricao_terceirizado: p.descricaoTerceirizado || null,
          fornecedor_id: p.fornecedorId || null,
          unidade_servico: p.unidadeServico,
          peca_no_estoque: p.pecaNoEstoque,
          peca_de_fornecedor: p.pecaDeFornecedor,
          status_aprovacao: p.statusAprovacao || 'Pendente',
          motivo_rejeicao: p.motivoRejeicao || null,
          conta_origem_pagamento: p.contaOrigemPagamento || null,
          data_pagamento: p.dataPagamento || null,
          data_recebimento: p.dataRecebimento || null,
          origem_servico: p.origemServico || null,
          origem_peca: p.origemPeca || null,
          valor_custo_real: p.valorCustoReal || 0,
        }))
      );
    }
  }

  // Update pagamentos if provided
  if (updates.pagamentos) {
    await supabase.from('os_pagamentos').delete().eq('os_id', id);
    if (updates.pagamentos.length > 0) {
      await supabase.from('os_pagamentos').insert(
        updates.pagamentos.map(p => ({
          id: p.id.startsWith('PAG-') ? undefined : p.id,
          os_id: id,
          meio: p.meio,
          valor: p.valor,
          parcelas: p.parcelas || 1,
          comprovante: p.comprovante || null,
          comprovante_nome: p.comprovanteNome || null,
          conta_destino: p.contaDestino || null,
        }))
      );
    }
  }

  // Update cache
  _osCache[index] = { ..._osCache[index], ...updates };

  // Side effects
  if (updates.status === 'Serviço concluído' && osAnterior.status !== 'Serviço concluído') {
    await reduzirEstoquePecas(_osCache[index].pecas);
    console.log(`[ASSISTÊNCIA] OS ${id} concluída - peças reduzidas do estoque`);
  }

  if (updates.status === 'Cancelada' && osAnterior.status !== 'Cancelada') {
    marcarSolicitacoesOSCancelada(id);
    console.log(`[ASSISTÊNCIA] OS ${id} cancelada`);
  }

  return _osCache[index];
};

// ==================== QUERIES ====================

export interface HistoricoOSCliente {
  osId: string;
  data: string;
  status: string;
  valorTotal: number;
  setor: string;
}

export const getHistoricoOSCliente = (clienteId: string): HistoricoOSCliente[] => {
  return _osCache
    .filter(os => os.clienteId === clienteId)
    .map(os => ({
      osId: os.id,
      data: os.dataHora,
      status: os.status,
      valorTotal: os.valorTotal,
      setor: os.setor
    }))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 3);
};

export const verificarIMEIEmOSAtiva = (imei: string): OrdemServico | null => {
  return _osCache.find(os =>
    os.status !== 'Serviço concluído' && os.status !== 'Finalizado' &&
    os.pecas.some(p => p.imei === imei)
  ) || null;
};

export const calcularSLADias = (dataHora: string): number => {
  const dataOS = new Date(dataHora);
  const hoje = new Date();
  const diffTime = Math.abs(hoje.getTime() - dataOS.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export { formatCurrency } from '@/utils/formatUtils';

export const exportOSToCSV = (data: OrdemServico[], filename: string) => {
  const clientes = getClientes();
  const lojas = getLojas();
  const tecnicos = getColaboradoresByPermissao('Assistência');

  const csvData = data.map(os => {
    const cliente = clientes.find(c => c.id === os.clienteId);
    const loja = lojas.find(l => l.id === os.lojaId);
    const tecnico = tecnicos.find(t => t.id === os.tecnicoId);

    return {
      'Nº OS': os.id,
      'Data/Hora': new Date(os.dataHora).toLocaleString('pt-BR'),
      'Cliente': cliente?.nome || '-',
      'Setor': os.setor,
      'Técnico': tecnico?.nome || '-',
      'Loja': loja?.nome || '-',
      'Status': os.status,
      'SLA (dias)': calcularSLADias(os.dataHora),
      'Valor Total': formatCurrency(os.valorTotal),
      'Descrição': os.descricao
    };
  });

  const headers = Object.keys(csvData[0] || {});
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
