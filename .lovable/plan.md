

# Corrigir scroll horizontal no modal "Selecionar Produto"

## Problema raiz
O componente `Table` global (`src/components/ui/table.tsx`) aplica `min-w-max` na tag `<table>` e envolve tudo em um `TableScrollArea` com scroll horizontal forcado. Isso faz com que qualquer tabela, incluindo a do modal, se expanda alem do container e exiba scroll horizontal -- mesmo com a tentativa de `[&_table]:min-w-0`.

## Solucao
Passar uma classe customizada na `Table` do modal para sobrescrever o `min-w-max` com `min-w-full`, forcando a tabela a respeitar a largura do container. Isso funciona porque o componente `Table` aceita `className` e usa `cn()` para merge, permitindo que a classe passada sobrescreva a padrao.

## Alteracoes

### Arquivo: `src/pages/VendasNova.tsx`

1. Nas duas instancias de `<Table>` dentro do modal de selecao de produto (aba Estoque e aba Pendentes), adicionar `className="min-w-full"`:

```tsx
// Aba Estoque (~linha 2766)
<Table className="min-w-full">

// Aba Pendentes (~linha correspondente)
<Table className="min-w-full">
```

2. Manter o container com `overflow-x-hidden` para garantir que nada vaze.

Isso faz com que a tabela ocupe 100% da largura do modal sem ultrapassar, eliminando o scroll horizontal e deixando o botao "Selecionar" sempre visivel.

