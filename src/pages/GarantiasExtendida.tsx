import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GarantiasLayout } from '@/components/layout/GarantiasLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Phone, MessageSquare, Star, Filter, Clock, AlertTriangle, CheckCircle2, X, Download, 
  ChevronRight, Smartphone, Calendar, User, Building2, Plus, History
} from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { getGarantias, GarantiaItem, addTimelineEntry } from '@/utils/garantiasApi';
import { getLojas, getColaboradores, getContasFinanceiras, getMaquinasCartao, getModelosPagamento } from '@/utils/cadastrosApi';
import { 
  calcularTempoRestante, 
  getTratativasComerciasByGarantiaId, 
  addTratativaComercial, 
  TratativaComercial,
  notificarFinanceiroAdesao,
  formatCurrency,
  getAdesoesPendentes
} from '@/utils/garantiaExtendidaApi';
import { getPlanosAtivos, PlanoGarantia } from '@/utils/planosGarantiaApi';
import { adicionarVendaParaConferencia } from '@/utils/conferenciaGestorApi';
import { toast } from 'sonner';

export default function GarantiasExtendida() {
  const navigate = useNavigate();
  const garantias = getGarantias();
  const lojas = getLojas();
  const colaboradores = getColaboradores();
  const contas = getContasFinanceiras();
  const maquinas = getMaquinasCartao();
  const modelosPagamento = getModelosPagamento();
  const planosGarantia = getPlanosAtivos();
  const adesoesPendentes = getAdesoesPendentes();
  
  // Filtros
  const [filters, setFilters] = useState({
    cliente: '',
    dataInicio: '',
    dataFim: '',
    imei: '',
    loja: 'todas',
    status: 'todas'
  });
  
  // Estado para tratativas inline
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [contatoDescricao, setContatoDescricao] = useState('');
  const [resultadoContato, setResultadoContato] = useState<string>('');
  
  // Estado para adesão
  const [showAdesaoDialog, setShowAdesaoDialog] = useState(false);
  const [adesaoGarantia, setAdesaoGarantia] = useState<GarantiaItem | null>(null);
  const [adesaoPlano, setAdesaoPlano] = useState<'Silver' | 'Gold'>('Silver');
  const [adesaoStep, setAdesaoStep] = useState<'pagamento' | 'confirmacao1' | 'confirmacao2'>('pagamento');
  const [adesaoData, setAdesaoData] = useState({
    planoId: '',
    meioPagamento: '',
    maquinaId: '',
    contaDestinoId: '',
    parcelas: 1,
    responsavelId: '',
    observacao: ''
  });
  
  const getLojaName = (id: string) => lojas.find(l => l.id === id)?.nome || id;
  const getColaboradorNome = (id: string) => colaboradores.find(c => c.id === id)?.nome || 'Sistema';
  
  // Filtrar garantias
  const garantiasFiltradas = useMemo(() => {
    return garantias.filter(g => {
      const tempoRestante = calcularTempoRestante(g.dataFimGarantia);
      
      if (filters.status === 'ativas' && tempoRestante.status === 'expirada') return false;
      if (filters.status === '7dias' && tempoRestante.status !== 'urgente') return false;
      if (filters.status === '30dias' && tempoRestante.status !== 'atencao') return false;
      if (filters.status === 'expiradas' && tempoRestante.status !== 'expirada') return false;
      
      if (filters.cliente && !g.clienteNome.toLowerCase().includes(filters.cliente.toLowerCase())) return false;
      if (filters.imei && !g.imei.includes(filters.imei)) return false;
      if (filters.loja !== 'todas' && g.lojaVenda !== filters.loja) return false;
      
      if (filters.dataInicio) {
        const dataVenda = new Date(g.dataInicioGarantia);
        if (dataVenda < new Date(filters.dataInicio)) return false;
      }
      
      if (filters.dataFim) {
        const dataVenda = new Date(g.dataInicioGarantia);
        const dataFimFiltro = new Date(filters.dataFim);
        dataFimFiltro.setHours(23, 59, 59);
        if (dataVenda > dataFimFiltro) return false;
      }
      
      return true;
    }).sort((a, b) => {
      const tempoA = calcularTempoRestante(a.dataFimGarantia);
      const tempoB = calcularTempoRestante(b.dataFimGarantia);
      return tempoA.dias - tempoB.dias;
    });
  }, [garantias, filters]);
  
  // Contadores
  const totalAtivas = garantias.filter(g => calcularTempoRestante(g.dataFimGarantia).status !== 'expirada').length;
  const expirando7Dias = garantias.filter(g => calcularTempoRestante(g.dataFimGarantia).status === 'urgente').length;
  const expirando30Dias = garantias.filter(g => calcularTempoRestante(g.dataFimGarantia).status === 'atencao').length;
  
  const handleLimparFiltros = () => {
    setFilters({ cliente: '', dataInicio: '', dataFim: '', imei: '', loja: 'todas', status: 'todas' });
  };
  
  const handleExportar = () => {
    const dataExport = garantiasFiltradas.map(g => {
      const tempo = calcularTempoRestante(g.dataFimGarantia);
      return {
        'ID Venda': g.vendaId,
        'Data Venda': format(new Date(g.dataInicioGarantia), 'dd/MM/yyyy'),
        'Cliente': g.clienteNome,
        'IMEI': g.imei,
        'Modelo': g.modelo,
        'Resp. Garantia': g.tipoGarantia,
        'Data Fim Garantia': format(new Date(g.dataFimGarantia), 'dd/MM/yyyy'),
        'Tempo Restante': tempo.texto,
        'Status': tempo.status === 'expirada' ? 'Expirada' : 'Ativa'
      };
    });
    
    const headers = Object.keys(dataExport[0] || {}).join(',');
    const rows = dataExport.map(item => 
      Object.values(item).map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `garantias-extendida-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dados exportados com sucesso!');
  };
  
  const getStatusBadge = (dataFim: string) => {
    const tempo = calcularTempoRestante(dataFim);
    switch (tempo.status) {
      case 'expirada':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">{tempo.texto}</Badge>;
      case 'urgente':
        return <Badge className="bg-red-500 text-white">{tempo.texto}</Badge>;
      case 'atencao':
        return <Badge className="bg-yellow-500 text-white">{tempo.texto}</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{tempo.texto}</Badge>;
    }
  };
  
  const getRowBorderColor = (dataFim: string) => {
    const tempo = calcularTempoRestante(dataFim);
    switch (tempo.status) {
      case 'expirada': return 'border-l-muted';
      case 'urgente': return 'border-l-red-500';
      case 'atencao': return 'border-l-yellow-500';
      default: return 'border-l-green-500';
    }
  };
  
  // Registrar contato
  const handleRegistrarContato = (garantia: GarantiaItem) => {
    if (!contatoDescricao.trim() || !resultadoContato) {
      toast.error('Preencha a descrição e o resultado do contato');
      return;
    }
    
    addTratativaComercial({
      garantiaId: garantia.id,
      vendaId: garantia.vendaId,
      tipo: 'Contato Realizado',
      dataHora: new Date().toISOString(),
      usuarioId: 'COL-001',
      usuarioNome: 'Lucas Mendes',
      descricao: contatoDescricao,
      resultadoContato: resultadoContato as any
    });
    
    addTimelineEntry({
      garantiaId: garantia.id,
      tipo: 'tratativa',
      titulo: 'Contato Comercial Realizado',
      descricao: `${resultadoContato}: ${contatoDescricao}`,
      usuarioId: 'COL-001',
      usuarioNome: 'Lucas Mendes',
      dataHora: new Date().toISOString()
    });
    
    setContatoDescricao('');
    setResultadoContato('');
    toast.success('Contato registrado com sucesso!');
  };
  
  // Iniciar adesão
  const handleIniciarAdesao = (garantia: GarantiaItem, plano: 'Silver' | 'Gold') => {
    setAdesaoGarantia(garantia);
    setAdesaoPlano(plano);
    setAdesaoStep('pagamento');
    setAdesaoData({
      planoId: '',
      meioPagamento: '',
      maquinaId: '',
      contaDestinoId: '',
      parcelas: 1,
      responsavelId: '',
      observacao: ''
    });
    setShowAdesaoDialog(true);
  };
  
  // Obter plano selecionado
  const getPlanoSelecionado = (): PlanoGarantia | null => {
    return planosGarantia.find(p => p.id === adesaoData.planoId) || null;
  };
  
  // Confirmar pagamento
  const handleConfirmarPagamento = () => {
    if (!adesaoData.planoId || !adesaoData.meioPagamento) {
      toast.error('Selecione o plano e meio de pagamento');
      return;
    }
    
    const meioPag = modelosPagamento.find(m => m.id === adesaoData.meioPagamento);
    if (meioPag?.modelo.toLowerCase().includes('cartão') || meioPag?.modelo.toLowerCase().includes('crédito') || meioPag?.modelo.toLowerCase().includes('débito')) {
      if (!adesaoData.maquinaId) {
        toast.error('Selecione a maquininha');
        return;
      }
    } else if (!adesaoData.contaDestinoId) {
      toast.error('Selecione a conta de destino');
      return;
    }
    
    setAdesaoStep('confirmacao1');
  };
  
  // Primeira confirmação
  const handleConfirmacao1 = () => {
    if (!adesaoData.responsavelId) {
      toast.error('Selecione o responsável');
      return;
    }
    setAdesaoStep('confirmacao2');
  };
  
  // Finalizar adesão
  const handleFinalizarAdesao = () => {
    if (!adesaoGarantia) return;
    
    const plano = getPlanoSelecionado();
    if (!plano) return;
    
    const meioPag = modelosPagamento.find(m => m.id === adesaoData.meioPagamento);
    const maquina = maquinas.find(m => m.id === adesaoData.maquinaId);
    const conta = contas.find(c => c.id === adesaoData.contaDestinoId);
    const responsavel = colaboradores.find(c => c.id === adesaoData.responsavelId);
    
    const novaDataFim = format(addMonths(new Date(), plano.meses), 'yyyy-MM-dd');
    
    const tratativa = addTratativaComercial({
      garantiaId: adesaoGarantia.id,
      vendaId: adesaoGarantia.vendaId,
      tipo: adesaoPlano === 'Silver' ? 'Adesão Silver' : 'Adesão Gold',
      dataHora: new Date().toISOString(),
      usuarioId: 'COL-001',
      usuarioNome: 'Lucas Mendes',
      descricao: `Cliente aderiu ao plano ${plano.nome}`,
      planoId: plano.id,
      planoNome: plano.nome,
      valorPlano: plano.valor,
      mesesPlano: plano.meses,
      novaDataFimGarantia: novaDataFim,
      statusAdesao: 'Pendente Financeiro',
      pagamento: {
        meioPagamento: meioPag?.modelo || '',
        maquinaId: maquina?.id,
        maquinaNome: maquina?.nome,
        contaDestinoId: conta?.id,
        contaDestinoNome: conta?.nome,
        valor: plano.valor,
        parcelas: adesaoData.parcelas
      },
      confirmacao1: {
        responsavelId: adesaoData.responsavelId,
        responsavelNome: responsavel?.nome || '',
        dataHora: new Date().toISOString()
      },
      confirmacao2: {
        responsavelId: 'COL-001',
        responsavelNome: 'Lucas Mendes',
        dataHora: new Date().toISOString(),
        observacao: adesaoData.observacao
      }
    });
    
    // Adicionar venda para conferência
    adicionarVendaParaConferencia(
      `${adesaoGarantia.vendaId}-EXT`,
      adesaoGarantia.lojaVenda,
      getLojaName(adesaoGarantia.lojaVenda),
      'COL-001',
      'Lucas Mendes',
      adesaoGarantia.clienteNome,
      plano.valor,
      'Normal',
      {
        subtotal: plano.valor,
        totalTradeIn: 0,
        total: plano.valor,
        lucro: plano.valor * 0.3,
        margem: 30,
        observacoes: `Garantia Extendida - ${plano.nome}`
      }
    );
    
    // Adicionar timeline
    addTimelineEntry({
      garantiaId: adesaoGarantia.id,
      tipo: 'tratativa',
      titulo: `Adesão ao Plano ${plano.nome}`,
      descricao: `Cliente aderiu ao plano ${plano.nome} por ${formatCurrency(plano.valor)}. Nova data fim: ${format(new Date(novaDataFim), 'dd/MM/yyyy')}`,
      usuarioId: 'COL-001',
      usuarioNome: 'Lucas Mendes',
      dataHora: new Date().toISOString()
    });
    
    notificarFinanceiroAdesao(tratativa);
    
    setShowAdesaoDialog(false);
    toast.success(`Adesão ao plano ${plano.nome} realizada com sucesso!`);
  };

  return (
    <GarantiasLayout title="Garantia Extendida">
      <div className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total com Garantia</p>
                  <p className="text-3xl font-bold">{totalAtivas}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expirando em 7 dias</p>
                  <p className="text-3xl font-bold text-red-600">{expirando7Dias}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expirando em 30 dias</p>
                  <p className="text-3xl font-bold text-yellow-600">{expirando30Dias}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Adesões Pendentes</p>
                  <p className="text-3xl font-bold text-primary">{adesoesPendentes.length}</p>
                </div>
                <Star className="h-10 w-10 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <Label>Cliente</Label>
                <Input
                  placeholder="Buscar cliente..."
                  value={filters.cliente}
                  onChange={(e) => setFilters({ ...filters, cliente: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Venda Início</Label>
                <Input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Venda Fim</Label>
                <Input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                />
              </div>
              <div>
                <Label>IMEI</Label>
                <Input
                  placeholder="Buscar IMEI..."
                  value={filters.imei}
                  onChange={(e) => setFilters({ ...filters, imei: e.target.value })}
                />
              </div>
              <div>
                <Label>Loja</Label>
                <Select value={filters.loja} onValueChange={(v) => setFilters({ ...filters, loja: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {lojas.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="ativas">Ativas</SelectItem>
                    <SelectItem value="7dias">Expirando em 7 dias</SelectItem>
                    <SelectItem value="30dias">Expirando em 30 dias</SelectItem>
                    <SelectItem value="expiradas">Expiradas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={handleLimparFiltros}>
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button variant="outline" onClick={handleExportar}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Lista de Garantias com Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Venda com Garantia ({garantiasFiltradas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {garantiasFiltradas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma garantia encontrada
              </div>
            ) : (
              <Accordion 
                type="single" 
                collapsible 
                value={expandedItem || undefined}
                onValueChange={(v) => setExpandedItem(v || null)}
                className="space-y-3"
              >
                {garantiasFiltradas.map((garantia) => {
                  const tratativas = getTratativasComerciasByGarantiaId(garantia.id);
                  const tempo = calcularTempoRestante(garantia.dataFimGarantia);
                  
                  return (
                    <AccordionItem 
                      key={garantia.id} 
                      value={garantia.id}
                      className={`border rounded-lg overflow-hidden border-l-4 ${getRowBorderColor(garantia.dataFimGarantia)}`}
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                        <div className="flex flex-1 items-center justify-between pr-4">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{garantia.modelo}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {garantia.clienteNome}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {garantia.imei}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                              Venda: {format(new Date(garantia.dataInicioGarantia), 'dd/MM/yyyy')}
                            </div>
                            {getStatusBadge(garantia.dataFimGarantia)}
                            {tratativas.length > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <History className="h-3 w-3" />
                                {tratativas.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                          {/* Informações da Venda */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Dados da Venda
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ID Venda:</span>
                                <span className="font-medium">{garantia.vendaId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Loja:</span>
                                <span>{getLojaName(garantia.lojaVenda)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Resp. Garantia:</span>
                                <Badge variant="outline">{garantia.tipoGarantia}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fim Garantia:</span>
                                <span className={tempo.status === 'expirada' ? 'line-through text-muted-foreground' : ''}>
                                  {format(new Date(garantia.dataFimGarantia), 'dd/MM/yyyy')}
                                </span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => navigate(`/garantias/extendida/${garantia.id}`)}
                              >
                                <ChevronRight className="h-4 w-4 mr-2" />
                                Ver Detalhes Completos
                              </Button>
                            </div>
                          </div>
                          
                          {/* Registrar Contato */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Registrar Contato
                            </h4>
                            <div className="space-y-3">
                              <Select 
                                value={expandedItem === garantia.id ? resultadoContato : ''} 
                                onValueChange={setResultadoContato}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Resultado do contato" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Interessado">Interessado</SelectItem>
                                  <SelectItem value="Sem interesse">Sem interesse</SelectItem>
                                  <SelectItem value="Sem resposta">Sem resposta</SelectItem>
                                  <SelectItem value="Agendou retorno">Agendou retorno</SelectItem>
                                </SelectContent>
                              </Select>
                              <Textarea
                                placeholder="Descreva o contato realizado..."
                                value={expandedItem === garantia.id ? contatoDescricao : ''}
                                onChange={(e) => setContatoDescricao(e.target.value)}
                                rows={2}
                              />
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleRegistrarContato(garantia)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Registrar Contato
                              </Button>
                            </div>
                          </div>
                          
                          {/* Ações de Adesão */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              Adesão a Plano
                            </h4>
                            <div className="space-y-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full border-gray-400"
                                onClick={() => handleIniciarAdesao(garantia, 'Silver')}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Aderir Plano Silver
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full border-yellow-500 text-yellow-700"
                                onClick={() => handleIniciarAdesao(garantia, 'Gold')}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Aderir Plano Gold
                              </Button>
                              
                              {/* Histórico de Tratativas */}
                              {tratativas.length > 0 && (
                                <div className="pt-3 border-t">
                                  <p className="text-xs text-muted-foreground mb-2">Últimas tratativas:</p>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {tratativas.slice(-3).reverse().map(t => (
                                      <div key={t.id} className="text-xs p-2 rounded bg-muted/50">
                                        <div className="flex items-center justify-between">
                                          <Badge variant="outline" className="text-xs">{t.tipo}</Badge>
                                          <span className="text-muted-foreground">
                                            {format(new Date(t.dataHora), 'dd/MM HH:mm')}
                                          </span>
                                        </div>
                                        {t.descricao && (
                                          <p className="mt-1 text-muted-foreground line-clamp-1">{t.descricao}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {garantiasFiltradas.length} {garantiasFiltradas.length === 1 ? 'garantia encontrada' : 'garantias encontradas'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog de Adesão */}
      <Dialog open={showAdesaoDialog} onOpenChange={setShowAdesaoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Adesão ao Plano {adesaoPlano}
            </DialogTitle>
            <DialogDescription>
              {adesaoGarantia && `Cliente: ${adesaoGarantia.clienteNome}`}
            </DialogDescription>
          </DialogHeader>
          
          {adesaoStep === 'pagamento' && (
            <div className="space-y-4">
              <div>
                <Label>Plano</Label>
                <Select value={adesaoData.planoId} onValueChange={(v) => setAdesaoData({...adesaoData, planoId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planosGarantia
                      .filter(p => p.nome.toLowerCase().includes(adesaoPlano.toLowerCase()))
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} - {formatCurrency(p.valor)} ({p.meses} meses)
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Meio de Pagamento</Label>
                <Select value={adesaoData.meioPagamento} onValueChange={(v) => setAdesaoData({...adesaoData, meioPagamento: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelosPagamento.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.modelo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {adesaoData.meioPagamento && modelosPagamento.find(m => m.id === adesaoData.meioPagamento)?.modelo.toLowerCase().includes('cartão') && (
                <>
                  <div>
                    <Label>Maquininha</Label>
                    <Select value={adesaoData.maquinaId} onValueChange={(v) => setAdesaoData({...adesaoData, maquinaId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {maquinas.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Parcelas</Label>
                    <Select value={String(adesaoData.parcelas)} onValueChange={(v) => setAdesaoData({...adesaoData, parcelas: parseInt(v)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {adesaoData.meioPagamento && !modelosPagamento.find(m => m.id === adesaoData.meioPagamento)?.modelo.toLowerCase().includes('cartão') && (
                <div>
                  <Label>Conta de Destino</Label>
                  <Select value={adesaoData.contaDestinoId} onValueChange={(v) => setAdesaoData({...adesaoData, contaDestinoId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdesaoDialog(false)}>Cancelar</Button>
                <Button onClick={handleConfirmarPagamento}>Continuar</Button>
              </DialogFooter>
            </div>
          )}
          
          {adesaoStep === 'confirmacao1' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Resumo do Pagamento</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Plano: {getPlanoSelecionado()?.nome}<br />
                  Valor: {getPlanoSelecionado() && formatCurrency(getPlanoSelecionado()!.valor)}<br />
                  Pagamento: {modelosPagamento.find(m => m.id === adesaoData.meioPagamento)?.modelo}
                </p>
              </div>
              
              <div>
                <Label>Responsável pela Confirmação</Label>
                <Select value={adesaoData.responsavelId} onValueChange={(v) => setAdesaoData({...adesaoData, responsavelId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {colaboradores.filter(c => c.status === 'Ativo').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdesaoStep('pagamento')}>Voltar</Button>
                <Button onClick={handleConfirmacao1}>Confirmar</Button>
              </DialogFooter>
            </div>
          )}
          
          {adesaoStep === 'confirmacao2' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  ✓ Confirmação 1 realizada por {colaboradores.find(c => c.id === adesaoData.responsavelId)?.nome}
                </p>
              </div>
              
              <div>
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Adicione observações sobre a adesão..."
                  value={adesaoData.observacao}
                  onChange={(e) => setAdesaoData({...adesaoData, observacao: e.target.value})}
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdesaoStep('confirmacao1')}>Voltar</Button>
                <Button onClick={handleFinalizarAdesao} className="bg-green-600 hover:bg-green-700">
                  Finalizar Adesão
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GarantiasLayout>
  );
}
