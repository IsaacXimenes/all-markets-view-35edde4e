
# Correcao: Busca por IMEI com Mascara em Todo o Sistema

## Problema

Quando o usuario digita um IMEI com mascara (ex: `35-123456-789012-3`), os filtros de busca nao encontram resultados porque comparam o texto com hifens diretamente contra o IMEI armazenado sem hifens. A solucao e remover caracteres nao-numericos de AMBOS os lados da comparacao (filtro e dado) antes de comparar.

## Locais Afetados (14 arquivos, ~20 comparacoes)

Varios arquivos ja fazem a limpeza corretamente (OSAssistencia, OSProdutosAnalise, EstoqueProdutos, etc). Os seguintes precisam de correcao:

### 1. `src/pages/EstoqueMovimentacoes.tsx` (linha 105)
Busca de produtos na aba de movimentacoes:
```
// DE: p.imei.includes(busca)
// PARA: p.imei.includes(busca.replace(/\D/g, ''))
```

### 2. `src/pages/Vendas.tsx` (linha 195)
Filtro de vendas por IMEI:
```
// DE: item.imei.includes(imeiFiltro)
// PARA: item.imei.includes(imeiFiltro.replace(/\D/g, ''))
```

### 3. `src/pages/VendasNova.tsx` (linhas 590, 607, 2923)
Busca de produto para adicionar a venda (3 filtros identicos):
```
// DE: p.imei.includes(buscaProduto)
// PARA: p.imei.includes(buscaProduto.replace(/\D/g, ''))
```

### 4. `src/pages/VendasFinalizarDigital.tsx` (linhas 594, 611, 2436)
Mesma logica do VendasNova, 3 filtros:
```
// DE: p.imei.includes(buscaProduto)
// PARA: p.imei.includes(buscaProduto.replace(/\D/g, ''))
```

### 5. `src/pages/VendasEditar.tsx` (linhas 415, 434, 2013)
Mesma logica, 3 filtros:
```
// DE: p.imei.includes(buscaProduto)
// PARA: p.imei.includes(buscaProduto.replace(/\D/g, ''))
```

### 6. `src/pages/GarantiasExtendida.tsx` (linha 51)
Filtro de garantias estendidas por IMEI:
```
// DE: g.imei.includes(filters.imei)
// PARA: g.imei.includes(filters.imei.replace(/\D/g, ''))
```

### 7. `src/pages/GarantiasNovaManual.tsx` (linha 165)
Busca de aparelho por IMEI:
```
// DE: p.imei?.toLowerCase().includes(buscaAparelho.toLowerCase())
// PARA: p.imei?.replace(/\D/g, '').includes(buscaAparelho.replace(/\D/g, ''))
```

### 8. `src/pages/GarantiaDetalhes.tsx` (linha 77)
Mesma logica:
```
// DE: p.imei?.toLowerCase().includes(buscaAparelho.toLowerCase())
// PARA: p.imei?.replace(/\D/g, '').includes(buscaAparelho.replace(/\D/g, ''))
```

### 9. `src/pages/EstoqueNovaMovimentacaoMatriz.tsx` (linha 68)
Busca de produto para movimentacao:
```
// DE: p.imei.toLowerCase().includes(termo)
// PARA: p.imei.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
```

---

## Abordagem Tecnica

A correcao e simples e consistente: em cada comparacao de IMEI, aplicar `.replace(/\D/g, '')` no termo de busca (e no dado quando ele pode conter mascara). Isso garante que tanto `351234567890123` quanto `35-123456-789012-3` encontrem o mesmo resultado.

Nenhuma alteracao de banco de dados necessaria — apenas correcoes no frontend.
