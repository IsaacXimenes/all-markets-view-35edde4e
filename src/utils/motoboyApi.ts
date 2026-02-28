// Motoboy API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';

// Lazy imports to break circular dependency
let _vendasModule: any = null;
let _financeModule: any = null;
let _cadastrosModule: any = null;

const getVendasModule = () => {
  if (!_vendasModule) { import('./vendasApi').then(m => { _vendasModule = m; }); }
  return _vendasModule;
};
const getFinanceModule = () => {
  if (!_financeModule) { import('./financeApi').then(m => { _financeModule = m; }); }
  return _financeModule;
};
const getCadastrosModule = () => {
  if (!_cadastrosModule) { import('./cadastrosApi').then(m => { _cadastrosModule = m; }); }
  return _cadastrosModule;
};

// Pre-warm
import('./vendasApi').then(m => { _vendasModule = m; });
import('./financeApi').then(m => { _financeModule = m; });
import('./cadastrosApi').then(m => { _cadastrosModule = m; });

export interface DemandaMotoboy {
  id: string;
  motoboyId: string;
  motoboyNome: string;
  data: string;
  tipo: 'Entrega' | 'Coleta' | 'Movimentação';
  descricao: string;
  lojaOrigem: string;
  lojaDestino: string;
  status: 'Concluída' | 'Pendente' | 'Cancelada';
  valorDemanda: number;
  vendaId?: string;
}

export interface RemuneracaoMotoboy {
  id: string;
  motoboyId: string;
  motoboyNome: string;
  competencia: string;
  periodoInicio: string;
  periodoFim: string;
  qtdDemandas: number;
  valorTotal: number;
  status: 'Pendente' | 'Pago';
  dataPagamento?: string;
  contaId?: string;
  contaNome?: string;
  comprovante?: string;
  comprovanteNome?: string;
  pagoPor?: string;
  observacoesPagamento?: string;
}

// ── Cache layer ──
let demandasCache: DemandaMotoboy[] = [];
let remuneracoesCache: RemuneracaoMotoboy[] = [];

const mapDemandaRow = (r: any): DemandaMotoboy => ({
  id: r.id,
  motoboyId: r.motoboy_id || '',
  motoboyNome: r.motoboy_nome || '',
  data: r.data || '',
  tipo: r.tipo || 'Entrega',
  descricao: r.descricao || '',
  lojaOrigem: r.loja_origem || '',
  lojaDestino: r.loja_destino || '',
  status: r.status || 'Pendente',
  valorDemanda: Number(r.valor_demanda) || 0,
  vendaId: r.venda_id || undefined,
});

const mapRemRow = (r: any): RemuneracaoMotoboy => ({
  id: r.id,
  motoboyId: r.motoboy_id || '',
  motoboyNome: r.motoboy_nome || '',
  competencia: r.competencia || '',
  periodoInicio: r.periodo_inicio || '',
  periodoFim: r.periodo_fim || '',
  qtdDemandas: r.qtd_demandas || 0,
  valorTotal: Number(r.valor_total) || 0,
  status: r.status || 'Pendente',
  dataPagamento: r.data_pagamento || undefined,
  contaId: r.conta_id || undefined,
  contaNome: r.conta_nome || undefined,
  comprovante: r.comprovante || undefined,
  comprovanteNome: r.comprovante_nome || undefined,
  pagoPor: r.pago_por || undefined,
  observacoesPagamento: r.observacoes_pagamento || undefined,
});

export const initMotoboyCache = async () => {
  const [dRes, rRes] = await Promise.all([
    supabase.from('demandas_motoboy').select('*').order('data', { ascending: false }),
    supabase.from('remuneracoes_motoboy').select('*').order('periodo_inicio', { ascending: false }),
  ]);
  if (dRes.data) demandasCache = dRes.data.map(mapDemandaRow);
  if (rRes.data) remuneracoesCache = rRes.data.map(mapRemRow);
};

// Auto-init
initMotoboyCache();

// Helpers para competência bi-mensal
const getMesesAbrev = () => ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

const getCompetenciaFromDate = (dateStr: string): { competencia: string; periodoInicio: string; periodoFim: string } => {
  const date = new Date(dateStr + 'T12:00:00');
  const meses = getMesesAbrev();
  const mes = meses[date.getMonth()];
  const ano = date.getFullYear();
  const dia = date.getDate();
  const ultimoDia = getDaysInMonth(date);
  if (dia <= 15) {
    return {
      competencia: `${mes}-${ano} - 1`,
      periodoInicio: `${ano}-${String(date.getMonth() + 1).padStart(2, '0')}-01`,
      periodoFim: `${ano}-${String(date.getMonth() + 1).padStart(2, '0')}-15`
    };
  } else {
    return {
      competencia: `${mes}-${ano} - 2`,
      periodoInicio: `${ano}-${String(date.getMonth() + 1).padStart(2, '0')}-16`,
      periodoFim: `${ano}-${String(date.getMonth() + 1).padStart(2, '0')}-${ultimoDia}`
    };
  }
};

