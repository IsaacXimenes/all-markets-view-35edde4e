// API para Retirada de Peças - Supabase
import { supabase } from '@/integrations/supabase/client';
import { Produto, getProdutoById, updateProduto } from './estoqueApi';
import { getProdutoPendenteById, updateProdutoPendente } from './osApi';
import { addPeca } from './pecasApi';
import { useCadastroStore } from '@/store/cadastroStore';
import { addNotification } from './notificationsApi';

// ============= INTERFACES =============

export type RetiradaPecasStatus = 
  | 'Pendente Assistência' 
  | 'Em Desmonte' 
  | 'Concluída' 
  | 'Cancelada';

export interface PecaRetiradaItem {
  id: string;
  marca: string;
  nome: string;
  valorCustoPeca: number;
  quantidade: number;
  valorRecomendado?: number;
}

export interface RetiradaPecasTimeline {
  id: string;
  dataHora: string;
  tipo: 'solicitacao_retirada_pecas' | 'desmonte_iniciado' | 'pecas_geradas' | 'desmonte_finalizado' | 'desmonte_cancelado';
  titulo: string;
  descricao: string;
  responsavel: string;
}

export interface LogAuditoriaRetirada {
  id: string;
  dataHora: string;
  usuario: string;
  detalhes: string;
  tipoAlteracao: 'criacao' | 'inicio_desmonte' | 'adicionar_peca' | 'remover_peca' | 'finalizar' | 'cancelar' | 'edicao';
}

export interface RetiradaPecas {
  id: string;
  aparelhoId: string;
  imeiOriginal: string;
  modeloOriginal: string;
  corOriginal: string;
  valorCustoAparelho: number;
  motivo: string;
  responsavelSolicitacao: string;
  dataSolicitacao: string;
  status: RetiradaPecasStatus;
  tecnicoResponsavel?: string;
  dataInicioDesmonte?: string;
  dataConclusao?: string;
  pecasRetiradas: PecaRetiradaItem[];
  timeline: RetiradaPecasTimeline[];
  lojaId: string;
  logsAuditoria: LogAuditoriaRetirada[];
}

// Cache
let _retiradasCache: RetiradaPecas[] = [];
let _initPromise: Promise<void> | null = null;

const mapRow = (row: any): RetiradaPecas => ({
  id: row.id,
  aparelhoId: row.aparelho_id || '',
  imeiOriginal: row.imei_original || '',
  modeloOriginal: row.modelo_original || '',
  corOriginal: row.cor_original || '',
  valorCustoAparelho: Number(row.valor_custo_aparelho) || 0,
  motivo: row.motivo || '',
  responsavelSolicitacao: row.responsavel_solicitacao || '',
  dataSolicitacao: row.data_solicitacao || '',
  status: row.status || 'Pendente Assistência',
  tecnicoResponsavel: row.tecnico_responsavel,
  dataInicioDesmonte: row.data_inicio_desmonte,
  dataConclusao: row.data_conclusao,
  pecasRetiradas: Array.isArray(row.pecas_retiradas) ? row.pecas_retiradas : [],
  timeline: Array.isArray(row.timeline) ? row.timeline : [],
  lojaId: row.loja_id || '',
  logsAuditoria: Array.isArray(row.logs_auditoria) ? row.logs_auditoria : [],
});

const saveRetirada = async (retirada: RetiradaPecas): Promise<void> => {
  const { error } = await supabase.from('retiradas_pecas').update({
    status: retirada.status,
    tecnico_responsavel: retirada.tecnicoResponsavel,
    data_inicio_desmonte: retirada.dataInicioDesmonte,
    data_conclusao: retirada.dataConclusao,
    pecas_retiradas: retirada.pecasRetiradas as any,
    timeline: retirada.timeline as any,
    logs_auditoria: retirada.logsAuditoria as any,
  }).eq('id', retirada.id);
  if (error) { console.error('Erro ao salvar retirada:', error); throw error; }
};

