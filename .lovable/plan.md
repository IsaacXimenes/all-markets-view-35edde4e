

## Ajustes no Grafico de Fluxo de Caixa (Extrato Financeiro)

### Alteracoes

1. **Corrigir ordenacao cronologica**: Os dias no grafico estao invertidos (mais recente primeiro). Sera adicionada uma chave de data ISO auxiliar no agrupamento para ordenar do mais antigo para o mais recente antes de exibir.

2. **Trocar grafico de barras por linhas suaves**: Substituir `BarChart` + `Bar` por `LineChart` + `Line` com `type="monotone"` para curvas suaves.

3. **Cores**: Linha de Entradas em verde (`#10b981`) e linha de Saidas em vermelho (`#ef4444`), com pontos nos dados e `strokeWidth={2}`.

### Detalhes tecnicos

**Arquivo**: `src/pages/FinanceiroExtrato.tsx`

| Alteracao | Detalhe |
|---|---|
| Imports | Trocar `BarChart, Bar` por `LineChart, Line` |
| `dadosGrafico` (useMemo) | Guardar a data ISO como campo auxiliar `dateISO`, ordenar por ela antes do `.slice(-15)`, removendo o campo auxiliar na saida |
| Componente grafico | `<LineChart>` com `<Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />` e `<Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />` |

