// Agenda Eletrônica para Gestão Administrativa - Supabase
import { supabase } from '@/integrations/supabase/client';

export interface AnotacaoGestao {
  id: string;
  chaveContexto: string;
  dataHora: string;
  usuario: string;
  observacao: string;
  importante: boolean;
}

// Cache local
let anotacoesCache: AnotacaoGestao[] = [];
let cacheInitialized = false;

const mapRow = (row: any): AnotacaoGestao => ({
  id: row.id,
  chaveContexto: row.chave_contexto,
  dataHora: row.data_hora || row.created_at,
  usuario: row.usuario || '',
  observacao: row.observacao || '',
  importante: row.importante || false,
});

export const initAnotacoesGestaoCache = async () => {
  const { data, error } = await supabase
    .from('anotacoes_gestao')
    .select('*')
    .order('data_hora', { ascending: false });
  if (error) { console.error('[AgendaGestao] Erro ao carregar:', error); return; }
  anotacoesCache = (data || []).map(mapRow);
  cacheInitialized = true;
};

export function getAnotacoesGestao(chaveContexto: string): AnotacaoGestao[] {
  return anotacoesCache
    .filter(a => a.chaveContexto === chaveContexto)
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
}

export async function registrarAnotacaoGestao(
  chaveContexto: string,
  usuario: string,
  observacao: string,
  importante: boolean
): Promise<AnotacaoGestao> {
  const agora = new Date().toISOString();
  const { data, error } = await supabase
    .from('anotacoes_gestao')
    .insert({
      chave_contexto: chaveContexto,
      data_hora: agora,
      usuario,
      observacao,
      importante,
    })
    .select()
    .single();
  if (error) throw error;
  const nova = mapRow(data);
  anotacoesCache.unshift(nova);
  return nova;
}

export function temAnotacaoImportante(chaveContexto: string): boolean {
  return anotacoesCache.some(a => a.chaveContexto === chaveContexto && a.importante);
}
