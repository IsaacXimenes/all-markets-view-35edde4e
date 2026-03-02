import { useState, useMemo, useEffect, useCallback } from 'react';
import { EstoqueLayout } from '@/components/layout/EstoqueLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getAcessorios, getAcessoriosByLoja, Acessorio, transferirAcessorioOrigem, receberAcessorioDestino } from '@/utils/acessoriosApi';
import { useCadastroStore } from '@/store/cadastroStore';
import { AutocompleteLoja } from '@/components/AutocompleteLoja';
import { Download, Plus, CheckCircle, Clock, Eye, Edit, Package, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ResponsiveTableContainer } from '@/components/ui/ResponsiveContainers';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';

interface MovimentacaoAcessorio {
  id: string;
  codigoLegivel: string;
  data: string;
  acessorio: string;
  acessorioId: string;
  quantidade: number;
  origem: string;
  destino: string;
  responsavel: string;
  motivo: string;
  status: 'Pendente' | 'Recebido';
  dataRecebimento?: string;
  responsavelRecebimento?: string;
}

export default function EstoqueMovimentacoesAcessorios() {
  const { obterLojasTipoLoja, obterColaboradoresAtivos, obterLojaById, obterNomeLoja } = useCadastroStore();
  const user = useAuthStore(state => state.user);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoAcessorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [acessoriosEstoque, setAcessoriosEstoque] = useState<Acessorio[]>(getAcessorios());
  const [origemFilter, setOrigemFilter] = useState<string>('todas');
  const [destinoFilter, setDestinoFilter] = useState<string>('todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const lojas = obterLojasTipoLoja();
  const acessorios = acessoriosEstoque;
  const colaboradores = obterColaboradoresAtivos();
  const colaboradoresComPermissao = colaboradores.filter(col => col.eh_estoquista || col.eh_gestor);

  // Carregar do Supabase
  const carregarMovimentacoes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_acessorios_estoque')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped: MovimentacaoAcessorio[] = (data || []).map((row: any) => ({
        id: row.id,
        codigoLegivel: row.codigo_legivel || `MOV-ACESS-${row.id.substring(0, 8)}`,
        data: row.data || '',
        acessorio: row.nome_acessorio || '',
        acessorioId: row.acessorio_id || '',
        quantidade: row.quantidade || 1,
        origem: row.origem || '',
        destino: row.destino || '',
        responsavel: row.responsavel || '',
        motivo: row.motivo || '',
        status: row.status === 'Recebido' ? 'Recebido' : 'Pendente',
        dataRecebimento: row.data_recebimento || undefined,
        responsavelRecebimento: row.responsavel_recebimento || undefined,
      }));
      setMovimentacoes(mapped);
    } catch (err) {
      console.error('Erro ao carregar movimentações de acessórios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarMovimentacoes();
  }, [carregarMovimentacoes]);

  // Estados para modais
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [movimentacaoDetalhe, setMovimentacaoDetalhe] = useState<MovimentacaoAcessorio | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [movimentacaoParaEditar, setMovimentacaoParaEditar] = useState<MovimentacaoAcessorio | null>(null);
  const [editFormData, setEditFormData] = useState({ destino: '', motivo: '' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [movimentacaoParaConfirmar, setMovimentacaoParaConfirmar] = useState<string | null>(null);
  const [responsavelConfirmacao, setResponsavelConfirmacao] = useState<string>('');

  const [formOrigem, setFormOrigem] = useState<string>('');
  const [formDestino, setFormDestino] = useState<string>('');

  const getLojaNome = (lojaIdOuNome: string) => {
    const loja = obterLojaById(lojaIdOuNome);
    if (loja) return loja.nome;
    return obterNomeLoja(lojaIdOuNome);
  };

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(m => {
      if (origemFilter !== 'todas' && m.origem !== origemFilter) return false;
      if (destinoFilter !== 'todas' && m.destino !== destinoFilter) return false;
      return true;
    });
  }, [movimentacoes, origemFilter, destinoFilter]);

  const handleAbrirConfirmacao = (movId: string) => {
    setMovimentacaoParaConfirmar(movId);
    setResponsavelConfirmacao(user?.colaborador?.id || '');
    setConfirmDialogOpen(true);
  };

  const handleConfirmarRecebimento = async () => {
    if (!movimentacaoParaConfirmar || !responsavelConfirmacao) {
      toast({ title: 'Campo obrigatório', description: 'Selecione o responsável pela confirmação', variant: 'destructive' });
      return;
    }

    const nomeResponsavel = colaboradores.find(c => c.id === responsavelConfirmacao)?.nome || responsavelConfirmacao;
    const mov = movimentacoes.find(m => m.id === movimentacaoParaConfirmar);
    
    if (mov) {
      const recebido = await receberAcessorioDestino(mov.acessorioId, mov.quantidade, mov.destino);
      if (!recebido) {
        toast({ title: 'Erro ao receber', description: 'Não foi possível adicionar os acessórios ao estoque de destino', variant: 'destructive' });
        return;
      }

      try {
        const { error } = await supabase.from('movimentacoes_acessorios_estoque').update({
          status: 'Recebido',
          data_recebimento: new Date().toISOString(),
          responsavel_recebimento: nomeResponsavel,
        } as any).eq('id', mov.id);

        if (error) throw error;

        await carregarMovimentacoes();
        setAcessoriosEstoque(getAcessorios());
      } catch (err) {
        console.error('Erro ao confirmar recebimento:', err);
        toast({ title: 'Erro', description: 'Falha ao atualizar no banco', variant: 'destructive' });
        return;
      }
    }

    setConfirmDialogOpen(false);
    setMovimentacaoParaConfirmar(null);
    setResponsavelConfirmacao('');
    toast({ title: 'Recebimento confirmado', description: `Movimentação confirmada. Estoque adicionado ao destino.` });
  };

  const handleSalvarEdicao = async () => {
    if (!movimentacaoParaEditar) return;
    if (!editFormData.destino) {
      toast({ title: 'Campo obrigatório', description: 'Selecione o destino', variant: 'destructive' });
      return;
    }
    if (!editFormData.motivo || !editFormData.motivo.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe o motivo', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('movimentacoes_acessorios_estoque').update({
        destino: editFormData.destino,
        motivo: editFormData.motivo,
      } as any).eq('id', movimentacaoParaEditar.id);

      if (error) throw error;
      await carregarMovimentacoes();
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
      toast({ title: 'Erro', description: 'Falha ao atualizar', variant: 'destructive' });
      return;
    }

    setEditDialogOpen(false);
    setMovimentacaoParaEditar(null);
    toast({ title: 'Movimentação atualizada', description: 'Os dados da movimentação foram atualizados com sucesso' });
  };

  const handleExport = () => {
    const headers = ['ID', 'Data', 'Acessório', 'Quantidade', 'Origem', 'Destino', 'Responsável', 'Motivo', 'Status'];
    const rows = movimentacoesFiltradas.map(m => [
      m.codigoLegivel, new Date(m.data).toLocaleDateString('pt-BR'), m.acessorio,
      m.quantidade.toString(), getLojaNome(m.origem), getLojaNome(m.destino), m.responsavel, m.motivo, m.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'movimentacoes-acessorios.csv';
    link.click();
  };

  const acessoriosFiltradosPorOrigem = useMemo(() => {
    if (!formOrigem) return acessorios.filter(a => a.quantidade > 0);
    return getAcessoriosByLoja(formOrigem).filter(a => a.quantidade > 0);
  }, [acessorios, formOrigem]);

  const handleRegistrarMovimentacao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const acessorioId = formData.get('acessorioId') as string;
    const quantidade = parseInt(formData.get('quantidade') as string);
    const acessorio = acessorios.find(a => a.id === acessorioId);
    const responsavelId = formData.get('responsavel') as string;
    const responsavelNome = colaboradoresComPermissao.find(c => c.id === responsavelId)?.nome || responsavelId;
    const motivo = formData.get('motivo') as string;

    if (!motivo || !motivo.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe o motivo da movimentação', variant: 'destructive' });
      return;
    }
    if (!formOrigem || !formDestino) {
      toast({ title: 'Campo obrigatório', description: 'Selecione origem e destino', variant: 'destructive' });
      return;
    }

    const sucesso = await transferirAcessorioOrigem(acessorioId, quantidade, formOrigem);
    if (!sucesso) {
      toast({ title: 'Estoque insuficiente', description: 'A loja de origem não possui estoque suficiente', variant: 'destructive' });
      return;
    }

    const codigoLegivel = `MOV-ACESS-${Date.now()}`;
    const dataMovimentacao = formData.get('data') as string;

    try {
      const { error } = await supabase.from('movimentacoes_acessorios_estoque').insert({
        codigo_legivel: codigoLegivel,
        acessorio_id: acessorioId,
        nome_acessorio: acessorio?.descricao || '',
        quantidade,
        origem: formOrigem,
        destino: formDestino,
        responsavel: responsavelNome,
        motivo,
        data: dataMovimentacao,
        status: 'Pendente',
      } as any).select().single();

      if (error) throw error;

      await carregarMovimentacoes();
      setDialogOpen(false);
      setFormOrigem('');
      setFormDestino('');
      setAcessoriosEstoque(getAcessorios());
      toast({ title: 'Movimentação registrada', description: `${codigoLegivel} registrada. Estoque subtraído da origem.` });
    } catch (err) {
      console.error('Erro ao registrar movimentação:', err);
      toast({ title: 'Erro', description: 'Falha ao salvar movimentação', variant: 'destructive' });
    }
  };

  return (
    <EstoqueLayout title="Movimentações - Acessórios">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Origem</Label>
                <AutocompleteLoja
                  value={origemFilter === 'todas' ? '' : origemFilter}
                  onChange={(v) => setOrigemFilter(v || 'todas')}
                  placeholder="Todas as origens"
                  apenasLojasTipoLoja
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Destino</Label>
                <AutocompleteLoja
                  value={destinoFilter === 'todas' ? '' : destinoFilter}
                  onChange={(v) => setDestinoFilter(v || 'todas')}
                  placeholder="Todos os destinos"
                  apenasLojasTipoLoja
                />
              </div>
              <div className="flex items-end">
                <Button variant="ghost" onClick={() => { setOrigemFilter('todas'); setDestinoFilter('todas'); }}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
              <div className="flex items-end gap-2 justify-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Nova Movimentação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Registrar Movimentação de Acessório</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRegistrarMovimentacao} className="space-y-4">
                      <div>
                        <Label htmlFor="data">Data</Label>
                        <Input id="data" name="data" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="acessorioId">Acessório</Label>
                        <Select name="acessorioId" required>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {acessoriosFiltradosPorOrigem.map(acessorio => (
                              <SelectItem key={acessorio.id} value={acessorio.id}>
                                {acessorio.descricao} (Qtd: {acessorio.quantidade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quantidade">Quantidade</Label>
                        <Input id="quantidade" name="quantidade" type="number" defaultValue="1" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="origem">Origem *</Label>
                          <AutocompleteLoja value={formOrigem} onChange={(v) => setFormOrigem(v)} placeholder="Selecione a origem" apenasLojasTipoLoja />
                        </div>
                        <div>
                          <Label htmlFor="destino">Destino *</Label>
                          <AutocompleteLoja value={formDestino} onChange={(v) => setFormDestino(v)} placeholder="Selecione o destino" apenasLojasTipoLoja />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="responsavel">Responsável *</Label>
                        <input type="hidden" name="responsavel" value={user?.colaborador?.id || ''} />
                        <Input value={user?.colaborador?.nome || 'Não identificado'} disabled className="bg-muted" />
                      </div>
                      <div>
                        <Label htmlFor="motivo">Motivo *</Label>
                        <Textarea id="motivo" name="motivo" required placeholder="Informe o motivo da movimentação" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">Registrar</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button onClick={handleExport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ResponsiveTableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-20 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Acessório</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
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
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : movimentacoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma movimentação encontrada</TableCell>
                </TableRow>
              ) : movimentacoesFiltradas.map(mov => (
                <TableRow 
                  key={mov.id}
                  className={cn(
                    mov.status === 'Pendente' && 'bg-yellow-500/10',
                    mov.status === 'Recebido' && 'bg-green-500/10'
                  )}
                >
                  <TableCell className="sticky left-0 z-10 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{mov.acessorio}</TableCell>
                  <TableCell className="font-mono text-xs">{mov.codigoLegivel}</TableCell>
                  <TableCell>{mov.data ? new Date(mov.data).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>{mov.quantidade}</TableCell>
                  <TableCell>{getLojaNome(mov.origem)}</TableCell>
                  <TableCell>{getLojaNome(mov.destino)}</TableCell>
                  <TableCell>{mov.responsavel}</TableCell>
                  <TableCell>
                    {mov.status === 'Recebido' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />Recebido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                        <Clock className="h-3 w-3 mr-1" />Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={mov.motivo}>{mov.motivo}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Visualizar"
                        onClick={() => { setMovimentacaoDetalhe(mov); setShowDetalhesModal(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {mov.status === 'Pendente' && (
                        <>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Editar"
                            onClick={() => { setMovimentacaoParaEditar(mov); setEditFormData({ destino: mov.destino, motivo: mov.motivo }); setEditDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleAbrirConfirmacao(mov.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />Confirmar
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

        {/* Dialog: Detalhes/Timeline */}
        <Dialog open={showDetalhesModal} onOpenChange={setShowDetalhesModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Timeline — {movimentacaoDetalhe?.codigoLegivel}</DialogTitle>
            </DialogHeader>
            {movimentacaoDetalhe && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Acessório:</span> {movimentacaoDetalhe.acessorio}</div>
                  <div><span className="text-muted-foreground">Quantidade:</span> {movimentacaoDetalhe.quantidade}</div>
                  <div><span className="text-muted-foreground">Origem:</span> {getLojaNome(movimentacaoDetalhe.origem)}</div>
                  <div><span className="text-muted-foreground">Destino:</span> {getLojaNome(movimentacaoDetalhe.destino)}</div>
                  <div><span className="text-muted-foreground">Responsável:</span> {movimentacaoDetalhe.responsavel}</div>
                  <div><span className="text-muted-foreground">Motivo:</span> {movimentacaoDetalhe.motivo}</div>
                </div>
                <Separator />
                {movimentacaoDetalhe.status === 'Recebido' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Recebido em {movimentacaoDetalhe.dataRecebimento ? new Date(movimentacaoDetalhe.dataRecebimento).toLocaleDateString('pt-BR') : '-'} por {movimentacaoDetalhe.responsavelRecebimento}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Aguardando recebimento</span>
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
              <DialogTitle>Editar Movimentação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Destino</Label>
                <AutocompleteLoja value={editFormData.destino} onChange={(v) => setEditFormData({ ...editFormData, destino: v })} placeholder="Selecione o destino" apenasLojasTipoLoja />
              </div>
              <div>
                <Label>Motivo</Label>
                <Textarea value={editFormData.motivo} onChange={(e) => setEditFormData({ ...editFormData, motivo: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSalvarEdicao}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AlertDialog: Confirmação */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Recebimento</AlertDialogTitle>
              <AlertDialogDescription>
                Confirmar o recebimento dos acessórios na loja de destino? O estoque será adicionado automaticamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setMovimentacaoParaConfirmar(null); setResponsavelConfirmacao(''); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmarRecebimento}>Confirmar Recebimento</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </EstoqueLayout>
  );
}
