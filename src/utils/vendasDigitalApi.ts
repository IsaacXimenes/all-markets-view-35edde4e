// Vendas Digital API - Supabase Integration
import { supabase } from '@/integrations/supabase/client';
import { addNotification } from './notificationsApi';

export type VendaDigitalStatus = 
  | 'Pendente' 
  | 'Ajuste Solicitado' 
  | 'Em Finalização' 
  | 'Concluída Digital';

export interface TimelineEntry {
  id: string;
  data: string;
  acao: string;
  responsavel: string;
  responsavelId: string;
  detalhes?: string;
}

export interface VendaDigital {
  id: string;
  numero: number;
  dataHora: string;
  responsavelVendaId: string;
  responsavelVendaNome: string;
  clienteNome: string;
  clienteId?: string;
  valorTotal: number;
  status: VendaDigitalStatus;
  timeline: TimelineEntry[];
  finalizadorId?: string;
  finalizadorNome?: string;
  dataFinalizacao?: string;
  motivoAjuste?: string;
  dadosCompletos?: {
    itens: any[];
    tradeIns: any[];
    pagamentos: any[];
    observacoes: string;
    origemVenda: string;
    localRetirada: string;
  };
}

// ── Cache layer ──
let _cache: VendaDigital[] = [];
let _cacheLoaded = false;

const mapRow = (r: any): VendaDigital => ({
  id: r.id,
  numero: r.numero || 0,
  dataHora: r.data_hora || '',
  responsavelVendaId: r.responsavel_venda_id || '',
  responsavelVendaNome: r.responsavel_venda_nome || '',
  clienteNome: r.cliente_nome || '',
  clienteId: r.cliente_id || undefined,
  valorTotal: Number(r.valor_total) || 0,
  status: (r.status || 'Pendente') as VendaDigitalStatus,
  timeline: (r.timeline as TimelineEntry[]) || [],
  finalizadorId: r.finalizador_id || undefined,
  finalizadorNome: r.finalizador_nome || undefined,
  dataFinalizacao: r.data_finalizacao || undefined,
  motivoAjuste: r.motivo_ajuste || undefined,
  dadosCompletos: r.dados_completos as VendaDigital['dadosCompletos'] || undefined,
});

export const initVendasDigitaisCache = async () => {
  const { data, error } = await supabase
    .from('vendas_digitais')
    .select('*')
    .order('data_hora', { ascending: false });
  if (error) { console.error('[VDIG] init error', error); return; }
  _cache = (data || []).map(mapRow);
  _cacheLoaded = true;
};

// Auto-init
initVendasDigitaisCache();

// Colaboradores com permissão Digital - carregados dinamicamente do Supabase
let _colaboradoresDigital: { id: string; nome: string; cargo: string; permissao: string }[] = [];
let _colaboradoresFinalizador: { id: string; nome: string; cargo: string; permissao: string }[] = [];

const carregarColaboradoresDigital = async () => {
  const { data } = await supabase.from('colaboradores').select('id, nome, cargo').eq('ativo', true).eq('eh_vendedor', true);
  if (data) {
    _colaboradoresDigital = data.map(c => ({ id: c.id, nome: c.nome, cargo: c.cargo || '', permissao: 'Digital' }));
    _colaboradoresFinalizador = data.map(c => ({ id: c.id, nome: c.nome, cargo: c.cargo || '', permissao: 'Finalizador Digital' }));
  }
};
carregarColaboradoresDigital();

export const colaboradoresDigital = _colaboradoresDigital;
export const colaboradoresFinalizador = _colaboradoresFinalizador;

