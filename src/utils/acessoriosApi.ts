// API de Acessórios - Migrada para Supabase
import { supabase } from '@/integrations/supabase/client';

// ==================== INTERFACES ====================

export interface HistoricoValorRecomendadoAcessorio {
  data: string;
  usuario: string;
  valorAntigo: number | null;
  valorNovo: number;
}

export interface Acessorio {
  id: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  valorCusto: number;
  valorRecomendado?: number;
  historicoValorRecomendado?: HistoricoValorRecomendadoAcessorio[];
  loja: string;
  fornecedorId?: string;
  imei?: string;
}

export interface VendaAcessorio {
  id: string;
  acessorioId: string;
  descricao: string;
  quantidade: number;
  valorRecomendado: number;
  valorUnitario: number;
  valorTotal: number;
}

// ==================== CACHE ====================

let acessoriosCache: Acessorio[] = [];
let cacheInitialized = false;

const mapFromDB = (row: any): Acessorio => ({
  id: row.id,
  descricao: row.nome,
  categoria: row.categoria || '',
  quantidade: row.quantidade || 0,
  valorCusto: Number(row.valor_custo) || 0,
  valorRecomendado: Number(row.valor_venda) || 0,
  loja: row.loja_id || '',
  fornecedorId: row.marca || undefined,
  imei: row.imei || undefined,
});

const mapToDB = (a: Partial<Acessorio>) => ({
  ...(a.descricao !== undefined && { nome: a.descricao }),
  ...(a.categoria !== undefined && { categoria: a.categoria }),
  ...(a.quantidade !== undefined && { quantidade: a.quantidade }),
  ...(a.valorCusto !== undefined && { valor_custo: a.valorCusto }),
  ...(a.valorRecomendado !== undefined && { valor_venda: a.valorRecomendado }),
  ...(a.loja !== undefined && { loja_id: a.loja || null }),
  ...(a.fornecedorId !== undefined && { marca: a.fornecedorId }),
  ...(a.imei !== undefined && { imei: a.imei || null }),
});

export const initAcessoriosCache = async () => {
  if (cacheInitialized) return;
  const { data, error } = await supabase.from('acessorios').select('*');
  if (error) { console.error('[ACESSORIOS] init error:', error); return; }
  acessoriosCache = (data || []).map(mapFromDB);
  cacheInitialized = true;
};

// Auto-init
initAcessoriosCache();

// ==================== CATEGORIAS ====================

const categoriasAcessorios = [
  'Capas', 'Carregadores', 'Cabos', 'Películas', 'Áudio',
  'Suportes', 'Baterias Externas', 'Outros'
];

export const getCategoriasAcessorios = (): string[] => [...categoriasAcessorios];

// ==================== GET (síncrono via cache) ====================

export const getAcessorios = (): Acessorio[] => [...acessoriosCache];

export const getAcessorioById = (id: string): Acessorio | null => {
  return acessoriosCache.find(a => a.id === id) || null;
};

export const getAcessoriosByLoja = (loja: string): Acessorio[] => {
  return acessoriosCache.filter(a => a.loja === loja);
};

export const isAcessorioIdRegistered = (id: string): boolean => {
  return acessoriosCache.some(a => a.id === id);
};

// ==================== MUTAÇÕES (async) ====================

export const addAcessorio = async (acessorio: Omit<Acessorio, 'id'>): Promise<Acessorio> => {
  const dbData = mapToDB(acessorio);
  const { data, error } = await supabase.from('acessorios').insert(dbData).select().single();
  if (error) throw error;
  const novo = mapFromDB(data);
  acessoriosCache.push(novo);
  return novo;
};

export const updateAcessorioQuantidade = async (id: string, novaQuantidade: number): Promise<Acessorio | null> => {
  const { error } = await supabase.from('acessorios').update({ quantidade: novaQuantidade }).eq('id', id);
  if (error) { console.error(error); throw error; }
  const idx = acessoriosCache.findIndex(a => a.id === id);
  if (idx !== -1) { acessoriosCache[idx].quantidade = novaQuantidade; return acessoriosCache[idx]; }
  return null;
};

