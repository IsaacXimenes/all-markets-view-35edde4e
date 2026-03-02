import { useState, useMemo, useEffect, useCallback } from 'react';
import { OSLayout } from '@/components/layout/OSLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCadastroStore } from '@/store/cadastroStore';
import { AutocompleteLoja } from '@/components/AutocompleteLoja';
import { useAuthStore } from '@/store/authStore';
import { useIsAcessoGeral } from '@/utils/permissoesUtils';
import { AutocompleteColaborador } from '@/components/AutocompleteColaborador';
import { getPecas, getPecaById, updatePeca, Peca, initializePecasWithLojaIds } from '@/utils/pecasApi';
import { formatCurrency } from '@/utils/formatUtils';
import { Plus, Package, Search, X, CheckCircle, Clock, Eye, Edit, ArrowRight, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ResponsiveTableContainer } from '@/components/ui/ResponsiveContainers';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface MovimentacaoPeca {
  id: string;
  codigoLegivel: string;
  pecaId: string;
  descricaoPeca: string;
  modelo: string;
  quantidade: number;
  origem: string;
  destino: string;
  responsavel: string;
  motivo: string;
  data: string;
  status: 'Pendente' | 'Recebido';
  dataRecebimento?: string;
  responsavelRecebimento?: string;
}

