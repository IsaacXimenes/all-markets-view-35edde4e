

## Correcao de Calculo e Transformacao da Aba de Consignacao

### Resumo

Corrigir a base de calculo do valor total de pecas na OS para usar Valor de Custo (em vez de Valor Recomendado). Transformar a view "lista" da aba de Consignacao com 5 cards de indicadores consolidados, filtros profissionais (Fornecedor, Data, Status) e nova coluna "Valor Usado" na tabela.

---

### Alteracao 1: Base de Calculo com Valor de Custo (`src/pages/OSAssistenciaNova.tsx`)

**Linha 2025**: Ao selecionar peca no modal, usar `valorCusto` em vez de `valorRecomendado`:

```typescript
// ANTES
valor: p.valorRecomendado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),

// DEPOIS
valor: p.valorCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
```

Isso garante que `calcularValorTotalPeca` (linha 485-489) use o valor de custo como base para o calculo do Valor Total (incluindo desconto percentual). O campo "Valor Total" exibido na linha do grid (linha 1314) refletira o custo real.

---

### Alteracao 2: Dashboard com 5 Cards de Indicadores (`src/pages/OSConsignacao.tsx`)

**Linhas 77-85** (stats useMemo): Expandir o calculo para incluir os 5 indicadores solicitados:

```typescript
const stats = useMemo(() => {
  // 1. Soma do Valor Total (custo de todas as remessas)
  const valorTotal = lotes.reduce((acc, l) =>
    acc + l.itens.reduce((a, i) => a + i.valorCusto * i.quantidadeOriginal, 0), 0);

  // 2. Soma do Valor Usado (custo de todas as pecas consumidas)
  const valorUsado = lotes.reduce((acc, l) => acc + getValorConsumido(l), 0);

  // 3. Total de Produtos (quantidade total recebida)
  const totalProdutos = lotes.reduce((acc, l) =>
    acc + l.itens.reduce((a, i) => a + i.quantidadeOriginal, 0), 0);

  // 4. Total de Consumidos
  const totalConsumidos = lotes.reduce((acc, l) =>
    acc + l.itens.filter(i => i.status === 'Consumido').reduce((a, i) => a + i.quantidadeOriginal, 0), 0);

  // 5. Disponiveis no Estoque
  const disponiveis = lotes.reduce((acc, l) =>
    acc + l.itens.filter(i => i.status === 'Disponivel').reduce((a, i) => a + i.quantidade, 0), 0);

  return { valorTotal, valorUsado, totalProdutos, totalConsumidos, disponiveis };
}, [lotes]);
```

**Linhas 694-740** (Cards da view lista): Substituir os 4 cards manuais por 5 `StatsCard` com icones e cores padronizadas:

| Card | Titulo | Valor | Icone |
|------|--------|-------|-------|
| 1 | Valor Total | formatCurrency(stats.valorTotal) | DollarSign |
| 2 | Valor Usado | formatCurrency(stats.valorUsado) | DollarSign (destructive) |
| 3 | Total de Produtos | stats.totalProdutos | Package |
| 4 | Total Consumidos | stats.totalConsumidos | CheckCircle |
| 5 | Disponiveis | stats.disponiveis | PackageCheck (green) |

Grid: `grid-cols-2 md:grid-cols-5 gap-4`

---

### Alteracao 3: Filtros Profissionais (`src/pages/OSConsignacao.tsx`)

Adicionar 3 estados de filtro e uma barra de filtros acima da tabela:

```typescript
const [filtroFornecedor, setFiltroFornecedor] = useState('');
const [filtroStatus, setFiltroStatus] = useState('');
const [filtroData, setFiltroData] = useState('');
```

Barra de filtros com:
- `AutocompleteFornecedor` para filtro por fornecedor
- `Select` com opcoes: Todos, Aberto, Em Acerto, Pago, Devolvido
- `Input type="date"` para filtro por data de criacao

`useMemo` para `lotesFiltrados` aplicando os 3 filtros sobre `lotes`.

---

### Alteracao 4: Nova Coluna "Valor Usado" na Tabela (`src/pages/OSConsignacao.tsx`)

**Linhas 754-809** (tabela de lotes): Adicionar coluna "Valor Usado" entre "Valor Total" e "Consumidos":

```typescript
<TableHead>Valor Usado</TableHead>
// ...
<TableCell className="font-semibold text-destructive">
  {formatCurrency(getValorConsumido(lote))}
</TableCell>
```

Atualizar `colSpan` da linha vazia para 10.

---

### Detalhes Tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/OSAssistenciaNova.tsx` | Linha 2025: trocar `valorRecomendado` por `valorCusto` na selecao de peca |
| `src/pages/OSConsignacao.tsx` | Expandir stats para 5 indicadores; substituir cards por StatsCard; adicionar filtros (fornecedor, status, data); adicionar coluna "Valor Usado" na tabela |

### Sequencia de Implementacao

1. `OSAssistenciaNova.tsx` - Corrigir base de calculo
2. `OSConsignacao.tsx` - Stats + Cards + Filtros + Coluna Valor Usado

