// API para gestão de Peças no Estoque - Supabase
import { supabase } from '@/integrations/supabase/client';

export interface MovimentacaoPeca {
  id: string;
  pecaId: string;
  tipo: 'Entrada' | 'Saída' | 'Reserva';
  quantidade: number;
  data: string;
  osId?: string;
  descricao: string;
}

export interface Peca {
  id: string;
  descricao: string;
  lojaId: string;
  modelo: string;
  valorCusto: number;
  valorRecomendado: number;
  quantidade: number;
  dataEntrada: string;
  origem: 'Nota de Compra' | 'Manual' | 'Produto Thiago' | 'Solicitação' | 'Solicitação Cancelada' | 'Retirada de Peça' | 'Consignacao';
  notaCompraId?: string;
  loteConsignacaoId?: string;
  status: 'Disponível' | 'Utilizada' | 'Devolvida';
  statusMovimentacao?: 'Em movimentação' | null;
  movimentacaoPecaId?: string;
  fornecedorId?: string;
}

// ==================== MAPEAMENTO SUPABASE ====================

const mapPecaFromDB = (row: any): Peca => ({
  id: row.id,
  descricao: row.descricao,
  lojaId: row.loja_id || '',
  modelo: row.modelo || '',
  valorCusto: Number(row.valor_custo) || 0,
  valorRecomendado: Number(row.valor_recomendado) || 0,
  quantidade: row.quantidade || 0,
  dataEntrada: row.data_entrada || row.created_at || '',
  origem: row.origem || 'Manual',
  notaCompraId: row.nota_compra_id || undefined,
  loteConsignacaoId: row.lote_consignacao_id || undefined,
  status: row.status || 'Disponível',
  statusMovimentacao: row.status_movimentacao || null,
  movimentacaoPecaId: row.movimentacao_peca_id || undefined,
  fornecedorId: row.fornecedor_id || undefined,
});

const mapPecaToDB = (peca: Partial<Peca>) => ({
  ...(peca.descricao !== undefined && { descricao: peca.descricao }),
  ...(peca.lojaId !== undefined && { loja_id: peca.lojaId || null }),
  ...(peca.modelo !== undefined && { modelo: peca.modelo }),
  ...(peca.valorCusto !== undefined && { valor_custo: peca.valorCusto }),
  ...(peca.valorRecomendado !== undefined && { valor_recomendado: peca.valorRecomendado }),
  ...(peca.quantidade !== undefined && { quantidade: peca.quantidade }),
  ...(peca.dataEntrada !== undefined && { data_entrada: peca.dataEntrada?.split('T')[0] || null }),
  ...(peca.origem !== undefined && { origem: peca.origem }),
  ...(peca.notaCompraId !== undefined && { nota_compra_id: peca.notaCompraId || null }),
  ...(peca.loteConsignacaoId !== undefined && { lote_consignacao_id: peca.loteConsignacaoId || null }),
  ...(peca.status !== undefined && { status: peca.status }),
  ...(peca.statusMovimentacao !== undefined && { status_movimentacao: peca.statusMovimentacao }),
  ...(peca.movimentacaoPecaId !== undefined && { movimentacao_peca_id: peca.movimentacaoPecaId || null }),
  ...(peca.fornecedorId !== undefined && { fornecedor_id: peca.fornecedorId || null }),
});

const mapMovFromDB = (row: any): MovimentacaoPeca => ({
  id: row.id,
  pecaId: row.peca_id || '',
  tipo: row.tipo || 'Entrada',
  quantidade: row.quantidade || 1,
  data: row.data || row.created_at || '',
  osId: row.os_id || undefined,
  descricao: row.descricao || '',
});

// ==================== CACHE ====================
let _pecasCache: Peca[] = [];
let _movCache: MovimentacaoPeca[] = [];
let _cacheLoaded = false;

export const initPecasCache = async (): Promise<void> => {
  try {
    const { data: pecasData } = await supabase.from('pecas').select('*');
    _pecasCache = (pecasData || []).map(mapPecaFromDB);

    const { data: movData } = await supabase.from('movimentacoes_pecas').select('*');
    _movCache = (movData || []).map(mapMovFromDB);
    _cacheLoaded = true;
  } catch (e) {
    console.error('[PECAS] Erro ao carregar cache:', e);
  }
};

// Compatibilidade: inicialização legada (no-op)
export const initializePecasWithLojaIds = (_lojaIds: string[]): void => {
  // No-op - dados vêm do Supabase
};

// ==================== CRUD ====================

export const getPecas = (): Peca[] => [..._pecasCache];

export const getPecaById = (id: string): Peca | undefined => _pecasCache.find(p => p.id === id);

export const getPecaByDescricao = (descricao: string): Peca | undefined => {
  const lower = descricao.toLowerCase();
  return _pecasCache.find(p => p.descricao.toLowerCase().includes(lower));
};

