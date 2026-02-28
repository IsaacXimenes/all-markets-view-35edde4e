// API de Feedback para Recursos Humanos - Supabase Integration
import { supabase } from '@/integrations/supabase/client';

export interface FeedbackRegistro {
  id: string;
  colaboradorId: string;
  tipo: 'Advertência' | 'Advertência (2)' | 'Suspensão' | 'Suspensão (2)' | 'Suspensão (3)';
  texto: string;
  gestorId: string;
  gestorNome: string;
  dataHora: Date;
  referenciaAnterior?: string;
  arquivo?: {
    nome: string;
    tipo: string;
    url: string;
  };
}

export interface ColaboradorFeedback {
  id: string;
  nome: string;
  cargo: string;
  loja: string;
  cpf: string;
}

// ── Cache layer ──
let feedbacksCache: FeedbackRegistro[] = [];

const mapRow = (r: any): FeedbackRegistro => ({
  id: r.id,
  colaboradorId: r.colaborador_id || '',
  tipo: r.tipo || 'Advertência',
  texto: r.texto || '',
  gestorId: r.gestor_id || '',
  gestorNome: r.gestor_nome || '',
  dataHora: new Date(r.data_hora),
  referenciaAnterior: r.referencia_anterior || undefined,
  arquivo: r.arquivo || undefined,
});

export const initFeedbacksCache = async () => {
  const { data, error } = await supabase.from('feedbacks').select('*').order('data_hora', { ascending: false });
  if (error) { console.error('[FEEDBACK] init error', error); return; }
  feedbacksCache = (data || []).map(mapRow);
};

// Auto-init
initFeedbacksCache();

// API Functions
export const getFeedbacks = () => [...feedbacksCache].sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime());

export const getFeedbackById = (id: string) => feedbacksCache.find(f => f.id === id);

export const getFeedbacksByColaborador = (colaboradorId: string) =>
  feedbacksCache.filter(f => f.colaboradorId === colaboradorId)
    .sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime());

// Função que recebe colaboradores do store e retorna os que têm feedback
export const getColaboradoresComFeedbackFromStore = (colaboradoresStore: Array<{
  id: string;
  nome: string;
  cargo: string;
  loja_id: string;
  cpf: string;
  ativo: boolean;
}>, obterNomeLoja: (id: string) => string): ColaboradorFeedback[] => {
  const idsComFeedback = new Set(feedbacksCache.map(f => f.colaboradorId));
  const colaboradores = colaboradoresStore.filter(c => idsComFeedback.has(c.id) && c.ativo);
  return colaboradores.map(col => ({
    id: col.id,
    nome: col.nome,
    cargo: col.cargo,
    loja: obterNomeLoja(col.loja_id),
    cpf: col.cpf
  }));
};

// Função que recebe colaboradores do store e retorna todos para feedback
export const getTodosColaboradoresParaFeedbackFromStore = (colaboradoresStore: Array<{
  id: string;
  nome: string;
  cargo: string;
  loja_id: string;
  cpf: string;
  ativo: boolean;
}>, obterNomeLoja: (id: string) => string): ColaboradorFeedback[] => {
  const colaboradores = colaboradoresStore.filter(c => c.ativo);
  return colaboradores.map(col => ({
    id: col.id,
    nome: col.nome,
    cargo: col.cargo,
    loja: obterNomeLoja(col.loja_id),
    cpf: col.cpf
  }));
};

export const getUltimaNotificacao = (colaboradorId: string): Date | null => {
  const feedbacksColaborador = feedbacksCache.filter(f => f.colaboradorId === colaboradorId);
  if (feedbacksColaborador.length === 0) return null;
  return feedbacksColaborador.sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime())[0].dataHora;
};

export const getProximaAnotacao = (colaboradorId: string): string => {
  const feedbacksColaborador = feedbacksCache.filter(f => f.colaboradorId === colaboradorId);
  const count = feedbacksColaborador.length;
  if (count === 0) return 'Sem registros';
  if (count === 1) return 'Advertência (2)';
  if (count === 2) return 'Suspensão';
  return `Suspensão (${count - 1})`;
};

export const getContadorFeedbacks = (colaboradorId: string): number => {
  return feedbacksCache.filter(f => f.colaboradorId === colaboradorId).length;
};

export const addFeedback = async (feedback: Omit<FeedbackRegistro, 'id'>): Promise<FeedbackRegistro> => {
  const { data, error } = await supabase.from('feedbacks').insert({
    colaborador_id: feedback.colaboradorId || null,
    tipo: feedback.tipo,
    texto: feedback.texto,
    gestor_id: feedback.gestorId || null,
    gestor_nome: feedback.gestorNome,
    data_hora: feedback.dataHora.toISOString(),
    referencia_anterior: feedback.referenciaAnterior || null,
    arquivo: feedback.arquivo as any || null,
  }).select().single();
  if (error) throw error;
  const mapped = mapRow(data);
  feedbacksCache.push(mapped);
  return mapped;
};

export const deleteFeedback = async (id: string) => {
  await supabase.from('feedbacks').delete().eq('id', id);
  feedbacksCache = feedbacksCache.filter(f => f.id !== id);
};

// Verificar se usuário atual é gestor
const cargosGestores = ['Gerente Geral', 'Gerente Financeiro', 'Gerente de Estoque', 'Supervisor de Loja'];

export const isUsuarioGestor = (cargoNome: string): boolean => {
  return cargosGestores.some(c => cargoNome.toLowerCase().includes(c.toLowerCase()) ||
    cargoNome.toLowerCase().includes('gerente') ||
    cargoNome.toLowerCase().includes('supervisor'));
};

// Usuário logado mockado (gestor)
export const getUsuarioLogado = () => ({
  id: '7c1231ea',
  nome: 'Fernanda Gabrielle Silva de Lima',
  cargo: 'Assistente Administrativo',
  isGestor: true
});

// Exportar CSV
export const exportFeedbacksToCSV = (data: any[], filename: string) => {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const value = row[h];
        if (value instanceof Date) {
          return value.toLocaleString('pt-BR');
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.click();
};
