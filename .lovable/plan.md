
# Correção: Produtos da Loja Online não aparecem na Finalização Digital

## Problema Identificado

Quando a "Loja de Venda" é "Loja - Online" (ID `fcc78c1a`), o sistema aplica a regra de estoque compartilhado e redireciona para "Loja - Matriz" (ID `3ac7e00c`). Porém, o filtro so mostra produtos cuja localização efetiva seja exatamente a Matriz. Produtos registrados diretamente na loja Online (com `loja: 'fcc78c1a'`) ficam invisíveis, pois `'fcc78c1a' !== '3ac7e00c'`.

## Causa Raiz

Na função `getLojaEstoqueReal()`, quando a loja é Online, retorna o ID da Matriz. O filtro de produtos compara `lojaEfetivaProduto === lojaEstoqueReal`, o que exclui produtos que estão fisicamente cadastrados na Online.

O mesmo bug existe em `getProdutosDisponiveisPorLoja()` na `estoqueApi.ts`.

## Solução

Alterar a lógica de filtragem para considerar AMBAS as lojas quando há compartilhamento de estoque. Produtos devem aparecer se estiverem na Matriz OU na Online quando a venda é de qualquer uma dessas duas lojas.

### Alterações

**1. `src/utils/estoqueApi.ts`** - Criar helper e corrigir `getProdutosDisponiveisPorLoja`

- Criar função `getLojasPorPoolEstoque(lojaId)` que retorna um array com todas as lojas do mesmo pool de estoque (ex: `['fcc78c1a', '3ac7e00c']` para Online ou Matriz)
- Corrigir `getProdutosDisponiveisPorLoja` para usar o array de lojas do pool ao invés de um único ID

**2. `src/pages/VendasFinalizarDigital.tsx`** - Corrigir filtro de produtos (linha 584-588)

- Importar a nova função `getLojasPorPoolEstoque`
- No `produtosFiltrados`, trocar a comparação de igualdade simples por verificação de inclusão no pool:
  - De: `lojaEfetivaProduto !== lojaEstoqueReal`
  - Para: `!lojasPool.includes(lojaEfetivaProduto)`
- Mesma correção no `produtosOutrasLojas` (linha 610)

**3. `src/pages/VendasNova.tsx`** - Verificar e aplicar mesma correção se necessário

- Garantir consistência no filtro de produtos da tela de Nova Venda

### Exemplo da correção no filtro

```text
// Antes (bugado):
const lojaEstoqueReal = getLojaEstoqueReal(lojaVenda);
if (lojaEfetivaProduto !== lojaEstoqueReal) return false;

// Depois (corrigido):
const lojasPool = getLojasPorPoolEstoque(lojaVenda);
if (!lojasPool.includes(lojaEfetivaProduto)) return false;
```

A nova função `getLojasPorPoolEstoque` retornará:
- Para Loja Online: `['fcc78c1a', '3ac7e00c']` (Online + Matriz)
- Para Loja Matriz: `['3ac7e00c', 'fcc78c1a']` (Matriz + Online)
- Para qualquer outra loja: `['<id_da_loja>']` (apenas ela mesma)