export const initRetiradasPecasCache = async (): Promise<void> => {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const { data, error } = await supabase.from('retiradas_pecas').select('*');
    if (error) { console.error('Erro ao carregar retiradas_pecas:', error); return; }
    _retiradasCache = (data || []).map(mapRow);
  })();
  return _initPromise;
};

// Leitura síncrona
export const getRetiradasPecas = (): RetiradaPecas[] =>
  [..._retiradasCache].sort((a, b) => new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime());

export const getRetiradasPecasPendentes = (): RetiradaPecas[] =>
  _retiradasCache.filter(r => r.status === 'Pendente Assistência' || r.status === 'Em Desmonte')
    .sort((a, b) => new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime());

export const getRetiradaPecasById = (id: string): RetiradaPecas | null =>
  _retiradasCache.find(r => r.id === id) || null;

export const getRetiradaPecasByAparelhoId = (aparelhoId: string): RetiradaPecas | null =>
  _retiradasCache.find(r => r.aparelhoId === aparelhoId && r.status !== 'Cancelada') || null;

// Solicitar retirada
export const solicitarRetiradaPecas = async (
  aparelhoId: string, motivo: string, responsavel: string
): Promise<{ sucesso: boolean; mensagem: string; retirada?: RetiradaPecas }> => {
  const produto = getProdutoById(aparelhoId);
  const produtoPendente = !produto ? getProdutoPendenteById(aparelhoId) : null;
  if (!produto && !produtoPendente) return { sucesso: false, mensagem: 'Aparelho não encontrado' };

  const retiradaExistente = _retiradasCache.find(
    r => r.aparelhoId === aparelhoId && r.status !== 'Cancelada' && r.status !== 'Concluída'
  );
  if (retiradaExistente) return { sucesso: false, mensagem: 'Já existe uma solicitação de retirada ativa para este aparelho' };

  const agora = new Date().toISOString();
  const imei = produto?.imei || produtoPendente!.imei;
  const modelo = produto?.modelo || produtoPendente!.modelo;
  const cor = produto?.cor || produtoPendente!.cor;
  const valorCusto = produto?.valorCusto || produtoPendente!.valorCusto;
  const loja = produto?.loja || produtoPendente!.loja;

  const timeline: RetiradaPecasTimeline[] = [{
    id: `TL-RET-${Date.now()}`, dataHora: agora, tipo: 'solicitacao_retirada_pecas',
    titulo: 'Solicitação de Retirada de Peças',
    descricao: `Solicitação criada por ${responsavel}. Motivo: ${motivo}`, responsavel
  }];
  const logsAuditoria: LogAuditoriaRetirada[] = [{
    id: `LOG-RET-${Date.now()}`, dataHora: agora, usuario: responsavel,
    detalhes: `Solicitação de retirada criada. Motivo: ${motivo}`, tipoAlteracao: 'criacao'
  }];

  const { data: row, error } = await supabase.from('retiradas_pecas').insert({
    aparelho_id: aparelhoId, imei_original: imei, modelo_original: modelo, cor_original: cor,
    valor_custo_aparelho: valorCusto, motivo, responsavel_solicitacao: responsavel,
    status: 'Pendente Assistência', pecas_retiradas: [] as any, timeline: timeline as any,
    loja_id: loja, logs_auditoria: logsAuditoria as any,
  }).select().single();
  if (error) return { sucesso: false, mensagem: error.message };

  const novaRetirada = mapRow(row);
  _retiradasCache.push(novaRetirada);

  if (produto) {
    await updateProduto(aparelhoId, { statusRetiradaPecas: 'Pendente Assistência', retiradaPecasId: novaRetirada.id });
  } else if (produtoPendente) {
    await updateProdutoPendente(aparelhoId, { statusGeral: 'Retirada de Peças' });
  }

  addNotification({
    type: 'retirada_pecas', title: 'Nova Solicitação de Retirada de Peças',
    description: `Aparelho IMEI ${imei} (${modelo}) aguardando desmonte. Motivo: ${motivo}`, targetUsers: []
  });

  return { sucesso: true, mensagem: 'Solicitação de retirada de peças criada com sucesso', retirada: novaRetirada };
};

