// API de Metas Mensais por Loja - Migrada para Supabase
import { supabase } from '@/integrations/supabase/client';

export interface MetaLoja {
  id: string;
  lojaId: string;
  mes: number;
  ano: number;
  metaFaturamento: number;
  metaAcessorios: number;
  metaGarantia: number;
  metaAssistencia: number;
  dataCriacao: string;
  ultimaAtualizacao: string;
}

// ==================== CACHE ====================

let metasCache: MetaLoja[] = [];
let cacheInitialized = false;

const mapFromDB = (row: any): MetaLoja => ({
  id: row.id,
  lojaId: row.loja_id || '',
  mes: row.mes || 1,
  ano: row.ano || new Date().getFullYear(),
  metaFaturamento: Number(row.meta_faturamento) || 0,
  metaAcessorios: Number(row.meta_acessorios) || 0,
  metaGarantia: Number(row.meta_garantia) || 0,
  metaAssistencia: Number(row.meta_assistencia) || 0,
  dataCriacao: row.created_at || new Date().toISOString(),
  ultimaAtualizacao: row.ultima_atualizacao || row.created_at || new Date().toISOString(),
});

export const initMetasCache = async () => {
  if (cacheInitialized) return;
  const { data, error } = await supabase.from('metas_lojas').select('*');
  if (error) { console.error('[METAS] init error:', error); return; }
  metasCache = (data || []).map(mapFromDB);
  cacheInitialized = true;
};

// Auto-init
initMetasCache();

// ==================== GET (síncrono) ====================

export const getMetas = (): MetaLoja[] => [...metasCache];

export const getMetaByLojaEMes = (lojaId: string, mes: number, ano: number): MetaLoja | null => {
  return metasCache.find(m => m.lojaId === lojaId && m.mes === mes && m.ano === ano) || null;
};

// ==================== MUTAÇÕES (async) ====================

export const addMeta = async (data: Omit<MetaLoja, 'id' | 'dataCriacao' | 'ultimaAtualizacao'>): Promise<MetaLoja> => {
  const existente = getMetaByLojaEMes(data.lojaId, data.mes, data.ano);
  if (existente) {
    return (await updateMeta(existente.id, data))!;
  }

  const { data: row, error } = await supabase.from('metas_lojas').insert({
    loja_id: data.lojaId || null,
    mes: data.mes,
    ano: data.ano,
    meta_faturamento: data.metaFaturamento,
    meta_acessorios: data.metaAcessorios,
    meta_garantia: data.metaGarantia,
    meta_assistencia: data.metaAssistencia,
  }).select().single();
  if (error) throw error;
  const nova = mapFromDB(row);
  metasCache.push(nova);
  return nova;
};

export const updateMeta = async (id: string, data: Partial<Omit<MetaLoja, 'id' | 'dataCriacao'>>): Promise<MetaLoja | null> => {
  const updates: any = { ultima_atualizacao: new Date().toISOString() };
  if (data.metaFaturamento !== undefined) updates.meta_faturamento = data.metaFaturamento;
  if (data.metaAcessorios !== undefined) updates.meta_acessorios = data.metaAcessorios;
  if (data.metaGarantia !== undefined) updates.meta_garantia = data.metaGarantia;
  if (data.metaAssistencia !== undefined) updates.meta_assistencia = data.metaAssistencia;
  if (data.lojaId !== undefined) updates.loja_id = data.lojaId;
  if (data.mes !== undefined) updates.mes = data.mes;
  if (data.ano !== undefined) updates.ano = data.ano;

  const { error } = await supabase.from('metas_lojas').update(updates).eq('id', id);
  if (error) { console.error(error); return null; }

  const idx = metasCache.findIndex(m => m.id === id);
  if (idx !== -1) {
    metasCache[idx] = { ...metasCache[idx], ...data, ultimaAtualizacao: updates.ultima_atualizacao };
    return metasCache[idx];
  }
  return null;
};

export const deleteMeta = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('metas_lojas').delete().eq('id', id);
  if (error) { console.error(error); return false; }
  metasCache = metasCache.filter(m => m.id !== id);
  return true;
};
