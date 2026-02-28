// Cores de Aparelhos API - Supabase
import { supabase } from '@/integrations/supabase/client';

export interface CorAparelho {
  id: string;
  nome: string;
  hexadecimal: string;
  status: 'Ativo' | 'Inativo';
}

// Cache local
let coresCache: CorAparelho[] = [];
let cacheInitialized = false;

// Seed data para inicialização
const SEED_CORES: Omit<CorAparelho, 'id'>[] = [
  { nome: 'Preto', hexadecimal: '#000000', status: 'Ativo' },
  { nome: 'Branco', hexadecimal: '#FFFFFF', status: 'Ativo' },
  { nome: 'Prata', hexadecimal: '#C0C0C0', status: 'Ativo' },
  { nome: 'Ouro', hexadecimal: '#FFD700', status: 'Ativo' },
  { nome: 'Ouro Rosa', hexadecimal: '#B76E79', status: 'Ativo' },
  { nome: 'Azul', hexadecimal: '#007AFF', status: 'Ativo' },
  { nome: 'Azul Sierra', hexadecimal: '#69ABE5', status: 'Ativo' },
  { nome: 'Azul Pacífico', hexadecimal: '#184E77', status: 'Ativo' },
  { nome: 'Azul Ultramar', hexadecimal: '#2E4A87', status: 'Ativo' },
  { nome: 'Vermelho (PRODUCT)RED', hexadecimal: '#FF0000', status: 'Ativo' },
  { nome: 'Verde', hexadecimal: '#34C759', status: 'Ativo' },
  { nome: 'Verde Alpino', hexadecimal: '#5E8C61', status: 'Ativo' },
  { nome: 'Verde Meia-Noite', hexadecimal: '#1D3C34', status: 'Ativo' },
  { nome: 'Roxo', hexadecimal: '#AF52DE', status: 'Ativo' },
  { nome: 'Roxo Profundo', hexadecimal: '#1D1D3F', status: 'Ativo' },
  { nome: 'Laranja', hexadecimal: '#FF9500', status: 'Ativo' },
  { nome: 'Rosa', hexadecimal: '#FF2D55', status: 'Ativo' },
  { nome: 'Cinza Espacial', hexadecimal: '#4A4A4A', status: 'Ativo' },
  { nome: 'Grafite', hexadecimal: '#41424C', status: 'Ativo' },
  { nome: 'Titânio Natural', hexadecimal: '#BEB8AE', status: 'Ativo' },
  { nome: 'Titânio Preto', hexadecimal: '#3C3C3D', status: 'Ativo' },
  { nome: 'Titânio Branco', hexadecimal: '#F0F0EC', status: 'Ativo' },
  { nome: 'Titânio Azul', hexadecimal: '#394C60', status: 'Ativo' },
  { nome: 'Estelar', hexadecimal: '#FAF7F2', status: 'Ativo' },
  { nome: 'Meia-Noite', hexadecimal: '#2C2C2E', status: 'Ativo' },
  { nome: 'Amarelo', hexadecimal: '#FFCC00', status: 'Ativo' },
  { nome: 'Coral', hexadecimal: '#FF6F61', status: 'Ativo' },
];

const mapRow = (row: any): CorAparelho => ({
  id: row.id,
  nome: row.nome,
  hexadecimal: row.hexadecimal || '#000000',
  status: (row.status as 'Ativo' | 'Inativo') || 'Ativo',
});

export const initCoresCache = async () => {
  const { data, error } = await supabase.from('cores_aparelho').select('*').order('nome');
  if (error) { console.error('[CoresAPI] Erro ao carregar:', error); return; }

  if (!data || data.length === 0) {
    // Seed inicial
    const { data: inserted, error: insertErr } = await supabase
      .from('cores_aparelho')
      .insert(SEED_CORES.map(c => ({ nome: c.nome, hexadecimal: c.hexadecimal, status: c.status })))
      .select();
    if (insertErr) { console.error('[CoresAPI] Erro seed:', insertErr); return; }
    coresCache = (inserted || []).map(mapRow);
  } else {
    coresCache = data.map(mapRow);
  }
  cacheInitialized = true;
};

// API Functions (síncronas via cache)
export const getCores = (): CorAparelho[] => [...coresCache];

export const getCorById = (id: string) => coresCache.find(c => c.id === id);

export const addCor = async (cor: Omit<CorAparelho, 'id'>): Promise<CorAparelho> => {
  const { data, error } = await supabase.from('cores_aparelho')
    .insert({ nome: cor.nome, hexadecimal: cor.hexadecimal, status: cor.status })
    .select().single();
  if (error) throw error;
  const nova = mapRow(data);
  coresCache.push(nova);
  return nova;
};

export const updateCor = async (id: string, updates: Partial<CorAparelho>): Promise<CorAparelho | null> => {
  const payload: any = {};
  if (updates.nome !== undefined) payload.nome = updates.nome;
  if (updates.hexadecimal !== undefined) payload.hexadecimal = updates.hexadecimal;
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await supabase.from('cores_aparelho').update(payload).eq('id', id).select().single();
  if (error || !data) return null;
  const updated = mapRow(data);
  const idx = coresCache.findIndex(c => c.id === id);
  if (idx !== -1) coresCache[idx] = updated;
  return updated;
};

export const deleteCor = async (id: string): Promise<void> => {
  await supabase.from('cores_aparelho').delete().eq('id', id);
  coresCache = coresCache.filter(c => c.id !== id);
};

// Validar código hexadecimal
export const isValidHex = (hex: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
};
