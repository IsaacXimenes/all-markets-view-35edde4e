// API de Valores Recomendados para Trade-In - Supabase
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export interface ValorRecomendadoTroca {
  id: string;
  modelo: string;
  marca: string;
  condicao: 'Semi-novo';
  valorSugerido: number;
  ultimaAtualizacao: string;
}

export interface LogValorTroca {
  id: string;
  valorId: string;
  tipo: 'criacao' | 'edicao' | 'exclusao';
  modelo: string;
  usuario: string;
  dataHora: string;
  detalhes: string;
}

// Cache
let _valoresCache: ValorRecomendadoTroca[] = [];
let _logsCache: LogValorTroca[] = [];
let _initPromise: Promise<void> | null = null;

// Seed data
const SEED_VALORES: Omit<ValorRecomendadoTroca, 'id'>[] = [
  { modelo: 'iPhone 7 – 32 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 50, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 7 Plus – 32 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 100, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 7 Plus – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 200, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 8 – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 50, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 8 – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 100, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 8 Plus – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 200, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 8 Plus – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 300, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone X – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 200, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone X – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 400, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone XR – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 400, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone XR – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 500, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone XR – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 600, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone XS Max – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 500, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone XS Max – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 700, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 11 – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 600, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 11 – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 800, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 11 – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1000, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 11 Pro – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 900, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 11 Pro – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1100, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 11 Pro Max – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1000, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 11 Pro Max – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1200, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 11 Pro Max – 512 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1400, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 12 – 64 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1200, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 12 – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1300, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 12 – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1500, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 12 Pro – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1750, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 12 Pro – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1900, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 12 Pro Max – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2200, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 12 Pro Max – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2300, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 12 Pro Max – 512 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2450, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 13 – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 1700, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 13 – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2000, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 13 Pro – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2400, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 13 Pro – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2500, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 13 Pro Max – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2700, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 13 Pro Max – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2900, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 14 – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2000, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 14 – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2200, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 14 Plus – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2150, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 14 Plus – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2400, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 14 Pro – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2700, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 14 Pro – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2900, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 14 Pro Max – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3200, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 14 Pro Max – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3400, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 15 – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2700, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 15 – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3000, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 15 Plus – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 2900, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 15 Plus – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3300, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 15 Pro – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3400, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 15 Pro – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3600, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 15 Pro Max – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 4000, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 15 Pro Max – 512 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 4300, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 16 – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3500, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 16 – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3800, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 16 Plus – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 3700, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 16 Plus – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 4000, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 16 Pro – 128 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 4500, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 16 Pro – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 4700, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 16 Pro Max – 256 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 5400, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'iPhone 16 Pro Max – 512 GB', marca: 'Apple', condicao: 'Semi-novo', valorSugerido: 5600, ultimaAtualizacao: '2026-02-23' },
  { modelo: 'Samsung Galaxy S24 Ultra', marca: 'Samsung', condicao: 'Semi-novo', valorSugerido: 6000, ultimaAtualizacao: '2025-12-01' },
  { modelo: 'Samsung Galaxy S24+', marca: 'Samsung', condicao: 'Semi-novo', valorSugerido: 4400, ultimaAtualizacao: '2025-12-01' },
  { modelo: 'Samsung Galaxy S24', marca: 'Samsung', condicao: 'Semi-novo', valorSugerido: 3400, ultimaAtualizacao: '2025-12-01' },
  { modelo: 'Samsung Galaxy S23 Ultra', marca: 'Samsung', condicao: 'Semi-novo', valorSugerido: 3900, ultimaAtualizacao: '2025-12-01' },
  { modelo: 'Samsung Galaxy Z Flip 5', marca: 'Samsung', condicao: 'Semi-novo', valorSugerido: 2800, ultimaAtualizacao: '2025-12-01' },
  { modelo: 'Samsung Galaxy Z Fold 5', marca: 'Samsung', condicao: 'Semi-novo', valorSugerido: 5000, ultimaAtualizacao: '2025-12-01' },
  { modelo: 'Xiaomi 14 Ultra', marca: 'Xiaomi', condicao: 'Semi-novo', valorSugerido: 4400, ultimaAtualizacao: '2025-12-01' },
  { modelo: 'Xiaomi 14', marca: 'Xiaomi', condicao: 'Semi-novo', valorSugerido: 3100, ultimaAtualizacao: '2025-12-01' },
];

const mapValorRow = (row: any): ValorRecomendadoTroca => ({
  id: row.id,
  modelo: row.modelo,
  marca: row.marca || 'Apple',
  condicao: row.condicao || 'Semi-novo',
  valorSugerido: Number(row.valor_sugerido) || 0,
  ultimaAtualizacao: row.ultima_atualizacao ? String(row.ultima_atualizacao).split('T')[0] : '',
});

const mapLogRow = (row: any): LogValorTroca => ({
  id: row.id,
  valorId: row.valor_id || '',
  tipo: row.tipo || 'criacao',
  modelo: row.modelo || '',
  usuario: row.usuario || '',
  dataHora: row.data_hora || '',
  detalhes: row.detalhes || '',
});

export const initValoresTrocaCache = async (): Promise<void> => {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const [valoresRes, logsRes] = await Promise.all([
      supabase.from('valores_recomendados_troca').select('*'),
      supabase.from('logs_valor_troca').select('*').order('data_hora', { ascending: false }),
    ]);
    if (valoresRes.error) { console.error('Erro ao carregar valores_recomendados_troca:', valoresRes.error); return; }
    if (!valoresRes.data || valoresRes.data.length === 0) {
      // Seed
      const inserts = SEED_VALORES.map(v => ({
        modelo: v.modelo, marca: v.marca, condicao: v.condicao,
        valor_sugerido: v.valorSugerido, ultima_atualizacao: v.ultimaAtualizacao,
      }));
      const { data: seeded, error: seedErr } = await supabase.from('valores_recomendados_troca').insert(inserts).select();
      if (seedErr) { console.error('Erro ao seed valores_recomendados_troca:', seedErr); return; }
      _valoresCache = (seeded || []).map(mapValorRow);
    } else {
      _valoresCache = valoresRes.data.map(mapValorRow);
    }
    _logsCache = (logsRes.data || []).map(mapLogRow);
  })();
  return _initPromise;
};