export const calcularSLA = (dataHora: string): number => {
  const data = new Date(dataHora);
  const hoje = new Date();
  const diffTime = Math.abs(hoje.getTime() - data.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// API Functions
export const getVendasDigitais = (): VendaDigital[] => [..._cache];

export const getVendaDigitalById = (id: string): VendaDigital | null => {
  return _cache.find(v => v.id === id) || null;
};

export const getVendasDigitaisPendentes = (): VendaDigital[] => {
  return _cache.filter(v =>
    v.status === 'Pendente' || v.status === 'Ajuste Solicitado' || v.status === 'Em Finalização'
  );
};

export const criarPreCadastro = async (
  responsavelVendaId: string,
  responsavelVendaNome: string,
  clienteNome: string,
  valorTotal: number
): Promise<VendaDigital> => {
  const now = new Date().toISOString();
  const nextNum = _cache.length > 0 ? Math.max(..._cache.map(v => v.numero)) + 1 : 1;

  const timeline: TimelineEntry[] = [{
    id: `TL-${Date.now()}`,
    data: now,
    acao: 'Pré-cadastro enviado',
    responsavel: responsavelVendaNome,
    responsavelId: responsavelVendaId,
  }];

  const { data: row, error } = await supabase.from('vendas_digitais').insert({
    numero: nextNum,
    data_hora: now,
    responsavel_venda_id: responsavelVendaId,
    responsavel_venda_nome: responsavelVendaNome,
    cliente_nome: clienteNome,
    valor_total: valorTotal,
    status: 'Pendente',
    timeline: timeline as any,
  }).select().single();
  if (error) throw error;

  const mapped = mapRow(row);
  _cache.unshift(mapped);

  addNotification({
    type: 'venda_digital',
    title: 'Novo pré-cadastro digital',
    description: `${mapped.id} - ${clienteNome} - R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    targetUsers: colaboradoresFinalizador.map(c => c.id),
  });

  return mapped;
};

export const solicitarAjuste = async (
  vendaId: string,
  finalizadorId: string,
  finalizadorNome: string,
  motivo: string
): Promise<VendaDigital | null> => {
  const existing = _cache.find(v => v.id === vendaId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const newTimeline = [
    ...existing.timeline,
    { id: `TL-${Date.now()}`, data: now, acao: 'Ajuste solicitado', responsavel: finalizadorNome, responsavelId: finalizadorId, detalhes: motivo },
  ];

  const { data: row, error } = await supabase.from('vendas_digitais').update({
    status: 'Ajuste Solicitado',
    motivo_ajuste: motivo,
    timeline: newTimeline as any,
  }).eq('id', vendaId).select().single();
  if (error) return null;

  const mapped = mapRow(row);
  const idx = _cache.findIndex(v => v.id === vendaId);
  if (idx >= 0) _cache[idx] = mapped;

  addNotification({
    type: 'ajuste_venda',
    title: 'Ajuste solicitado',
    description: `Venda ${vendaId} – motivo: ${motivo.substring(0, 50)}...`,
    targetUsers: [existing.responsavelVendaId],
  });

  return mapped;
};

export const finalizarVendaDigital = async (
  vendaId: string,
  finalizadorId: string,
  finalizadorNome: string,
  clienteId: string,
  dadosCompletos: VendaDigital['dadosCompletos']
): Promise<VendaDigital | null> => {
  const existing = _cache.find(v => v.id === vendaId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const newTimeline = [
    ...existing.timeline,
    { id: `TL-${Date.now()}`, data: now, acao: 'Venda finalizada', responsavel: finalizadorNome, responsavelId: finalizadorId },
  ];

  const { data: row, error } = await supabase.from('vendas_digitais').update({
    status: 'Concluída Digital',
    cliente_id: clienteId,
    finalizador_id: finalizadorId,
    finalizador_nome: finalizadorNome,
    data_finalizacao: now,
    dados_completos: dadosCompletos as any,
    timeline: newTimeline as any,
  }).eq('id', vendaId).select().single();
  if (error) return null;

  const mapped = mapRow(row);
  const idx = _cache.findIndex(v => v.id === vendaId);
  if (idx >= 0) _cache[idx] = mapped;

  addNotification({
    type: 'venda_finalizada',
    title: 'Venda digital finalizada',
    description: `${vendaId} foi finalizada por ${finalizadorNome}`,
    targetUsers: [existing.responsavelVendaId],
  });

  return mapped;
};

export const getColaboradoresDigital = () => [..._colaboradoresDigital];
export const getColaboradoresFinalizador = () => [..._colaboradoresFinalizador];

export { formatCurrency } from '@/utils/formatUtils';

export const exportVendasDigitaisToCSV = (data: VendaDigital[], filename: string) => {
  if (data.length === 0) return;
  const csvData = data.map(v => ({
    'ID': v.id,
    'Data/Hora': new Date(v.dataHora).toLocaleString('pt-BR'),
    'Responsável Venda': v.responsavelVendaNome,
    'Cliente': v.clienteNome,
    'Valor Total': v.valorTotal,
    'Status': v.status,
    'SLA (dias)': calcularSLA(v.dataHora),
    'Finalizador': v.finalizadorNome || '-',
    'Data Finalização': v.dataFinalizacao ? new Date(v.dataFinalizacao).toLocaleString('pt-BR') : '-',
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

export const temPermissaoDigital = (colaboradorId: string): boolean => {
  return colaboradoresDigital.some(c => c.id === colaboradorId);
};

export const temPermissaoFinalizador = (colaboradorId: string): boolean => {
  return colaboradoresFinalizador.some(c => c.id === colaboradorId);
};
