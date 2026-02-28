// Fiado API - Supabase
import { supabase } from '@/integrations/supabase/client';

export interface DividaFiado {
  id: string;
  vendaId: string;
  clienteId: string;
  clienteNome: string;
  lojaId: string;
  lojaNome: string;
  valorFinal: number;
  qtdVezes: number;
  tipoRecorrencia: 'Mensal' | 'Semanal';
  inicioCompetencia: string;
  situacao: 'Em Aberto' | 'Quitado';
  dataCriacao: string;
  temAnotacaoImportante?: boolean;
}

export interface PagamentoFiado {
  id: string;
  dividaId: string;
  valor: number;
  dataPagamento: string;
  responsavel: string;
  comprovanteBase64?: string;
  comprovanteNome?: string;
}

export interface AnotacaoFiado {
  id: string;
  dividaId: string;
  dataHora: string;
  usuario: string;
  observacao: string;
  importante: boolean;
}

// Caches
let dividasCache: DividaFiado[] = [];
let pagamentosCache: PagamentoFiado[] = [];
let anotacoesCache: AnotacaoFiado[] = [];
let cacheInitialized = false;

const mapDivida = (r: any): DividaFiado => ({
  id: r.id,
  vendaId: r.venda_id || '',
  clienteId: r.cliente_id || '',
  clienteNome: r.cliente_nome || '',
  lojaId: r.loja_id || '',
  lojaNome: r.loja_nome || '',
  valorFinal: Number(r.valor_final) || 0,
  qtdVezes: r.qtd_vezes || 1,
  tipoRecorrencia: r.tipo_recorrencia || 'Mensal',
  inicioCompetencia: r.inicio_competencia || '',
  situacao: r.situacao || 'Em Aberto',
  dataCriacao: r.created_at || '',
  temAnotacaoImportante: r.tem_anotacao_importante || false,
});

const mapPagamento = (r: any): PagamentoFiado => ({
  id: r.id,
  dividaId: r.divida_id || '',
  valor: Number(r.valor) || 0,
  dataPagamento: r.data_pagamento || '',
  responsavel: r.responsavel || '',
  comprovanteBase64: r.comprovante || undefined,
  comprovanteNome: r.comprovante_nome || undefined,
});

const mapAnotacao = (r: any): AnotacaoFiado => ({
  id: r.id,
  dividaId: r.divida_id || '',
  dataHora: r.data_hora || r.created_at || '',
  usuario: r.usuario || '',
  observacao: r.observacao || '',
  importante: r.importante || false,
});

export const initFiadoCache = async () => {
  const [divRes, pagRes, anoRes] = await Promise.all([
    supabase.from('dividas_fiado').select('*').order('created_at', { ascending: false }),
    supabase.from('pagamentos_fiado').select('*').order('data_pagamento', { ascending: false }),
    supabase.from('anotacoes_fiado').select('*').order('data_hora', { ascending: false }),
  ]);
  if (divRes.error) console.error('[Fiado] dividas:', divRes.error);
  if (pagRes.error) console.error('[Fiado] pagamentos:', pagRes.error);
  if (anoRes.error) console.error('[Fiado] anotacoes:', anoRes.error);

  dividasCache = (divRes.data || []).map(mapDivida);
  pagamentosCache = (pagRes.data || []).map(mapPagamento);
  anotacoesCache = (anoRes.data || []).map(mapAnotacao);
  cacheInitialized = true;
};

// --- Consultas ---

export function getDividasFiado(): DividaFiado[] {
  return [...dividasCache];
}

export function getPagamentosDivida(dividaId: string): PagamentoFiado[] {
  return pagamentosCache.filter(p => p.dividaId === dividaId);
}

export function getAnotacoesDivida(dividaId: string): AnotacaoFiado[] {
  return anotacoesCache
    .filter(a => a.dividaId === dividaId)
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
}

export function getValorPagoDivida(dividaId: string): number {
  return pagamentosCache
    .filter(p => p.dividaId === dividaId)
    .reduce((acc, p) => acc + p.valor, 0);
}

