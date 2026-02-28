// Finance API - Supabase
import { supabase } from '@/integrations/supabase/client';
import { getContasFinanceiras, ContaFinanceira, addContaFinanceira, updateContaFinanceira, deleteContaFinanceira } from './cadastrosApi';

// Re-exportar tipos e funções de contas para manter compatibilidade
export type Conta = ContaFinanceira;
export const addConta = addContaFinanceira;
export const updateConta = updateContaFinanceira;
export const deleteConta = deleteContaFinanceira;

export interface Pagamento {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  meioPagamento: 'Pix' | 'Dinheiro' | 'Cartão Crédito' | 'Cartão Débito' | 'Transferência' | 'Boleto' | 'Outro';
  conta: string;
  loja: string;
  status: 'Pendente' | 'Conferido';
}

export const CATEGORIAS_DESPESA = [
  'Aluguel', 'Energia', 'Água', 'Internet/Telefonia', 'Salários', 'Impostos',
  'Marketing', 'Estoque', 'Manutenção', 'Material de Escritório', 'Frete/Logística', 'Outros'
];

export interface Despesa {
  id: string;
  tipo: 'Fixa' | 'Variável';
  data: string;
  descricao: string;
  valor: number;
  competencia: string;
  conta: string;
  observacoes?: string;
  lojaId: string;
  status: 'À vencer' | 'Vencido' | 'Pago' | 'Agendado';
  categoria: string;
  dataVencimento: string;
  dataPagamento: string | null;
  recorrente: boolean;
  periodicidade: 'Mensal' | 'Trimestral' | 'Anual' | null;
  pagoPor: string | null;
  recorrenciaEncerrada?: boolean;
  dataEncerramentoRecorrencia?: string;
  diaVencimento?: number;
  comprovante?: string;
  documento?: string;
}

// ==================== CACHE ====================
let _pagamentosCache: Pagamento[] = [];
let _despesasCache: Despesa[] = [];
let _finCacheLoaded = false;

// DB -> App mapping
const mapPagamentoFromDB = (row: any): Pagamento => ({
  id: row.id,
  data: row.data ? new Date(row.data).toISOString().split('T')[0] : '',
  descricao: row.descricao || '',
  valor: Number(row.valor) || 0,
  meioPagamento: row.meio_pagamento || 'Outro',
  conta: row.conta || '',
  loja: row.loja || '',
  status: row.status || 'Pendente',
});

const mapDespesaFromDB = (row: any): Despesa => ({
  id: row.id,
  tipo: row.tipo || 'Variável',
  data: row.data || '',
  descricao: row.descricao || '',
  valor: Number(row.valor) || 0,
  competencia: row.competencia || '',
  conta: row.conta || '',
  observacoes: row.observacoes || undefined,
  lojaId: row.loja_id || '',
  status: row.status || 'Pendente',
  categoria: row.categoria || '',
  dataVencimento: row.data_vencimento || '',
  dataPagamento: row.data_pagamento || null,
  recorrente: row.recorrente || false,
  periodicidade: row.periodicidade || null,
  pagoPor: row.pago_por || null,
  comprovante: row.comprovante || undefined,
  documento: row.documento || undefined,
});

export const initFinanceCache = async (): Promise<void> => {
  try {
    const [pagRes, despRes] = await Promise.all([
      supabase.from('pagamentos_financeiros').select('*').order('data', { ascending: false }),
      supabase.from('despesas').select('*').order('data_vencimento', { ascending: true }),
    ]);

    if (pagRes.error) throw pagRes.error;
    if (despRes.error) throw despRes.error;

    _pagamentosCache = (pagRes.data || []).map(mapPagamentoFromDB);
    _despesasCache = (despRes.data || []).map(mapDespesaFromDB);
    _finCacheLoaded = true;
    console.log(`[FINANCE] Cache carregado: ${_pagamentosCache.length} pagamentos, ${_despesasCache.length} despesas`);
  } catch (err) {
    console.error('[FINANCE] Erro ao carregar cache:', err);
    _pagamentosCache = [];
    _despesasCache = [];
    _finCacheLoaded = true;
  }
};

// ==================== CONTAS ====================
export const getContas = (): ContaFinanceira[] => {
  return getContasFinanceiras();
};

