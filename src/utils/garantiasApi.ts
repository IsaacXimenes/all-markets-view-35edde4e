// Garantias API - Supabase
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths, differenceInDays } from 'date-fns';
import { addOrdemServico } from './assistenciaApi';
import { updateProduto, addMovimentacao, Produto, getProdutoById, getStatusAparelho } from './estoqueApi';
import { registrarEmprestimoGarantia, addTimelineEntry as addTimelineUnificada } from './timelineApi';
import { addProdutoPendente } from './osApi';
import { addVenda } from './vendasApi';

// ==================== INTERFACES ====================

export interface GarantiaItem {
  id: string;
  vendaId: string;
  itemVendaId: string;
  produtoId: string;
  imei: string;
  modelo: string;
  tipoGarantia: 'Garantia - Apple' | 'Garantia - Thiago Imports';
  mesesGarantia: number;
  dataInicioGarantia: string;
  dataFimGarantia: string;
  status: 'Ativa' | 'Expirada' | 'Em Tratativa' | 'Concluída';
  lojaVenda: string;
  vendedorId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
}

export interface TratativaGarantia {
  id: string;
  garantiaId: string;
  tipo: 'Direcionado Apple' | 'Encaminhado Assistência' | 'Assistência + Empréstimo' | 'Troca Direta';
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  descricao: string;
  aparelhoEmprestadoId?: string;
  aparelhoEmprestadoModelo?: string;
  aparelhoEmprestadoImei?: string;
  aparelhoTrocaId?: string;
  aparelhoTrocaModelo?: string;
  aparelhoTrocaImei?: string;
  osId?: string;
  status: 'Em Andamento' | 'Concluído' | 'Aguardando Aprovação' | 'Aprovada' | 'Recusada';
}

export interface TimelineGarantia {
  id: string;
  garantiaId: string;
  dataHora: string;
  tipo: 'registro_venda' | 'abertura_garantia' | 'tratativa' | 'os_criada' | 'emprestimo' | 'devolucao' | 'troca' | 'conclusao';
  titulo: string;
  descricao: string;
  usuarioId: string;
  usuarioNome: string;
}

export interface ContatoAtivoGarantia {
  id: string;
  garantiaId?: string;
  dataLancamento: string;
  cliente: { id: string; nome: string; telefone: string; email: string; };
  aparelho: { modelo: string; imei: string; condicao?: 'Novo' | 'Seminovo'; };
  logistica: { motoboyId: string; motoboyNome: string; dataEntregaPrevista: string; enderecoEntrega: string; observacoes: string; };
  garantiaEstendida?: { aderida: boolean; plano?: 'Um Ano' | 'Dois Anos' | 'Três Anos'; planoId?: string; planoNome?: string; planoMeses?: number; valor?: number; };
  status: 'Pendente' | 'Garantia Criada' | 'Entregue';
  timeline: TimelineContatoAtivo[];
  autoGerado?: boolean;
}

export interface TimelineContatoAtivo {
  id: string;
  dataHora: string;
  tipo: 'criacao' | 'edicao' | 'garantia_criada' | 'entregue';
  descricao: string;
}

export interface MetadadosEstoque {
  notaEntradaId?: string;
  produtoNotaId?: string;
  loteRevisaoId?: string;
  loteRevisaoItemId?: string;
  imeiAparelho?: string;
  modeloAparelho?: string;
  marcaAparelho?: string;
}

export interface RegistroAnaliseGarantia {
  id: string;
  origem: 'Garantia' | 'Estoque';
  origemId: string;
  clienteDescricao: string;
  dataChegada: string;
  status: 'Pendente' | 'Solicitação Aprovada' | 'Recusada';
  tecnicoId?: string;
  tecnicoNome?: string;
  dataAprovacao?: string;
  usuarioAprovacao?: string;
  observacao?: string;
  motivoRecusa?: string;
  dataRecusa?: string;
  metadata?: MetadadosEstoque;
}

// ==================== CACHE ====================
let _garantiasCache: GarantiaItem[] = [];
let _tratativasCache: TratativaGarantia[] = [];
let _timelineCache: TimelineGarantia[] = [];
let _cacheInitialized = false;

// Supabase-backed caches
let _contatosAtivosCache: ContatoAtivoGarantia[] = [];
let _registrosAnaliseCache: RegistroAnaliseGarantia[] = [];
let _contatosInitPromise: Promise<void> | null = null;
let _registrosInitPromise: Promise<void> | null = null;

// ==================== MAPPERS - CONTATOS ATIVOS ====================

const mapContatoAtivoFromDB = (row: any): ContatoAtivoGarantia => ({
  id: row.id,
  garantiaId: row.garantia_id || undefined,
  dataLancamento: row.data_lancamento || '',
  cliente: row.cliente || { id: '', nome: '', telefone: '', email: '' },
  aparelho: row.aparelho || { modelo: '', imei: '' },
  logistica: row.logistica || { motoboyId: '', motoboyNome: '', dataEntregaPrevista: '', enderecoEntrega: '', observacoes: '' },
  garantiaEstendida: row.garantia_estendida || undefined,
  status: row.status || 'Pendente',
  timeline: Array.isArray(row.timeline) ? row.timeline : [],
  autoGerado: row.auto_gerado || false,
});

