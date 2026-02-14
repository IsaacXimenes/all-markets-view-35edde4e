
# Implementacoes no Modulo Financeiro

## Resumo

5 melhorias no modulo Financeiro: (1) rejeicao de notas de entrada pelo financeiro, (2) coluna de contagem de dias ate vencimento na Central de Despesas, (3) botao de exportar extrato por conta com movimentacoes individuais, (4) anexo de comprovante ao pagar despesa, e (5) anexo de documento ao lancar nova despesa.

---

## 1. Rejeicao de Nota de Entrada pelo Financeiro

**Onde:** `src/utils/notaEntradaFluxoApi.ts`, `src/pages/FinanceiroNotasPendencias.tsx`, `src/components/estoque/TabelaNotasPendencias.tsx`

Quando a atuacao da nota for "Financeiro", adicionar botao "Recusar" na tabela de notas pendentes. Ao clicar:
- Abrir modal com campos obrigatorios: Motivo da Recusa (select: "Dados incorretos", "Valor divergente", "Fornecedor invalido", "Documentacao insuficiente", "Outro") e Observacao (textarea).
- Ao confirmar, a nota tera a atuacao revertida para "Estoque" com status marcado e timeline registrando a rejeicao.
- Criar funcao `rejeitarNota()` em `notaEntradaFluxoApi.ts` que altera atuacao para "Estoque", registra timeline e envia notificacao para o estoque.
- A nota permanece no fluxo (nao e excluida), apenas retorna para o estoque com a observacao da recusa visivel na timeline.

---

## 2. Coluna de Dias ate Vencimento na Central de Despesas

**Onde:** `src/pages/FinanceiroCentralDespesas.tsx`

Adicionar coluna "Dias p/ Venc." na tabela de despesas, entre "Vencimento" e "Competencia":
- Calculo: diferenca em dias entre `dataVencimento` e a data atual
- Se status for "Pago" ou "Agendado": exibir "-" (nao aplicavel)
- Cores do badge:
  - 10+ dias: Verde (bg-green-500/10, text-green-700)
  - 4-9 dias: Amarelo (bg-yellow-500/10, text-yellow-700)
  - 1-3 dias: Vermelho (bg-red-500/10, text-red-700)
  - 0 dias (dia do vencimento): Laranja (bg-orange-500/10, text-orange-700)
  - Negativo (vencido): Vermelho com texto "Vencido ha X dias"

---

## 3. Botao Exportar no Extrato por Conta

**Onde:** `src/pages/FinanceiroExtratoContas.tsx`

Adicionar botao "Exportar CSV" ao lado do botao "Nova Movimentacao" na barra de filtros:
- Ao clicar, exportar CSV com dados individuais por conta:
  - Colunas: Conta, Loja, Tipo (Entrada/Saida), Descricao, Valor, Data
  - Incluir todas as movimentacoes (vendas, despesas, transferencias entre contas) do periodo filtrado
  - Cada linha do CSV e uma movimentacao individual vinculada a sua conta
  - Nome do arquivo: `extrato-contas-{mes}-{ano}.csv`
- Utilizar `exportToCSV` de `formatUtils.ts` (ja existente)

---

## 4. Comprovante no Pagamento de Despesa

**Onde:** `src/pages/FinanceiroCentralDespesas.tsx`, `src/utils/financeApi.ts`

No modal "Confirmar Pagamento" (quando clica no icone $ de uma despesa):
- Adicionar campo de upload "Comprovante" (input type="file" com accept="image/*,.pdf" e opcao capture="environment")
- Armazenar o nome do arquivo/referencia no campo `comprovante` da interface `Despesa`
- Adicionar campo `comprovante?: string` na interface `Despesa` em `financeApi.ts`
- Atualizar `pagarDespesa()` para aceitar parametro `comprovante`
- Exibir indicador "Contem Anexo" na tabela (coluna ou badge no status) e nos detalhes

---

## 5. Anexo de Documento no Lancamento de Nova Despesa

**Onde:** `src/pages/FinanceiroCentralDespesas.tsx`, `src/utils/financeApi.ts`

No formulario de Nova Despesa (collapsible):
- Adicionar campo "Documento/Anexo" (input type="file" com accept="image/*,.pdf,.doc,.docx")
- Campo opcional, nao obrigatorio
- Armazenar referencia no campo `documento?: string` da interface `Despesa`
- Exibir nome do documento nos detalhes da despesa (modal de detalhes)
- Passar o campo na chamada `addDespesa()`

---

## Detalhes Tecnicos

### Arquivos a modificar:

| Arquivo | Alteracao |
|---------|-----------|
| `src/utils/notaEntradaFluxoApi.ts` | Nova funcao `rejeitarNota(notaId, motivo, observacao, usuario)` |
| `src/pages/FinanceiroNotasPendencias.tsx` | Modal de rejeicao + handler |
| `src/components/estoque/TabelaNotasPendencias.tsx` | Botao "Recusar" nas acoes (modulo Financeiro) + prop `onRejeitar` |
| `src/pages/FinanceiroCentralDespesas.tsx` | Coluna dias vencimento + campo comprovante no modal pagar + campo documento no form nova despesa |
| `src/pages/FinanceiroExtratoContas.tsx` | Botao exportar CSV com movimentacoes individuais |
| `src/utils/financeApi.ts` | Campos `comprovante` e `documento` na interface `Despesa`, atualizar `pagarDespesa()` |

### Logica de dias ate vencimento:

```text
diasParaVencimento = diferencaDias(dataVencimento, hoje)
  >= 10: Verde
  4-9: Amarelo
  1-3: Vermelho
  0: Laranja (dia do vencimento)
  < 0: Vermelho ("Vencido")
```

### Funcao rejeitarNota:

```text
rejeitarNota(notaId, motivo, observacao, usuario):
  1. Buscar nota por ID
  2. Validar que atuacaoAtual === 'Financeiro'
  3. Alterar atuacaoAtual para 'Estoque'
  4. Registrar na timeline: "Nota rejeitada pelo Financeiro"
  5. Enviar notificacao para estoque
  6. Retornar nota atualizada
```