export const subtrairEstoqueAcessorio = async (id: string, quantidade: number): Promise<boolean> => {
  const a = acessoriosCache.find(x => x.id === id);
  if (!a || a.quantidade < quantidade) return false;
  const nova = a.quantidade - quantidade;
  const { error } = await supabase.from('acessorios').update({ quantidade: nova }).eq('id', id);
  if (error) { console.error(error); throw error; }
  a.quantidade = nova;
  return true;
};

export const adicionarEstoqueAcessorio = async (id: string, quantidade: number, valorCusto?: number): Promise<boolean> => {
  const a = acessoriosCache.find(x => x.id === id);
  if (!a) return false;
  const updates: any = { quantidade: a.quantidade + quantidade };
  if (valorCusto !== undefined) updates.valor_custo = valorCusto;
  const { error } = await supabase.from('acessorios').update(updates).eq('id', id);
  if (error) { console.error(error); throw error; }
  a.quantidade += quantidade;
  if (valorCusto !== undefined) a.valorCusto = valorCusto;
  return true;
};

export const getOrCreateAcessorio = async (
  descricao: string, categoria: string, quantidade: number, valorCusto: number, loja: string
): Promise<Acessorio> => {
  const existente = acessoriosCache.find(
    a => a.descricao.toLowerCase() === descricao.toLowerCase() && a.loja === loja
  );
  if (existente) {
    await adicionarEstoqueAcessorio(existente.id, quantidade, valorCusto);
    return existente;
  }
  return addAcessorio({ descricao, categoria, quantidade, valorCusto, loja });
};

export const updateValorRecomendadoAcessorio = async (
  id: string, novoValor: number, usuario: string
): Promise<Acessorio | null> => {
  const a = acessoriosCache.find(x => x.id === id);
  if (!a) return null;
  const { error } = await supabase.from('acessorios').update({ valor_venda: novoValor }).eq('id', id);
  if (error) { console.error(error); return null; }
  const entry: HistoricoValorRecomendadoAcessorio = {
    data: new Date().toISOString().split('T')[0], usuario,
    valorAntigo: a.valorRecomendado || null, valorNovo: novoValor
  };
  a.valorRecomendado = novoValor;
  if (!a.historicoValorRecomendado) a.historicoValorRecomendado = [];
  a.historicoValorRecomendado.unshift(entry);
  return a;
};

export const transferirAcessorioOrigem = async (id: string, quantidade: number, lojaOrigem: string): Promise<boolean> => {
  const a = acessoriosCache.find(x => x.id === id && x.loja === lojaOrigem);
  if (!a || a.quantidade < quantidade) return false;
  return subtrairEstoqueAcessorio(id, quantidade);
};

export const receberAcessorioDestino = async (id: string, quantidade: number, lojaDestino: string): Promise<boolean> => {
  const origem = acessoriosCache.find(x => x.id === id);
  if (!origem) return false;
  const existente = acessoriosCache.find(
    a => a.descricao.toLowerCase() === origem.descricao.toLowerCase() && a.loja === lojaDestino
  );
  if (existente) {
    return adicionarEstoqueAcessorio(existente.id, quantidade);
  }
  await addAcessorio({
    descricao: origem.descricao, categoria: origem.categoria, quantidade,
    valorCusto: origem.valorCusto, valorRecomendado: origem.valorRecomendado, loja: lojaDestino,
    fornecedorId: origem.fornecedorId
  });
  return true;
};

// ==================== EXPORT CSV ====================

export const exportAcessoriosToCSV = (data: Acessorio[], filename: string) => {
  if (data.length === 0) return;
  const headers = ['ID', 'Descrição', 'Categoria', 'Fornecedor', 'Quantidade', 'Valor Custo', 'Valor Recomendado', 'Loja'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.id, `"${row.descricao}"`, row.categoria, `"${row.fornecedorId || ''}"`,
      row.quantidade, row.valorCusto.toFixed(2), row.valorRecomendado?.toFixed(2) || '', row.loja
    ].join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export { formatCurrency } from '@/utils/formatUtils';