const mapRegistroAnaliseFromDB = (row: any): RegistroAnaliseGarantia => ({
  id: row.id,
  origem: row.origem || 'Garantia',
  origemId: row.origem_id || '',
  clienteDescricao: row.cliente_descricao || '',
  dataChegada: row.data_chegada || '',
  status: row.status || 'Pendente',
  tecnicoId: row.tecnico_id,
  tecnicoNome: row.tecnico_nome,
  dataAprovacao: row.data_aprovacao,
  usuarioAprovacao: row.usuario_aprovacao,
  observacao: row.observacao,
  motivoRecusa: row.motivo_recusa,
  dataRecusa: row.data_recusa,
  metadata: row.metadata || undefined,
});

// ==================== INIT CONTATOS/ANALISE ====================

export const initContatosAtivosCache = async (): Promise<void> => {
  if (_contatosInitPromise) return _contatosInitPromise;
  _contatosInitPromise = (async () => {
    const { data, error } = await supabase.from('contatos_ativos_garantia').select('*').order('data_lancamento', { ascending: false });
    if (error) { console.error('Erro ao carregar contatos_ativos_garantia:', error); return; }
    _contatosAtivosCache = (data || []).map(mapContatoAtivoFromDB);
    console.log(`[GARANTIA] Contatos ativos cache: ${_contatosAtivosCache.length}`);
  })();
  return _contatosInitPromise;
};

export const initRegistrosAnaliseCache = async (): Promise<void> => {
  if (_registrosInitPromise) return _registrosInitPromise;
  _registrosInitPromise = (async () => {
    const { data, error } = await supabase.from('registros_analise_garantia').select('*').order('data_chegada', { ascending: false });
    if (error) { console.error('Erro ao carregar registros_analise_garantia:', error); return; }
    _registrosAnaliseCache = (data || []).map(mapRegistroAnaliseFromDB);
    console.log(`[GARANTIA] Registros análise cache: ${_registrosAnaliseCache.length}`);
  })();
  return _registrosInitPromise;
};

// ==================== MAPPERS ====================

const mapGarantiaFromDB = (row: any): GarantiaItem => ({
  id: row.id,
  vendaId: row.venda_id || row.venda_id_ref || '',
  itemVendaId: row.item_venda_id || '',
  produtoId: row.produto_id || '',
  imei: row.imei || '',
  modelo: row.modelo || '',
  tipoGarantia: row.tipo_garantia || 'Garantia - Thiago Imports',
  mesesGarantia: row.meses_garantia || 0,
  dataInicioGarantia: row.data_inicio || '',
  dataFimGarantia: row.data_fim || '',
  status: row.status || 'Ativa',
  lojaVenda: row.loja_venda || '',
  vendedorId: row.vendedor_id || '',
  clienteId: row.cliente_id || '',
  clienteNome: row.cliente_nome || '',
  clienteTelefone: row.cliente_telefone || undefined,
  clienteEmail: row.cliente_email || undefined,
});

const mapTratativaFromJSON = (t: any): TratativaGarantia => ({
  id: t.id || '',
  garantiaId: t.garantiaId || '',
  tipo: t.tipo || 'Direcionado Apple',
  dataHora: t.dataHora || '',
  usuarioId: t.usuarioId || '',
  usuarioNome: t.usuarioNome || '',
  descricao: t.descricao || '',
  aparelhoEmprestadoId: t.aparelhoEmprestadoId,
  aparelhoEmprestadoModelo: t.aparelhoEmprestadoModelo,
  aparelhoEmprestadoImei: t.aparelhoEmprestadoImei,
  aparelhoTrocaId: t.aparelhoTrocaId,
  aparelhoTrocaModelo: t.aparelhoTrocaModelo,
  aparelhoTrocaImei: t.aparelhoTrocaImei,
  osId: t.osId,
  status: t.status || 'Em Andamento',
});

const mapTimelineFromJSON = (t: any): TimelineGarantia => ({
  id: t.id || '',
  garantiaId: t.garantiaId || '',
  dataHora: t.dataHora || '',
  tipo: t.tipo || 'tratativa',
  titulo: t.titulo || '',
  descricao: t.descricao || '',
  usuarioId: t.usuarioId || '',
  usuarioNome: t.usuarioNome || '',
});

// ==================== INIT CACHE ====================

export const initGarantiasCache = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('garantias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    _garantiasCache = (data || []).map(mapGarantiaFromDB);

    // Extract tratativas and timeline from JSONB
    _tratativasCache = [];
    _timelineCache = [];
    (data || []).forEach(row => {
      const tratativas = Array.isArray(row.tratativas) ? row.tratativas : [];
      tratativas.forEach((t: any) => _tratativasCache.push(mapTratativaFromJSON(t)));

      const timeline = Array.isArray(row.timeline_garantia) ? row.timeline_garantia : [];
      timeline.forEach((t: any) => _timelineCache.push(mapTimelineFromJSON(t)));
    });

    _cacheInitialized = true;
    console.log(`[GARANTIA] Cache inicializado: ${_garantiasCache.length} garantias`);
  } catch (error) {
    console.error('[GARANTIA] Erro ao inicializar cache:', error);
    _garantiasCache = [];
    _cacheInitialized = true;
  }
};

// Auto-init
initGarantiasCache();

// ==================== HELPERS ====================

let garantiaCounter = 0;
let tratativaCounter = 0;
let timelineCounter = 0;

const persistGarantiaTratativas = async (garantiaId: string) => {
  const tratativas = _tratativasCache.filter(t => t.garantiaId === garantiaId);
  const timeline = _timelineCache.filter(t => t.garantiaId === garantiaId);
  await supabase.from('garantias').update({
    tratativas: tratativas as any,
    timeline_garantia: timeline as any,
  }).eq('id', garantiaId);
};

