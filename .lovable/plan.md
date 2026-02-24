
# Inteligencia de Custos e Abatimento na Nota de Entrada

## Resumo

Implementar o ciclo completo de retorno financeiro da Assistencia para a Nota de Entrada, garantindo que os custos de reparo sejam refletidos corretamente nos tres fluxos de pagamento (Pos, Parcial e 100% Antecipado), com abatimento automatico no valor pendente ou geracao de credito ao fornecedor.

---

## Situacao Atual

O sistema ja possui:
- Encaminhamento de aparelhos da nota para Assistencia via lote de revisao
- Atualizacao de custo de reparo (`atualizarItemRevisao`) quando o tecnico finaliza o servico
- Finalizacao automatica do lote quando todos os itens estao concluidos (`finalizarLoteComLogisticaReversa`)
- Sistema de creditos ao fornecedor (`gerarCreditoFornecedor`, `getCreditosByFornecedor`)
- Campo `valorAbatimento` na interface `NotaEntrada` (existe mas nao e populado pelo retorno da assistencia)

**O que falta:**
1. Quando o lote e finalizado, o `valorAbatimento` da nota nao e atualizado
2. O `valorPendente` da nota nao e recalculado com base no abatimento
3. A tela de detalhes da nota (`NotaDetalhesContent`) nao exibe informacoes de assistencia/custos de reparo
4. Nao ha geracao automatica de credito no fluxo de finalizacao do lote para notas 100% Antecipadas (ja existe em `finalizarLoteComLogisticaReversa` mas sem registro na timeline da nota)
5. A timeline da nota nao registra o retorno da assistencia

---

## Implementacao

### 1. Atualizar nota ao finalizar lote de revisao

**Arquivo:** `src/utils/loteRevisaoApi.ts`

Na funcao `finalizarLoteComLogisticaReversa` (ja existente, linha 183-238), apos calcular custos e processar itens:

- Buscar a nota de entrada vinculada (`getNotaEntradaById`)
- Atualizar `nota.valorAbatimento` com o custo total de reparos
- Recalcular `nota.valorPendente` considerando o abatimento:
  - **Pos-Pagamento**: `valorPendente = valorTotal - valorPago - custoTotalReparos`
  - **Parcial**: `valorPendente = valorTotal - valorPago - custoTotalReparos`
  - **100% Antecipado**: manter valorPendente = 0, gerar credito (ja implementado parcialmente)
- Registrar na timeline da nota: "Retorno da Assistencia - Lote [ID] finalizado. Custo de reparos: R$ X. Abatimento aplicado."
- Para notas 100% Antecipadas, registrar tambem na timeline: "Credito gerado para fornecedor [nome]: R$ X"

Na funcao `finalizarLoteRevisao` (linha 157-172), aplicar a mesma logica de sincronizacao com a nota.

### 2. Sincronizacao individual por item (ao finalizar cada OS)

**Arquivo:** `src/pages/OSAssistenciaDetalhes.tsx`

A logica de atualizacao do item no lote ja existe (linhas 376-397). Adicionar:

- Apos `atualizarItemRevisao`, registrar na timeline da nota de entrada:
  - "Aparelho [modelo] (IMEI: [imei]) retornou da assistencia. Custo reparo: R$ X. Parecer: [resumo]"
- Atualizar `nota.valorAbatimento` parcialmente (acumular custos conforme itens vao sendo concluidos)

### 3. Funcao auxiliar para sincronizar nota com lote

**Arquivo:** `src/utils/loteRevisaoApi.ts`

Criar funcao `sincronizarNotaComLote(loteId: string)`:
- Recalcula custo total dos itens concluidos
- Atualiza `nota.valorAbatimento`
- Recalcula `nota.valorPendente` conforme tipo de pagamento
- Retorna a nota atualizada

Esta funcao sera chamada tanto na finalizacao do lote quanto na finalizacao individual de cada OS.

### 4. Exibir informacoes de assistencia na tela de detalhes da nota

**Arquivo:** `src/components/estoque/NotaDetalhesContent.tsx`

Adicionar nova secao "Assistencia Tecnica" entre "Produtos" e "Timeline":

