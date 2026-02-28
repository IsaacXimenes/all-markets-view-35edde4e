// API para Conferência de Vendas - Gestor
// MIGRADO PARA SUPABASE - tabela conferencias_gestor
import { supabase } from '@/integrations/supabase/client';
import { addNotification } from './notificationsApi';
import { getColaboradores, getCargos, getLojas, Colaborador, Cargo, Loja } from './cadastrosApi';
import { formatCurrency } from './formatUtils';

export type StatusConferencia = 'Conferência - Gestor' | 'Conferência - Financeiro' | 'Concluído';

export interface TimelineEvento {
  id: string;
  tipo: 'registro' | 'conferencia_gestor' | 'envio_financeiro' | 'finalizado';
  titulo: string;
  descricao: string;
  dataHora: string;
  responsavel?: string;
  observacao?: string;
}

export interface VendaConferencia {
  id: string;
  vendaId: string;
  dataRegistro: string;
  lojaId: string;
  lojaNome: string;
  vendedorId: string;
  vendedorNome: string;
  clienteNome: string;
  valorTotal: number;
  tipoVenda: 'Normal' | 'Digital' | 'Acessórios';
  status: StatusConferencia;
  slaDias: number;
  timeline: TimelineEvento[];
  gestorConferencia?: string;
  gestorNome?: string;
  observacaoGestor?: string;
  dataConferencia?: string;
  financeiroResponsavel?: string;
  financeiroNome?: string;
  dataFinalizacao?: string;
  contaDestino?: string;
  dadosVenda: {
    clienteCpf?: string; clienteTelefone?: string; clienteEmail?: string; clienteCidade?: string;
    origemVenda?: string; localRetirada?: string; tipoRetirada?: string; taxaEntrega?: number;
    itens?: any[]; tradeIns?: any[]; pagamentos?: any[]; acessorios?: any[];
    subtotal: number; totalTradeIn: number; total: number; lucro: number; margem: number; observacoes?: string;
  };
}

// ============= CACHE =============
let conferenciaCache: VendaConferencia[] = [];
let conferenciaCounter = 0;
let conferenciaCacheInitialized = false;

const calcularSLA = (dataRegistro: string): number => {
  const agora = new Date();
  const registro = new Date(dataRegistro);
  return Math.floor(Math.abs(agora.getTime() - registro.getTime()) / (1000 * 60 * 60 * 24));
};

const dbToConferencia = (r: any): VendaConferencia => ({
  id: r.id,
  vendaId: r.venda_id,
  dataRegistro: r.data_registro || r.created_at,
  lojaId: r.loja_id || '',
  lojaNome: r.loja_nome || '',
  vendedorId: r.vendedor_id || '',
  vendedorNome: r.vendedor_nome || '',
  clienteNome: r.cliente_nome || '',
  valorTotal: Number(r.valor_total) || 0,
  tipoVenda: r.tipo_venda || 'Normal',
  status: r.status || 'Conferência - Gestor',
  slaDias: r.sla_dias || 0,
  timeline: r.timeline || [],
  gestorConferencia: r.gestor_conferencia || undefined,
  gestorNome: r.gestor_nome || undefined,
  observacaoGestor: r.observacao_gestor || undefined,
  dataConferencia: r.data_conferencia || undefined,
  financeiroResponsavel: r.financeiro_resp || undefined,
  financeiroNome: r.financeiro_nome || undefined,
  dataFinalizacao: r.data_finalizacao || undefined,
  contaDestino: r.conta_destino || undefined,
  dadosVenda: r.dados_venda || { subtotal: 0, totalTradeIn: 0, total: 0, lucro: 0, margem: 0 },
});

const conferenciaToDb = (v: VendaConferencia) => ({
  id: v.id,
  venda_id: v.vendaId,
  data_registro: v.dataRegistro,
  loja_id: v.lojaId,
  loja_nome: v.lojaNome,
  vendedor_id: v.vendedorId,
  vendedor_nome: v.vendedorNome,
  cliente_nome: v.clienteNome,
  valor_total: v.valorTotal,
  tipo_venda: v.tipoVenda,
  status: v.status,
  sla_dias: v.slaDias,
  timeline: v.timeline,
  gestor_conferencia: v.gestorConferencia || null,
  gestor_nome: v.gestorNome || null,
  observacao_gestor: v.observacaoGestor || null,
  data_conferencia: v.dataConferencia || null,
  financeiro_resp: v.financeiroResponsavel || null,
  financeiro_nome: v.financeiroNome || null,
  data_finalizacao: v.dataFinalizacao || null,
  conta_destino: v.contaDestino || null,
  dados_venda: v.dadosVenda,
});