// ==================== FUNÇÕES CRUD ====================

export const getGarantias = (): GarantiaItem[] => [..._garantiasCache];

export const getGarantiaById = (id: string): GarantiaItem | undefined => _garantiasCache.find(g => g.id === id);

export const getGarantiasByVendaId = (vendaId: string): GarantiaItem[] => _garantiasCache.filter(g => g.vendaId === vendaId);

export const addGarantia = async (garantia: Omit<GarantiaItem, 'id'>): Promise<GarantiaItem> => {
  const { data, error } = await supabase.from('garantias').insert({
    venda_id: garantia.vendaId || null,
    venda_id_ref: garantia.vendaId || null,
    item_venda_id: garantia.itemVendaId || null,
    produto_id: garantia.produtoId || null,
    imei: garantia.imei || null,
    modelo: garantia.modelo || null,
    tipo_garantia: garantia.tipoGarantia || null,
    meses_garantia: garantia.mesesGarantia || null,
    data_inicio: garantia.dataInicioGarantia || null,
    data_fim: garantia.dataFimGarantia || null,
    status: garantia.status || 'Ativa',
    loja_venda: garantia.lojaVenda || null,
    vendedor_id: garantia.vendedorId || null,
    cliente_id: garantia.clienteId || null,
    cliente_nome: garantia.clienteNome || null,
    cliente_telefone: garantia.clienteTelefone || null,
    cliente_email: garantia.clienteEmail || null,
    tratativas: [],
    timeline_garantia: [],
  }).select().single();

  if (error) throw error;

  const newGarantia = mapGarantiaFromDB(data);
  _garantiasCache.unshift(newGarantia);
  return newGarantia;
};

export const updateGarantia = async (id: string, updates: Partial<GarantiaItem>): Promise<void> => {
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.dataFimGarantia !== undefined) dbUpdates.data_fim = updates.dataFimGarantia;
  if (updates.clienteNome !== undefined) dbUpdates.cliente_nome = updates.clienteNome;
  if (updates.clienteTelefone !== undefined) dbUpdates.cliente_telefone = updates.clienteTelefone;
  if (updates.clienteEmail !== undefined) dbUpdates.cliente_email = updates.clienteEmail;

  if (Object.keys(dbUpdates).length > 0) {
    await supabase.from('garantias').update(dbUpdates).eq('id', id);
  }

  const index = _garantiasCache.findIndex(g => g.id === id);
  if (index !== -1) {
    _garantiasCache[index] = { ..._garantiasCache[index], ...updates };
  }
};

// Tratativas
export const getTratativas = (): TratativaGarantia[] => [..._tratativasCache];

export const addTratativa = async (tratativa: Omit<TratativaGarantia, 'id'>): Promise<TratativaGarantia> => {
  tratativaCounter++;
  const newTratativa: TratativaGarantia = {
    ...tratativa,
    id: `TRAT-${String(tratativaCounter).padStart(4, '0')}-${Date.now()}`
  };
  _tratativasCache.push(newTratativa);
  await persistGarantiaTratativas(tratativa.garantiaId);
  return newTratativa;
};

export const getTratativasByGarantiaId = (garantiaId: string): TratativaGarantia[] =>
  _tratativasCache.filter(t => t.garantiaId === garantiaId);

export const updateTratativa = async (id: string, updates: Partial<TratativaGarantia>): Promise<void> => {
  const index = _tratativasCache.findIndex(t => t.id === id);
  if (index !== -1) {
    _tratativasCache[index] = { ..._tratativasCache[index], ...updates };
    await persistGarantiaTratativas(_tratativasCache[index].garantiaId);
  }
};

// Timeline
export const addTimelineEntry = async (entry: Omit<TimelineGarantia, 'id'>): Promise<TimelineGarantia> => {
  timelineCounter++;
  const newEntry: TimelineGarantia = {
    ...entry,
    id: `TL-${String(timelineCounter).padStart(4, '0')}-${Date.now()}`
  };
  _timelineCache.push(newEntry);
  await persistGarantiaTratativas(entry.garantiaId);
  return newEntry;
};

export const getTimelineByGarantiaId = (garantiaId: string): TimelineGarantia[] =>
  _timelineCache.filter(t => t.garantiaId === garantiaId).sort((a, b) =>
    new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
  );

// ==================== CONSULTAS ESPECIAIS ====================

export const getGarantiasEmAndamento = (): GarantiaItem[] =>
  _garantiasCache.filter(g => g.status === 'Em Tratativa');

export const getGarantiasExpirandoEm7Dias = (): GarantiaItem[] => {
  const hoje = new Date();
  return _garantiasCache.filter(g => {
    if (g.status !== 'Ativa') return false;
    const dias = differenceInDays(new Date(g.dataFimGarantia), hoje);
    return dias >= 0 && dias <= 7;
  });
};

export const getGarantiasExpirandoEm30Dias = (): GarantiaItem[] => {
  const hoje = new Date();
  return _garantiasCache.filter(g => {
    if (g.status !== 'Ativa') return false;
    const dias = differenceInDays(new Date(g.dataFimGarantia), hoje);
    return dias > 7 && dias <= 30;
  });
};

export const verificarGarantiaAtivaByIMEI = (imei: string): GarantiaItem | null =>
  _garantiasCache.find(g => g.imei === imei && (g.status === 'Ativa' || g.status === 'Em Tratativa')) || null;