// ==================== PAGAMENTOS ====================
export const getPagamentos = (): Pagamento[] => {
  const sorted = [..._pagamentosCache].sort((a, b) => {
    if (a.status === 'Pendente' && b.status === 'Conferido') return -1;
    if (a.status === 'Conferido' && b.status === 'Pendente') return 1;
    return new Date(b.data).getTime() - new Date(a.data).getTime();
  });
  return sorted;
};

export const conferirPagamento = async (id: string): Promise<boolean> => {
  const pagamento = _pagamentosCache.find(p => p.id === id);
  if (!pagamento) return false;

  const { error } = await supabase.from('pagamentos_financeiros').update({ status: 'Conferido' }).eq('id', id);
  if (error) { console.error(error); return false; }

  pagamento.status = 'Conferido';
  return true;
};

// Interface para receber dados de venda para criar pagamento
export interface VendaParaPagamento {
  id: string;
  clienteNome: string;
  valorTotal: number;
  lojaVenda: string;
  pagamentos: Array<{
    meio: 'Pix' | 'Dinheiro' | 'Cartão Crédito' | 'Cartão Débito' | 'Transferência' | 'Boleto' | 'Outro';
    valor: number;
    contaId?: string;
  }>;
}

export const criarPagamentosDeVenda = async (venda: VendaParaPagamento): Promise<Pagamento[]> => {
  const createdPagamentos: Pagamento[] = [];
  const contas = getContasFinanceiras();

  for (const pag of venda.pagamentos) {
    let contaNome = pag.contaId ? contas.find(c => c.id === pag.contaId)?.nome : null;
    if (!contaNome) {
      const contasLoja = contas.filter(c => c.lojaVinculada === venda.lojaVenda && c.status === 'Ativo');
      if (contasLoja.length > 0) {
        const contaPropria = contasLoja.find(c => c.statusMaquina === 'Própria');
        contaNome = contaPropria?.nome || contasLoja[0].nome;
      } else {
        contaNome = contas.find(c => c.status === 'Ativo')?.nome || 'Conta não encontrada';
      }
    }

    const { data: row, error } = await supabase.from('pagamentos_financeiros').insert({
      data: new Date().toISOString(),
      descricao: `Venda #${venda.id} - ${venda.clienteNome}`,
      valor: pag.valor,
      meio_pagamento: pag.meio,
      conta: contaNome,
      loja: venda.lojaVenda,
      status: 'Pendente',
    }).select().single();

    if (!error && row) {
      const novoPag = mapPagamentoFromDB(row);
      _pagamentosCache.push(novoPag);
      createdPagamentos.push(novoPag);
    }
  }

  return createdPagamentos;
};

// ==================== DESPESAS ====================
export const getDespesas = (): Despesa[] => {
  return [..._despesasCache];
};

export const addDespesa = async (despesa: Omit<Despesa, 'id'>): Promise<Despesa> => {
  const { data: row, error } = await supabase.from('despesas').insert({
    tipo: despesa.tipo,
    data: despesa.data,
    descricao: despesa.descricao,
    valor: despesa.valor,
    competencia: despesa.competencia,
    conta: despesa.conta,
    observacoes: despesa.observacoes || null,
    loja_id: despesa.lojaId || null,
    status: despesa.status,
    categoria: despesa.categoria,
    data_vencimento: despesa.dataVencimento || null,
    data_pagamento: despesa.dataPagamento || null,
    recorrente: despesa.recorrente || false,
    periodicidade: despesa.periodicidade || null,
    pago_por: despesa.pagoPor || null,
    comprovante: despesa.comprovante || null,
    documento: despesa.documento || null,
  }).select().single();

  if (error || !row) throw error || new Error('Falha ao inserir despesa');

  const newDespesa = mapDespesaFromDB(row);
  _despesasCache.push(newDespesa);
  return newDespesa;
};

export const deleteDespesa = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('despesas').delete().eq('id', id);
  if (error) return false;
  _despesasCache = _despesasCache.filter(d => d.id !== id);
  return true;
};

