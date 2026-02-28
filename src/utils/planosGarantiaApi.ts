// API para gerenciamento de planos de garantia - Supabase
import { supabase } from '@/integrations/supabase/client';

export interface PlanoGarantia {
  id: string;
  nome: string;
  tipo: 'Apple' | 'Thiago Imports';
  condicao: 'Novo' | 'Seminovo' | 'Ambos';
  meses: number;
  valor: number;
  modelos: string[];
  descricao: string;
  status: 'Ativo' | 'Inativo';
}

// Cache de módulo
let _planosCache: PlanoGarantia[] = [];
let _initPromise: Promise<void> | null = null;

// Seed data para primeira execução
const SEED_PLANOS: Omit<PlanoGarantia, 'id'>[] = [
  { nome: 'Silver', tipo: 'Thiago Imports', condicao: 'Seminovo', meses: 6, valor: 219.90, modelos: ['iPhone 11','iPhone 11 Pro','iPhone 11 Pro Max','iPhone 12','iPhone 12 Mini','iPhone 12 Pro','iPhone 12 Pro Max','iPhone 13','iPhone 13 Mini','iPhone 13 Pro','iPhone 13 Pro Max','iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max','iPhone XR'], descricao: 'Plano Silver 6 meses para seminovos', status: 'Ativo' },
  { nome: 'Silver', tipo: 'Thiago Imports', condicao: 'Seminovo', meses: 6, valor: 249.90, modelos: ['iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max'], descricao: 'Plano Silver 6 meses para iPhone 17 seminovos', status: 'Ativo' },
  { nome: 'Silver', tipo: 'Thiago Imports', condicao: 'Novo', meses: 6, valor: 279.90, modelos: ['iPhone 13','iPhone 13 Mini','iPhone 13 Pro','iPhone 13 Pro Max','iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max'], descricao: 'Plano Silver 6 meses para novos', status: 'Ativo' },
  { nome: 'Silver', tipo: 'Thiago Imports', condicao: 'Novo', meses: 6, valor: 379.90, modelos: ['iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max'], descricao: 'Plano Silver 6 meses para iPhone 17 novos', status: 'Ativo' },
  { nome: 'Gold', tipo: 'Thiago Imports', condicao: 'Seminovo', meses: 12, valor: 349.90, modelos: ['iPhone 11','iPhone 11 Pro','iPhone 11 Pro Max','iPhone 12','iPhone 12 Mini','iPhone 12 Pro','iPhone 12 Pro Max','iPhone 13','iPhone 13 Mini','iPhone 13 Pro','iPhone 13 Pro Max','iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max','iPhone XR'], descricao: 'Plano Gold 12 meses para seminovos', status: 'Ativo' },
  { nome: 'Gold', tipo: 'Thiago Imports', condicao: 'Seminovo', meses: 12, valor: 379.90, modelos: ['iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max'], descricao: 'Plano Gold 12 meses para iPhone 17 seminovos', status: 'Ativo' },
  { nome: 'Gold', tipo: 'Thiago Imports', condicao: 'Novo', meses: 12, valor: 399.90, modelos: ['iPhone 13','iPhone 13 Mini','iPhone 13 Pro','iPhone 13 Pro Max','iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max'], descricao: 'Plano Gold 12 meses para novos', status: 'Ativo' },
  { nome: 'Gold', tipo: 'Thiago Imports', condicao: 'Novo', meses: 12, valor: 449.90, modelos: ['iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max'], descricao: 'Plano Gold 12 meses para iPhone 17 novos', status: 'Ativo' },
  { nome: 'Sem Garantia Adicional', tipo: 'Thiago Imports', condicao: 'Ambos', meses: 0, valor: 0, modelos: [], descricao: 'Produto vendido sem garantia adicional', status: 'Ativo' },
];

const mapRow = (row: any): PlanoGarantia => ({
  id: row.id,
  nome: row.nome,
  tipo: row.tipo || 'Thiago Imports',
  condicao: row.condicao || 'Ambos',
  meses: row.meses || 0,
  valor: Number(row.valor) || 0,
  modelos: Array.isArray(row.modelos) ? row.modelos : [],
  descricao: row.descricao || '',
  status: row.status || 'Ativo',
});

export const initPlanosGarantiaCache = async (): Promise<void> => {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const { data, error } = await supabase.from('planos_garantia').select('*');
    if (error) { console.error('Erro ao carregar planos_garantia:', error); return; }
    if (!data || data.length === 0) {
      // Seed
      const inserts = SEED_PLANOS.map(p => ({
        nome: p.nome, tipo: p.tipo, condicao: p.condicao, meses: p.meses,
        valor: p.valor, modelos: p.modelos as any, descricao: p.descricao, status: p.status,
      }));
      const { data: seeded, error: seedErr } = await supabase.from('planos_garantia').insert(inserts).select();
      if (seedErr) { console.error('Erro ao seed planos_garantia:', seedErr); return; }
      _planosCache = (seeded || []).map(mapRow);
    } else {
      _planosCache = data.map(mapRow);
    }
  })();
  return _initPromise;
};

// Leitura síncrona do cache
export const getPlanosGarantia = (): PlanoGarantia[] => [..._planosCache];

export const getPlanoById = (id: string): PlanoGarantia | null =>
  _planosCache.find(p => p.id === id) || null;

export const getPlanosAtivos = (): PlanoGarantia[] =>
  _planosCache.filter(p => p.status === 'Ativo');

export const getPlanosPorModelo = (modelo: string, condicao: 'Novo' | 'Seminovo'): PlanoGarantia[] =>
  _planosCache.filter(p =>
    p.status === 'Ativo' &&
    (p.condicao === condicao || p.condicao === 'Ambos') &&
    (p.modelos.length === 0 || p.modelos.some(m => modelo.toLowerCase().includes(m.toLowerCase())))
  );

// Mutações async
export const addPlanoGarantia = async (plano: Omit<PlanoGarantia, 'id'>): Promise<PlanoGarantia> => {
  const { data, error } = await supabase.from('planos_garantia').insert({
    nome: plano.nome, tipo: plano.tipo, condicao: plano.condicao, meses: plano.meses,
    valor: plano.valor, modelos: plano.modelos as any, descricao: plano.descricao, status: plano.status,
  }).select().single();
  if (error) throw error;
  const novo = mapRow(data);
  _planosCache.push(novo);
  return novo;
};

export const updatePlanoGarantia = async (id: string, updates: Partial<PlanoGarantia>): Promise<PlanoGarantia | null> => {
  const dbUpdates: any = {};
  if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
  if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
  if (updates.condicao !== undefined) dbUpdates.condicao = updates.condicao;
  if (updates.meses !== undefined) dbUpdates.meses = updates.meses;
  if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
  if (updates.modelos !== undefined) dbUpdates.modelos = updates.modelos;
  if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { data, error } = await supabase.from('planos_garantia').update(dbUpdates).eq('id', id).select().single();
  if (error) throw error;
  const updated = mapRow(data);
  const idx = _planosCache.findIndex(p => p.id === id);
  if (idx !== -1) _planosCache[idx] = updated;
  return updated;
};

export const deletePlanoGarantia = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('planos_garantia').delete().eq('id', id);
  if (error) throw error;
  _planosCache = _planosCache.filter(p => p.id !== id);
  return true;
};

export const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