export const getHistoricoGarantiasByIMEI = (imei: string): GarantiaItem[] =>
  _garantiasCache.filter(g => g.imei === imei);

export const verificarTratativaAtivaByIMEI = (imei: string): { garantia: GarantiaItem; tratativa: TratativaGarantia } | null => {
  const garantia = _garantiasCache.find(g => g.imei === imei && g.status === 'Em Tratativa');
  if (!garantia) return null;
  const tratativaAtiva = _tratativasCache.find(t => t.garantiaId === garantia.id && t.status === 'Em Andamento');
  if (tratativaAtiva) return { garantia, tratativa: tratativaAtiva };
  return null;
};

export const getContadoresGarantia = () => {
  const emAndamento = _garantiasCache.filter(g => g.status === 'Em Tratativa').length;
  const aparelhosEmprestados = _tratativasCache.filter(t => t.status === 'Em Andamento' && t.aparelhoEmprestadoId).length;
  const emAssistencia = _tratativasCache.filter(t => t.status === 'Em Andamento' && t.osId).length;
  const maisde7Dias = _tratativasCache.filter(t => {
    if (t.status !== 'Em Andamento') return false;
    return differenceInDays(new Date(), new Date(t.dataHora)) > 7;
  }).length;
  const aguardandoAprovacao = _tratativasCache.filter(t => t.status === 'Aguardando Aprovação').length;
  return { emAndamento, aparelhosEmprestados, emAssistencia, maisde7Dias, aguardandoAprovacao };
};

export const calcularStatusExpiracao = (dataFimGarantia: string): {
  status: 'expirada' | 'urgente' | 'atencao' | 'ativa';
  diasRestantes: number;
  mensagem: string;
  cor: string;
} => {
  const hoje = new Date();
  const dataFim = new Date(dataFimGarantia);
  const dias = differenceInDays(dataFim, hoje);

  if (dias < 0) return { status: 'expirada', diasRestantes: dias, mensagem: `Fora do período de garantia (expirou em ${format(dataFim, 'dd/MM/yyyy')})`, cor: 'destructive' };
  if (dias <= 7) return { status: 'urgente', diasRestantes: dias, mensagem: `URGENTE: Garantia expira em ${dias} dia${dias !== 1 ? 's' : ''}`, cor: 'warning' };
  if (dias <= 30) return { status: 'atencao', diasRestantes: dias, mensagem: `Atenção: Garantia expira em ${dias} dias`, cor: 'secondary' };
  return { status: 'ativa', diasRestantes: dias, mensagem: `Garantia válida até ${format(dataFim, 'dd/MM/yyyy')}`, cor: 'success' };
};