export default function OSMovimentacaoPecas() {
  const { toast } = useToast();
  const { obterLojasPorTipo, obterNomeLoja, obterColaboradoresAtivos, obterNomeColaborador } = useCadastroStore();
  const user = useAuthStore(state => state.user);
  const acessoGeral = useIsAcessoGeral();
  const lojas = obterLojasPorTipo('Assistência');
  const colaboradores = obterColaboradoresAtivos();

  useEffect(() => {
    const lojaIds = lojas.map(l => l.id);
    if (lojaIds.length > 0) {
      initializePecasWithLojaIds(lojaIds);
    }
  }, [lojas]);

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoPeca[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar movimentações do Supabase
  const carregarMovimentacoes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_pecas_estoque')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped: MovimentacaoPeca[] = (data || []).map((row: any) => ({
        id: row.id,
        codigoLegivel: row.codigo_legivel || row.id.substring(0, 8),
        pecaId: row.peca_id || '',
        descricaoPeca: row.descricao_peca || '',
        modelo: row.modelo || '',
        quantidade: row.quantidade || 1,
        origem: row.origem || '',
        destino: row.destino || '',
        responsavel: row.responsavel || '',
        motivo: row.motivo || '',
        data: row.data || '',
        status: row.status === 'Recebido' ? 'Recebido' : 'Pendente',
        dataRecebimento: row.data_recebimento || undefined,
        responsavelRecebimento: row.responsavel_recebimento || undefined,
      }));
      setMovimentacoes(mapped);
    } catch (err) {
      console.error('Erro ao carregar movimentações de peças:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarMovimentacoes();
  }, [carregarMovimentacoes]);

  const pecas = useMemo(() => getPecas().filter(p => p.status === 'Disponível' && p.quantidade > 0 && p.statusMovimentacao !== 'Em movimentação'), [lojas, movimentacoes]);

  // Filtros
  const [filtroOrigem, setFiltroOrigem] = useState('todas');
  const [filtroDestino, setFiltroDestino] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modal nova movimentação
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pecaSelecionada, setPecaSelecionada] = useState<Peca | null>(null);
  const [formData, setFormData] = useState({
    quantidade: '1',
    destino: '',
    responsavel: user?.colaborador?.id || '',
    motivo: '',
    data: '',
  });

  // Modal de busca de peça
  const [showPecaModal, setShowPecaModal] = useState(false);
  const [buscaPeca, setBuscaPeca] = useState('');
  const [buscaLojaModal, setBuscaLojaModal] = useState<string>('todas');

  // AlertDialog de confirmação de recebimento
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [movParaConfirmar, setMovParaConfirmar] = useState<MovimentacaoPeca | null>(null);

  // Modal de timeline (Eye)
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [movTimeline, setMovTimeline] = useState<MovimentacaoPeca | null>(null);

  // Modal de edição
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [movParaEditar, setMovParaEditar] = useState<MovimentacaoPeca | null>(null);
  const [editForm, setEditForm] = useState({ destino: '', motivo: '' });

  const pecasFiltradas = useMemo(() => {
    let resultado = pecas;
    if (buscaLojaModal !== 'todas') {
      resultado = resultado.filter(p => p.lojaId === buscaLojaModal);
    }
    if (buscaPeca) {
      const busca = buscaPeca.toLowerCase();
      resultado = resultado.filter(p =>
        p.descricao.toLowerCase().includes(busca) ||
        p.modelo.toLowerCase().includes(busca) ||
        p.id.toLowerCase().includes(busca)
      );
    }
    return resultado;
  }, [pecas, buscaPeca, buscaLojaModal]);

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(m => {
      if (filtroOrigem !== 'todas' && m.origem !== filtroOrigem) return false;
      if (filtroDestino !== 'todas' && m.destino !== filtroDestino) return false;
      if (filtroStatus !== 'todos' && m.status !== filtroStatus) return false;
      return true;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [movimentacoes, filtroOrigem, filtroDestino, filtroStatus]);

  const handleSelecionarPeca = (peca: Peca) => {
    setPecaSelecionada(peca);
    setShowPecaModal(false);
    setBuscaPeca('');
    setBuscaLojaModal('todas');
  };

  const resetForm = () => {
    setPecaSelecionada(null);
    setFormData({ quantidade: '1', destino: '', responsavel: user?.colaborador?.id || '', motivo: '', data: '' });
  };

  const handleRegistrar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!pecaSelecionada) {
      toast({ title: 'Erro', description: 'Selecione uma peça', variant: 'destructive' });
      return;
    }
    if (!formData.destino) {
      toast({ title: 'Erro', description: 'Selecione o destino', variant: 'destructive' });
      return;
    }
    if (!formData.motivo.trim()) {
      toast({ title: 'Erro', description: 'Informe o motivo da movimentação', variant: 'destructive' });
      return;
    }

    const qtd = parseInt(formData.quantidade) || 1;
    if (qtd > pecaSelecionada.quantidade) {
      toast({ title: 'Erro', description: 'Quantidade indisponível em estoque', variant: 'destructive' });
      return;
    }

    if (pecaSelecionada.lojaId === formData.destino) {
      toast({ title: 'Erro', description: 'Origem e destino não podem ser iguais', variant: 'destructive' });
      return;
    }

    const dataMovimentacao = formData.data || new Date().toISOString().split('T')[0];
    const nomeResponsavel = formData.responsavel ? obterNomeColaborador(formData.responsavel) : (user?.colaborador?.nome || 'Não identificado');

    // Gerar código legível baseado na contagem
    const codigoLegivel = `MOV-PEC-${String(movimentacoes.length + 1).padStart(4, '0')}`;

    try {
      const { data: inserted, error } = await supabase.from('movimentacoes_pecas_estoque').insert({
        codigo_legivel: codigoLegivel,
        peca_id: pecaSelecionada.id,
        descricao_peca: pecaSelecionada.descricao,
        modelo: pecaSelecionada.modelo,
        quantidade: qtd,
        origem: pecaSelecionada.lojaId,
        destino: formData.destino,
        responsavel: nomeResponsavel,
        motivo: formData.motivo,
        data: dataMovimentacao,
        status: 'Pendente',
      } as any).select().single();

      if (error) throw error;

      // Marcar peça como "Em movimentação"
      updatePeca(pecaSelecionada.id, {
        statusMovimentacao: 'Em movimentação',
        movimentacaoPecaId: codigoLegivel,
      });

      // Atualizar estado local
      await carregarMovimentacoes();
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Movimentação registrada', description: `${codigoLegivel} - Peça marcada como "Em movimentação"` });
    } catch (err) {
      console.error('Erro ao registrar movimentação:', err);
      toast({ title: 'Erro', description: 'Falha ao salvar movimentação', variant: 'destructive' });
    }
  };

  // Abrir AlertDialog de confirmação
  const handleAbrirConfirmacao = (mov: MovimentacaoPeca) => {
    setMovParaConfirmar(mov);
    setConfirmDialogOpen(true);
  };

  // Confirmar recebimento
  const handleConfirmarRecebimento = async () => {
    if (!movParaConfirmar) return;

    try {
      const agora = new Date().toISOString();
      const nomeResp = user?.colaborador?.nome || 'Não identificado';

      const { error } = await supabase.from('movimentacoes_pecas_estoque').update({
        status: 'Recebido',
        data_recebimento: agora,
        responsavel_recebimento: nomeResp,
      } as any).eq('id', movParaConfirmar.id);

      if (error) throw error;

      // Atualizar lojaId da peça para o destino e limpar bloqueio
      updatePeca(movParaConfirmar.pecaId, {
        lojaId: movParaConfirmar.destino,
        statusMovimentacao: null,
        movimentacaoPecaId: undefined,
      });

      await carregarMovimentacoes();
      toast({ title: 'Recebimento confirmado', description: `Peça transferida para ${obterNomeLoja(movParaConfirmar.destino)}` });
    } catch (err) {
      console.error('Erro ao confirmar recebimento:', err);
      toast({ title: 'Erro', description: 'Falha ao confirmar recebimento', variant: 'destructive' });
    }

    setConfirmDialogOpen(false);
    setMovParaConfirmar(null);
  };

  // Abrir timeline
  const handleAbrirTimeline = (mov: MovimentacaoPeca) => {
    setMovTimeline(mov);
    setTimelineDialogOpen(true);
  };

  // Abrir edição
  const handleAbrirEdicao = (mov: MovimentacaoPeca) => {
    setMovParaEditar(mov);
    setEditForm({ destino: mov.destino, motivo: mov.motivo });
    setEditDialogOpen(true);
  };

  const handleSalvarEdicao = async () => {
    if (!movParaEditar) return;
    if (!editForm.destino || !editForm.motivo.trim()) {
      toast({ title: 'Erro', description: 'Preencha destino e motivo', variant: 'destructive' });
      return;
    }
    if (movParaEditar.origem === editForm.destino) {
      toast({ title: 'Erro', description: 'Origem e destino não podem ser iguais', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('movimentacoes_pecas_estoque').update({
        destino: editForm.destino,
        motivo: editForm.motivo,
      } as any).eq('id', movParaEditar.id);

      if (error) throw error;

      await carregarMovimentacoes();
      toast({ title: 'Movimentação atualizada' });
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
      toast({ title: 'Erro', description: 'Falha ao atualizar movimentação', variant: 'destructive' });
    }
    setEditDialogOpen(false);
    setMovParaEditar(null);
  };

  const pendentes = movimentacoes.filter(m => m.status === 'Pendente').length;
  const recebidas = movimentacoes.filter(m => m.status === 'Recebido').length;

  return (
    <OSLayout title="Movimentação - Peças">
      {/* Stats */}
      <div className="sticky top-0 z-10 bg-background pb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{movimentacoes.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{pendentes}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{recebidas}</div>
              <div className="text-xs text-muted-foreground">Recebidas</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Origem</Label>
              <AutocompleteLoja
                value={filtroOrigem === 'todas' ? '' : filtroOrigem}
                onChange={(v) => setFiltroOrigem(v || 'todas')}
                placeholder="Todas as origens"
                filtrarPorTipo="Assistência"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Destino</Label>
              <AutocompleteLoja
                value={filtroDestino === 'todas' ? '' : filtroDestino}
                onChange={(v) => setFiltroDestino(v || 'todas')}
                placeholder="Todos os destinos"
                filtrarPorTipo="Assistência"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue placeholder="Todos status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => { setFiltroOrigem('todas'); setFiltroDestino('todas'); setFiltroStatus('todos'); }}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
            <div className="flex items-end">
              <Button onClick={() => setDialogOpen(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <ResponsiveTableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Peça</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : movimentacoesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Nenhuma movimentação encontrada</TableCell>
              </TableRow>
            ) : movimentacoesFiltradas.map(mov => (
              <TableRow key={mov.id} className={cn(
                mov.status === 'Pendente' && 'bg-yellow-500/10',
                mov.status === 'Recebido' && 'bg-green-500/10'
              )}>
                <TableCell className="sticky left-0 z-10 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <div className="font-medium">{mov.descricaoPeca}</div>
                  {mov.status === 'Pendente' && (
                    <Badge variant="outline" className="text-[10px] mt-1 border-yellow-500 text-yellow-600">
                      Em movimentação
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{mov.codigoLegivel}</TableCell>
                <TableCell className="text-xs">{new Date(mov.data).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-xs">{mov.modelo}</TableCell>
                <TableCell>{mov.quantidade}</TableCell>
                <TableCell className="text-xs">{obterNomeLoja(mov.origem)}</TableCell>
                <TableCell className="text-xs">{obterNomeLoja(mov.destino)}</TableCell>
                <TableCell className="text-xs">{mov.responsavel}</TableCell>
                <TableCell>
                  {mov.status === 'Recebido' ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Recebido</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Pendente</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-[150px] truncate" title={mov.motivo}>{mov.motivo}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      title="Visualizar timeline"
                      onClick={() => handleAbrirTimeline(mov)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {mov.status === 'Pendente' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Editar movimentação"
                          onClick={() => handleAbrirEdicao(mov)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleAbrirConfirmacao(mov)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTableContainer>

      {/* Dialog: Nova Movimentação */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Movimentação de Peça</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegistrar} className="space-y-4">
            {/* Peça selecionada */}
            <div>
              <Label>Peça *</Label>
              {pecaSelecionada ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pecaSelecionada.descricao}</p>
                    <p className="text-xs text-muted-foreground">{pecaSelecionada.modelo} | Qtd: {pecaSelecionada.quantidade} | {obterNomeLoja(pecaSelecionada.lojaId)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPecaSelecionada(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setShowPecaModal(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar peça...
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  max={pecaSelecionada?.quantidade || 1}
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                />
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Destino *</Label>
              <AutocompleteLoja
                value={formData.destino}
                onChange={(v) => setFormData({ ...formData, destino: v })}
                placeholder="Selecione o destino"
                filtrarPorTipo="Assistência"
              />
            </div>

            <div>
              <Label>Responsável</Label>
              <AutocompleteColaborador
                value={formData.responsavel}
                onChange={(v) => setFormData({ ...formData, responsavel: v })}
                placeholder="Selecione o responsável"
              />
            </div>

            <div>
              <Label>Motivo *</Label>
              <Textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Informe o motivo da movimentação"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit">Registrar Movimentação</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Busca de Peça */}
      <Dialog open={showPecaModal} onOpenChange={setShowPecaModal}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Peça</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por descrição, modelo ou ID..."
                value={buscaPeca}
                onChange={(e) => setBuscaPeca(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-56">
              <AutocompleteLoja
                value={buscaLojaModal === 'todas' ? '' : buscaLojaModal}
                onChange={(v) => setBuscaLojaModal(v || 'todas')}
                placeholder="Todas as lojas"
                filtrarPorTipo="Assistência"
              />
            </div>
          </div>
          <ResponsiveTableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pecasFiltradas.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.descricao}</TableCell>
                    <TableCell>{p.modelo}</TableCell>
                    <TableCell>{p.quantidade}</TableCell>
                    <TableCell>{formatCurrency(p.valorCusto)}</TableCell>
                    <TableCell>{obterNomeLoja(p.lojaId)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleSelecionarPeca(p)}>Selecionar</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pecasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Nenhuma peça disponível</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ResponsiveTableContainer>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmação de Recebimento */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Recebimento</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar o recebimento da peça <strong>{movParaConfirmar?.descricaoPeca}</strong> na loja{' '}
              <strong>{movParaConfirmar ? obterNomeLoja(movParaConfirmar.destino) : ''}</strong>?
              <br /><br />
              A peça será transferida para o estoque da loja de destino.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMovParaConfirmar(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarRecebimento}>Confirmar Recebimento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Timeline */}
      <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Timeline — {movTimeline?.codigoLegivel}</DialogTitle>
          </DialogHeader>
          {movTimeline && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Movimentação registrada</p>
                  <p className="text-xs text-muted-foreground">{new Date(movTimeline.data).toLocaleDateString('pt-BR')} — {movTimeline.responsavel}</p>
                  <p className="text-xs mt-1">
                    <span className="text-muted-foreground">Origem:</span> {obterNomeLoja(movTimeline.origem)} →{' '}
                    <span className="text-muted-foreground">Destino:</span> {obterNomeLoja(movTimeline.destino)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Motivo: {movTimeline.motivo}</p>
                </div>
              </div>

              <Separator />

              {movTimeline.status === 'Recebido' ? (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Recebido</p>
                    <p className="text-xs text-muted-foreground">
                      {movTimeline.dataRecebimento ? new Date(movTimeline.dataRecebimento).toLocaleDateString('pt-BR') : ''}
                      {' — '}{movTimeline.responsavelRecebimento}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Aguardando Recebimento</p>
                    <p className="text-xs text-muted-foreground">Peça em trânsito</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Movimentação — {movParaEditar?.codigoLegivel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Destino</Label>
              <AutocompleteLoja
                value={editForm.destino}
                onChange={(v) => setEditForm({ ...editForm, destino: v })}
                placeholder="Selecione o destino"
                filtrarPorTipo="Assistência"
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea
                value={editForm.motivo}
                onChange={(e) => setEditForm({ ...editForm, motivo: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSalvarEdicao}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OSLayout>
  );
}