- Importar `getLoteRevisaoByNotaId`, `calcularAbatimento` de `loteRevisaoApi`
- Verificar se a nota tem lote de revisao vinculado
- Se sim, exibir:
  - **Card de resumo financeiro** (reutilizar `LoteRevisaoResumo` ja existente):
    - Valor Original da Nota
    - Custo Total de Reparos (com alerta se > 15%)
    - Valor Liquido (valor a pagar ao fornecedor)
  - **Tabela de itens encaminhados** com colunas:
    - Marca | Modelo | IMEI | Motivo | Status Reparo | Custo Reparo | Parecer
  - **Card de credito** (apenas para notas 100% Antecipadas):
    - Exibir creditos gerados com `getCreditosByFornecedor`
    - Badge visual "Credito Disponivel" ou "Credito Utilizado"
  - **Indicador de abatimento no card financeiro principal**:
    - Ao lado de "Valor Pendente", exibir "(com abatimento de R$ X)" quando houver abatimento

### 5. Atualizar funcao de pagamento para considerar abatimento

**Arquivo:** `src/utils/notaEntradaFluxoApi.ts`

Na funcao `registrarPagamento` (linha 629-727):

- Ao calcular `nota.valorPendente`, considerar o `valorAbatimento`:
  - `nota.valorPendente = nota.valorTotal - nota.valorPago - (nota.valorAbatimento || 0)`
- Na validacao de quitacao (tolerancia de R$ 0.01), usar o valor liquido (com abatimento)
- Garantir que a finalizacao automatica considere o abatimento na comparacao

### 6. Exibir creditos na tela do Financeiro

**Arquivo:** `src/pages/FinanceiroNotasAssistencia.tsx`

Na area de conferencia de notas de assistencia:
- Ja importa `getCreditosByFornecedor` e `calcularAbatimento`
- Adicionar card de creditos disponiveis do fornecedor vinculado a nota
- Permitir visualizacao dos creditos existentes

---

## Detalhes Tecnicos

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/utils/loteRevisaoApi.ts` | Nova funcao `sincronizarNotaComLote`; atualizar `finalizarLoteComLogisticaReversa` e `finalizarLoteRevisao` para sincronizar nota |
| `src/utils/notaEntradaFluxoApi.ts` | Exportar funcao `atualizarAbatimentoNota` para atualizar valorAbatimento e valorPendente; ajustar `registrarPagamento` para considerar abatimento |
| `src/components/estoque/NotaDetalhesContent.tsx` | Nova secao "Assistencia Tecnica" com resumo financeiro, tabela de itens e creditos |
| `src/pages/OSAssistenciaDetalhes.tsx` | Registrar retorno na timeline da nota ao finalizar OS com lote vinculado |

### Novas funcoes

- `sincronizarNotaComLote(loteId)` em `loteRevisaoApi.ts`
- `atualizarAbatimentoNota(notaId, valorAbatimento)` em `notaEntradaFluxoApi.ts`

### Sem novas dependencias npm

Todos os componentes e funcoes necessarias ja existem no projeto.

---

## Sequencia de Implementacao

1. `src/utils/notaEntradaFluxoApi.ts` - funcao `atualizarAbatimentoNota` + ajuste em `registrarPagamento`
2. `src/utils/loteRevisaoApi.ts` - funcao `sincronizarNotaComLote` + integracoes nas funcoes de finalizacao
3. `src/pages/OSAssistenciaDetalhes.tsx` - registro na timeline da nota ao finalizar OS
4. `src/components/estoque/NotaDetalhesContent.tsx` - secao visual de assistencia com resumo financeiro

---

## Logica de Abatimento por Fluxo

```text
Pos-Pagamento:
  Valor a Pagar = Valor Nota - Custo Reparos
  (abatimento reduz diretamente o que falta pagar)

Parcial:
  Saldo Devedor = Valor Nota - Valor Ja Pago - Custo Reparos
  (abatimento reduz o saldo restante)

100% Antecipado:
  Valor Ja Pago = Valor Nota (tudo pago)
  Credito Fornecedor = Custo Reparos
  (credito gerado para uso em futuras compras)
```