// Criar ou atualizar remuneração do período ao adicionar demanda
const atualizarRemuneracaoPeriodo = async (demanda: DemandaMotoboy) => {
  if (demanda.status !== 'Concluída') return;
  const { competencia, periodoInicio, periodoFim } = getCompetenciaFromDate(demanda.data);
  const existente = remuneracoesCache.find(r => r.motoboyId === demanda.motoboyId && r.competencia === competencia);

  if (existente) {
    existente.qtdDemandas += 1;
    existente.valorTotal += demanda.valorDemanda;
    await supabase.from('remuneracoes_motoboy').update({
      qtd_demandas: existente.qtdDemandas,
      valor_total: existente.valorTotal,
    }).eq('id', existente.id);
  } else {
    const { data } = await supabase.from('remuneracoes_motoboy').insert({
      motoboy_id: demanda.motoboyId,
      motoboy_nome: demanda.motoboyNome,
      competencia,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
      qtd_demandas: 1,
      valor_total: demanda.valorDemanda,
      status: 'Pendente',
    }).select().single();
    if (data) remuneracoesCache.push(mapRemRow(data));
  }
};

// Ativar demandas pendentes após conferência financeira
export const ativarDemandasPorVenda = async (vendaId: string): Promise<void> => {
  const pendentes = demandasCache.filter(d => d.vendaId === vendaId && d.status === 'Pendente');
  for (const d of pendentes) {
    d.status = 'Concluída';
    await supabase.from('demandas_motoboy').update({ status: 'Concluída' }).eq('id', d.id);
    await atualizarRemuneracaoPeriodo(d);
  }
};

// Adicionar nova demanda de motoboy
export const addDemandaMotoboy = async (demanda: Omit<DemandaMotoboy, 'id'>): Promise<DemandaMotoboy> => {
  const { data, error } = await supabase.from('demandas_motoboy').insert({
    motoboy_id: demanda.motoboyId || null,
    motoboy_nome: demanda.motoboyNome,
    data: demanda.data,
    tipo: demanda.tipo,
    descricao: demanda.descricao,
    loja_origem: demanda.lojaOrigem,
    loja_destino: demanda.lojaDestino,
    status: demanda.status,
    valor_demanda: demanda.valorDemanda,
    venda_id: demanda.vendaId || null,
  }).select().single();
  if (error) throw error;
  const mapped = mapDemandaRow(data);
  demandasCache.push(mapped);
  if (mapped.status === 'Concluída') await atualizarRemuneracaoPeriodo(mapped);
  return mapped;
};

export const getDemandas = (filtros?: {
  motoboyId?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
}): DemandaMotoboy[] => {
  let resultado = [...demandasCache];
  if (filtros?.motoboyId) resultado = resultado.filter(d => d.motoboyId === filtros.motoboyId);
  if (filtros?.dataInicio) resultado = resultado.filter(d => d.data >= filtros.dataInicio!);
  if (filtros?.dataFim) resultado = resultado.filter(d => d.data <= filtros.dataFim!);
  if (filtros?.status && filtros.status !== 'todas') resultado = resultado.filter(d => d.status === filtros.status);
  return resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
};

export const getRemuneracoes = (filtros?: {
  motoboyId?: string;
  competencia?: string;
  status?: string;
}): RemuneracaoMotoboy[] => {
  let resultado = [...remuneracoesCache];
  if (filtros?.motoboyId) resultado = resultado.filter(r => r.motoboyId === filtros.motoboyId);
  if (filtros?.competencia) resultado = resultado.filter(r => r.competencia === filtros.competencia);
  if (filtros?.status && filtros.status !== 'todos') resultado = resultado.filter(r => r.status === filtros.status);
  return resultado.sort((a, b) => {
    if (a.status === 'Pendente' && b.status === 'Pago') return -1;
    if (a.status === 'Pago' && b.status === 'Pendente') return 1;
    return new Date(b.periodoInicio).getTime() - new Date(a.periodoInicio).getTime();
  });
};

export const calcularRemuneracaoPeriodo = (
  motoboyId: string,
  periodoInicio: string,
  periodoFim: string
): { qtdDemandas: number; valorTotal: number } => {
  const demandasPeriodo = demandasCache.filter(d =>
    d.motoboyId === motoboyId && d.data >= periodoInicio && d.data <= periodoFim && d.status === 'Concluída'
  );
  return {
    qtdDemandas: demandasPeriodo.length,
    valorTotal: demandasPeriodo.reduce((acc, d) => acc + d.valorDemanda, 0)
  };
};

export interface DadosPagamentoRemuneracao {
  contaId: string;
  contaNome: string;
  comprovante: string;
  comprovanteNome: string;
  pagoPor: string;
  observacoes?: string;
}

