import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VendasLayout } from '@/components/layout/VendasLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Eye, Copy, TrendingUp, DollarSign, Percent, ShoppingCart } from 'lucide-react';
import { getVendas, exportVendasToCSV, formatCurrency, Venda } from '@/utils/vendasApi';
import { getLojas, getColaboradores, Loja, Colaborador } from '@/utils/cadastrosApi';

export default function Vendas() {
  const navigate = useNavigate();
  const [vendas] = useState<Venda[]>(getVendas());
  const [lojas] = useState<Loja[]>(getLojas());
  const [colaboradores] = useState<Colaborador[]>(getColaboradores());
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [lojaFiltro, setLojaFiltro] = useState('');

  const getLojaName = (id: string) => {
    const loja = lojas.find(l => l.id === id);
    return loja?.nome || id;
  };

  const getColaboradorNome = (id: string) => {
    const col = colaboradores.find(c => c.id === id);
    return col?.nome || id;
  };

  // Cálculos corretos para cada venda
  const calcularTotaisVenda = (venda: Venda) => {
    const valorCusto = venda.itens.reduce((acc, item) => acc + item.valorCusto * item.quantidade, 0);
    const valorRecomendado = venda.itens.reduce((acc, item) => acc + item.valorRecomendado * item.quantidade, 0);
    const valorVenda = venda.total;
    const lucro = valorVenda - valorCusto;
    const margem = valorCusto > 0 ? ((lucro / valorCusto) * 100) : 0;
    
    return { valorCusto, valorRecomendado, valorVenda, lucro, margem };
  };

  const vendasFiltradas = useMemo(() => {
    return vendas.filter(v => {
      const dataVenda = new Date(v.dataHora);
      
      if (dataInicio) {
        const inicio = new Date(dataInicio);
        if (dataVenda < inicio) return false;
      }
      
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        if (dataVenda > fim) return false;
      }
      
      if (lojaFiltro && v.lojaVenda !== lojaFiltro) return false;
      
      return true;
    });
  }, [vendas, dataInicio, dataFim, lojaFiltro]);

  const totais = useMemo(() => {
    let totalVendas = 0;
    let totalLucro = 0;
    let totalMargem = 0;
    
    vendasFiltradas.forEach(v => {
      const calc = calcularTotaisVenda(v);
      totalVendas += calc.valorVenda;
      totalLucro += calc.lucro;
      totalMargem += calc.margem;
    });
    
    const margemMedia = vendasFiltradas.length > 0 ? totalMargem / vendasFiltradas.length : 0;
    
    return { totalVendas, totalLucro, margemMedia, quantidade: vendasFiltradas.length };
  }, [vendasFiltradas]);

  const handleExportCSV = () => {
    exportVendasToCSV(vendasFiltradas, 'vendas-export.csv');
  };

  return (
    <VendasLayout title="Gestão de Vendas">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendas do Período</p>
                <p className="text-2xl font-bold">{totais.quantidade}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendas</p>
                <p className="text-2xl font-bold">{formatCurrency(totais.totalVendas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totais.totalLucro)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Percent className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margem Média</p>
                <p className="text-2xl font-bold">{totais.margemMedia.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Loja de Venda</label>
              <Select value={lojaFiltro || 'all'} onValueChange={(val) => setLojaFiltro(val === 'all' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Lojas</SelectItem>
                  {lojas.map(loja => (
                    <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => navigate('/vendas/nova')} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Valor Recomendado</TableHead>
                  <TableHead className="text-right">Valor Venda</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendasFiltradas.map((venda) => {
                  const calc = calcularTotaisVenda(venda);
                  const isPrejuizo = calc.lucro < 0;
                  
                  return (
                    <TableRow key={venda.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(venda.dataHora).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{venda.id}</TableCell>
                      <TableCell className="font-medium">{venda.clienteNome}</TableCell>
                      <TableCell>{getColaboradorNome(venda.vendedor)}</TableCell>
                      <TableCell>{getLojaName(venda.lojaVenda)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(calc.valorRecomendado)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(calc.valorVenda)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isPrejuizo ? 'text-destructive bg-destructive/10' : 'text-green-600'}`}>
                        {formatCurrency(calc.lucro)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={isPrejuizo ? "destructive" : calc.margem >= 40 ? "default" : "secondary"}
                          className={isPrejuizo ? 'bg-destructive/10' : ''}
                        >
                          {calc.margem.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/vendas/${venda.id}`)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/vendas/nova?duplicar=${venda.id}`)}
                            title="Duplicar venda"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totalizador */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-muted-foreground">Vendas:</span>
                <span className="ml-2 font-bold">{totais.quantidade}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="ml-2 font-bold">{formatCurrency(totais.totalVendas)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Lucro:</span>
                <span className="ml-2 font-bold text-green-600">{formatCurrency(totais.totalLucro)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Margem Média:</span>
                <span className="ml-2 font-bold">{totais.margemMedia.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </VendasLayout>
  );
}