// Seed data for first run
const seedData: VendaConferencia[] = [
  { id: 'CONF-001', vendaId: 'VEN-0001', dataRegistro: new Date(Date.now() - 0 * 86400000).toISOString(), lojaId: 'db894e7d', lojaNome: 'Loja - JK Shopping', vendedorId: '6dcbc817', vendedorNome: 'Caua Victor Costa dos Santos', clienteNome: 'Ricardo Mendes', valorTotal: 15800, tipoVenda: 'Normal', status: 'Conferência - Gestor', slaDias: 0, timeline: [{ id: 'TL-001', tipo: 'registro', titulo: 'Venda Registrada', descricao: 'Venda registrada pelo vendedor', dataHora: new Date(Date.now() - 0 * 86400000).toISOString(), responsavel: 'Caua Victor Costa dos Santos' }], dadosVenda: { clienteCpf: '789.123.456-00', clienteTelefone: '(11) 99999-8888', origemVenda: 'Loja Física', itens: [{ produto: 'iPhone 15 Pro Max', imei: '352123456789100', valorVenda: 15800, valorCusto: 7500 }], pagamentos: [{ meioPagamento: 'Pix', valor: 15800 }], subtotal: 15800, totalTradeIn: 0, total: 15800, lucro: 8300, margem: 110.67 } },
  { id: 'CONF-002', vendaId: 'VEN-0002', dataRegistro: new Date(Date.now() - 1 * 86400000).toISOString(), lojaId: '3ac7e00c', lojaNome: 'Loja - Matriz', vendedorId: '143ac0c2', vendedorNome: 'Antonio Sousa Silva', clienteNome: 'Fernanda Lima', valorTotal: 8900, tipoVenda: 'Digital', status: 'Conferência - Gestor', slaDias: 1, timeline: [{ id: 'TL-002', tipo: 'registro', titulo: 'Venda Digital Registrada', descricao: 'Venda digital enviada', dataHora: new Date(Date.now() - 1 * 86400000).toISOString(), responsavel: 'Antonio Sousa Silva' }], dadosVenda: { subtotal: 8900, totalTradeIn: 0, total: 8900, lucro: 4700, margem: 111.90 } },
  { id: 'CONF-003', vendaId: 'VEN-0003', dataRegistro: new Date(Date.now() - 2 * 86400000).toISOString(), lojaId: '5b9446d5', lojaNome: 'Loja - Shopping Sul', vendedorId: '9812948d', vendedorNome: 'Gustavo de Souza dos Santos', clienteNome: 'Bruno Santos', valorTotal: 2350, tipoVenda: 'Acessórios', status: 'Conferência - Gestor', slaDias: 2, timeline: [{ id: 'TL-003', tipo: 'registro', titulo: 'Venda de Acessórios', descricao: 'Venda de acessórios registrada', dataHora: new Date(Date.now() - 2 * 86400000).toISOString(), responsavel: 'Gustavo de Souza dos Santos' }], dadosVenda: { subtotal: 2350, totalTradeIn: 0, total: 2350, lucro: 850, margem: 56.67 } },
  { id: 'CONF-004', vendaId: 'VEN-0004', dataRegistro: new Date(Date.now() - 4 * 86400000).toISOString(), lojaId: '0d06e7db', lojaNome: 'Loja - Águas Lindas Shopping', vendedorId: 'b106080f', vendedorNome: 'Erick Guthemberg Ferreira da Silva', clienteNome: 'Carla Oliveira', valorTotal: 22500, tipoVenda: 'Normal', status: 'Conferência - Gestor', slaDias: 4, timeline: [{ id: 'TL-004', tipo: 'registro', titulo: 'Venda Registrada', descricao: 'Venda de alto valor registrada', dataHora: new Date(Date.now() - 4 * 86400000).toISOString(), responsavel: 'Erick Guthemberg' }], dadosVenda: { subtotal: 22500, totalTradeIn: 0, total: 22500, lucro: 11300, margem: 100.89 } },
  { id: 'CONF-005', vendaId: 'VEN-0005', dataRegistro: new Date(Date.now() - 7 * 86400000).toISOString(), lojaId: 'db894e7d', lojaNome: 'Loja - JK Shopping', vendedorId: '6dcbc817', vendedorNome: 'Caua Victor Costa dos Santos', clienteNome: 'Amanda Rodrigues', valorTotal: 9800, tipoVenda: 'Normal', status: 'Conferência - Financeiro', slaDias: 0, gestorConferencia: 'b467c728', gestorNome: 'Anna Beatriz Borges', observacaoGestor: 'Valores conferidos.', dataConferencia: new Date(Date.now() - 6 * 86400000).toISOString(), timeline: [{ id: 'TL-005-1', tipo: 'registro', titulo: 'Venda Registrada', descricao: 'Venda registrada', dataHora: new Date(Date.now() - 7 * 86400000).toISOString(), responsavel: 'Caua Victor' }], dadosVenda: { subtotal: 9800, totalTradeIn: 0, total: 9800, lucro: 5000, margem: 104.17 } },
  { id: 'CONF-006', vendaId: 'VEN-0006', dataRegistro: new Date(Date.now() - 8 * 86400000).toISOString(), lojaId: '3ac7e00c', lojaNome: 'Loja - Matriz', vendedorId: '143ac0c2', vendedorNome: 'Antonio Sousa Silva', clienteNome: 'Diego Martins', valorTotal: 5600, tipoVenda: 'Digital', status: 'Conferência - Financeiro', slaDias: 0, gestorConferencia: '428d37c2', gestorNome: 'Bruno Alves Peres', dataConferencia: new Date(Date.now() - 7 * 86400000).toISOString(), timeline: [], dadosVenda: { subtotal: 5600, totalTradeIn: 0, total: 5600, lucro: 2800, margem: 100 } },
  { id: 'CONF-007', vendaId: 'VEN-0007', dataRegistro: new Date(Date.now() - 10 * 86400000).toISOString(), lojaId: '5b9446d5', lojaNome: 'Loja - Shopping Sul', vendedorId: '9812948d', vendedorNome: 'Gustavo de Souza dos Santos', clienteNome: 'Letícia Souza', valorTotal: 3200, tipoVenda: 'Acessórios', status: 'Conferência - Financeiro', slaDias: 0, gestorConferencia: 'b467c728', gestorNome: 'Anna Beatriz Borges', dataConferencia: new Date(Date.now() - 9 * 86400000).toISOString(), timeline: [], dadosVenda: { subtotal: 3200, totalTradeIn: 0, total: 3200, lucro: 1100, margem: 52.38 } },
  { id: 'CONF-008', vendaId: 'VEN-0008', dataRegistro: new Date(Date.now() - 12 * 86400000).toISOString(), lojaId: '0d06e7db', lojaNome: 'Loja - Águas Lindas Shopping', vendedorId: '6dcbc817', vendedorNome: 'Caua Victor Costa dos Santos', clienteNome: 'Rafael Costa', valorTotal: 18500, tipoVenda: 'Normal', status: 'Concluído', slaDias: 0, gestorConferencia: '428d37c2', gestorNome: 'Bruno Alves Peres', dataConferencia: new Date(Date.now() - 11 * 86400000).toISOString(), financeiroResponsavel: '7c1231ea', financeiroNome: 'Fernanda Gabrielle Silva de Lima', dataFinalizacao: new Date(Date.now() - 10 * 86400000).toISOString(), timeline: [], dadosVenda: { subtotal: 18500, totalTradeIn: 0, total: 18500, lucro: 9500, margem: 105.56 } },
  { id: 'CONF-009', vendaId: 'VEN-0009', dataRegistro: new Date(Date.now() - 14 * 86400000).toISOString(), lojaId: 'fcc78c1a', lojaNome: 'Loja - Online', vendedorId: '143ac0c2', vendedorNome: 'Antonio Sousa Silva', clienteNome: 'Gabriela Pereira', valorTotal: 7200, tipoVenda: 'Normal', status: 'Concluído', slaDias: 0, gestorConferencia: 'b467c728', gestorNome: 'Anna Beatriz Borges', dataConferencia: new Date(Date.now() - 13 * 86400000).toISOString(), financeiroResponsavel: '7c1231ea', financeiroNome: 'Fernanda Gabrielle Silva de Lima', dataFinalizacao: new Date(Date.now() - 12 * 86400000).toISOString(), timeline: [], dadosVenda: { subtotal: 10200, totalTradeIn: 3000, total: 7200, lucro: 2200, margem: 44 } },
  { id: 'CONF-010', vendaId: 'VEN-0010', dataRegistro: new Date(Date.now() - 16 * 86400000).toISOString(), lojaId: 'db894e7d', lojaNome: 'Loja - JK Shopping', vendedorId: '9812948d', vendedorNome: 'Gustavo de Souza dos Santos', clienteNome: 'Marina Oliveira', valorTotal: 12500, tipoVenda: 'Normal', status: 'Concluído', slaDias: 0, gestorConferencia: '428d37c2', gestorNome: 'Bruno Alves Peres', dataConferencia: new Date(Date.now() - 15 * 86400000).toISOString(), financeiroResponsavel: '7c1231ea', financeiroNome: 'Fernanda Gabrielle Silva de Lima', dataFinalizacao: new Date(Date.now() - 14 * 86400000).toISOString(), timeline: [], dadosVenda: { subtotal: 12500, totalTradeIn: 0, total: 12500, lucro: 6500, margem: 108.33 } },
];