export const addPeca = async (peca: Omit<Peca, 'id'>): Promise<Peca> => {
  const dbData = mapPecaToDB(peca);
  const { data, error } = await supabase.from('pecas').insert(dbData).select().single();
  if (error) throw error;
  const newPeca = mapPecaFromDB(data);

  // Registrar movimentação de entrada
  await supabase.from('movimentacoes_pecas').insert({
    peca_id: newPeca.id,
    tipo: 'Entrada',
    quantidade: newPeca.quantidade,
    data: newPeca.dataEntrada || new Date().toISOString(),
    descricao: `Entrada - ${newPeca.origem}`,
  });

  _pecasCache.push(newPeca);
  return newPeca;
};

export const updatePeca = async (id: string, updates: Partial<Peca>): Promise<Peca | null> => {
  const dbData = mapPecaToDB(updates);
  const { data, error } = await supabase.from('pecas').update(dbData).eq('id', id).select().single();
  if (error || !data) return null;
  const updated = mapPecaFromDB(data);
  const idx = _pecasCache.findIndex(p => p.id === id);
  if (idx !== -1) _pecasCache[idx] = updated;
  return updated;
};

export const deletePeca = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('pecas').delete().eq('id', id);
  if (error) return false;
  _pecasCache = _pecasCache.filter(p => p.id !== id);
  return true;
};

// Callback para registrar consumo de consignação
let onConsumoPecaConsignada: ((pecaId: string, osId: string, tecnico: string, quantidade: number) => void) | null = null;

export const setOnConsumoPecaConsignada = (cb: (pecaId: string, osId: string, tecnico: string, quantidade: number) => void) => {
  onConsumoPecaConsignada = cb;
};

// Dar baixa em peça do estoque
export const darBaixaPeca = async (id: string, quantidade: number = 1, osId?: string, tecnico?: string): Promise<{ sucesso: boolean; mensagem: string }> => {
  const peca = _pecasCache.find(p => p.id === id);
  if (!peca) return { sucesso: false, mensagem: `Peça ${id} não encontrada no estoque` };
  if (peca.status !== 'Disponível') return { sucesso: false, mensagem: `Peça ${peca.descricao} não está disponível (status: ${peca.status})` };
  if (peca.quantidade < quantidade) return { sucesso: false, mensagem: `Quantidade insuficiente de ${peca.descricao}. Disponível: ${peca.quantidade}, Solicitado: ${quantidade}` };

  const novaQtd = peca.quantidade - quantidade;
  const novoStatus = novaQtd === 0 ? 'Utilizada' : peca.status;

  await supabase.from('pecas').update({ quantidade: novaQtd, status: novoStatus }).eq('id', id);
  peca.quantidade = novaQtd;
  peca.status = novoStatus as Peca['status'];

  await supabase.from('movimentacoes_pecas').insert({
    peca_id: id,
    tipo: 'Saída',
    quantidade,
    data: new Date().toISOString(),
    os_id: osId || null,
    descricao: `Baixa para OS${osId ? ` ${osId}` : ''} - ${peca.descricao}`,
  });

  if (peca.loteConsignacaoId && onConsumoPecaConsignada && osId) {
    onConsumoPecaConsignada(id, osId, tecnico || 'Sistema', quantidade);
  }

  return { sucesso: true, mensagem: `Baixa de ${quantidade} unidade(s) de ${peca.descricao} realizada com sucesso` };
};

// Buscar movimentações por peça
export const getMovimentacoesByPecaId = (pecaId: string): MovimentacaoPeca[] => {
  return _movCache
    .filter(m => m.pecaId === pecaId)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
};

// Adicionar movimentação manual
export const addMovimentacaoPeca = async (mov: Omit<MovimentacaoPeca, 'id'>): Promise<MovimentacaoPeca> => {
  const { data, error } = await supabase.from('movimentacoes_pecas').insert({
    peca_id: mov.pecaId,
    tipo: mov.tipo,
    quantidade: mov.quantidade,
    data: mov.data,
    os_id: mov.osId || null,
    descricao: mov.descricao,
  }).select().single();
  if (error) throw error;
  const newMov = mapMovFromDB(data);
  _movCache.push(newMov);
  return newMov;
};

export const exportPecasToCSV = (data: Peca[], filename: string): void => {
  const headers = ['ID', 'Descrição', 'Loja', 'Modelo', 'Valor Custo', 'Valor Recomendado', 'Quantidade', 'Data Entrada', 'Origem', 'Status'];
  const rows = data.map(p => [
    p.id, p.descricao, p.lojaId, p.modelo,
    p.valorCusto.toFixed(2), p.valorRecomendado.toFixed(2),
    p.quantidade.toString(),
    new Date(p.dataEntrada).toLocaleDateString('pt-BR'),
    p.origem, p.status,
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
