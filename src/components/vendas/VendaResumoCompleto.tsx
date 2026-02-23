import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, Package, CreditCard, Truck, ArrowLeftRight, Shield, 
  Headphones, AlertTriangle, FileText, Camera
} from 'lucide-react';
import { VendaComFluxo } from '@/utils/fluxoVendasApi';
import { formatCurrency } from '@/utils/formatUtils';
import { ComprovantePreview } from '@/components/vendas/ComprovantePreview';
import { useCadastroStore } from '@/store/cadastroStore';
import { getContasFinanceiras } from '@/utils/cadastrosApi';
import { displayIMEI } from '@/utils/imeiMask';

interface VendaResumoCompletoProps {
  venda: VendaComFluxo;
  readOnly?: boolean;
  showCustos?: boolean;
}

export function VendaResumoCompleto({ venda, readOnly = true, showCustos = true }: VendaResumoCompletoProps) {
  const { obterNomeLoja, obterNomeColaborador } = useCadastroStore();
  const contasFinanceiras = getContasFinanceiras();

  const getContaNome = (id: string) => {
    const conta = contasFinanceiras.find(c => c.id === id);
    if (!conta) return id;
    const lojaNome = conta.lojaVinculada ? obterNomeLoja(conta.lojaVinculada) : '';
    return lojaNome ? `${lojaNome} - ${conta.nome}` : conta.nome;
  };

  // Cálculos financeiros
  const subtotalItens = venda.itens?.reduce((acc, i) => acc + i.valorVenda, 0) || 0;
  const totalAcessorios = (venda.acessorios as any[])?.reduce((acc: number, a: any) => acc + (a.valorTotal || 0), 0) || 0;
  const totalTradeIn = venda.totalTradeIn || 0;
  const taxaEntrega = venda.taxaEntrega || 0;
  const garantiaExtVal = (venda as any).garantiaExtendida?.valor || 0;
  const custoTotal = venda.itens?.reduce((acc, i) => acc + (i.valorCusto || 0), 0) || 0;
  const totalPagamentos = venda.pagamentos?.reduce((acc, p) => acc + p.valor, 0) || 0;
  const totalTaxas = venda.pagamentos?.reduce((acc, p) => acc + (p.taxaCartao || 0), 0) || 0;
  const valorLiquido = totalPagamentos - totalTaxas;
  const lucro = venda.lucro ?? (valorLiquido - custoTotal);
  const margem = custoTotal > 0 ? ((lucro / custoTotal) * 100) : 0;
  const isPrejuizo = lucro < 0;

  return (
    <div className="space-y-4">
      {/* Downgrade Alert */}
      {(venda as any).tipoOperacao === 'Downgrade' && (venda as any).saldoDevolver > 0 && (
        <Card className="border-2 border-destructive bg-destructive/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowLeftRight className="h-5 w-5 text-destructive" />
              <Badge className="bg-orange-500 text-white border-orange-500">DOWNGRADE</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Valor Trade-In</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalTradeIn)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor Produtos</p>
                <p className="text-lg font-bold">{formatCurrency(venda.subtotal || 0)}</p>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-destructive">PIX a Devolver:</span>
              <span className="text-xl font-bold text-destructive">{formatCurrency((venda as any).saldoDevolver)}</span>
            </div>
            {(venda as any).chavePix && (
              <div className="mt-2 p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Chave PIX</p>
                <p className="font-mono font-medium">{(venda as any).chavePix}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações da Venda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informações da Venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">ID</p>
              <p className="font-medium">{venda.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Nº Venda</p>
              <p className="font-medium">{venda.numero}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Data</p>
              <p className="font-medium">{new Date(venda.dataHora).toLocaleDateString('pt-BR')} {new Date(venda.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Loja</p>
              <p className="font-medium truncate">{obterNomeLoja(venda.lojaVenda)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Vendedor</p>
              <p className="font-medium truncate">{obterNomeColaborador(venda.vendedor)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Origem</p>
              <p className="font-medium">{venda.origemVenda || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cliente */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Nome</p>
              <p className="font-medium">{venda.clienteNome}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">CPF</p>
              <p className="font-medium">{venda.clienteCpf || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Telefone</p>
              <p className="font-medium">{venda.clienteTelefone || '-'}</p>
            </div>
            {venda.clienteEmail && (
              <div>
                <p className="text-muted-foreground text-xs">E-mail</p>
                <p className="font-medium truncate">{venda.clienteEmail}</p>
              </div>
            )}
            {venda.clienteCidade && (
              <div>
                <p className="text-muted-foreground text-xs">Cidade</p>
                <p className="font-medium">{venda.clienteCidade}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Itens da Venda */}
      {venda.itens && venda.itens.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Itens da Venda ({venda.itens.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead className="text-right">Recomendado</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    {showCustos && <TableHead className="text-right">Custo</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venda.itens.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-sm">{item.produto}</TableCell>
                      <TableCell className="text-xs font-mono">{item.imei ? displayIMEI(item.imei) : '-'}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(item.valorRecomendado)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(item.valorVenda)}</TableCell>
                      {showCustos && <TableCell className="text-right text-sm">{formatCurrency(item.valorCusto)}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acessórios */}
      {(venda.acessorios as any[])?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Acessórios ({(venda.acessorios as any[]).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(venda.acessorios as any[]).map((acess: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-sm">{acess.descricao}</TableCell>
                      <TableCell className="text-center text-sm">{acess.quantidade}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(acess.valorUnitario)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(acess.valorTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade-In */}
      {venda.tradeIns && venda.tradeIns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Trade-In / Base de Troca ({venda.tradeIns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venda.tradeIns.map((trade, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-sm">{trade.modelo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={trade.condicao === 'Novo' ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400'}>
                          {trade.condicao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{trade.imei ? displayIMEI(trade.imei) : '-'}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-green-600">-{formatCurrency(trade.valorCompraUsado)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trade.tipoEntrega === 'Entregue no Ato' ? (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400">Entregue</Badge>
                          ) : trade.tipoEntrega === 'Com o Cliente' ? (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400">Com Cliente</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          {trade.termoResponsabilidade && <FileText className="h-3 w-3 text-blue-500" />}
                          {trade.fotosAparelho && trade.fotosAparelho.length > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Camera className="h-3 w-3 text-purple-500" />
                              <span className="text-xs text-muted-foreground">{trade.fotosAparelho.length}</span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="px-4 py-2 text-right text-sm font-medium text-green-600 border-t">
              Total Abatimento: -{formatCurrency(totalTradeIn)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logística */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Logística / Retirada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Tipo</p>
              <p className="font-medium">{venda.tipoRetirada || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Local</p>
              <p className="font-medium truncate">{venda.localRetirada ? obterNomeLoja(venda.localRetirada) || venda.localRetirada : '-'}</p>
            </div>
            {taxaEntrega > 0 && (
              <div>
                <p className="text-muted-foreground text-xs">Taxa de Entrega</p>
                <p className="font-medium">{formatCurrency(taxaEntrega)}</p>
              </div>
            )}
            {venda.motoboyId && (
              <div>
                <p className="text-muted-foreground text-xs">Motoboy</p>
                <p className="font-medium truncate">{obterNomeColaborador(venda.motoboyId)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Garantia Extendida */}
      {(venda as any).garantiaExtendida && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Shield className="h-4 w-4" />
              Garantia Extendida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Plano</p>
                <p className="font-medium">{(venda as any).garantiaExtendida.planoNome}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Valor</p>
                <p className="font-medium">{formatCurrency(garantiaExtVal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Vigência</p>
                <p className="font-medium">{(venda as any).garantiaExtendida.meses} meses</p>
              </div>
              {(venda as any).garantiaExtendida.dataInicio && (
                <div>
                  <p className="text-muted-foreground text-xs">Período</p>
                  <p className="font-medium text-xs">
                    {new Date((venda as any).garantiaExtendida.dataInicio).toLocaleDateString('pt-BR')} a {new Date((venda as any).garantiaExtendida.dataFim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagamentos */}
      {venda.pagamentos && venda.pagamentos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamentos ({venda.pagamentos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meio</TableHead>
                    <TableHead>Conta Destino</TableHead>
                    <TableHead className="text-center">Parcelas</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead>Comprovante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venda.pagamentos.map((pag, idx) => {
                    const liq = pag.valor - (pag.taxaCartao || 0);
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-sm">{pag.meioPagamento}</TableCell>
                        <TableCell className="text-sm truncate max-w-[150px]">{getContaNome(pag.contaDestino)}</TableCell>
                        <TableCell className="text-center text-sm">
                          {pag.parcelas && pag.parcelas > 1 ? `${pag.parcelas}x` : pag.parcelas === 1 ? '1x' : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(pag.valor)}</TableCell>
                        <TableCell className="text-right text-sm text-orange-600">
                          {pag.taxaCartao ? `-${formatCurrency(pag.taxaCartao)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-600">{formatCurrency(liq)}</TableCell>
                        <TableCell>
                          <ComprovantePreview comprovante={pag.comprovante} comprovanteNome={pag.comprovanteNome} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Financeiro */}
      <Card className={isPrejuizo ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {isPrejuizo && <AlertTriangle className="h-4 w-4 text-red-600" />}
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal Itens</span>
              <span className="font-medium">{formatCurrency(subtotalItens)}</span>
            </div>
            {totalAcessorios > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acessórios</span>
                <span className="font-medium">+{formatCurrency(totalAcessorios)}</span>
              </div>
            )}
            {totalTradeIn > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trade-In</span>
                <span className="font-medium text-green-600">-{formatCurrency(totalTradeIn)}</span>
              </div>
            )}
            {taxaEntrega > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Entrega</span>
                <span className="font-medium">+{formatCurrency(taxaEntrega)}</span>
              </div>
            )}
            {garantiaExtVal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Garantia Extendida</span>
                <span className="font-medium">+{formatCurrency(garantiaExtVal)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total da Venda</span>
              <span className="font-bold">{formatCurrency(venda.total)}</span>
            </div>
            {totalTaxas > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxas de Cartão</span>
                <span className="font-medium text-orange-600">-{formatCurrency(totalTaxas)}</span>
              </div>
            )}
            {showCustos && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo Total</span>
                  <span className="font-medium">{formatCurrency(custoTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro</span>
                  <span className={`font-bold ${isPrejuizo ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(lucro)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem</span>
                  <span className={`font-medium ${isPrejuizo ? 'text-red-600' : 'text-green-600'}`}>
                    {margem.toFixed(1)}%
                  </span>
                </div>
                {isPrejuizo && (
                  <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-400 text-xs mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Venda com prejuízo!
                  </div>
                )}
              </>
            )}
            {venda.comissaoVendedor !== undefined && venda.comissaoVendedor > 0 && showCustos && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comissão</span>
                <span className="font-medium">{formatCurrency(venda.comissaoVendedor)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