export const initConferenciasGestorCache = async () => {
  try {
    const { data, error } = await supabase.from('conferencias_gestor').select('*');
    if (error) throw error;

    if (!data || data.length === 0) {
      // Seed
      const records = seedData.map(conferenciaToDb);
      const { error: insertError } = await supabase.from('conferencias_gestor').insert(records);
      if (insertError) console.error('[ConferenciasGestor] Erro seed:', insertError);
      conferenciaCache = [...seedData];
    } else {
      conferenciaCache = data.map(dbToConferencia);
    }
    conferenciaCounter = conferenciaCache.length;
    conferenciaCacheInitialized = true;
    console.log(`[ConferenciasGestor] Cache: ${conferenciaCache.length} registros`);
  } catch (err) {
    console.error('[ConferenciasGestor] Erro init:', err);
    conferenciaCache = [...seedData];
    conferenciaCounter = conferenciaCache.length;
    conferenciaCacheInitialized = true;
  }
};

// ============= GETTERS =============
export const getVendasConferencia = (): VendaConferencia[] =>
  conferenciaCache.map(v => ({ ...v, slaDias: v.status === 'Conferência - Gestor' ? calcularSLA(v.dataRegistro) : v.slaDias }));

export const getVendaConferenciaById = (id: string): VendaConferencia | null => {
  const v = conferenciaCache.find(c => c.id === id);
  if (!v) return null;
  return { ...v, slaDias: v.status === 'Conferência - Gestor' ? calcularSLA(v.dataRegistro) : v.slaDias };
};

