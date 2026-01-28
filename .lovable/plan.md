
# Plano: Implementar Pendências Restantes do Fluxo Estoque-Financeiro

## Resumo das 3 Implementações

| # | Funcionalidade | Arquivo | Descrição |
|---|----------------|---------|-----------|
| 1 | Individualização Automática | EstoqueNotaCadastrar.tsx | Expandir produtos com quantidade > 1 em N registros individuais |
| 2 | Exibir tipoPagamento | EstoqueNotaDetalhes.tsx | Mostrar tipo de pagamento selecionado na página de detalhes |
| 3 | Coluna Nota de Origem | EstoqueProdutosPendentes.tsx | Melhorar badge colorido para Urgência vs Entrada Normal |

---

## Etapa 1: Individualização Automática de Produtos

**Arquivo**: `src/pages/EstoqueNotaCadastrar.tsx`

Adicionar função `expandirProdutos()` que transforma produtos com `quantidade > 1` em N registros individuais:

```typescript
// Função para expandir produtos com quantidade > 1 em registros individuais
const expandirProdutos = (produtosOriginais: ProdutoLinha[], notaId: string) => {
  const produtosExpandidos = [];

  produtosOriginais.forEach((p, prodIndex) => {
    if (p.tipoProduto === 'Aparelho' || p.quantidade <= 1) {
      // Aparelhos sempre têm quantidade 1 com IMEI específico
      produtosExpandidos.push({
        id: `PROD-${notaId}-${String(prodIndex + 1).padStart(3, '0')}`,
        marca: p.marca,
        modelo: p.modelo,
        cor: p.cor,
        imei: p.imei || '',
        tipo: p.categoria,
        tipoProduto: p.tipoProduto,
        quantidade: 1,
        valorUnitario: p.custoUnitario,
        valorTotal: p.custoUnitario,
        saudeBateria: p.categoria === 'Novo' ? 100 : 85,
        statusConferencia: 'Pendente'
      });
    } else {
      // Acessórios com quantidade > 1: gerar N registros individuais
      for (let i = 0; i < p.quantidade; i++) {
        produtosExpandidos.push({
          id: `PROD-${notaId}-${String(prodIndex + 1).padStart(3, '0')}-${String(i + 1).padStart(3, '0')}`,
          marca: p.marca,
          modelo: p.modelo,
          cor: p.cor,
          imei: '', // Acessórios não têm IMEI
          tipo: p.categoria,
          tipoProduto: p.tipoProduto,
          quantidade: 1,
          valorUnitario: p.custoUnitario,
          valorTotal: p.custoUnitario,
          saudeBateria: 100,
          statusConferencia: 'Pendente'
        });
      }
    }
  });

  return produtosExpandidos;
};
```

**Modificar handleSalvar()** para usar a função de expansão e exibir mensagem informativa:

```typescript
const handleSalvar = () => {
  // ... validações existentes ...

  // Gerar ID temporário para expansão
  const tempNotaId = `NC-${new Date().getFullYear()}-${String(notasExistentes.length + 1).padStart(5, '0')}`;
  
  // Expandir produtos com quantidade > 1
  const produtosExpandidos = expandirProdutos(produtos, tempNotaId);

  const novaNota = addNotaCompra({
    // ... dados existentes ...
    produtos: produtosExpandidos,
  });

  // Mensagem informativa sobre individualização
  if (produtosExpandidos.length > produtos.length) {
    toast.success(`Nota ${novaNota.id} cadastrada!`, {
      description: `${produtosExpandidos.length} registros individuais criados. Tipo: ${tipoPagamento}`
    });
  } else {
    toast.success(`Nota ${novaNota.id} cadastrada. Tipo: ${tipoPagamento}`);
  }
};
```

---

## Etapa 2: Exibir tipoPagamento na Página de Detalhes

**Arquivo**: `src/pages/EstoqueNotaDetalhes.tsx`

