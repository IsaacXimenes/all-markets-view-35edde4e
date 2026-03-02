
# Plano: Adicionar Quantidade Total no resumo do novo lote de Consignacao

## Alteracao

No arquivo `src/pages/OSConsignacao.tsx`, adicionar o calculo da quantidade total e exibi-la ao lado do valor total no rodape do formulario de novo lote.

### Detalhes tecnicos

1. **Calcular quantidade total** (ao lado do `valorTotalNovo`, linha ~219):
```ts
const quantidadeTotalNovo = novoItens.reduce((acc, item) => {
  return acc + (parseInt(item.quantidade) || 0);
}, 0);
```

2. **Atualizar o rodape** (linhas 552-555) para exibir ambas as informacoes:
```tsx
<div className="mt-4 p-3 bg-muted rounded-lg flex justify-between items-center">
  <div className="flex gap-6">
    <div>
      <span className="text-sm text-muted-foreground">Quantidade:</span>
      <span className="ml-2 font-bold">{quantidadeTotalNovo}</span>
    </div>
    <div>
      <span className="text-sm text-muted-foreground">Valor Total:</span>
      <span className="ml-2 text-lg font-bold">{formatCurrency(valorTotalNovo)}</span>
    </div>
  </div>
</div>
```

A quantidade total soma todas as quantidades dos itens lancados (ex: 3 pecas com quantidade 5 = 15).

## Arquivo afetado

| Arquivo | Alteracao |
|---------|----------|
| `src/pages/OSConsignacao.tsx` | Adicionar calculo e exibicao da quantidade total no resumo do lote |