export const exportGarantiasToCSV = (garantiasFiltradas: GarantiaItem[], filename: string) => {
  const headers = ['Data Venda', 'ID Garantia', 'IMEI', 'Modelo', 'Cliente', 'Resp. Garantia', 'Data Fim', 'Status', 'Tipo Tratativa', 'Data Tratativa'];
  const rows = garantiasFiltradas.map(g => {
    const tratativasGarantia = getTratativasByGarantiaId(g.id);
    const ultimaTratativa = tratativasGarantia[tratativasGarantia.length - 1];
    return [
      format(new Date(g.dataInicioGarantia), 'dd/MM/yyyy'), g.id, g.imei, g.modelo, g.clienteNome,
      g.tipoGarantia, format(new Date(g.dataFimGarantia), 'dd/MM/yyyy'), g.status,
      ultimaTratativa?.tipo || '-', ultimaTratativa ? format(new Date(ultimaTratativa.dataHora), 'dd/MM/yyyy') : '-'
    ];
  });
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// ==================== CONTATOS ATIVOS (Supabase) ====================

export const getContatosAtivos = (): ContatoAtivoGarantia[] => [..._contatosAtivosCache];

export const addContatoAtivo = async (contato: Omit<ContatoAtivoGarantia, 'id' | 'timeline'>): Promise<ContatoAtivoGarantia> => {
  const timelineInit = [{ id: `TLC-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'criacao', descricao: 'Contato registrado' }];
  const { data, error } = await supabase.from('contatos_ativos_garantia').insert({
    garantia_id: contato.garantiaId || null,
    data_lancamento: contato.dataLancamento || new Date().toISOString(),
    cliente: contato.cliente as any,
    aparelho: contato.aparelho as any,
    logistica: contato.logistica as any,
    garantia_estendida: contato.garantiaEstendida as any || null,
    status: contato.status || 'Pendente',
    timeline: timelineInit as any,
    auto_gerado: contato.autoGerado || false,
  }).select().single();
  if (error) throw error;
  const novo = mapContatoAtivoFromDB(data);
  _contatosAtivosCache.unshift(novo);
  return novo;
};

export const updateContatoAtivo = async (id: string, updates: Partial<ContatoAtivoGarantia>): Promise<void> => {
  const index = _contatosAtivosCache.findIndex(c => c.id === id);
  if (index === -1) return;

  const current = _contatosAtivosCache[index];
  const newTimeline = [...current.timeline, { id: `TLC-${Date.now()}`, dataHora: new Date().toISOString(), tipo: 'edicao' as const, descricao: 'Contato atualizado' }];

  const dbUpdates: any = { timeline: newTimeline as any };
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.cliente !== undefined) dbUpdates.cliente = updates.cliente;
  if (updates.aparelho !== undefined) dbUpdates.aparelho = updates.aparelho;
  if (updates.logistica !== undefined) dbUpdates.logistica = updates.logistica;
  if (updates.garantiaEstendida !== undefined) dbUpdates.garantia_estendida = updates.garantiaEstendida;

  await supabase.from('contatos_ativos_garantia').update(dbUpdates).eq('id', id);
  _contatosAtivosCache[index] = { ...current, ...updates, timeline: newTimeline };
};

export const verificarEGerarContatosAutomaticos = async (): Promise<ContatoAtivoGarantia[]> => {
  const garantiasExpirando = [...getGarantiasExpirandoEm7Dias(), ...getGarantiasExpirandoEm30Dias()];
  const novosContatos: ContatoAtivoGarantia[] = [];
  for (const garantia of garantiasExpirando) {
    if (_contatosAtivosCache.some(c => c.garantiaId === garantia.id)) continue;
    try {
      const novo = await addContatoAtivo({
        garantiaId: garantia.id,
        dataLancamento: new Date().toISOString(),
        cliente: { id: garantia.clienteId, nome: garantia.clienteNome, telefone: garantia.clienteTelefone || '', email: garantia.clienteEmail || '' },
        aparelho: { modelo: garantia.modelo, imei: garantia.imei },
        logistica: { motoboyId: '', motoboyNome: '', dataEntregaPrevista: '', enderecoEntrega: '', observacoes: `Contato gerado automaticamente - Garantia ${garantia.id} expira em ${format(new Date(garantia.dataFimGarantia), 'dd/MM/yyyy')}` },
        status: 'Pendente',
        autoGerado: true,
      });
      novosContatos.push(novo);
    } catch (err) {
      console.error('[GARANTIA] Erro ao gerar contato automático:', err);
    }
  }
  return novosContatos;
};

// ==================== ANÁLISE GARANTIA (Supabase) ====================

export const getRegistrosAnaliseGarantia = (): RegistroAnaliseGarantia[] => [..._registrosAnaliseCache];

export const aprovarAnaliseGarantia = async (id: string, dados: { tecnicoId: string; tecnicoNome: string; dataAprovacao: string; usuarioAprovacao: string }): Promise<RegistroAnaliseGarantia | null> => {
  const { error } = await supabase.from('registros_analise_garantia').update({
    status: 'Solicitação Aprovada',
    tecnico_id: dados.tecnicoId,
    tecnico_nome: dados.tecnicoNome,
    data_aprovacao: dados.dataAprovacao,
    usuario_aprovacao: dados.usuarioAprovacao,
  }).eq('id', id);
  if (error) { console.error('Erro ao aprovar análise:', error); throw error; }
  const index = _registrosAnaliseCache.findIndex(r => r.id === id);
  if (index !== -1) {
    _registrosAnaliseCache[index] = { ..._registrosAnaliseCache[index], status: 'Solicitação Aprovada', ...dados };
    return _registrosAnaliseCache[index];
  }
  return null;
};

export const recusarAnaliseGarantia = async (id: string, motivo: string): Promise<RegistroAnaliseGarantia | null> => {
  const agora = new Date().toISOString();
  const { error } = await supabase.from('registros_analise_garantia').update({
    status: 'Recusada',
    motivo_recusa: motivo,
    data_recusa: agora,
  }).eq('id', id);
  if (error) { console.error('Erro ao recusar análise:', error); throw error; }
  const index = _registrosAnaliseCache.findIndex(r => r.id === id);
  if (index !== -1) {
    _registrosAnaliseCache[index] = { ..._registrosAnaliseCache[index], status: 'Recusada', motivoRecusa: motivo, dataRecusa: agora };
    return _registrosAnaliseCache[index];
  }
  return null;
};

export const encaminharParaAnaliseGarantia = async (origemId: string, origem: 'Garantia' | 'Estoque', descricao: string, observacao?: string, metadata?: MetadadosEstoque): Promise<void> => {
  const { data, error } = await supabase.from('registros_analise_garantia').insert({
    origem, origem_id: origemId, cliente_descricao: descricao,
    data_chegada: new Date().toISOString(), status: 'Pendente',
    observacao: observacao || null, metadata: (metadata || {}) as any,
  }).select().single();
  if (error) { console.error('Erro ao encaminhar para análise:', error); throw error; }
  _registrosAnaliseCache.unshift(mapRegistroAnaliseFromDB(data));
};

// ==================== FLUXO DE APROVAÇÃO DE TRATATIVAS ====================

export const aprovarTratativa = async (id: string, gestorId: string, gestorNome: string): Promise<{ sucesso: boolean; erro?: string }> => {
  const index = _tratativasCache.findIndex(t => t.id === id);
  if (index === -1) return { sucesso: false, erro: 'Tratativa não encontrada' };

  const tratativa = _tratativasCache[index];
  if (tratativa.status !== 'Aguardando Aprovação') return { sucesso: false, erro: 'Tratativa não está aguardando aprovação' };

  const garantia = getGarantiaById(tratativa.garantiaId);
  if (!garantia) return { sucesso: false, erro: 'Garantia não encontrada' };

  try {
    const agora = new Date().toISOString();

    if (tratativa.tipo === 'Assistência + Empréstimo' && tratativa.aparelhoEmprestadoId) {
      await updateProduto(tratativa.aparelhoEmprestadoId, {
        statusEmprestimo: 'Empréstimo - Assistência',
        emprestimoGarantiaId: garantia.id,
        emprestimoClienteId: garantia.clienteId,
        emprestimoClienteNome: garantia.clienteNome,
        emprestimoOsId: tratativa.osId,
        emprestimoDataHora: agora,
      });
      await addMovimentacao({
        data: agora, produto: tratativa.aparelhoEmprestadoModelo || '', imei: tratativa.aparelhoEmprestadoImei || '',
        quantidade: 1, origem: garantia.lojaVenda, destino: 'Empréstimo - Garantia',
        responsavel: gestorNome, motivo: `Empréstimo aprovado garantia ${garantia.id}`
      });
    }

    if (tratativa.tipo === 'Troca Direta' && tratativa.aparelhoTrocaId) {
      const aparelhoTroca = getProdutoById(tratativa.aparelhoTrocaId);
      await updateProduto(tratativa.aparelhoTrocaId, { bloqueadoEmTrocaGarantiaId: garantia.id, quantidade: 0 });
      await addMovimentacao({
        data: agora, produto: tratativa.aparelhoTrocaModelo || '', imei: tratativa.aparelhoTrocaImei || '',
        quantidade: 1, origem: garantia.lojaVenda, destino: 'Troca - Garantia',
        responsavel: gestorNome, motivo: `Troca aprovada garantia ${garantia.id}`
      });

      await addProdutoPendente({
        imei: garantia.imei, marca: 'Apple', modelo: garantia.modelo,
        cor: aparelhoTroca?.cor || '-', tipo: 'Seminovo', condicao: 'Semi-novo',
        origemEntrada: 'Garantia', notaOuVendaId: `GAR-${garantia.id}`,
        valorCusto: 0, valorOrigem: 0, saudeBateria: 0,
        loja: garantia.lojaVenda, dataEntrada: agora.split('T')[0],
        motivoAssistencia: `Defeito relatado na Garantia ID #${garantia.id}`,
      } as any, true);

      await addVenda({
        dataHora: agora, lojaVenda: garantia.lojaVenda, vendedor: gestorId,
        clienteId: garantia.clienteId, clienteNome: garantia.clienteNome,
        clienteCpf: '', clienteTelefone: garantia.clienteTelefone || '',
        clienteEmail: garantia.clienteEmail || '', clienteCidade: '',
        origemVenda: 'Troca Garantia', localRetirada: garantia.lojaVenda,
        tipoRetirada: 'Retirada Balcão', taxaEntrega: 0,
        itens: [{ id: `ITEM-GAR-${garantia.id}`, produtoId: tratativa.aparelhoTrocaId, produto: tratativa.aparelhoTrocaModelo || '', imei: tratativa.aparelhoTrocaImei || '', quantidade: 1, valorRecomendado: 0, valorCusto: 0, valorVenda: 0, categoria: 'Apple', loja: garantia.lojaVenda }],
        tradeIns: [{ id: `TI-GAR-${garantia.id}`, modelo: garantia.modelo, descricao: 'Entrada de Garantia', imei: garantia.imei, valorCompraUsado: 0, imeiValidado: true, condicao: 'Semi-novo' }],
        acessorios: [], pagamentos: [], subtotal: 0, totalTradeIn: 0, total: 0, lucro: 0, margem: 0,
        observacoes: `Troca Direta - Garantia ${garantia.id}.`, status: 'Concluída',
      });

      await encaminharParaAnaliseGarantia(garantia.id, 'Garantia', `${garantia.clienteNome} - ${garantia.modelo} (IMEI: ${garantia.imei}) - Troca Direta`);

      await addTimelineEntry({
        garantiaId: garantia.id, dataHora: agora, tipo: 'troca',
        titulo: 'Nota de Venda Garantia Gerada',
        descricao: `Nota de venda com custo zerado gerada.`,
        usuarioId: gestorId, usuarioNome: gestorNome
      });
    }

    _tratativasCache[index] = { ..._tratativasCache[index], status: 'Em Andamento' };
    await persistGarantiaTratativas(garantia.id);

    await addTimelineEntry({
      garantiaId: garantia.id, dataHora: agora, tipo: 'tratativa',
      titulo: 'Tratativa Aprovada pelo Gestor',
      descricao: `Tratativa ${tratativa.tipo} aprovada por ${gestorNome}.`,
      usuarioId: gestorId, usuarioNome: gestorNome
    });

    addTimelineUnificada({
      entidadeId: garantia.id, entidadeTipo: 'Garantia', dataHora: agora,
      tipo: 'aprovacao_tratativa', titulo: 'Tratativa Aprovada',
      descricao: `Tratativa ${tratativa.tipo} da garantia ${garantia.id} aprovada por ${gestorNome}`,
      usuarioId: gestorId, usuarioNome: gestorNome
    });

    return { sucesso: true };
  } catch (error) {
    console.error('[GARANTIA] Erro ao aprovar tratativa:', error);
    return { sucesso: false, erro: 'Erro ao aprovar tratativa' };
  }
};