Adicionar campo visual na seção de informações da nota (grid de 3 colunas):

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* ... campos existentes ... */}
  
  <div>
    <Label>Tipo de Pagamento</Label>
    <div className="mt-1">
      {nota.tipoPagamento ? (
        <Badge 
          variant="outline" 
          className={
            nota.tipoPagamento === 'Pós-Conferência' 
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
              : nota.tipoPagamento === 'Parcial'
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              : 'bg-green-500/10 text-green-600 border-green-500/30'
          }
        >
          {nota.tipoPagamento}
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-gray-500/10">
          Não definido
        </Badge>
      )}
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      {nota.tipoPagamento === 'Pós-Conferência' && 'Pagamento após validação do estoque'}
      {nota.tipoPagamento === 'Parcial' && 'Pagamento adiantado + restante após conferência'}
      {nota.tipoPagamento === '100% Antecipado' && 'Pagamento total antes da conferência'}
    </p>
  </div>
  
  <div>
    <Label>Valor Total</Label>
    <Input value={formatCurrency(nota.valorTotal)} disabled className="font-semibold" />
  </div>
</div>
```

---

## Etapa 3: Melhorar Coluna "Nota de Origem" com Badges Coloridos

**Arquivo**: `src/pages/EstoqueProdutosPendentes.tsx`

Atualizar a célula da coluna "Nota de Origem" para badges mais visuais:

```typescript
<TableCell>
  {(produto as any).notaOrigemId ? (
    <div className="space-y-1">
      {/* Badge colorido baseado no tipo de nota */}
      {(produto as any).notaOrigemId.startsWith('URG') ? (
        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 font-medium">
          🚨 Urgência
        </Badge>
      ) : (produto as any).notaOrigemId.startsWith('NC-') ? (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            Entrada
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {(produto as any).notaOrigemId}
          </span>
        </div>
      ) : (
        <span className="font-mono text-xs">{(produto as any).notaOrigemId}</span>
      )}
      
      {/* Barra de progresso de conferência com cores dinâmicas */}
      {(() => {
        const progresso = getNotaProgresso((produto as any).notaOrigemId);
        if (progresso) {
          return (
            <div className="space-y-1 mt-1">
              <Progress 
                value={progresso.percentual} 
                className={`h-1.5 ${
                  progresso.percentual === 100 
                    ? '[&>div]:bg-green-500' 
                    : progresso.percentual >= 50 
                    ? '[&>div]:bg-blue-500' 
                    : '[&>div]:bg-yellow-500'
                }`} 
              />
              <span className="text-xs text-muted-foreground">
                {progresso.conferidos}/{progresso.total} ({progresso.percentual}%)
              </span>
            </div>
          );
        }
        return null;
      })()}
    </div>
  ) : (
    <span className="text-muted-foreground">—</span>
  )}
</TableCell>
```

---

## Resumo Visual das Mudanças

### EstoqueNotaCadastrar.tsx
- Nova função `expandirProdutos()` (linhas 189-245)
- Modificação do `handleSalvar()` para usar expansão
- Toast informativo mostrando quantidade de registros criados

### EstoqueNotaDetalhes.tsx
- Grid expandido para 3 colunas (linhas 519-580)
- Novo campo "Tipo de Pagamento" com badge colorido
- Descrição explicativa do tipo selecionado

### EstoqueProdutosPendentes.tsx
- Badge "🚨 Urgência" (laranja) para notas URG-
- Badge "Entrada" (azul) + ID para notas NC-
- Barra de progresso com cores dinâmicas (verde 100%, azul >= 50%, amarelo < 50%)
- Percentual numérico junto ao progresso

---

## Fluxo de Teste Recomendado

1. **Testar Individualização**:
   - Cadastrar nota com acessório quantidade = 5
   - Verificar que 5 registros individuais foram criados
   - Cada registro deve ter ID único (PROD-NC-XXX-001, PROD-NC-XXX-002, etc.)

2. **Testar Tipo de Pagamento**:
   - Selecionar "Parcial" no cadastro
   - Abrir detalhes da nota
   - Verificar badge amarelo com descrição correta

3. **Testar Badges de Origem**:
   - Acessar Produtos Pendentes
   - Verificar badges "Urgência" (laranja) e "Entrada" (azul)
   - Verificar cores dinâmicas na barra de progresso
