// API para Garantia Extendida - Supabase
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import { addNotification } from './notificationsApi';

export type ResultadoContato = 'Interessado' | 'Sem interesse' | 'Sem resposta' | 'Agendou retorno';
export type TipoTratativaComercial = 'Contato Realizado' | 'Adesão Silver' | 'Adesão Gold';
export type StatusAdesao = 'Pendente Financeiro' | 'Concluída' | 'Cancelada';

export interface TratativaComercial {
  id: string;
  garantiaId: string;
  vendaId: string;
  tipo: TipoTratativaComercial;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  descricao?: string;
  resultadoContato?: ResultadoContato;
  planoId?: string;
  planoNome?: string;
  valorPlano?: number;
  mesesPlano?: number;
  novaDataFimGarantia?: string;
  statusAdesao?: StatusAdesao;
  pagamento?: {
    meioPagamento: string;
    maquinaId?: string;
    maquinaNome?: string;
    contaDestinoId?: string;
    contaDestinoNome?: string;
    valor: number;
    parcelas?: number;
  };
  confirmacao1?: { responsavelId: string; responsavelNome: string; dataHora: string; };
  confirmacao2?: { responsavelId: string; responsavelNome: string; dataHora: string; observacao?: string; };
  vendaConferenciaId?: string;
}

// Cache
let _tratativasCache: TratativaComercial[] = [];
let _initPromise: Promise<void> | null = null;

const mapRow = (row: any): TratativaComercial => ({
  id: row.id,
  garantiaId: row.garantia_id || '',
  vendaId: row.venda_id || '',
  tipo: row.tipo || 'Contato Realizado',
  dataHora: row.data_hora || '',
  usuarioId: row.usuario_id || '',
  usuarioNome: row.usuario_nome || '',
  descricao: row.descricao,
  resultadoContato: row.resultado_contato,
  planoId: row.plano_id,
  planoNome: row.plano_nome,
  valorPlano: row.valor_plano != null ? Number(row.valor_plano) : undefined,
  mesesPlano: row.meses_plano,
  novaDataFimGarantia: row.nova_data_fim_garantia,
  statusAdesao: row.status_adesao,
  pagamento: row.pagamento || undefined,
  confirmacao1: row.confirmacao1 || undefined,
  confirmacao2: row.confirmacao2 || undefined,
  vendaConferenciaId: row.venda_conferencia_id,
});

export const initTratativasComerciaisCache = async (): Promise<void> => {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const { data, error } = await supabase.from('tratativas_comerciais').select('*');
    if (error) { console.error('Erro ao carregar tratativas_comerciais:', error); return; }
    _tratativasCache = (data || []).map(mapRow);
  })();
  return _initPromise;
};

// Leitura síncrona
export const getTratativasComerciais = (): TratativaComercial[] => [..._tratativasCache];

export const getTratativasComerciasByGarantiaId = (garantiaId: string): TratativaComercial[] =>
  _tratativasCache.filter(t => t.garantiaId === garantiaId);

// Mutações async
export const addTratativaComercial = async (tratativa: Omit<TratativaComercial, 'id'>): Promise<TratativaComercial> => {
  const { data, error } = await supabase.from('tratativas_comerciais').insert({
    garantia_id: tratativa.garantiaId,
    venda_id: tratativa.vendaId,
    tipo: tratativa.tipo,
    data_hora: tratativa.dataHora,
    usuario_id: tratativa.usuarioId,
    usuario_nome: tratativa.usuarioNome,
    descricao: tratativa.descricao,
    resultado_contato: tratativa.resultadoContato,
    plano_id: tratativa.planoId,
    plano_nome: tratativa.planoNome,
    valor_plano: tratativa.valorPlano,
    meses_plano: tratativa.mesesPlano,
    nova_data_fim_garantia: tratativa.novaDataFimGarantia,
    status_adesao: tratativa.statusAdesao,
    pagamento: tratativa.pagamento as any,
    confirmacao1: tratativa.confirmacao1 as any,
    confirmacao2: tratativa.confirmacao2 as any,
    venda_conferencia_id: tratativa.vendaConferenciaId,
  }).select().single();
  if (error) throw error;
  const nova = mapRow(data);
  _tratativasCache.push(nova);
  return nova;
};

export const updateTratativaComercial = async (id: string, updates: Partial<TratativaComercial>): Promise<void> => {
  const dbUpdates: any = {};
  if (updates.statusAdesao !== undefined) dbUpdates.status_adesao = updates.statusAdesao;
  if (updates.confirmacao1 !== undefined) dbUpdates.confirmacao1 = updates.confirmacao1;
  if (updates.confirmacao2 !== undefined) dbUpdates.confirmacao2 = updates.confirmacao2;
  if (updates.pagamento !== undefined) dbUpdates.pagamento = updates.pagamento;
  if (updates.vendaConferenciaId !== undefined) dbUpdates.venda_conferencia_id = updates.vendaConferenciaId;
  if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
  if (updates.resultadoContato !== undefined) dbUpdates.resultado_contato = updates.resultadoContato;

  const { error } = await supabase.from('tratativas_comerciais').update(dbUpdates).eq('id', id);
  if (error) throw error;
  const idx = _tratativasCache.findIndex(t => t.id === id);
  if (idx !== -1) _tratativasCache[idx] = { ..._tratativasCache[idx], ...updates };
};

// Utilitários puros
export const calcularTempoRestante = (dataFim: string): { texto: string; dias: number; status: 'normal' | 'atencao' | 'urgente' | 'expirada' } => {
  const hoje = new Date();
  const fim = new Date(dataFim);
  const diffDias = differenceInDays(fim, hoje);

  if (diffDias < 0) return { texto: 'Expirada', dias: diffDias, status: 'expirada' };

  const meses = Math.floor(diffDias / 30);
  const dias = diffDias % 30;
  let texto = '';
  if (meses > 0) {
    texto = `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    if (dias > 0) texto += ` e ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  } else {
    texto = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }

  let status: 'normal' | 'atencao' | 'urgente' | 'expirada' = 'normal';
  if (diffDias <= 7) status = 'urgente';
  else if (diffDias <= 30) status = 'atencao';

  return { texto, dias: diffDias, status };
};

export const podeRenovar = (dataFimGarantia: string): boolean => {
  return new Date(dataFimGarantia) < new Date();
};

export const getAdesoesPendentes = (): TratativaComercial[] =>
  _tratativasCache.filter(t =>
    (t.tipo === 'Adesão Silver' || t.tipo === 'Adesão Gold') && t.statusAdesao === 'Pendente Financeiro'
  );

export const getAdesoesConcluidas = (): TratativaComercial[] =>
  _tratativasCache.filter(t =>
    (t.tipo === 'Adesão Silver' || t.tipo === 'Adesão Gold') && t.statusAdesao === 'Concluída'
  );

export const notificarFinanceiroAdesao = (tratativa: TratativaComercial): void => {
  addNotification({
    type: 'garantia_extendida',
    title: `Nova adesão ${tratativa.planoNome}`,
    description: `Adesão ao plano ${tratativa.planoNome} - R$ ${tratativa.valorPlano?.toFixed(2)} aguardando conferência`,
    targetUsers: ['financeiro']
  });
};

export const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
