// API para gerenciar Trade-Ins pendentes - Supabase
import { supabase } from '@/integrations/supabase/client';
import { ItemTradeIn } from './vendasApi';
import { AnexoTemporario } from '@/components/estoque/BufferAnexos';
import { addProdutoPendente, ProdutoPendente } from './osApi';

export interface TradeInPendente {
  id: string;
  vendaId: string;
  clienteId: string;
  clienteNome: string;
  tradeIn: ItemTradeIn;
  dataVenda: string;
  lojaVenda: string;
  vendedorId: string;
  vendedorNome: string;
  status: 'Aguardando Devolução' | 'Recebido';
  termoResponsabilidade?: AnexoTemporario;
  fotosAparelho?: AnexoTemporario[];
  fotosRecebimento?: AnexoTemporario[];
  dataRecebimento?: string;
  responsavelRecebimentoId?: string;
  responsavelRecebimentoNome?: string;
  observacoesRecebimento?: string;
  slaCongelado?: string;
  slaFaixaCongelada?: SLAFaixa;
}

// Cache
let _cache: TradeInPendente[] = [];
let _initPromise: Promise<void> | null = null;

const mapRow = (row: any): TradeInPendente => ({
  id: row.id,
  vendaId: row.venda_id || '',
  clienteId: row.cliente_id || '',
  clienteNome: row.cliente_nome || '',
  tradeIn: row.trade_in || {},
  dataVenda: row.data_venda || '',
  lojaVenda: row.loja_venda || '',
  vendedorId: row.vendedor_id || '',
  vendedorNome: row.vendedor_nome || '',
  status: row.status || 'Aguardando Devolução',
  termoResponsabilidade: row.termo_responsabilidade || undefined,
  fotosAparelho: Array.isArray(row.fotos_aparelho) ? row.fotos_aparelho : [],
  fotosRecebimento: Array.isArray(row.fotos_recebimento) ? row.fotos_recebimento : [],
  dataRecebimento: row.data_recebimento || undefined,
  responsavelRecebimentoId: row.responsavel_recebimento_id || undefined,
  responsavelRecebimentoNome: row.responsavel_recebimento_nome || undefined,
  observacoesRecebimento: row.observacoes_recebimento || undefined,
  slaCongelado: row.sla_congelado || undefined,
  slaFaixaCongelada: row.sla_faixa_congelada || undefined,
});

export const initBaseTrocasPendentesCache = async (): Promise<void> => {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const { data, error } = await supabase.from('base_trocas_pendentes').select('*');
    if (error) { console.error('Erro ao carregar base_trocas_pendentes:', error); return; }
    _cache = (data || []).map(mapRow);
  })();
  return _initPromise;
};

// Leitura síncrona
export function getTradeInsPendentes(): TradeInPendente[] { return [..._cache]; }
export function getTradeInsPendentesAguardando(): TradeInPendente[] { return _cache.filter(t => t.status === 'Aguardando Devolução'); }
export function getTradeInsPendentesRecebidos(): TradeInPendente[] { return _cache.filter(t => t.status === 'Recebido'); }
export function getTradeInPendenteById(id: string): TradeInPendente | undefined { return _cache.find(t => t.id === id); }
export function getTradeInPendenteByVendaId(vendaId: string): TradeInPendente | undefined { return _cache.find(t => t.vendaId === vendaId); }

// Mutações async
export async function addTradeInPendente(data: Omit<TradeInPendente, 'id'>): Promise<TradeInPendente> {
  const { data: row, error } = await supabase.from('base_trocas_pendentes').insert({
    venda_id: data.vendaId,
    cliente_id: data.clienteId,
    cliente_nome: data.clienteNome,
    trade_in: data.tradeIn as any,
    data_venda: data.dataVenda,
    loja_venda: data.lojaVenda,
    vendedor_id: data.vendedorId,
    vendedor_nome: data.vendedorNome,
    status: 'Aguardando Devolução',
    termo_responsabilidade: data.termoResponsabilidade as any,
    fotos_aparelho: data.fotosAparelho as any,
  }).select().single();
  if (error) throw error;
  const novo = mapRow(row);
  _cache.push(novo);
  return novo;
}