export const updateDespesa = async (id: string, data: Partial<Despesa>): Promise<boolean> => {
  const index = _despesasCache.findIndex(d => d.id === id);
  if (index === -1) return false;

  const db: any = {};
  if (data.tipo !== undefined) db.tipo = data.tipo;
  if (data.data !== undefined) db.data = data.data;
  if (data.descricao !== undefined) db.descricao = data.descricao;
  if (data.valor !== undefined) db.valor = data.valor;
  if (data.competencia !== undefined) db.competencia = data.competencia;
  if (data.conta !== undefined) db.conta = data.conta;
  if (data.observacoes !== undefined) db.observacoes = data.observacoes;
  if (data.lojaId !== undefined) db.loja_id = data.lojaId;
  if (data.status !== undefined) db.status = data.status;
  if (data.categoria !== undefined) db.categoria = data.categoria;
  if (data.dataVencimento !== undefined) db.data_vencimento = data.dataVencimento;
  if (data.dataPagamento !== undefined) db.data_pagamento = data.dataPagamento;
  if (data.recorrente !== undefined) db.recorrente = data.recorrente;
  if (data.periodicidade !== undefined) db.periodicidade = data.periodicidade;
  if (data.pagoPor !== undefined) db.pago_por = data.pagoPor;
  if (data.comprovante !== undefined) db.comprovante = data.comprovante;
  if (data.documento !== undefined) db.documento = data.documento;

  const { error } = await supabase.from('despesas').update(db).eq('id', id);
  if (error) return false;

  _despesasCache[index] = { ..._despesasCache[index], ...data };
  return true;
};

export const pagarDespesa = async (id: string, usuarioNome: string, comprovante?: string): Promise<boolean> => {
  return updateDespesa(id, {
    status: 'Pago',
    dataPagamento: new Date().toISOString().split('T')[0],
    pagoPor: usuarioNome,
    ...(comprovante ? { comprovante } : {}),
  });
};

export const provisionarProximoPeriodo = async (id: string): Promise<Despesa | null> => {
  const despesa = _despesasCache.find(d => d.id === id);
  if (!despesa || !despesa.recorrente) return null;
  if ((despesa as any).recorrenciaEncerrada) return null;

  const venc = new Date(despesa.dataVencimento + 'T00:00:00');
  if (despesa.periodicidade === 'Mensal') venc.setMonth(venc.getMonth() + 1);
  else if (despesa.periodicidade === 'Trimestral') venc.setMonth(venc.getMonth() + 3);
  else if (despesa.periodicidade === 'Anual') venc.setFullYear(venc.getFullYear() + 1);

  const meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const novaCompetencia = `${meses[venc.getMonth()]}-${venc.getFullYear()}`;

  const jaExiste = _despesasCache.some(d => d.competencia === novaCompetencia && d.descricao === despesa.descricao && d.lojaId === despesa.lojaId);
  if (jaExiste) return null;

  const nova = await addDespesa({
    ...despesa,
    data: new Date().toISOString().split('T')[0],
    competencia: novaCompetencia,
    dataVencimento: venc.toISOString().split('T')[0],
    dataPagamento: null,
    status: 'Agendado',
    pagoPor: null,
    diaVencimento: despesa.diaVencimento || venc.getDate(),
  });

  return nova;
};

export const provisionarRecorrenciaContinua = async (id: string, mesesFuturos: number = 12): Promise<Despesa[]> => {
  const criadas: Despesa[] = [];
  let ultimaId = id;
  for (let i = 0; i < mesesFuturos; i++) {
    const nova = await provisionarProximoPeriodo(ultimaId);
    if (!nova) break;
    criadas.push(nova);
    ultimaId = nova.id;
  }
  return criadas;
};

export const encerrarRecorrencia = async (id: string, dataEncerramento: string): Promise<boolean> => {
  return updateDespesa(id, {
    recorrenciaEncerrada: true,
    dataEncerramentoRecorrencia: dataEncerramento,
  } as any);
};

export const atualizarStatusVencidos = (): number => {
  const hoje = new Date().toISOString().split('T')[0];
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  const meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const competenciaAtual = `${meses[mesAtual]}-${anoAtual}`;
  let count = 0;
  _despesasCache.forEach(d => {
    if (d.status === 'Agendado' && d.competencia === competenciaAtual) {
      d.status = 'À vencer';
      count++;
    }
    if (d.status === 'À vencer' && d.dataVencimento < hoje) {
      d.status = 'Vencido';
      count++;
    }
  });
  return count;
};

export const getLojas = () => [] as string[];

// Auto-init
initFinanceCache().catch(e => console.error('Erro ao inicializar cache finance:', e));