const getUsuarioLogado = (): string => {
  try {
    const state = useAuthStore.getState();
    return state.user?.colaborador?.nome || state.user?.username || 'Sistema';
  } catch { return 'Sistema'; }
};

const registrarLog = async (tipo: LogValorTroca['tipo'], valorId: string, modelo: string, detalhes: string) => {
  const usuario = getUsuarioLogado();
  const dataHora = new Date().toISOString();
  const { data, error } = await supabase.from('logs_valor_troca').insert({
    valor_id: valorId, tipo, modelo, usuario, data_hora: dataHora, detalhes,
  }).select().single();
  if (!error && data) {
    _logsCache.unshift(mapLogRow(data));
  }
};

// Leitura síncrona
export const getValoresRecomendadosTroca = (): ValorRecomendadoTroca[] => [..._valoresCache];

export const getValorRecomendado = (modelo: string): ValorRecomendadoTroca | null =>
  _valoresCache.find(v => v.modelo.toLowerCase() === modelo.toLowerCase()) || null;

export const buscarValoresRecomendados = (busca: string): ValorRecomendadoTroca[] => {
  if (!busca.trim()) return [..._valoresCache];
  const termo = busca.toLowerCase();
  return _valoresCache.filter(v => v.modelo.toLowerCase().includes(termo) || v.marca.toLowerCase().includes(termo));
};

// Mutações async
export const criarValorRecomendado = async (dados: Omit<ValorRecomendadoTroca, 'id' | 'ultimaAtualizacao'>): Promise<ValorRecomendadoTroca> => {
  const ultimaAtualizacao = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('valores_recomendados_troca').insert({
    modelo: dados.modelo, marca: dados.marca, condicao: dados.condicao,
    valor_sugerido: dados.valorSugerido, ultima_atualizacao: ultimaAtualizacao,
  }).select().single();
  if (error) throw error;
  const novo = mapValorRow(data);
  _valoresCache.push(novo);
  await registrarLog('criacao', novo.id, novo.modelo, `Criado valor para ${novo.modelo}: Sugerido R$${novo.valorSugerido}`);
  return novo;
};

export const editarValorRecomendado = async (id: string, dados: Partial<Omit<ValorRecomendadoTroca, 'id'>>): Promise<ValorRecomendadoTroca | null> => {
  const idx = _valoresCache.findIndex(v => v.id === id);
  if (idx === -1) return null;
  const anterior = { ..._valoresCache[idx] };
  const alteracoes: string[] = [];

  if (dados.valorSugerido !== undefined && dados.valorSugerido !== anterior.valorSugerido) alteracoes.push(`Val.Sugerido: R$${anterior.valorSugerido} → R$${dados.valorSugerido}`);
  if (dados.modelo !== undefined && dados.modelo !== anterior.modelo) alteracoes.push(`Modelo: ${anterior.modelo} → ${dados.modelo}`);
  if (dados.marca !== undefined && dados.marca !== anterior.marca) alteracoes.push(`Marca: ${anterior.marca} → ${dados.marca}`);

  const dbUpdates: any = { ultima_atualizacao: new Date().toISOString().split('T')[0] };
  if (dados.modelo !== undefined) dbUpdates.modelo = dados.modelo;
  if (dados.marca !== undefined) dbUpdates.marca = dados.marca;
  if (dados.valorSugerido !== undefined) dbUpdates.valor_sugerido = dados.valorSugerido;
  if (dados.condicao !== undefined) dbUpdates.condicao = dados.condicao;

  const { data, error } = await supabase.from('valores_recomendados_troca').update(dbUpdates).eq('id', id).select().single();
  if (error) throw error;
  const updated = mapValorRow(data);
  _valoresCache[idx] = updated;

  if (alteracoes.length > 0) {
    await registrarLog('edicao', id, updated.modelo, alteracoes.join('\n'));
  }
  return updated;
};

export const excluirValorRecomendado = async (id: string): Promise<boolean> => {
  const idx = _valoresCache.findIndex(v => v.id === id);
  if (idx === -1) return false;
  const removido = _valoresCache[idx];
  const { error } = await supabase.from('valores_recomendados_troca').delete().eq('id', id);
  if (error) throw error;
  _valoresCache.splice(idx, 1);
  await registrarLog('exclusao', id, removido.modelo, `Removido valor para ${removido.modelo}`);
  return true;
};

// Logs
export const getLogsValorTroca = (valorId?: string): LogValorTroca[] => {
  if (valorId) return _logsCache.filter(l => l.valorId === valorId);
  return [..._logsCache];
};

// Exportar CSV
export const exportarValoresCSV = (): string => {
  const header = 'ID,Modelo,Marca,Valor Sugerido,Última Atualização\n';
  const rows = _valoresCache.map(v =>
    `${v.id},${v.modelo},${v.marca},${v.valorSugerido},${v.ultimaAtualizacao}`
  ).join('\n');
  return header + rows;
};
