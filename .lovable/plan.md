
## Plano: Renomear coluna "Status Compra" para "Valor Base Troca", exibir diferenca em valor e adicionar filtro

### Arquivo: `src/pages/Vendas.tsx`

### 1. Novo estado de filtro

Adicionar `filtroBaseTroca` (string) com opcoes: `''` (todos), `'acima'`, `'abaixo'`, `'conformidade'`, `'sem-ref'`.

### 2. Adicionar Select de filtro na area de filtros (apos "Tipo Pagamento", antes do botao Nova Venda)

```
Valor Base Troca
- Todos
- Acima
- Abaixo
- Conformidade
- Sem ref.
```

### 3. Adicionar logica de filtragem no `vendasFiltradas`

Para cada venda, calcular o status da base de troca considerando todos os trade-ins:
- `'acima'`: pelo menos um trade-in com `valorPago > valorSugerido`
- `'abaixo'`: pelo menos um trade-in com `valorPago < valorSugerido`
- `'conformidade'`: todos os trade-ins com `valorPago === valorSugerido`
- `'sem-ref'`: pelo menos um trade-in sem valor de referencia

Se `filtroBaseTroca` estiver ativo, filtrar vendas que nao tenham trade-in (excluidas) e vendas que nao correspondam ao criterio selecionado.

### 4. Renomear cabecalho da coluna (linha 434)

De `Status Compra` para `Valor Base Troca`.

### 5. Reformular conteudo da celula (linhas 568-619)

Substituir badges "Acima" / "OK" / "Sem ref." pelo valor da diferenca formatado:

- Sem trade-in: exibir `-`
- Trade-in sem referencia: Badge outline `Sem ref.`
- `valorPago > valorSugerido`: Badge vermelho `Acima R$ XX,XX`
- `valorPago < valorSugerido`: Badge verde `Abaixo R$ XX,XX`
- `valorPago === valorSugerido`: Badge verde `Conforme`

O tooltip permanece com detalhamento (modelo, valor pago, valor recomendado).

### 6. Atualizar dependencia do `useMemo`

Adicionar `filtroBaseTroca` ao array de dependencias do `vendasFiltradas`.

### Resumo

| Alteracao | Local |
|-----------|-------|
| Novo estado `filtroBaseTroca` | Linha ~39 |
| Novo Select de filtro | Apos linha 404 |
| Logica de filtragem | Bloco `vendasFiltradas` (~linha 207) |
| Renomear cabecalho | Linha 434 |
| Reformular celula | Linhas 568-619 |
| Dependencia useMemo | Linha 216 |