// Iniciar desmonte
export const iniciarDesmonte = async (
  retiradaId: string, tecnicoResponsavel: string
): Promise<{ sucesso: boolean; mensagem: string; retirada?: RetiradaPecas }> => {
  const retirada = _retiradasCache.find(r => r.id === retiradaId);
  if (!retirada) return { sucesso: false, mensagem: 'Solicitação não encontrada' };
  if (retirada.status !== 'Pendente Assistência') return { sucesso: false, mensagem: 'Status inválido para iniciar desmonte' };

  const agora = new Date().toISOString();
  retirada.status = 'Em Desmonte';
  retirada.tecnicoResponsavel = tecnicoResponsavel;
  retirada.dataInicioDesmonte = agora;
  retirada.timeline.unshift({ id: `TL-RET-${Date.now()}-inicio`, dataHora: agora, tipo: 'desmonte_iniciado', titulo: 'Desmonte Iniciado', descricao: `Desmonte iniciado pelo técnico ${tecnicoResponsavel}`, responsavel: tecnicoResponsavel });
  retirada.logsAuditoria.push({ id: `LOG-RET-${Date.now()}-inicio`, dataHora: agora, usuario: tecnicoResponsavel, detalhes: 'Desmonte iniciado', tipoAlteracao: 'inicio_desmonte' });

  await saveRetirada(retirada);

  const produto = getProdutoById(retirada.aparelhoId);
  if (produto) await updateProduto(retirada.aparelhoId, { statusRetiradaPecas: 'Em Desmonte' });

  addNotification({ type: 'retirada_pecas', title: 'Desmonte Iniciado', description: `Técnico ${tecnicoResponsavel} iniciou o desmonte do aparelho IMEI ${retirada.imeiOriginal}`, targetUsers: [] });
  return { sucesso: true, mensagem: 'Desmonte iniciado com sucesso', retirada };
};