export async function registrarRecebimento(
  id: string,
  dados: {
    fotosRecebimento: AnexoTemporario[];
    responsavelRecebimentoId: string;
    responsavelRecebimentoNome: string;
    observacoesRecebimento?: string;
  }
): Promise<TradeInPendente | null> {
  const item = _cache.find(t => t.id === id);
  if (!item) return null;

  const sla = calcularSLA(item.dataVenda);
  const agora = new Date().toISOString();

  const { data: row, error } = await supabase.from('base_trocas_pendentes').update({
    status: 'Recebido',
    data_recebimento: agora,
    fotos_recebimento: dados.fotosRecebimento as any,
    responsavel_recebimento_id: dados.responsavelRecebimentoId,
    responsavel_recebimento_nome: dados.responsavelRecebimentoNome,
    observacoes_recebimento: dados.observacoesRecebimento,
    sla_congelado: sla.texto,
    sla_faixa_congelada: sla.faixa,
  }).eq('id', id).select().single();
  if (error) throw error;
  const updated = mapRow(row);
  const idx = _cache.findIndex(t => t.id === id);
  if (idx !== -1) _cache[idx] = updated;
  return updated;
}

// SLA
export type SLAFaixa = '0-24 horas' | '24-48 horas' | '48-72 horas' | '72+ horas';

export interface SLAInfo {
  dias: number;
  horas: number;
  texto: string;
  nivel: 'normal' | 'atencao' | 'critico';
  faixa: SLAFaixa;
}

export function calcularSLA(dataVenda: string): SLAInfo {
  const diff = Date.now() - new Date(dataVenda).getTime();
  const horasTotal = diff / (1000 * 60 * 60);
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let nivel: 'normal' | 'atencao' | 'critico' = 'normal';
  let faixa: SLAFaixa = '0-24 horas';

  if (horasTotal >= 72) { nivel = 'critico'; faixa = '72+ horas'; }
  else if (horasTotal >= 48) { nivel = 'atencao'; faixa = '48-72 horas'; }
  else if (horasTotal >= 24) { nivel = 'normal'; faixa = '24-48 horas'; }

  return { dias, horas, texto: `${dias} dias e ${horas} horas`, nivel, faixa };
}

// Integração com Estoque
export async function migrarParaProdutosPendentes(tradeInPendenteId: string): Promise<ProdutoPendente | null> {
  const tradeIn = getTradeInPendenteById(tradeInPendenteId);
  if (!tradeIn || tradeIn.status !== 'Recebido') return null;

  try {
    const marca = tradeIn.tradeIn.modelo?.toLowerCase().includes('iphone') ? 'Apple' : 'Outro';
    const imeiLimpo = tradeIn.tradeIn.imei?.replace(/-/g, '') || '';

    const produtoPendente = await addProdutoPendente({
      imei: imeiLimpo,
      marca,
      modelo: tradeIn.tradeIn.modelo,
      cor: 'N/A',
      tipo: 'Seminovo',
      condicao: tradeIn.tradeIn.condicao === 'Novo' ? 'Novo' : 'Semi-novo',
      origemEntrada: 'Base de Troca',
      notaOuVendaId: tradeIn.vendaId,
      valorCusto: tradeIn.tradeIn.valorCompraUsado,
      valorOrigem: tradeIn.tradeIn.valorCompraUsado,
      saudeBateria: 85,
      loja: tradeIn.lojaVenda,
      dataEntrada: tradeIn.dataRecebimento || new Date().toISOString().split('T')[0],
      fornecedor: `Cliente: ${tradeIn.clienteNome}`
    }, true);

    return produtoPendente;
  } catch (error) {
    console.error('[BaseTrocasAPI] Erro ao migrar para Produtos Pendentes:', error);
    return null;
  }
}

// Estatísticas
export interface EstatisticasBaseTrocas {
  total: number;
  aguardando: number;
  recebidos: number;
  valorTotalAguardando: number;
  mediaTempoSLA: number;
}

export function getEstatisticasBaseTrocas(): EstatisticasBaseTrocas {
  const aguardando = _cache.filter(t => t.status === 'Aguardando Devolução');
  const recebidos = _cache.filter(t => t.status === 'Recebido');
  const valorTotalAguardando = aguardando.reduce((acc, t) => acc + (t.tradeIn.valorCompraUsado || 0), 0);

  let totalDias = 0;
  aguardando.forEach(t => { totalDias += calcularSLA(t.dataVenda).dias; });
  const mediaTempoSLA = aguardando.length > 0 ? totalDias / aguardando.length : 0;

  return { total: _cache.length, aguardando: aguardando.length, recebidos: recebidos.length, valorTotalAguardando, mediaTempoSLA };
}
