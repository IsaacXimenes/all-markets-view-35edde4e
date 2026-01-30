
# Correção de Responsividade do Ranking de Vendedores

## Problema
Os valores monetários (vendas e comissões) estão transbordando do card do ranking de vendedores no Dashboard, pois não há controle de overflow e os tamanhos de fonte são fixos.

## Solução

### Arquivo: `src/components/dashboard/RankingVendedores.tsx`

#### 1. Top 3 em Destaque (linhas 71-104)
- Adicionar `min-w-0` na div de valores para permitir truncamento
- Reduzir tamanho de fonte de forma responsiva: `text-base lg:text-lg` para valores principais
- Adicionar `truncate` nos valores monetários
- Ajustar padding responsivo: `p-3 lg:p-4`
- Reduzir tamanho do Avatar em telas pequenas: `h-10 w-10 lg:h-12 lg:w-12`

#### 2. Posições 4º ao 10º (linhas 113-141)
- Adicionar `min-w-0` na div de valores
- Reduzir tamanho de fonte: `text-xs lg:text-sm` para valores
- Adicionar `truncate` para evitar overflow
- Ajustar gap e padding: `gap-2 lg:gap-3`, `p-2`

#### 3. Layout Flexível
- Usar `flex-shrink-0` nos elementos fixos (medalhas, avatares)
- Garantir que a coluna de valores possa encolher com `shrink`

### Mudancas Detalhadas

```text
Top 3 - Antes:
  <div className="text-right">
    <p className="font-bold text-success">{formatCurrency(seller.sales)}</p>
    <p className="text-xs text-purple-600 font-medium">...</p>
  </div>

Top 3 - Depois:
  <div className="text-right min-w-0 shrink-0">
    <p className="font-bold text-success text-sm lg:text-base truncate">...</p>
    <p className="text-[10px] lg:text-xs text-purple-600 font-medium truncate">...</p>
  </div>

Demais - Antes:
  <div className="text-right">
    <p className="text-sm font-semibold">{formatCurrency(seller.sales)}</p>
    <p className="text-xs text-purple-600">...</p>
  </div>

Demais - Depois:
  <div className="text-right min-w-0 shrink-0">
    <p className="text-xs lg:text-sm font-semibold truncate">...</p>
    <p className="text-[10px] lg:text-xs text-purple-600 truncate">...</p>
  </div>
```

### Resumo das Alterações
| Elemento | Antes | Depois |
|----------|-------|--------|
| Padding Top 3 | `p-4` | `p-3 lg:p-4` |
| Avatar Top 3 | `h-12 w-12` | `h-10 w-10 lg:h-12 lg:w-12` |
| Valor vendas Top 3 | `font-bold text-success` | `font-bold text-success text-sm lg:text-base truncate` |
| Valor comissão Top 3 | `text-xs` | `text-[10px] lg:text-xs truncate` |
| Gap demais | `gap-3` | `gap-2 lg:gap-3` |
| Valor vendas demais | `text-sm` | `text-xs lg:text-sm truncate` |
| Valor comissão demais | `text-xs` | `text-[10px] lg:text-xs truncate` |

## Resultado Esperado
- Valores se ajustam automaticamente ao tamanho do container
- Em telas menores, fontes são reduzidas proporcionalmente
- Valores longos são truncados com `...` em vez de transbordar
- Layout permanece legível em tablets, notebooks e monitores grandes