export const getStatusConferenciaByVendaId = (vendaId: string): StatusConferencia | null =>
  conferenciaCache.find(v => v.vendaId === vendaId)?.status || null;

export const getVendasPorStatus = (status: StatusConferencia): VendaConferencia[] =>
  conferenciaCache.filter(v => v.status === status).map(v => ({ ...v, slaDias: v.status === 'Conferência - Gestor' ? calcularSLA(v.dataRegistro) : v.slaDias }));

// ============= MUTATIONS (async) =============
export const validarVendaGestor = async (
  id: string, gestorId: string, gestorNome: string, observacao: string
): Promise<VendaConferencia | null> => {
  const index = conferenciaCache.findIndex(v => v.id === id);
  if (index === -1) return null;

  const agora = new Date().toISOString();
  const updated: VendaConferencia = {
    ...conferenciaCache[index],
    status: 'Conferência - Financeiro',
    gestorConferencia: gestorId, gestorNome, observacaoGestor: observacao, dataConferencia: agora, slaDias: 0,
    timeline: [...conferenciaCache[index].timeline,
      { id: `TL-${id}-CONF`, tipo: 'conferencia_gestor', titulo: 'Conferência do Gestor', descricao: 'Venda validada pelo gestor', dataHora: agora, responsavel: gestorNome, observacao: observacao || undefined },
      { id: `TL-${id}-FIN`, tipo: 'envio_financeiro', titulo: 'Enviada ao Financeiro', descricao: 'Venda migrada para conferência financeira', dataHora: agora }
    ]
  };

  conferenciaCache[index] = updated;
  const { error } = await supabase.from('conferencias_gestor').update(conferenciaToDb(updated)).eq('id', id);
  if (error) console.error('[ConferenciasGestor] Erro update:', error);

  addNotification({ type: 'venda_conferencia', title: `Venda ${updated.vendaId} conferida pelo Gestor`, description: `${gestorNome} validou a venda - Enviada ao Financeiro`, targetUsers: ['COL-006'] });
  return updated;
};