export const recusarTratativa = async (id: string, gestorId: string, gestorNome: string, motivo: string): Promise<{ sucesso: boolean; erro?: string }> => {
  const index = _tratativasCache.findIndex(t => t.id === id);
  if (index === -1) return { sucesso: false, erro: 'Tratativa não encontrada' };

  const tratativa = _tratativasCache[index];
  if (tratativa.status !== 'Aguardando Aprovação') return { sucesso: false, erro: 'Tratativa não está aguardando aprovação' };

  const garantia = getGarantiaById(tratativa.garantiaId);

  _tratativasCache[index] = { ..._tratativasCache[index], status: 'Recusada' };

  if (garantia) {
    const outrasTratativas = _tratativasCache.filter(t => t.garantiaId === garantia.id && t.status === 'Em Andamento');
    if (outrasTratativas.length === 0) {
      await updateGarantia(garantia.id, { status: 'Ativa' });
    }

    await addTimelineEntry({
      garantiaId: garantia.id, dataHora: new Date().toISOString(), tipo: 'tratativa',
      titulo: 'Tratativa Recusada pelo Gestor',
      descricao: `Tratativa ${tratativa.tipo} recusada por ${gestorNome}. Motivo: ${motivo}`,
      usuarioId: gestorId, usuarioNome: gestorNome
    });

    await persistGarantiaTratativas(garantia.id);
  }

  return { sucesso: true };
};

