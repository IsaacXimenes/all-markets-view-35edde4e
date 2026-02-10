
# Plano: Coluna "Produto" fixa e reordenacao de colunas na tabela de Aparelhos

## Objetivo

Fixar a coluna "Produto" na tabela de Estoque > Aparelhos para que ela permaneca visivel ao rolar horizontalmente, e reordenar as colunas conforme solicitado.

## Nova ordem de colunas

```text
Produto (fixa) > Loja > Venda Recomendada > Custo > Custo Assist. > Status > ID > IMEI > Tipo > Origem > Qtd > Saude Bat. > Estoque > Assistencia > Acoes
```

A coluna "Status" foi movida para depois de "Custo Assist." (antes estava em segundo lugar).

## Alteracoes

### 1. Coluna fixa "Produto" (`src/pages/EstoqueProdutos.tsx`)

- Aplicar `sticky left-0 z-10 bg-background` no `TableHead` e `TableCell` da coluna "Produto"
- Para as linhas com cor de fundo condicional (bateria), o `TableCell` do Produto herdara a cor da linha via CSS, garantindo que nao haja "buraco" visual
- Adicionar uma sombra sutil no lado direito da coluna fixa para indicar visualmente a separacao (`shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`)

### 2. Reordenar colunas (`src/pages/EstoqueProdutos.tsx`)

Mover tanto os `TableHead` quanto os `TableCell` correspondentes para a nova ordem:
1. Produto (sticky)
2. Loja
3. Venda Recomendada
4. Custo
5. Custo Assist.
6. Status
7. ID
8. IMEI
9. Tipo
10. Origem
11. Qtd
12. Saude Bat.
13. Estoque
14. Assistencia
15. Acoes

## Arquivo Modificado

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/EstoqueProdutos.tsx` | Reordenar colunas do header e body; aplicar classes sticky na coluna Produto |

## Detalhe Tecnico

A coluna fixa usa CSS nativo `position: sticky` com `left: 0`, que funciona nativamente dentro do scroll horizontal do `TableScrollArea` (Radix ScrollArea). O `z-index: 10` garante que a coluna fique acima das demais ao rolar. O `bg-background` (ou cor herdada da linha) evita sobreposicao transparente.