// Adicionar peça
export const adicionarPecaRetirada = async (
  retiradaId: string, peca: Omit<PecaRetiradaItem, 'id'>
): Promise<{ sucesso: boolean; mensagem: string; retirada?: RetiradaPecas }> => {
  const retirada = _retiradasCache.find(r => r.id === retiradaId);
  if (!retirada) return { sucesso: false, mensagem: 'Solicitação não encontrada' };
  if (retirada.status !== 'Pendente Assistência' && retirada.status !== 'Em Desmonte') return { sucesso: false, mensagem: 'Não é possível adicionar peças neste status' };

  const novaPeca: PecaRetiradaItem = { ...peca, id: `PECA-RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
  retirada.pecasRetiradas.push(novaPeca);
  retirada.logsAuditoria.push({ id: `LOG-RET-${Date.now()}-add`, dataHora: new Date().toISOString(), usuario: 'Usuário Sistema', detalhes: `Peça adicionada: ${peca.nome} (${peca.quantidade}x ${peca.valorCustoPeca.toFixed(2)})`, tipoAlteracao: 'adicionar_peca' });

  await saveRetirada(retirada);
  return { sucesso: true, mensagem: 'Peça adicionada com sucesso', retirada };
};

// Remover peça
export const removerPecaRetirada = async (
  retiradaId: string, pecaId: string
): Promise<{ sucesso: boolean; mensagem: string; retirada?: RetiradaPecas }> => {
  const retirada = _retiradasCache.find(r => r.id === retiradaId);
  if (!retirada) return { sucesso: false, mensagem: 'Solicitação não encontrada' };
  if (retirada.status !== 'Pendente Assistência' && retirada.status !== 'Em Desmonte') return { sucesso: false, mensagem: 'Não é possível remover peças neste status' };

  const pecaRemovida = retirada.pecasRetiradas.find(p => p.id === pecaId);
  retirada.pecasRetiradas = retirada.pecasRetiradas.filter(p => p.id !== pecaId);
  retirada.logsAuditoria.push({ id: `LOG-RET-${Date.now()}-rem`, dataHora: new Date().toISOString(), usuario: 'Usuário Sistema', detalhes: `Peça removida: ${pecaRemovida?.nome || pecaId}`, tipoAlteracao: 'remover_peca' });

  await saveRetirada(retirada);
  return { sucesso: true, mensagem: 'Peça removida com sucesso', retirada };
};

// Calcular soma das peças
export const calcularSomaPecas = (retiradaId: string): number => {
  const retirada = _retiradasCache.find(r => r.id === retiradaId);
  if (!retirada) return 0;
  return retirada.pecasRetiradas.reduce((acc, peca) => acc + (peca.valorCustoPeca * peca.quantidade), 0);
};

// Validar custo
export const validarCustoRetirada = (retiradaId: string): { valido: boolean; somaPecas: number; custoAparelho: number; diferenca: number } => {
  const retirada = _retiradasCache.find(r => r.id === retiradaId);
  if (!retirada) return { valido: false, somaPecas: 0, custoAparelho: 0, diferenca: 0 };
  const somaPecas = calcularSomaPecas(retiradaId);
  return { valido: somaPecas >= retirada.valorCustoAparelho, somaPecas, custoAparelho: retirada.valorCustoAparelho, diferenca: somaPecas - retirada.valorCustoAparelho };
};

// Finalizar desmonte
export const finalizarDesmonte = async (
  retiradaId: string, tecnicoResponsavel: string, lojaDestinoId: string
): Promise<{ sucesso: boolean; mensagem: string; retirada?: RetiradaPecas; pecasGeradas?: number }> => {
  const retirada = _retiradasCache.find(r => r.id === retiradaId);
  if (!retirada) return { sucesso: false, mensagem: 'Solicitação não encontrada' };
  if (retirada.status !== 'Em Desmonte') return { sucesso: false, mensagem: 'O desmonte precisa ser iniciado primeiro' };
  if (retirada.pecasRetiradas.length === 0) return { sucesso: false, mensagem: 'Adicione pelo menos uma peça antes de finalizar' };

  const validacao = validarCustoRetirada(retiradaId);
  const agora = new Date().toISOString();

  let pecasGeradas = 0;
  for (const peca of retirada.pecasRetiradas) {
    await addPeca({ descricao: peca.nome, lojaId: lojaDestinoId, modelo: retirada.modeloOriginal, valorCusto: peca.valorCustoPeca, valorRecomendado: peca.valorRecomendado || peca.valorCustoPeca * 1.5, quantidade: peca.quantidade, dataEntrada: agora, origem: 'Retirada de Peça', status: 'Disponível' });
    pecasGeradas += peca.quantidade;
  }

  retirada.timeline.unshift({ id: `TL-RET-${Date.now()}-pecas`, dataHora: agora, tipo: 'pecas_geradas', titulo: 'Peças Geradas', descricao: `${pecasGeradas} peça(s) adicionada(s) ao estoque da assistência`, responsavel: tecnicoResponsavel });
  retirada.status = 'Concluída';
  retirada.dataConclusao = agora;
  retirada.logsAuditoria.push({ id: `LOG-RET-${Date.now()}-final`, dataHora: agora, usuario: tecnicoResponsavel, detalhes: `Desmonte finalizado. ${retirada.pecasRetiradas.length} peça(s) gerada(s). Valor total: R$ ${validacao.somaPecas.toFixed(2)}`, tipoAlteracao: 'finalizar' });
  retirada.timeline.unshift({ id: `TL-RET-${Date.now()}-final`, dataHora: agora, tipo: 'desmonte_finalizado', titulo: 'Desmonte Finalizado', descricao: `Desmonte concluído. ${pecasGeradas} peça(s) gerada(s) no valor total de R$ ${validacao.somaPecas.toFixed(2)}`, responsavel: tecnicoResponsavel });

  await saveRetirada(retirada);

  const produto = getProdutoById(retirada.aparelhoId);
  if (produto) await updateProduto(retirada.aparelhoId, { statusNota: 'Concluído', quantidade: 0, statusRetiradaPecas: 'Concluída' });

  addNotification({ type: 'retirada_pecas', title: 'Desmonte Finalizado', description: `Aparelho IMEI ${retirada.imeiOriginal} desmontado. ${pecasGeradas} peça(s) gerada(s) e adicionadas ao estoque da assistência.`, targetUsers: [] });
  return { sucesso: true, mensagem: 'Desmonte finalizado com sucesso', retirada, pecasGeradas };
};

// Cancelar
export const cancelarRetiradaPecas = async (
  retiradaId: string, responsavel: string, motivo: string
): Promise<{ sucesso: boolean; mensagem: string; retirada?: RetiradaPecas }> => {
  const retirada = _retiradasCache.find(r => r.id === retiradaId);
  if (!retirada) return { sucesso: false, mensagem: 'Solicitação não encontrada' };
  if (retirada.status === 'Concluída') return { sucesso: false, mensagem: 'Não é possível cancelar uma retirada já concluída' };
  if (retirada.status === 'Cancelada') return { sucesso: false, mensagem: 'Esta retirada já foi cancelada' };

  const agora = new Date().toISOString();
  retirada.status = 'Cancelada';
  retirada.logsAuditoria.push({ id: `LOG-RET-${Date.now()}-cancel`, dataHora: agora, usuario: responsavel, detalhes: `Retirada cancelada. Motivo: ${motivo}`, tipoAlteracao: 'cancelar' });
  retirada.timeline.unshift({ id: `TL-RET-${Date.now()}-cancel`, dataHora: agora, tipo: 'desmonte_cancelado', titulo: 'Retirada Cancelada', descricao: `Cancelada por ${responsavel}. Motivo: ${motivo}`, responsavel });

  await saveRetirada(retirada);

  const produto = getProdutoById(retirada.aparelhoId);
  if (produto) await updateProduto(retirada.aparelhoId, { statusNota: 'Concluído', statusRetiradaPecas: null, retiradaPecasId: undefined });

  return { sucesso: true, mensagem: 'Retirada cancelada com sucesso. Aparelho reativado.', retirada };
};

// Verificar disponibilidade
export const verificarDisponibilidadeRetirada = (aparelhoId: string): { disponivel: boolean; motivo?: string } => {
  const produto = getProdutoById(aparelhoId);
  if (produto) {
    if (produto.bloqueadoEmVendaId) return { disponivel: false, motivo: 'Aparelho está bloqueado em uma venda' };
    if (produto.statusMovimentacao === 'Em movimentação') return { disponivel: false, motivo: 'Aparelho está em movimentação' };
    const retiradaAtiva = _retiradasCache.find(r => r.aparelhoId === aparelhoId && r.status !== 'Cancelada' && r.status !== 'Concluída');
    if (retiradaAtiva) return { disponivel: false, motivo: 'Já existe uma solicitação de retirada ativa para este aparelho' };
    if (produto.quantidade <= 0) return { disponivel: false, motivo: 'Aparelho sem quantidade disponível' };
    return { disponivel: true };
  }
  const produtoPendente = getProdutoPendenteById(aparelhoId);
  if (produtoPendente) {
    const retiradaAtiva = _retiradasCache.find(r => r.aparelhoId === aparelhoId && r.status !== 'Cancelada' && r.status !== 'Concluída');
    if (retiradaAtiva) return { disponivel: false, motivo: 'Já existe uma solicitação de retirada ativa para este aparelho' };
    return { disponivel: true };
  }
  return { disponivel: false, motivo: 'Aparelho não encontrado' };
};

// Estatísticas
export const getEstatisticasRetiradas = (): { pendentes: number; emDesmonte: number; concluidas: number; canceladas: number; valorTotalPecasGeradas: number } => {
  return {
    pendentes: _retiradasCache.filter(r => r.status === 'Pendente Assistência').length,
    emDesmonte: _retiradasCache.filter(r => r.status === 'Em Desmonte').length,
    concluidas: _retiradasCache.filter(r => r.status === 'Concluída').length,
    canceladas: _retiradasCache.filter(r => r.status === 'Cancelada').length,
    valorTotalPecasGeradas: _retiradasCache.filter(r => r.status === 'Concluída').reduce((acc, r) => acc + calcularSomaPecas(r.id), 0),
  };
};
