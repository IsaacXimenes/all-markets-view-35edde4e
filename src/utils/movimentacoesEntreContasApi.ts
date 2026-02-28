// Movimentações entre Contas API - Supabase
import { supabase } from '@/integrations/supabase/client';

export interface MovimentacaoEntreConta {
  id: string;
  transacaoId: string;
  contaOrigemId: string;
  contaDestinoId: string;
  valor: number;
  dataHora: string;
  observacao: string;
  usuarioId: string;
  usuarioNome: string;
}

export interface LogMovimentacao {
  id: string;
  movimentacaoId: string;
  transacaoId: string;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  contaOrigemId: string;
  contaDestinoId: string;
  valor: number;
  observacao: string;
}

// Cache
let _movCache: MovimentacaoEntreConta[] = [];
let _logsCache: LogMovimentacao[] = [];
let _initPromise: Promise<void> | null = null;

const mapMovRow = (row: any): MovimentacaoEntreConta => ({
  id: row.id,
  transacaoId: row.transacao_id || '',
  contaOrigemId: row.conta_origem_id || '',
  contaDestinoId: row.conta_destino_id || '',
  valor: Number(row.valor) || 0,
  dataHora: row.data_hora || '',
  observacao: row.observacao || '',
  usuarioId: row.usuario_id || '',
  usuarioNome: row.usuario_nome || '',
});

const mapLogRow = (row: any): LogMovimentacao => ({
  id: row.id,
  movimentacaoId: row.movimentacao_id || '',
  transacaoId: row.transacao_id || '',
  dataHora: row.data_hora || '',
  usuarioId: row.usuario_id || '',
  usuarioNome: row.usuario_nome || '',
  contaOrigemId: row.conta_origem_id || '',
  contaDestinoId: row.conta_destino_id || '',
  valor: Number(row.valor) || 0,
  observacao: row.observacao || '',
});

export const initMovimentacoesEntreContasCache = async (): Promise<void> => {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const [movRes, logsRes] = await Promise.all([
      supabase.from('movimentacoes_entre_contas').select('*').order('data_hora', { ascending: false }),
      supabase.from('logs_movimentacoes_contas').select('*').order('data_hora', { ascending: false }),
    ]);
    if (movRes.error) console.error('Erro ao carregar movimentacoes_entre_contas:', movRes.error);
    if (logsRes.error) console.error('Erro ao carregar logs_movimentacoes_contas:', logsRes.error);
    _movCache = (movRes.data || []).map(mapMovRow);
    _logsCache = (logsRes.data || []).map(mapLogRow);
  })();
  return _initPromise;
};

// Leitura síncrona
export const getMovimentacoesEntreConta = (): MovimentacaoEntreConta[] => [..._movCache];
export const getLogsMovimentacoes = (): LogMovimentacao[] => [..._logsCache];

// Mutações async
export const addMovimentacaoEntreConta = async (data: Omit<MovimentacaoEntreConta, 'id' | 'transacaoId'>): Promise<MovimentacaoEntreConta> => {
  const transacaoId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const { data: row, error } = await supabase.from('movimentacoes_entre_contas').insert({
    transacao_id: transacaoId,
    conta_origem_id: data.contaOrigemId,
    conta_destino_id: data.contaDestinoId,
    valor: data.valor,
    data_hora: data.dataHora,
    observacao: data.observacao,
    usuario_id: data.usuarioId,
    usuario_nome: data.usuarioNome,
  }).select().single();
  if (error) throw error;
  const nova = mapMovRow(row);
  _movCache.unshift(nova);
  return nova;
};

export const addLogMovimentacao = async (mov: MovimentacaoEntreConta): Promise<void> => {
  const { data: row, error } = await supabase.from('logs_movimentacoes_contas').insert({
    movimentacao_id: mov.id,
    transacao_id: mov.transacaoId,
    data_hora: mov.dataHora,
    usuario_id: mov.usuarioId,
    usuario_nome: mov.usuarioNome,
    conta_origem_id: mov.contaOrigemId,
    conta_destino_id: mov.contaDestinoId,
    valor: mov.valor,
    observacao: mov.observacao,
  }).select().single();
  if (error) { console.error('Erro ao adicionar log movimentação:', error); throw error; }
  if (row) _logsCache.unshift(mapLogRow(row));
};