export function getSaldoDevedor(divida: DividaFiado): number {
  const valorPago = getValorPagoDivida(divida.id);
  return Math.max(0, divida.valorFinal - valorPago);
}

export function getProgressoDivida(divida: DividaFiado): number {
  const valorPago = getValorPagoDivida(divida.id);
  return Math.min(100, (valorPago / divida.valorFinal) * 100);
}

// --- Mutações ---

export async function criarDividaFiado(
  vendaId: string,
  clienteId: string,
  clienteNome: string,
  lojaId: string,
  lojaNome: string,
  valorFinal: number,
  qtdVezes: number,
  tipoRecorrencia: 'Mensal' | 'Semanal'
): Promise<DividaFiado> {
  const agora = new Date();
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const { data, error } = await supabase.from('dividas_fiado').insert({
    venda_id: vendaId,
    cliente_id: clienteId,
    cliente_nome: clienteNome,
    loja_id: lojaId,
    loja_nome: lojaNome,
    valor_final: valorFinal,
    qtd_vezes: qtdVezes,
    tipo_recorrencia: tipoRecorrencia,
    inicio_competencia: `${meses[agora.getMonth()]}-${agora.getFullYear()}`,
    situacao: 'Em Aberto',
  }).select().single();
  if (error) throw error;
  const divida = mapDivida(data);
  dividasCache.unshift(divida);
  return divida;
}

export async function registrarPagamentoFiado(
  dividaId: string,
  valor: number,
  responsavel: string,
  comprovanteBase64?: string,
  comprovanteNome?: string
): Promise<PagamentoFiado | null> {
  const divida = dividasCache.find(d => d.id === dividaId);
  if (!divida || divida.situacao === 'Quitado') return null;

  const { data, error } = await supabase.from('pagamentos_fiado').insert({
    divida_id: dividaId,
    valor,
    responsavel,
    comprovante: comprovanteBase64 || null,
    comprovante_nome: comprovanteNome || null,
  }).select().single();
  if (error) throw error;
  const pagamento = mapPagamento(data);
  pagamentosCache.unshift(pagamento);

  // Verificar quitação
  const totalPago = getValorPagoDivida(dividaId);
  if (totalPago >= divida.valorFinal - 0.01) {
    divida.situacao = 'Quitado';
    await supabase.from('dividas_fiado').update({ situacao: 'Quitado' }).eq('id', dividaId);
  }

  return pagamento;
}

export async function registrarAnotacaoFiado(
  dividaId: string,
  usuario: string,
  observacao: string,
  importante: boolean
): Promise<AnotacaoFiado> {
  const { data, error } = await supabase.from('anotacoes_fiado').insert({
    divida_id: dividaId,
    data_hora: new Date().toISOString(),
    usuario,
    observacao,
    importante,
  }).select().single();
  if (error) throw error;
  const anotacao = mapAnotacao(data);
  anotacoesCache.unshift(anotacao);

  if (importante) {
    const divida = dividasCache.find(d => d.id === dividaId);
    if (divida) {
      divida.temAnotacaoImportante = true;
      await supabase.from('dividas_fiado').update({ tem_anotacao_importante: true }).eq('id', dividaId);
    }
  }

  return anotacao;
}

// --- Estatísticas ---

export function getEstatisticasFiado() {
  const dividas = getDividasFiado();
  const emAberto = dividas.filter(d => d.situacao === 'Em Aberto');
  const quitadas = dividas.filter(d => d.situacao === 'Quitado');

  const valorTotalEmAberto = emAberto.reduce((acc, d) => acc + d.valorFinal, 0);
  const valorPagoEmAberto = emAberto.reduce((acc, d) => acc + getValorPagoDivida(d.id), 0);
  const saldoDevedor = valorTotalEmAberto - valorPagoEmAberto;

  const valorTotalQuitado = quitadas.reduce((acc, d) => acc + d.valorFinal, 0);

  return {
    totalEmAberto: emAberto.length,
    totalQuitadas: quitadas.length,
    valorTotalEmAberto,
    valorTotalQuitado,
    saldoDevedor,
    valorRecebido: valorPagoEmAberto + valorTotalQuitado
  };
}

// --- Formatação ---

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}