// ==================== ORQUESTRADOR ATÔMICO DE TRATATIVA ====================

export interface ProcessarTratativaRequest {
  garantiaId: string;
  tipo: TratativaGarantia['tipo'];
  descricao: string;
  usuarioId: string;
  usuarioNome: string;
  aparelhoSelecionado?: Produto | null;
}

export const processarTratativaGarantia = async (dados: ProcessarTratativaRequest): Promise<{ sucesso: boolean; osId?: string; erro?: string }> => {
  const garantia = getGarantiaById(dados.garantiaId);
  if (!garantia) return { sucesso: false, erro: 'Garantia não encontrada' };

  if (garantia.status === 'Expirada') return { sucesso: false, erro: 'Não é possível abrir tratativa para garantia expirada' };
  if (garantia.status === 'Concluída') return { sucesso: false, erro: 'Não é possível abrir tratativa para garantia concluída' };

  try {
    let osId: string | undefined;
    const agora = new Date().toISOString();

    if (dados.tipo === 'Encaminhado Assistência' || dados.tipo === 'Assistência + Empréstimo') {
      const observacaoEmprestimo = dados.tipo === 'Assistência + Empréstimo' && dados.aparelhoSelecionado
        ? `\n[EMPRÉSTIMO] Cliente com aparelho emprestado: ${dados.aparelhoSelecionado.modelo} (IMEI: ${dados.aparelhoSelecionado.imei})`
        : '';

      const novaOS = await addOrdemServico({
        dataHora: agora, clienteId: garantia.clienteId, setor: 'GARANTIA',
        tecnicoId: '', lojaId: garantia.lojaVenda, status: 'Aguardando Análise',
        proximaAtuacao: 'Técnico: Avaliar/Executar', pecas: [], pagamentos: [],
        descricao: `${dados.descricao}${observacaoEmprestimo}`,
        timeline: [{ data: agora, tipo: 'registro', descricao: `OS criada automaticamente via Garantia ${garantia.id}`, responsavel: dados.usuarioNome }],
        valorTotal: 0, custoTotal: 0, origemOS: 'Garantia', garantiaId: garantia.id,
        modeloAparelho: garantia.modelo, imeiAparelho: garantia.imei,
      });
      osId = novaOS.id;

      await addTimelineEntry({
        garantiaId: garantia.id, dataHora: agora, tipo: 'os_criada',
        titulo: `OS criada: ${osId}`, descricao: `Ordem de serviço ${osId} criada automaticamente para reparo`,
        usuarioId: dados.usuarioId, usuarioNome: dados.usuarioNome
      });

      addTimelineUnificada({
        entidadeId: garantia.id, entidadeTipo: 'Garantia', dataHora: agora,
        tipo: 'os_criada', titulo: `OS ${osId} criada via Garantia`,
        descricao: `OS ${osId} criada automaticamente para garantia ${garantia.id}`,
        usuarioId: dados.usuarioId, usuarioNome: dados.usuarioNome
      });

      if (dados.tipo === 'Assistência + Empréstimo') {
        await encaminharParaAnaliseGarantia(garantia.id, 'Garantia', `${garantia.clienteNome} - ${garantia.modelo} (IMEI: ${garantia.imei}) - Assistência + Empréstimo`);
      }
    }

    if (dados.tipo === 'Assistência + Empréstimo' && dados.aparelhoSelecionado) {
      await updateProduto(dados.aparelhoSelecionado.id, {
        statusEmprestimo: 'Empréstimo - Assistência',
        emprestimoGarantiaId: garantia.id,
        emprestimoClienteId: garantia.clienteId,
        emprestimoClienteNome: garantia.clienteNome,
        emprestimoOsId: osId,
        emprestimoDataHora: agora,
      });
      await addMovimentacao({
        data: agora, produto: dados.aparelhoSelecionado.modelo, imei: dados.aparelhoSelecionado.imei,
        quantidade: 1, origem: garantia.lojaVenda, destino: 'Empréstimo - Garantia',
        responsavel: dados.usuarioNome, motivo: `Empréstimo garantia ${garantia.id}`
      });

      await addTimelineEntry({
        garantiaId: garantia.id, dataHora: agora, tipo: 'emprestimo',
        titulo: 'Aparelho emprestado',
        descricao: `${dados.aparelhoSelecionado.modelo} (IMEI: ${dados.aparelhoSelecionado.imei}) emprestado ao cliente`,
        usuarioId: dados.usuarioId, usuarioNome: dados.usuarioNome
      });
    }

    if (dados.tipo === 'Troca Direta' && dados.aparelhoSelecionado) {
      await updateProduto(dados.aparelhoSelecionado.id, { bloqueadoEmTrocaGarantiaId: garantia.id, quantidade: 0 });
      await addMovimentacao({
        data: agora, produto: dados.aparelhoSelecionado.modelo, imei: dados.aparelhoSelecionado.imei,
        quantidade: 1, origem: garantia.lojaVenda, destino: 'Troca - Garantia',
        responsavel: dados.usuarioNome, motivo: `Troca direta garantia ${garantia.id}`
      });

      await addProdutoPendente({
        imei: garantia.imei, marca: 'Apple', modelo: garantia.modelo,
        cor: dados.aparelhoSelecionado.cor || '-', tipo: 'Seminovo', condicao: 'Semi-novo',
        origemEntrada: 'Garantia', notaOuVendaId: `GAR-${garantia.id}`,
        valorCusto: 0, valorOrigem: 0, saudeBateria: 0,
        loja: garantia.lojaVenda, dataEntrada: agora.split('T')[0],
        motivoAssistencia: `Defeito relatado na Garantia ID #${garantia.id}`,
      } as any, true);

      await addVenda({
        dataHora: agora, lojaVenda: garantia.lojaVenda, vendedor: dados.usuarioId,
        clienteId: garantia.clienteId, clienteNome: garantia.clienteNome,
        clienteCpf: '', clienteTelefone: garantia.clienteTelefone || '',
        clienteEmail: garantia.clienteEmail || '', clienteCidade: '',
        origemVenda: 'Troca Garantia', localRetirada: garantia.lojaVenda,
        tipoRetirada: 'Retirada Balcão', taxaEntrega: 0,
        itens: [{ id: `ITEM-GAR-${garantia.id}`, produtoId: dados.aparelhoSelecionado.id, produto: dados.aparelhoSelecionado.modelo, imei: dados.aparelhoSelecionado.imei, quantidade: 1, valorRecomendado: 0, valorCusto: 0, valorVenda: 0, categoria: 'Apple', loja: garantia.lojaVenda }],
        tradeIns: [{ id: `TI-GAR-${garantia.id}`, modelo: garantia.modelo, descricao: 'Entrada de Garantia', imei: garantia.imei, valorCompraUsado: 0, imeiValidado: true, condicao: 'Semi-novo' }],
        acessorios: [], pagamentos: [], subtotal: 0, totalTradeIn: 0, total: 0, lucro: 0, margem: 0,
        observacoes: `Troca Direta - Garantia ${garantia.id}.`, status: 'Concluída',
      });

      await encaminharParaAnaliseGarantia(garantia.id, 'Garantia', `${garantia.clienteNome} - ${garantia.modelo} (IMEI: ${garantia.imei}) - Troca Direta`);

      await addTimelineEntry({
        garantiaId: garantia.id, dataHora: agora, tipo: 'troca',
        titulo: 'Nota de Venda Garantia Gerada',
        descricao: `Nota de venda com custo zerado gerada. Aparelho defeituoso (IMEI: ${garantia.imei}) encaminhado para Aparelhos Pendentes.`,
        usuarioId: dados.usuarioId, usuarioNome: dados.usuarioNome
      });
    }

    await addTratativa({
      garantiaId: garantia.id, tipo: dados.tipo, dataHora: agora,
      usuarioId: dados.usuarioId, usuarioNome: dados.usuarioNome,
      descricao: dados.descricao,
      aparelhoEmprestadoId: dados.tipo === 'Assistência + Empréstimo' ? dados.aparelhoSelecionado?.id : undefined,
      aparelhoEmprestadoModelo: dados.tipo === 'Assistência + Empréstimo' ? dados.aparelhoSelecionado?.modelo : undefined,
      aparelhoEmprestadoImei: dados.tipo === 'Assistência + Empréstimo' ? dados.aparelhoSelecionado?.imei : undefined,
      aparelhoTrocaId: dados.tipo === 'Troca Direta' ? dados.aparelhoSelecionado?.id : undefined,
      aparelhoTrocaModelo: dados.tipo === 'Troca Direta' ? dados.aparelhoSelecionado?.modelo : undefined,
      aparelhoTrocaImei: dados.tipo === 'Troca Direta' ? dados.aparelhoSelecionado?.imei : undefined,
      osId, status: 'Em Andamento'
    });

    if (dados.tipo === 'Direcionado Apple') {
      await addTimelineEntry({
        garantiaId: garantia.id, dataHora: agora, tipo: 'tratativa',
        titulo: 'Cliente Direcionado para Apple', descricao: dados.descricao,
        usuarioId: dados.usuarioId, usuarioNome: dados.usuarioNome
      });
    }

    await updateGarantia(garantia.id, { status: 'Em Tratativa' });

    addTimelineUnificada({
      entidadeId: garantia.id, entidadeTipo: 'Garantia', dataHora: agora,
      tipo: 'tratativa_registrada', titulo: `Tratativa: ${dados.tipo}`,
      descricao: `Tratativa registrada para garantia ${garantia.id}.`,
      usuarioId: dados.usuarioId, usuarioNome: dados.usuarioNome
    });

    return { sucesso: true, osId };
  } catch (error) {
    console.error('[GARANTIA] Erro ao processar tratativa:', error);
    return { sucesso: false, erro: 'Erro ao processar tratativa. Nenhuma alteração foi salva.' };
  }
};
