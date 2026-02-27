
# Remover Coluna de Aprovação e Executar Ações Automaticamente

## O que muda

O fluxo de aprovação do gestor será eliminado. Quando uma tratativa de "Troca Direta" ou "Assistência + Empréstimo" for registrada, as ações de estoque serão executadas **imediatamente**, sem etapa intermediária de aprovação.

---

## Alterações

### 1. `src/utils/garantiasApi.ts` -- Executar ações de estoque direto na criação

Na função `processarTratativaGarantia()` (linha 967):
- Remover a variável `precisaAprovacao` -- todas as tratativas terão status `'Em Andamento'` desde o início
- Mover a lógica de estoque que hoje está dentro de `aprovarTratativa()` para dentro de `processarTratativaGarantia()`:
  - **Assistência + Empréstimo**: marcar aparelho emprestado, criar movimentação
  - **Troca Direta**: dar baixa no aparelho novo, registrar aparelho defeituoso em Pendentes, gerar Nota de Venda zerada, encaminhar para análise
- As funções `aprovarTratativa` e `recusarTratativa` deixam de ser necessárias (podem ser mantidas como código morto ou removidas)

### 2. `src/pages/GarantiasEmAndamento.tsx` -- Remover coluna e funcionalidades de aprovação

- Remover import de `ThumbsUp`, `ThumbsDown`, `aprovarTratativa`, `recusarTratativa`
- Remover estados: `showRecusaModal`, `tratativaParaRecusa`, `motivoRecusa`
- Remover funções: `handleAprovarTratativa`, `handleRecusarTratativa`
- Remover `<TableHead>Aprovação</TableHead>` (linha 378) e toda a `<TableCell>` correspondente (linhas 415-445)
- Remover o modal de recusa (linhas 621-650)
- Ajustar `colSpan` de 11 para 10 na linha vazia
- Remover filtro por `'Aguardando Aprovação'` no `useMemo` dos dados da tabela (linha 70)

### 3. Status do produto na Troca Direta

O aparelho que sai do estoque receberá destino `'Troca Direta - Garantia'` na movimentação (em vez de `'Vendido'`), conforme solicitado anteriormente.