export const finalizarVendaFinanceiro = async (
  id: string, responsavelId: string, responsavelNome: string, contaDestino: string
): Promise<VendaConferencia | null> => {
  const index = conferenciaCache.findIndex(v => v.id === id);
  if (index === -1) return null;

  const agora = new Date().toISOString();
  const updated: VendaConferencia = {
    ...conferenciaCache[index],
    status: 'Concluído',
    financeiroResponsavel: responsavelId, financeiroNome: responsavelNome, contaDestino, dataFinalizacao: agora,
    timeline: [...conferenciaCache[index].timeline,
      { id: `TL-${id}-FINAL`, tipo: 'finalizado', titulo: 'Concluído', descricao: `Venda finalizada pelo financeiro. Conta: ${contaDestino}`, dataHora: agora, responsavel: responsavelNome }
    ]
  };

  conferenciaCache[index] = updated;
  const { error } = await supabase.from('conferencias_gestor').update(conferenciaToDb(updated)).eq('id', id);
  if (error) console.error('[ConferenciasGestor] Erro update:', error);
  return updated;
};

export const adicionarVendaParaConferencia = async (
  vendaId: string, lojaId: string, lojaNome: string, vendedorId: string, vendedorNome: string,
  clienteNome: string, valorTotal: number, tipoVenda: 'Normal' | 'Digital' | 'Acessórios',
  dadosVenda: VendaConferencia['dadosVenda']
): Promise<VendaConferencia> => {
  conferenciaCounter++;
  const agora = new Date().toISOString();
  const nova: VendaConferencia = {
    id: `CONF-${String(conferenciaCounter).padStart(3, '0')}`,
    vendaId, dataRegistro: agora, lojaId, lojaNome, vendedorId, vendedorNome, clienteNome,
    valorTotal, tipoVenda, status: 'Conferência - Gestor', slaDias: 0,
    timeline: [{ id: `TL-${conferenciaCounter}-REG`, tipo: 'registro', titulo: tipoVenda === 'Digital' ? 'Venda Digital Registrada' : tipoVenda === 'Acessórios' ? 'Venda de Acessórios Registrada' : 'Venda Registrada', descricao: `Venda ${tipoVenda.toLowerCase()} registrada pelo vendedor`, dataHora: agora, responsavel: vendedorNome }],
    dadosVenda
  };

  conferenciaCache.unshift(nova);
  const { error } = await supabase.from('conferencias_gestor').insert(conferenciaToDb(nova));
  if (error) console.error('[ConferenciasGestor] Erro insert:', error);
  notificarGestores(nova);
  return nova;
};

const notificarGestores = (venda: VendaConferencia) => {
  const colaboradores = getColaboradores();
  const cargos = getCargos();
  const gestores = colaboradores.filter(col => { const cargo = cargos.find(c => c.id === col.cargo); return cargo?.permissoes.includes('Gestor'); });
  const gestorIds = gestores.map(g => g.id);
  addNotification({ type: 'venda_conferencia', title: `Nova venda ${venda.vendaId} pendente de conferência`, description: `${venda.clienteNome} - ${formatCurrency(venda.valorTotal)} - Aguardando validação`, targetUsers: gestorIds.length > 0 ? gestorIds : ['COL-001', 'COL-002'] });
};

export const temPermissaoGestor = (colaboradorId?: string): boolean => {
  if (!colaboradorId) return true;
  const colaboradores = getColaboradores();
  const cargos = getCargos();
  const colaborador = colaboradores.find(c => c.id === colaboradorId);
  if (!colaborador) return false;
  const cargo = cargos.find(c => c.id === colaborador.cargo);
  return cargo?.permissoes.includes('Gestor') || false;
};

export const getGestores = (): Colaborador[] => {
  const colaboradores = getColaboradores();
  const cargos = getCargos();
  return colaboradores.filter(col => { const cargo = cargos.find(c => c.id === col.cargo); return cargo?.permissoes.includes('Gestor'); });
};

export { formatCurrency } from '@/utils/formatUtils';

export const exportConferenciaToCSV = (data: VendaConferencia[], filename: string) => {
  if (data.length === 0) return;
  const csvData = data.map(v => ({
    'ID Venda': v.vendaId, 'Data Registro': new Date(v.dataRegistro).toLocaleString('pt-BR'),
    'Loja': v.lojaNome, 'Responsável Venda': v.vendedorNome, 'Cliente': v.clienteNome,
    'Valor Total': v.valorTotal, 'Tipo Venda': v.tipoVenda, 'Status': v.status,
    'SLA (dias)': v.slaDias, 'Gestor': v.gestorNome || '-',
    'Data Conferência': v.dataConferencia ? new Date(v.dataConferencia).toLocaleString('pt-BR') : '-',
    'Financeiro': v.financeiroNome || '-',
    'Data Finalização': v.dataFinalizacao ? new Date(v.dataFinalizacao).toLocaleString('pt-BR') : '-'
  }));
  const headers = Object.keys(csvData[0]).join(',');
  const rows = csvData.map(item => Object.values(item).map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
