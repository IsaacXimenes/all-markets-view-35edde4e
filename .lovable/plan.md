
# Ocultar coluna ID no modal "Selecionar Produto"

## Objetivo
Remover a coluna "ID" das tabelas do modal de selecao de produto na Nova Venda, eliminando scroll horizontal e otimizando para uso mobile com selecao rapida.

## Alteracoes

### Arquivo: `src/pages/VendasNova.tsx`

#### 1. Aba "Produtos - Estoque" (linhas ~2769-2877)
- Remover `<TableHead>ID</TableHead>` (linha 2771)
- Remover `<TableCell>` com `produto.id` (linha 2784) nos produtos filtrados
- Remover `<TableCell>` com `produto.id` (linha 2838) nos produtos de outras lojas
- Atualizar `colSpan` de 8 para 7 nas linhas de "Nenhum produto" e "Produtos em outras lojas"

#### 2. Aba "Produtos - Pendentes" (linhas ~2880-2920+)
- Remover `<TableHead>ID</TableHead>` (linha 2883)
- Remover `<TableCell>` com `produto.id` (linha 2900)

#### 3. Remover largura minima fixa
- Remover o wrapper `<div className="min-w-[700px]">` (linha 2765) que forca uma largura minima e causa scroll horizontal desnecessario

Essas alteracoes reduzem o numero de colunas, permitindo que a tabela caiba na tela sem scroll horizontal, melhorando a experiencia em dispositivos moveis.