export const registrarPagamentoRemuneracao = async (id: string, dados?: DadosPagamentoRemuneracao): Promise<boolean> => {
  const idx = remuneracoesCache.findIndex(r => r.id === id);
  if (idx === -1) return false;

  const rem = remuneracoesCache[idx];
  const hoje = new Date().toISOString().split('T')[0];

  const updateData: any = {
    status: 'Pago',
    data_pagamento: hoje,
  };
  if (dados) {
    updateData.conta_id = dados.contaId;
    updateData.conta_nome = dados.contaNome;
    updateData.comprovante = dados.comprovante;
    updateData.comprovante_nome = dados.comprovanteNome;
    updateData.pago_por = dados.pagoPor;
    updateData.observacoes_pagamento = dados.observacoes || null;
  }

  const { error } = await supabase.from('remuneracoes_motoboy').update(updateData).eq('id', id);
  if (error) return false;

  remuneracoesCache[idx] = {
    ...rem,
    status: 'Pago',
    dataPagamento: hoje,
    ...(dados ? {
      contaId: dados.contaId,
      contaNome: dados.contaNome,
      comprovante: dados.comprovante,
      comprovanteNome: dados.comprovanteNome,
      pagoPor: dados.pagoPor,
      observacoesPagamento: dados.observacoes,
    } : {})
  };

  // Integração financeira
  if (dados) {
    try {
      const meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
      const mesAtual = new Date().getMonth();
      const anoAtual = new Date().getFullYear();
      const competenciaFinanceira = `${meses[mesAtual]}-${anoAtual}`;
      const finApi = getFinanceModule();
      if (finApi?.addDespesa) {
        await finApi.addDespesa({
          tipo: 'Variável',
          data: hoje,
          descricao: `Pagamento Remuneração Motoboy - ${rem.motoboyNome} - Período ${new Date(rem.periodoInicio).toLocaleDateString('pt-BR')} a ${new Date(rem.periodoFim).toLocaleDateString('pt-BR')}`,
          valor: rem.valorTotal,
          competencia: competenciaFinanceira,
          conta: dados.contaNome,
          observacoes: dados.observacoes || '',
          lojaId: '3ac7e00c',
          status: 'Pago',
          categoria: 'Frete/Logística',
          dataVencimento: hoje,
          dataPagamento: hoje,
          recorrente: false,
          periodicidade: null,
          pagoPor: dados.pagoPor,
          comprovante: dados.comprovanteNome
        });
      }
    } catch (e) {
      console.error('[MOTOBOY] Erro ao lançar despesa financeira:', e);
    }
  }

  return true;
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const gerarCompetencias = (): string[] => {
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const anoAtual = new Date().getFullYear();
  const competencias: string[] = [];
  for (let ano = anoAtual - 1; ano <= anoAtual + 1; ano++) {
    for (const mes of meses) {
      competencias.push(`${mes}-${ano} - 1`);
      competencias.push(`${mes}-${ano} - 2`);
    }
  }
  return competencias;
};

// Detalhamento de entregas para drill-down da remuneração
export interface DetalheEntregaRemuneracao {
  demandaId: string;
  vendaId: string;
  vendedor: string;
  produto: string;
  localizacao: string;
  valorEntrega: number;
  valorVenda: number;
}

export const getDetalheEntregasRemuneracao = (
  motoboyId: string,
  periodoInicio: string,
  periodoFim: string
): DetalheEntregaRemuneracao[] => {
  const vendasMod = getVendasModule();
  const todasVendas = vendasMod?.getVendas ? vendasMod.getVendas() : [];
  const demandasPeriodo = demandasCache.filter(d =>
    d.motoboyId === motoboyId && d.data >= periodoInicio && d.data <= periodoFim && d.status === 'Concluída'
  );
  return demandasPeriodo.map(d => {
    if (d.vendaId) {
      const venda = todasVendas.find((v: any) => v.id === d.vendaId);
      if (venda) {
        return {
          demandaId: d.id,
          vendaId: d.vendaId,
          vendedor: (() => { const mod = getCadastrosModule(); return mod?.getColaboradorById?.(venda.vendedor)?.nome || venda.vendedor; })(),
          produto: venda.itens?.map((i: any) => i.produto).join(', ') || d.descricao,
          localizacao: d.lojaDestino,
          valorEntrega: d.valorDemanda,
          valorVenda: venda.total || 0
        };
      }
    }
    return {
      demandaId: d.id,
      vendaId: d.vendaId || '-',
      vendedor: d.motoboyNome,
      produto: d.descricao,
      localizacao: d.lojaDestino,
      valorEntrega: d.valorDemanda,
      valorVenda: 0
    };
  });
};

// Estatísticas gerais de motoboys
export const getEstatisticasMotoboys = () => {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);
  const demandasMes = demandasCache.filter(d =>
    new Date(d.data) >= inicioMes && new Date(d.data) <= fimMes
  );
  const remuneracoesPendentes = remuneracoesCache.filter(r => r.status === 'Pendente');
  return {
    totalDemandasMes: demandasMes.filter(d => d.status === 'Concluída').length,
    demandasPendentes: demandasMes.filter(d => d.status === 'Pendente').length,
    valorTotalMes: demandasMes.filter(d => d.status === 'Concluída').reduce((acc, d) => acc + d.valorDemanda, 0),
    remuneracoesPendentes: remuneracoesPendentes.length,
    valorPendentePagamento: remuneracoesPendentes.reduce((acc, r) => acc + r.valorTotal, 0)
  };
};
