// API para Taxas de Entrega - Supabase
import { supabase } from '@/integrations/supabase/client';

export interface LogAlteracao {
  id: string;
  data: string;
  usuarioId: string;
  usuarioNome: string;
  valorAnterior: number;
  valorNovo: number;
  acao: 'criacao' | 'edicao' | 'status';
}

export interface TaxaEntrega {
  id: string;
  local: string;
  valor: number;
  status: 'Ativo' | 'Inativo';
  dataCriacao: string;
  dataAtualizacao: string;
  logs: LogAlteracao[];
}

// Cache
let _taxasCache: TaxaEntrega[] = [];
let _initPromise: Promise<void> | null = null;

const SEED_TAXAS = [
  { local: 'Águas Claras', valor: 40 }, { local: 'Asa Norte', valor: 30 }, { local: 'Asa Sul', valor: 30 },
  { local: 'Ceilândia', valor: 50 }, { local: 'Cruzeiro', valor: 25 }, { local: 'Gama', valor: 55 },
  { local: 'Guará I', valor: 35 }, { local: 'Guará II', valor: 35 }, { local: 'Lago Norte', valor: 40 },
  { local: 'Lago Sul', valor: 40 }, { local: 'Noroeste', valor: 30 }, { local: 'Núcleo Bandeirante', valor: 45 },
  { local: 'Octogonal', valor: 30 }, { local: 'Park Sul', valor: 35 }, { local: 'Planaltina', valor: 60 },
  { local: 'Recanto das Emas', valor: 60 }, { local: 'Riacho Fundo I', valor: 50 }, { local: 'Riacho Fundo II', valor: 55 },
  { local: 'Samambaia', valor: 55 }, { local: 'Santa Maria', valor: 60 }, { local: 'SIA', valor: 35 },
  { local: 'Sobradinho', valor: 50 }, { local: 'Sudoeste', valor: 25 }, { local: 'Taguatinga', valor: 45 },
  { local: 'Vicente Pires', valor: 45 },
];

const mapRow = (row: any): TaxaEntrega => ({
  id: row.id,
  local: row.local,
  valor: Number(row.valor) || 0,
  status: row.status || 'Ativo',
  dataCriacao: row.data_criacao || row.created_at,
  dataAtualizacao: row.data_atualizacao || row.created_at,
  logs: Array.isArray(row.logs) ? row.logs : [],
});

export const initTaxasEntregaCache = async (): Promise<void> => {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const { data, error } = await supabase.from('taxas_entrega').select('*');
    if (error) { console.error('Erro ao carregar taxas_entrega:', error); return; }
    if (!data || data.length === 0) {
      const inserts = SEED_TAXAS.map(t => ({ local: t.local, valor: t.valor, status: 'Ativo' }));
      const { data: seeded, error: seedErr } = await supabase.from('taxas_entrega').insert(inserts).select();
      if (seedErr) { console.error('Erro ao seed taxas_entrega:', seedErr); return; }
      _taxasCache = (seeded || []).map(mapRow);
    } else {
      _taxasCache = data.map(mapRow);
    }
  })();
  return _initPromise;
};

export const getTaxasEntrega = (): TaxaEntrega[] => [..._taxasCache];
export const getTaxasEntregaAtivas = (): TaxaEntrega[] => _taxasCache.filter(t => t.status === 'Ativo');
export const getTaxaEntregaById = (id: string): TaxaEntrega | undefined => _taxasCache.find(t => t.id === id);
export const getTaxaEntregaByLocal = (local: string): TaxaEntrega | undefined =>
  _taxasCache.find(t => t.local.toLowerCase() === local.toLowerCase());

export const addTaxaEntrega = async (local: string, valor: number, usuarioId: string, usuarioNome: string): Promise<TaxaEntrega> => {
  const agora = new Date().toISOString();
  const log: LogAlteracao = { id: `LOG-${Date.now()}`, data: agora, usuarioId, usuarioNome, valorAnterior: 0, valorNovo: valor, acao: 'criacao' };
  const { data, error } = await supabase.from('taxas_entrega').insert({
    local, valor, status: 'Ativo', logs: [log] as any,
  }).select().single();
  if (error) throw error;
  const nova = mapRow(data);
  _taxasCache.push(nova);
  return nova;
};

export const updateTaxaEntrega = async (id: string, valor: number, usuarioId: string, usuarioNome: string): Promise<TaxaEntrega | null> => {
  const taxa = _taxasCache.find(t => t.id === id);
  if (!taxa) return null;
  const agora = new Date().toISOString();
  const log: LogAlteracao = { id: `LOG-${Date.now()}`, data: agora, usuarioId, usuarioNome, valorAnterior: taxa.valor, valorNovo: valor, acao: 'edicao' };
  const newLogs = [...taxa.logs, log];
  const { data, error } = await supabase.from('taxas_entrega').update({
    valor, data_atualizacao: agora, logs: newLogs as any,
  }).eq('id', id).select().single();
  if (error) throw error;
  const updated = mapRow(data);
  const idx = _taxasCache.findIndex(t => t.id === id);
  if (idx !== -1) _taxasCache[idx] = updated;
  return updated;
};

export const toggleStatusTaxaEntrega = async (id: string, usuarioId: string, usuarioNome: string): Promise<TaxaEntrega | null> => {
  const taxa = _taxasCache.find(t => t.id === id);
  if (!taxa) return null;
  const agora = new Date().toISOString();
  const novoStatus = taxa.status === 'Ativo' ? 'Inativo' : 'Ativo';
  const log: LogAlteracao = { id: `LOG-${Date.now()}`, data: agora, usuarioId, usuarioNome, valorAnterior: taxa.valor, valorNovo: taxa.valor, acao: 'status' };
  const newLogs = [...taxa.logs, log];
  const { data, error } = await supabase.from('taxas_entrega').update({
    status: novoStatus, data_atualizacao: agora, logs: newLogs as any,
  }).eq('id', id).select().single();
  if (error) throw error;
  const updated = mapRow(data);
  const idx = _taxasCache.findIndex(t => t.id === id);
  if (idx !== -1) _taxasCache[idx] = updated;
  return updated;
};

export const updateTaxaLocal = async (id: string, local: string): Promise<TaxaEntrega | null> => {
  const { data, error } = await supabase.from('taxas_entrega').update({
    local, data_atualizacao: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error) throw error;
  const updated = mapRow(data);
  const idx = _taxasCache.findIndex(t => t.id === id);
  if (idx !== -1) _taxasCache[idx] = updated;
  return updated;
};

export const deleteTaxaEntrega = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('taxas_entrega').delete().eq('id', id);
  if (error) throw error;
  _taxasCache = _taxasCache.filter(t => t.id !== id);
  return true;
};
