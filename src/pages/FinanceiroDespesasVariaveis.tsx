import { useState, useMemo } from 'react';
import { FinanceiroLayout } from '@/components/layout/FinanceiroLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Plus, Trash2, Calendar } from 'lucide-react';
import { getDespesas, addDespesa, deleteDespesa, updateDespesa } from '@/utils/financeApi';
import { getContasFinanceiras } from '@/utils/cadastrosApi';
import { toast } from 'sonner';
import { InputComMascara } from '@/components/ui/InputComMascara';
import { formatCurrency, exportToCSV, parseMoeda } from '@/utils/formatUtils';

// Helper para gerar lista de competências (meses)
const gerarListaCompetencias = () => {
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const anoAtual = new Date().getFullYear();
  const competencias: string[] = [];
  
  // Gera competências do ano anterior ao próximo ano
  for (let ano = anoAtual - 1; ano <= anoAtual + 1; ano++) {
    for (const mes of meses) {
      competencias.push(`${mes}-${ano}`);
    }
  }
  
  return competencias;
};

export default function FinanceiroDespesasVariaveis() {
  const [despesas, setDespesas] = useState(getDespesas());
  const contasFinanceiras = getContasFinanceiras().filter(c => c.status === 'Ativo');
  const competencias = useMemo(() => gerarListaCompetencias(), []);

  // Estado para modal de alteração em lote
  const [dialogLoteOpen, setDialogLoteOpen] = useState(false);
  const [selectedDespesas, setSelectedDespesas] = useState<string[]>([]);
  const [novaCompetenciaLote, setNovaCompetenciaLote] = useState('');

  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    competencia: '',
    conta: '',
    observacoes: ''
  });

  const despesasVariaveis = useMemo(() => despesas.filter(d => d.tipo === 'Variável'), [despesas]);
  const totalVariaveis = useMemo(() => despesasVariaveis.reduce((acc, d) => acc + d.valor, 0), [despesasVariaveis]);

  const handleLancar = () => {
    if (!form.descricao || !form.valor || !form.competencia || !form.conta) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const novaDespesa = addDespesa({
      tipo: 'Variável',
      descricao: form.descricao,
      valor: parseMoeda(form.valor),
      data: new Date().toISOString().split('T')[0], // Data atual correta
      competencia: form.competencia,
      conta: form.conta,
      observacoes: form.observacoes
    });

    setDespesas(getDespesas());
    toast.success(`Despesa Variável lançada: ${novaDespesa.id}`);
    setForm({
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      competencia: '',
      conta: '',
      observacoes: ''
    });
  };

  const handleDelete = (id: string) => {
    if (deleteDespesa(id)) {
      setDespesas(getDespesas());
      toast.success('Despesa excluída');
    }
  };

  const handleExport = () => {
    const data = despesasVariaveis.map(d => ({
      ID: d.id,
      Data: d.data,
      Descrição: d.descricao,
      Valor: formatCurrency(d.valor),
      Competência: d.competencia,
      Conta: d.conta,
      Observações: d.observacoes || ''
    }));
    exportToCSV(data, `despesas-variaveis-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Despesas Variáveis exportadas!');
  };

  // Handler para seleção de despesas
  const handleSelectDespesa = (id: string) => {
    setSelectedDespesas(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDespesas.length === despesasVariaveis.length) {
      setSelectedDespesas([]);
    } else {
      setSelectedDespesas(despesasVariaveis.map(d => d.id));
    }
  };

  // Handler para alteração em lote
  const handleAlterarCompetenciaLote = () => {
    if (!novaCompetenciaLote) {
      toast.error('Selecione a nova competência');
      return;
    }

    selectedDespesas.forEach(id => {
      updateDespesa(id, { competencia: novaCompetenciaLote });
    });

    setDespesas(getDespesas());
    setDialogLoteOpen(false);
    setSelectedDespesas([]);
    setNovaCompetenciaLote('');
    toast.success(`Competência alterada para ${selectedDespesas.length} despesa(s)`);
  };

  return (
    <FinanceiroLayout title="Lançar Despesas Variáveis">
      <div className="space-y-6">
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-orange-700 dark:text-orange-400">Nova Despesa Variável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Descrição *</Label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Compra de estoque..."
                />
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <InputComMascara
                  mascara="moeda"
                  value={form.valor}
                  onChange={(valor) => setForm({ ...form, valor })}
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <Label>Data de Lançamento *</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <Label>Competência *</Label>
                <Select value={form.competencia} onValueChange={(value) => setForm({ ...form, competencia: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {competencias.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Conta de Origem *</Label>
                <Select value={form.conta} onValueChange={(value) => setForm({ ...form, conta: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contasFinanceiras.map(c => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setForm({
                descricao: '', valor: '', data: new Date().toISOString().split('T')[0],
                competencia: '', conta: '', observacoes: ''
              })}>
                Cancelar
              </Button>
              <Button onClick={handleLancar} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Lançar Despesa Variável
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Despesas Variáveis Lançadas</CardTitle>
            <div className="flex gap-2">
              {selectedDespesas.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setDialogLoteOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Mudar Competência ({selectedDespesas.length})
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedDespesas.length === despesasVariaveis.length && despesasVariaveis.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesasVariaveis.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedDespesas.includes(d.id)}
                          onCheckedChange={() => handleSelectDespesa(d.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell>{new Date(d.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{d.descricao}</TableCell>
                      <TableCell className="text-xs">{d.conta}</TableCell>
                      <TableCell>{d.competencia}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(d.valor)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 pt-4 border-t text-right">
              <span className="text-lg font-bold">Total: {formatCurrency(totalVariaveis)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Modal Alteração de Competência em Lote */}
        <Dialog open={dialogLoteOpen} onOpenChange={setDialogLoteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Competência em Lote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Selecione a nova competência para as {selectedDespesas.length} despesa(s) selecionada(s).
              </p>
              <div className="space-y-2">
                <Label>Nova Competência *</Label>
                <Select value={novaCompetenciaLote} onValueChange={setNovaCompetenciaLote}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {competencias.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogLoteOpen(false)}>Cancelar</Button>
              <Button onClick={handleAlterarCompetenciaLote}>Alterar Competência</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FinanceiroLayout>
  );
}
