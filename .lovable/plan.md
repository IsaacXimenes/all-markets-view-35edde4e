

## Correcao do Layout - Detalhes do Produto Pendente

### Problema

O card "Servico Concluido - Validacao Pendente" (Custo Composto) foi inserido dentro do grid de 2 colunas com a classe `lg:col-span-2`, ocupando toda a largura e empurrando o quadro "Parecer Estoque" para baixo, desorganizando o layout original.

### Layout Original (antes da mudanca)

```text
+---------------------------+---------------------------+
| Informacoes do Produto    | Parecer Estoque           |
+---------------------------+---------------------------+
| Parecer Assistencia       | Timeline                  |
+---------------------------+---------------------------+
```

### Layout Atual (quebrado)

```text
+---------------------------+---------------------------+
| Informacoes do Produto    |                           |
+-----------------------------------------------------------+
| Custo Composto (col-span-2 - ocupa tudo)                  |
+-----------------------------------------------------------+
| Parecer Estoque           | Parecer Assistencia       |
+---------------------------+---------------------------+
| Timeline                  |                           |
+---------------------------+---------------------------+
```

### Correcao Proposta

Mover o card de Custo Composto para **fora** do grid de 2 colunas, colocando-o **acima** do grid como um card de largura total independente. Assim o grid interno mantem o layout original com "Informacoes do Produto" e "Parecer Estoque" lado a lado.

### Layout Corrigido

```text
+-----------------------------------------------------------+
| Custo Composto + Resumo Tecnico (largura total, fora do   |
| grid, so aparece quando status = Validar Aparelho)        |
+-----------------------------------------------------------+
+---------------------------+---------------------------+
| Informacoes do Produto    | Parecer Estoque           |
+---------------------------+---------------------------+
| Parecer Assistencia       | Timeline                  |
+---------------------------+---------------------------+
```

### Detalhes Tecnicos

**Arquivo: `src/pages/EstoqueProdutoPendenteDetalhes.tsx`**

- Mover o bloco condicional do card "Custo Composto" (linhas 394-444) para **antes** da abertura do grid (linha 314: `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`)
- Remover a classe `col-span-1 lg:col-span-2` do card, pois ele estara fora do grid e ja ocupara a largura total naturalmente

Nenhum outro arquivo precisa ser alterado.
