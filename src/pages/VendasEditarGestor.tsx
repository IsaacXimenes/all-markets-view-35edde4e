import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VendasLayout } from '@/components/layout/VendasLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, User, Package, CreditCard, Shield, Lock, Save, X, AlertTriangle,
  FileText, Check, Pencil, Headphones, Plus, Trash2
} from 'lucide-react';
import { format, addMonths, addDays } from 'date-fns';
import { 
  getVendaById, 
  updateVenda, 
  registrarEdicaoVenda, 
  Venda, 
  ItemVenda, 
  ItemTradeIn, 
  Pagamento 
} from '@/utils/vendasApi';
import { 
  getContasFinanceirasHabilitadas,
  getMaquinasCartao,
  MaquinaCartao
} from '@/utils/cadastrosApi';
import { useCadastroStore } from '@/store/cadastroStore';
import { calcularComissaoVenda, getComissaoColaborador } from '@/utils/comissoesApi';
import { displayIMEI } from '@/utils/imeiMask';
import { formatCurrency, moedaMask, parseMoeda } from '@/utils/formatUtils';
import { getAcessorios, Acessorio, VendaAcessorio } from '@/utils/acessoriosApi';

export default function VendasEditarGestor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { obterNomeLoja, obterNomeColaborador } = useCadastroStore();
  
  const [vendaOriginal, setVendaOriginal] = useState<Venda | null>(null);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [tradeIns, setTradeIns] = useState<ItemTradeIn[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  
  // Acessórios
  const [acessoriosEstoque, setAcessoriosEstoque] = useState<Acessorio[]>(getAcessorios());
  const [acessoriosVenda, setAcessoriosVenda] = useState<VendaAcessorio[]>([]);
  const [showAcessorioModal, setShowAcessorioModal] = useState(false);
  const [buscaAcessorio, setBuscaAcessorio] = useState('');
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alteracoesDetectadas, setAlteracoesDetectadas] = useState<{ campo: string; valorAnterior: any; valorNovo: any }[]>([]);
  
  const contasFinanceiras = getContasFinanceirasHabilitadas();
  const maquinasCartao = getMaquinasCartao().filter(m => m.status === 'Ativo');

  useEffect(() => {
    if (id) {
      const venda = getVendaById(id);
      if (venda) {
        setVendaOriginal(venda);
        setItens([...venda.itens]);
        setTradeIns([...venda.tradeIns]);
        setPagamentos([...venda.pagamentos]);
        // Carregar acessórios
        if (venda.acessorios && venda.acessorios.length > 0) {
          setAcessoriosVenda(venda.acessorios);
        } else if ((venda as any).acessoriosVenda) {
          setAcessoriosVenda((venda as any).acessoriosVenda);
        }
      }
    }
  }, [id]);

  const getLojaNome = (lojaId: string) => obterNomeLoja(lojaId);
  const getColaboradorNome = (colId: string) => obterNomeColaborador(colId);
  const getContaNome = (contaId: string) => contasFinanceiras.find(c => c.id === contaId)?.nome || contaId;

  // Cálculos
  const subtotal = useMemo(() => itens.reduce((acc, item) => acc + item.valorVenda, 0), [itens]);
  const totalAcessorios = useMemo(() => acessoriosVenda.reduce((acc, a) => acc + a.valorTotal, 0), [acessoriosVenda]);
  const totalTradeIn = useMemo(() => tradeIns.reduce((acc, t) => acc + t.valorCompraUsado, 0), [tradeIns]);
  const totalPagamentos = useMemo(() => pagamentos.reduce((acc, p) => acc + p.valor, 0), [pagamentos]);
  const total = subtotal + totalAcessorios - totalTradeIn + (vendaOriginal?.taxaEntrega || 0);
  const valorCustoAcessorios = useMemo(() => acessoriosVenda.reduce((acc, a) => {
    const acessorio = acessoriosEstoque.find(ae => ae.id === a.acessorioId);
    return acc + (acessorio?.valorCusto || 0) * a.quantidade;
  }, 0), [acessoriosVenda, acessoriosEstoque]);
  const valorCustoTotal = useMemo(() => itens.reduce((acc, item) => acc + item.valorCusto, 0) + valorCustoAcessorios, [itens, valorCustoAcessorios]);
  const lucro = total - valorCustoTotal;
  const margem = valorCustoTotal > 0 ? ((lucro / valorCustoTotal) * 100) : 0;
  const valorPendente = total - totalPagamentos;
  
  // Detectar se é operação Downgrade
  const isDowngrade = useMemo(() => {
    if (!vendaOriginal) return false;
    // Verificar pelo tipoOperacao salvo ou pelo cálculo
    return (vendaOriginal as any).tipoOperacao === 'Downgrade' || 
           (totalTradeIn > subtotal && tradeIns.length > 0);
  }, [vendaOriginal, totalTradeIn, subtotal, tradeIns.length]);
  
  const saldoDevolver = useMemo(() => {
    if (!isDowngrade) return 0;
    return totalTradeIn - subtotal + (vendaOriginal?.taxaEntrega || 0);
  }, [isDowngrade, totalTradeIn, subtotal, vendaOriginal?.taxaEntrega]);

  // Comissão
  const comissaoVendedor = vendaOriginal && lucro > 0 
    ? calcularComissaoVenda(vendaOriginal.vendedor, lucro) 
    : 0;

  // Acessórios filtrados
  const acessoriosFiltrados = useMemo(() => {
    return acessoriosEstoque.filter(a => {
      if (a.quantidade <= 0) return false;
      if (buscaAcessorio && !a.descricao.toLowerCase().includes(buscaAcessorio.toLowerCase())) return false;
      return true;
    });
  }, [acessoriosEstoque, buscaAcessorio]);

  // Adicionar acessório à venda
  const handleAddAcessorio = (acessorio: Acessorio) => {
    const existente = acessoriosVenda.find(a => a.acessorioId === acessorio.id);
    if (existente) {
      if (existente.quantidade + 1 > acessorio.quantidade) {
        toast({ title: "Estoque insuficiente", description: `Apenas ${acessorio.quantidade} unidades disponíveis.`, variant: "destructive" });
        return;
      }
      const updated = acessoriosVenda.map(a => 
        a.acessorioId === acessorio.id 
          ? { ...a, quantidade: a.quantidade + 1, valorTotal: (a.quantidade + 1) * a.valorUnitario }
          : a
      );
      setAcessoriosVenda(updated);
    } else {
      const valorRecomendado = acessorio.valorRecomendado || acessorio.valorCusto * 1.5;
      const novoAcessorio: VendaAcessorio = {
        id: `ACESSV-${Date.now()}`,
        acessorioId: acessorio.id,
        descricao: acessorio.descricao,
        quantidade: 1,
        valorRecomendado: valorRecomendado,
        valorUnitario: valorRecomendado,
        valorTotal: valorRecomendado
      };
      setAcessoriosVenda([...acessoriosVenda, novoAcessorio]);
    }
    setShowAcessorioModal(false);
    setBuscaAcessorio('');
    toast({ title: "Acessório adicionado", description: `${acessorio.descricao} adicionado à venda` });
  };

  const handleRemoveAcessorio = (acessorioId: string) => {
    setAcessoriosVenda(acessoriosVenda.filter(a => a.id !== acessorioId));
  };

  // Atualizar valor de item
  const handleUpdateItemValor = (itemId: string, novoValor: number) => {
    setItens(prev => prev.map(item => 
      item.id === itemId ? { ...item, valorVenda: novoValor } : item
    ));
  };

  // Atualizar valor de trade-in
  const handleUpdateTradeInValor = (tradeId: string, novoValor: number) => {
    setTradeIns(prev => prev.map(t => 
      t.id === tradeId ? { ...t, valorCompraUsado: novoValor } : t
    ));
  };

  // Atualizar pagamento
  const handleUpdatePagamento = (pagId: string, field: string, value: any) => {
    setPagamentos(prev => prev.map(p => 
      p.id === pagId ? { ...p, [field]: value } : p
    ));
  };

  // Detectar alterações
  const detectarAlteracoes = (): { campo: string; valorAnterior: any; valorNovo: any }[] => {
    if (!vendaOriginal) return [];
    
    const alteracoes: { campo: string; valorAnterior: any; valorNovo: any }[] = [];

    // Verificar itens
    vendaOriginal.itens.forEach((itemOriginal, i) => {
      const itemAtual = itens.find(it => it.id === itemOriginal.id);
      if (itemAtual && itemAtual.valorVenda !== itemOriginal.valorVenda) {
        alteracoes.push({
          campo: `Valor de ${itemOriginal.produto}`,
          valorAnterior: itemOriginal.valorVenda,
          valorNovo: itemAtual.valorVenda
        });
      }
    });

    // Verificar trade-ins
    vendaOriginal.tradeIns.forEach((tradeOriginal, i) => {
      const tradeAtual = tradeIns.find(t => t.id === tradeOriginal.id);
      if (tradeAtual && tradeAtual.valorCompraUsado !== tradeOriginal.valorCompraUsado) {
        alteracoes.push({
          campo: `Valor Trade-In ${tradeOriginal.modelo}`,
          valorAnterior: tradeOriginal.valorCompraUsado,
          valorNovo: tradeAtual.valorCompraUsado
        });
      }
    });

    // Verificar total (recalculado)
    if (total !== vendaOriginal.total) {
      alteracoes.push({
        campo: 'Total da Venda',
        valorAnterior: vendaOriginal.total,
        valorNovo: total
      });
    }

    // Verificar lucro
    if (lucro !== vendaOriginal.lucro) {
      alteracoes.push({
        campo: 'Lucro',
        valorAnterior: vendaOriginal.lucro,
        valorNovo: lucro
      });
    }

    // Verificar comissão
    const comissaoOriginal = vendaOriginal.comissaoVendedor || 0;
    if (comissaoVendedor !== comissaoOriginal) {
      alteracoes.push({
        campo: 'Comissão do Vendedor',
        valorAnterior: comissaoOriginal,
        valorNovo: comissaoVendedor
      });
    }

    return alteracoes;
  };

  // Validações
  const validarVenda = (): string[] => {
    const erros: string[] = [];
    
    if (itens.length === 0) {
      erros.push('Deve haver pelo menos um item na venda.');
    }
    
    if (Math.abs(valorPendente) > 0.01) {
      erros.push(`O total de pagamentos (${formatCurrency(totalPagamentos)}) deve ser igual ao valor final (${formatCurrency(total)}).`);
    }
    
    return erros;
  };

  // Preparar salvamento
  const handlePrepararSalvar = () => {
    const erros = validarVenda();
    if (erros.length > 0) {
      toast({
        title: "Erros de validação",
        description: erros.join(' '),
        variant: "destructive"
      });
      return;
    }

    const alteracoes = detectarAlteracoes();
    if (alteracoes.length === 0) {
      toast({
        title: "Sem alterações",
        description: "Nenhuma alteração foi detectada."
      });
      return;
    }

    setAlteracoesDetectadas(alteracoes);
    setShowConfirmModal(true);
  };

  // Confirmar salvamento
  const handleConfirmarSalvar = () => {
    if (!vendaOriginal) return;

    // Registrar alterações na timeline
    registrarEdicaoVenda(
      vendaOriginal.id,
      'GESTOR-001', // Em produção, seria o ID do usuário logado
      'Gestor',     // Em produção, seria o nome do usuário logado
      alteracoesDetectadas
    );

    // Atualizar venda
    updateVenda(vendaOriginal.id, {
      itens,
      tradeIns,
      pagamentos,
      acessorios: acessoriosVenda,
      subtotal,
      totalTradeIn,
      total,
      lucro,
      margem,
      comissaoVendedor
    });

    toast({
      title: "Venda atualizada",
      description: `${alteracoesDetectadas.length} alteração(ões) registrada(s) com sucesso.`
    });

    setShowConfirmModal(false);
    navigate('/vendas/conferencia-gestor');
  };

  if (!vendaOriginal) {
    return (
      <VendasLayout title="Editar Venda">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Venda não encontrada.</p>
          <Button onClick={() => navigate('/vendas/conferencia-gestor')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </VendasLayout>
    );
  }

  return (
    <VendasLayout title={`Editar Venda ${vendaOriginal.id}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/vendas/conferencia-gestor')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Pencil className="h-3 w-3 mr-1" />
            Modo Edição Gestor
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card Bloqueado - Informações da Venda */}
        <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5" />
              Informações da Venda (Bloqueado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70">
              <div>
                <p className="text-sm text-muted-foreground">Loja</p>
                <p className="font-medium">{getLojaNome(vendaOriginal.lojaVenda)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendedor</p>
                <p className="font-medium">{getColaboradorNome(vendaOriginal.vendedor)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data/Hora</p>
                <p className="font-medium">{new Date(vendaOriginal.dataHora).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Origem</p>
                <Badge variant="outline">{vendaOriginal.origemVenda}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Bloqueado - Cliente */}
        <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5" />
              <User className="h-5 w-5" />
              Cliente (Bloqueado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{vendaOriginal.clienteNome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{vendaOriginal.clienteCpf}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{vendaOriginal.clienteTelefone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{vendaOriginal.clienteEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Editável - Itens da Venda */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens da Venda
              <Badge variant="outline" className="ml-2 text-primary border-primary">Editável</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Valor Recomendado</TableHead>
                  <TableHead className="text-right w-40">Valor de Venda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.produto}</TableCell>
                    <TableCell className="font-mono text-sm">{displayIMEI(item.imei)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.valorCusto)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.valorRecomendado)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="relative w-32 ml-auto">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={moedaMask(item.valorVenda)}
                          onChange={(e) => handleUpdateItemValor(item.id, parseMoeda(e.target.value))}
                          className="pl-9 text-right"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Acessórios */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Acessórios
                <Badge variant="outline" className="ml-2 text-primary border-primary">Editável</Badge>
              </span>
              <Button onClick={() => setShowAcessorioModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Selecionar Acessórios
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {acessoriosVenda.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum acessório adicionado. Clique em "Selecionar Acessórios" para adicionar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acessório</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Custo Produto</TableHead>
                    <TableHead className="text-right">Valor Recomendado</TableHead>
                    <TableHead className="text-right">Valor de Venda</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acessoriosVenda.map(acessorio => {
                    const acessorioOriginal = acessoriosEstoque.find(a => a.id === acessorio.acessorioId);
                    const custoUnit = acessorioOriginal?.valorCusto || 0;
                    const lucroItem = acessorio.valorTotal - (custoUnit * acessorio.quantidade);
                    return (
                    <TableRow key={acessorio.id}>
                      <TableCell className="font-medium">{acessorio.descricao}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => {
                              if (acessorio.quantidade > 1) {
                                const updated = acessoriosVenda.map(a => 
                                  a.id === acessorio.id 
                                    ? { ...a, quantidade: a.quantidade - 1, valorTotal: (a.quantidade - 1) * a.valorUnitario }
                                    : a
                                );
                                setAcessoriosVenda(updated);
                              }
                            }}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{acessorio.quantidade}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => {
                              const acessorioEstoqueItem = acessoriosEstoque.find(a => a.id === acessorio.acessorioId);
                              if (acessorioEstoqueItem && acessorio.quantidade < acessorioEstoqueItem.quantidade) {
                                const updated = acessoriosVenda.map(a => 
                                  a.id === acessorio.id 
                                    ? { ...a, quantidade: a.quantidade + 1, valorTotal: (a.quantidade + 1) * a.valorUnitario }
                                    : a
                                );
                                setAcessoriosVenda(updated);
                              } else {
                                toast({ title: "Estoque insuficiente", description: "Quantidade máxima atingida.", variant: "destructive" });
                              }
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatCurrency(custoUnit)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(acessorio.valorRecomendado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                            <Input 
                              type="text"
                              value={acessorio.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                const numValue = Number(value) / 100;
                                const updated = acessoriosVenda.map(a => 
                                  a.id === acessorio.id ? { ...a, valorUnitario: numValue, valorTotal: numValue * a.quantidade } : a
                                );
                                setAcessoriosVenda(updated);
                              }}
                              className="w-28 text-right pl-8"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(acessorio.valorTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${lucroItem >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {formatCurrency(lucroItem)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveAcessorio(acessorio.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {tradeIns.length > 0 && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Base de Troca
                <Badge variant="outline" className="ml-2 text-primary border-primary">Editável</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead className="text-right w-44">Valor de Compra Usado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeIns.map(trade => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.modelo}</TableCell>
                      <TableCell className="font-mono text-sm">{trade.imei}</TableCell>
                      <TableCell>
                        <Badge variant={trade.condicao === 'Novo' ? 'default' : 'secondary'}>
                          {trade.condicao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="relative w-32 ml-auto">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={moedaMask(trade.valorCompraUsado)}
                            onChange={(e) => handleUpdateTradeInValor(trade.id, parseMoeda(e.target.value))}
                            className="pl-9 text-right"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Card Editável - Pagamentos (Bloqueado em Downgrade) */}
        {isDowngrade ? (
          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-5 w-5" />
                <CreditCard className="h-5 w-5" />
                Pagamentos (Bloqueado - Downgrade)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500 opacity-50" />
                <p className="text-muted-foreground font-medium">Quadro de pagamentos bloqueado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Em vendas Downgrade, não há entrada de pagamentos. 
                  O saldo de <span className="font-bold text-destructive">{formatCurrency(saldoDevolver)}</span> será devolvido ao cliente via PIX.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagamentos
                <Badge variant="outline" className="ml-2 text-primary border-primary">Editável</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meio de Pagamento</TableHead>
                    <TableHead>Conta de Destino</TableHead>
                    <TableHead className="text-right w-40">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.map(pag => (
                    <TableRow key={pag.id}>
                      <TableCell className="font-medium">{pag.meioPagamento}</TableCell>
                      <TableCell>{getContaNome(pag.contaDestino)}</TableCell>
                      <TableCell className="text-right">
                        <div className="relative w-32 ml-auto">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={moedaMask(pag.valor)}
                            onChange={(e) => handleUpdatePagamento(pag.id, 'valor', parseMoeda(e.target.value))}
                            className="pl-9 text-right"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {Math.abs(valorPendente) > 0.01 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">
                    {valorPendente > 0 
                      ? `Faltam ${formatCurrency(valorPendente)} para fechar o pagamento` 
                      : `Pagamento excede em ${formatCurrency(Math.abs(valorPendente))}`
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumo Financeiro */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo Financeiro (Recalculado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-xl font-bold">{formatCurrency(subtotal)}</p>
              </div>
              {totalAcessorios > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Acessórios</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAcessorios)}</p>
                </div>
              )}
              <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Base de Troca</p>
                <p className="text-xl font-bold text-green-600">-{formatCurrency(totalTradeIn)}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total da Venda</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
              </div>
              <div className={`p-3 rounded-lg ${lucro < 0 ? 'bg-destructive/20' : 'bg-green-100 dark:bg-green-950/30'}`}>
                <p className="text-sm text-muted-foreground">{lucro < 0 ? 'Prejuízo' : 'Lucro'}</p>
                <p className={`text-lg font-bold ${lucro < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(lucro)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Comissão</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(comissaoVendedor)}</p>
                <p className="text-xs text-muted-foreground">
                  ({getComissaoColaborador(vendaOriginal.vendedor).comissao}% do lucro)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate('/vendas/conferencia-gestor')}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handlePrepararSalvar}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Modal Selecionar Acessórios */}
      <Dialog open={showAcessorioModal} onOpenChange={setShowAcessorioModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Selecionar Acessórios</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <Input 
              placeholder="Buscar acessório..."
              value={buscaAcessorio}
              onChange={(e) => setBuscaAcessorio(e.target.value)}
              className="flex-shrink-0"
            />
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="overflow-x-auto min-w-0">
                <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Qtd Disp.</TableHead>
                      <TableHead className="text-right">Valor Custo</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acessoriosFiltrados.map(acessorio => (
                      <TableRow key={acessorio.id} className={acessorio.quantidade < 10 ? 'bg-destructive/10' : ''}>
                        <TableCell className="font-mono text-sm">{acessorio.id}</TableCell>
                        <TableCell className="font-medium">{acessorio.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{acessorio.categoria}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={acessorio.quantidade < 10 ? "destructive" : "secondary"}>
                            {acessorio.quantidade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(acessorio.valorCusto)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleAddAcessorio(acessorio)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {acessoriosFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum acessório encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowAcessorioModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Confirmar Alterações
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              As seguintes alterações serão registradas na timeline da venda:
            </p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {alteracoesDetectadas.map((alt, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-primary" />
                    {alt.campo}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-muted-foreground">
                      Anterior: {typeof alt.valorAnterior === 'number' 
                        ? formatCurrency(alt.valorAnterior) 
                        : alt.valorAnterior}
                    </span>
                    <span>→</span>
                    <span className="font-medium text-primary">
                      Novo: {typeof alt.valorNovo === 'number' 
                        ? formatCurrency(alt.valorNovo) 
                        : alt.valorNovo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarSalvar}>
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VendasLayout>
  );
}
