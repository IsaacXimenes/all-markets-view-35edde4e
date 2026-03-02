
# Plano: Corrigir Draft Dialog da Consignacao + Filtrar Maquinas por Loja

## Problema 1: Draft Dialog nao aparece no momento correto

O Dialog de rascunho esta posicionado no JSX da view `detalhamento` (linha 1408), mas quando o usuario entra na view `novo`, o componente retorna cedo (linha 468-581) e nunca renderiza o Dialog. Por isso, o dialog so aparece quando o usuario volta para outra view.

**Solucao:** Mover o Draft Dialog para dentro do bloco de retorno da view `novo` (antes do fechamento `</OSLayout>` na linha 580).

### Arquivo: `src/pages/OSConsignacao.tsx`
- Copiar o bloco do Draft Dialog (linhas 1408-1429) para dentro da view `novo`, logo antes do `</OSLayout>` na linha 580
- Remover o Draft Dialog da posicao atual (linha 1408-1429) na view `detalhamento`

## Problema 2: Maquinas de cartao nao filtradas por loja

Ja planejado anteriormente. Filtrar maquinas por `lojaVendaId`.

### Arquivo: `src/components/vendas/PagamentoQuadro.tsx`
- Linha 640: adicionar `.filter(maq => !lojaVendaId || maq.lojaVinculada === lojaVendaId)` antes do `.map()`

## Resumo

| Arquivo | Alteracao |
|---------|----------|
| `src/pages/OSConsignacao.tsx` | Mover Draft Dialog para dentro da view 'novo' |
| `src/components/vendas/PagamentoQuadro.tsx` | Filtrar maquinas de cartao pela loja da venda |
