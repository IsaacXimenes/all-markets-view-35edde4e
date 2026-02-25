import { useState } from 'react';
import { CadastrosLayout } from '@/components/layout/CadastrosLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getContasFinanceiras, addContaFinanceira, updateContaFinanceira, deleteContaFinanceira, toggleContaFinanceira, ContaFinanceira } from '@/utils/cadastrosApi';
import { useCadastroStore } from '@/store/cadastroStore';
import { useAuthStore } from '@/store/authStore';
import { exportToCSV } from '@/utils/formatUtils';
import { InputComMascara } from '@/components/ui/InputComMascara';
import { Plus, Pencil, Trash2, Download, Check, X, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CadastrosContasFinanceiras() {
  const { toast } = useToast();
  const { lojas } = useCadastroStore();
  const user = useAuthStore((s) => s.user);
  const [contas, setContas] = useState(getContasFinanceiras());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaFinanceira | null>(null);

  // Toggle dialog
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleContaId, setToggleContaId] = useState<string | null>(null);
  const [toggleObservacao, setToggleObservacao] = useState('');

  // Histórico dialog
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [historicoConta, setHistoricoConta] = useState<ContaFinanceira | null>(null);

  const [form, setForm] = useState({
    nome: '',
    tipo: '',
    lojaVinculada: '',
    banco: '',
    agencia: '',
    conta: '',
    cnpj: '',
    saldoInicial: 0,
    saldoAtual: 0,
    status: 'Ativo' as 'Ativo' | 'Inativo',
    ultimoMovimento: '',
    statusMaquina: 'Própria' as 'Terceirizada' | 'Própria',
    notaFiscal: true
  });

  const resetForm = () => {
    setForm({
      nome: '',
      tipo: '',
      lojaVinculada: '',
      banco: '',
      agencia: '',
      conta: '',
      cnpj: '',
      saldoInicial: 0,
      saldoAtual: 0,
      status: 'Ativo',
      ultimoMovimento: '',
      statusMaquina: 'Própria',
      notaFiscal: true
    });
    setEditingConta(null);
  };

  const handleOpenDialog = (conta?: ContaFinanceira) => {
    if (conta) {
      setEditingConta(conta);
      setForm({ 
        ...conta, 
        ultimoMovimento: conta.ultimoMovimento || '',
        statusMaquina: conta.statusMaquina || 'Própria',
        notaFiscal: conta.notaFiscal ?? true
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleStatusMaquinaChange = (value: 'Terceirizada' | 'Própria') => {
    setForm({ 
      ...form, 
      statusMaquina: value,
      notaFiscal: value === 'Própria'
    });
  };

  const handleSave = () => {
    if (!form.nome || !form.tipo || !form.lojaVinculada) {
      toast({ title: 'Erro', description: 'Nome, Tipo e Loja são obrigatórios', variant: 'destructive' });
      return;
    }

    const dataToSave = { 
      ...form, 
      saldoAtual: form.saldoAtual || form.saldoInicial,
      notaFiscal: form.statusMaquina === 'Própria',
      habilitada: true,
      historicoAlteracoes: [] as any[]
    };

    if (editingConta) {
      updateContaFinanceira(editingConta.id, dataToSave);
      toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso' });
    } else {
      addContaFinanceira(dataToSave);
      toast({ title: 'Sucesso', description: 'Conta cadastrada com sucesso' });
    }

    setContas(getContasFinanceiras());
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteContaFinanceira(id);
    setContas(getContasFinanceiras());
    toast({ title: 'Sucesso', description: 'Conta removida com sucesso' });
  };

  const handleToggleClick = (contaId: string) => {
    setToggleContaId(contaId);
    setToggleObservacao('');
    setToggleDialogOpen(true);
  };

  const handleConfirmarToggle = () => {
    if (!toggleContaId) return;
    const usuario = user?.colaborador?.nome || user?.username || 'Usuário';
    toggleContaFinanceira(toggleContaId, usuario, toggleObservacao || undefined);
    setContas(getContasFinanceiras());
    setToggleDialogOpen(false);
    setToggleContaId(null);
    const conta = getContasFinanceiras().find(c => c.id === toggleContaId);
    toast({ 
      title: 'Sucesso', 
      description: `Conta ${conta?.nome} ${conta?.habilitada !== false ? 'habilitada' : 'desabilitada'} com sucesso` 
    });
  };

  const handleOpenHistorico = (conta: ContaFinanceira) => {
    setHistoricoConta(conta);
    setHistoricoDialogOpen(true);
  };

  const handleExport = () => {
    const dataToExport = contas.map(conta => ({
      ID: conta.id,
      Loja: getLojaName(conta.lojaVinculada),
      'Nome da Conta': conta.nome,
      Tipo: conta.tipo || '-',
      CNPJ: conta.cnpj,
      'Valor Inicial': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.saldoInicial || 0),
      'Status Máquina': conta.statusMaquina,
      'Nota Fiscal': conta.notaFiscal ? 'Sim' : 'Não',
      Habilitada: conta.habilitada !== false ? 'Sim' : 'Não',
      Status: conta.status
    }));
    exportToCSV(dataToExport, 'contas-financeiras.csv');
  };

  const getLojaName = (lojaId: string) => {
    if (lojaId === 'geral-dinheiro') return 'Geral - Dinheiro';
    if (lojaId === 'geral-assistencia') return 'Geral - Assistência';
    const loja = lojas.find(l => l.id === lojaId);
    return loja?.nome || lojaId;
  };

  const toggleContaData = toggleContaId ? contas.find(c => c.id === toggleContaId) : null;

  return (
    <CadastrosLayout title="Cadastro de Contas Financeiras">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Nome da Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead className="text-right">Valor Inicial</TableHead>
                <TableHead>Status Máquina</TableHead>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead>Habilitada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map(conta => (
                <TableRow key={conta.id} className={conta.habilitada === false ? 'opacity-50' : ''}>
                  <TableCell className="font-mono text-xs">{conta.id}</TableCell>
                  <TableCell className="text-sm">{getLojaName(conta.lojaVinculada)}</TableCell>
                  <TableCell className="font-medium">{conta.nome}</TableCell>
                  <TableCell className="text-sm">{conta.tipo || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{conta.cnpj}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.saldoInicial || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={conta.statusMaquina === 'Própria' ? 'default' : 'secondary'}>
                      {conta.statusMaquina}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {conta.notaFiscal ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={conta.habilitada !== false}
                      onCheckedChange={() => handleToggleClick(conta.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={conta.status === 'Ativo' ? 'default' : 'secondary'}>
                      {conta.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenHistorico(conta)} title="Histórico">
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(conta)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(conta.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog de edição/criação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConta ? 'Editar Conta' : 'Nova Conta Financeira'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Loja Vinculada *</Label>
              <Select value={form.lojaVinculada} onValueChange={v => setForm({ ...form, lojaVinculada: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a loja" /></SelectTrigger>
                <SelectContent>
                  {lojas.filter(l => l.ativa).map(loja => (
                    <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome da Conta *</Label>
              <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="99.999.999/9999-99" />
            </div>
            <div className="space-y-2">
              <Label>Valor Inicial</Label>
              <InputComMascara
                mascara="moeda"
                value={form.saldoInicial}
                onChange={(_, rawValue) => {
                  setForm({ ...form, saldoInicial: rawValue as number });
                }}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Status da Máquina *</Label>
              <Select value={form.statusMaquina} onValueChange={handleStatusMaquinaChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Terceirizada">Terceirizada</SelectItem>
                  <SelectItem value="Própria">Própria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nota Fiscal</Label>
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                {form.notaFiscal ? (
                  <><Check className="h-4 w-4 text-primary" /> <span>Sim</span></>
                ) : (
                  <><X className="h-4 w-4 text-muted-foreground" /> <span>Não</span></>
                )}
                <span className="text-xs text-muted-foreground ml-2">(Automático: Sim quando Própria)</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as 'Ativo' | 'Inativo' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conta Bancária">Conta Bancária</SelectItem>
                  <SelectItem value="Conta Digital">Conta Digital</SelectItem>
                  <SelectItem value="Caixa">Caixa</SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Dinheiro - Geral">Dinheiro - Geral</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input value={form.banco} onChange={e => setForm({ ...form, banco: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Agência</Label>
              <Input value={form.agencia} onChange={e => setForm({ ...form, agencia: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Input value={form.conta} onChange={e => setForm({ ...form, conta: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação do toggle */}
      <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggleContaData?.habilitada !== false ? 'Desabilitar' : 'Habilitar'} Conta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Deseja {toggleContaData?.habilitada !== false ? 'desabilitar' : 'habilitar'} a conta <strong>{toggleContaData?.nome}</strong>?
              {toggleContaData?.habilitada !== false && (
                <span className="block mt-1 text-destructive">
                  Contas desabilitadas não aparecerão nos campos de seleção de outros módulos.
                </span>
              )}
            </p>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={toggleObservacao}
                onChange={e => setToggleObservacao(e.target.value)}
                placeholder="Motivo da alteração..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarToggle}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de histórico */}
      <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico - {historicoConta?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(!historicoConta?.historicoAlteracoes || historicoConta.historicoAlteracoes.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma alteração registrada.</p>
            ) : (
              historicoConta.historicoAlteracoes.map((h, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-start">
                    <Badge variant={h.novoStatus === 'Habilitada' ? 'default' : 'secondary'}>
                      {h.statusAnterior} → {h.novoStatus}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.dataHora).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm"><strong>Usuário:</strong> {h.usuario}</p>
                  {h.observacao && (
                    <p className="text-sm text-muted-foreground"><strong>Obs:</strong> {h.observacao}</p>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoricoDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CadastrosLayout>
  );
}
