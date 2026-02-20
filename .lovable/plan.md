

## Pagamentos Parciais e Fechamento Flexivel de Lotes de Consignacao

### Resumo

Atualmente, o fluxo de consignacao exige um unico "Acerto de Contas" que congela todo o lote, gera uma unica nota financeira e encerra tudo de uma vez. O novo modelo permite pagamentos parciais sob demanda enquanto o estoque permanece disponivel, com um fechamento final separado.

---

### Mudancas no Modelo de Dados

**Arquivo: `src/utils/consignacaoApi.ts`**

1. Novos status para `ItemConsignacao.status`: adicionar `'Em Pagamento'` e `'Pago'`
2. Novo status para `LoteConsignacao.status`: adicionar `'Concluido'`
3. Nova interface `PagamentoParcial` com campos: `id`, `data`, `valor`, `itensIds`, `notaFinanceiraId`, `status` ('Pendente' | 'Pago')
4. Adicionar campo `pagamentosParciais: PagamentoParcial[]` na interface `LoteConsignacao`
5. Remover a restricao que exige status `'Em Acerto'` para gerar nota financeira -- agora funciona com lote `'Aberto'`

### Novas Funcoes na API

**Arquivo: `src/utils/consignacaoApi.ts`**

1. `gerarPagamentoParcial(loteId, itemIds[], dadosPagamento)`:
   - Valida que os itens selecionados estao com status `'Consumido'`
   - Muda status dos itens para `'Em Pagamento'`
   - Cria registro `PagamentoParcial` no array do lote
   - Gera `NotaAssistencia` e injeta via `__pushNotaConsignacao`
   - Registra na timeline

2. `confirmarPagamentoParcial(loteId, pagamentoId)`:
   - Muda status do pagamento para `'Pago'`
   - Muda status dos itens vinculados para `'Pago'`
   - Registra na timeline

3. `finalizarLote(loteId, responsavel)`:
   - Gera pagamento parcial final para itens consumidos remanescentes (se houver)
   - Marca todas as sobras (status `'Disponivel'`) como `'Devolvido'` e atualiza estoque (`updatePeca` com `status: 'Devolvida'`, `quantidade: 0`)
   - Muda status do lote para `'Concluido'`
   - Registra na timeline

4. Modificar `iniciarAcertoContas` -- esta funcao nao deve mais congelar pecas disponiveis (remover a logica que muda `'Disponivel'` para `'Em Acerto'` e marca pecas como `'Utilizada'` no estoque)

5. Atualizar `getValorConsumido` para considerar os novos status (`'Em Pagamento'`, `'Pago'`)

### Regra de Disponibilidade Continua

- Pecas com status `'Disponivel'` permanecem disponiveis no estoque durante todo o ciclo de vida do lote
- Somente o botao "Finalizar Lote e Confirmar Devolucoes" muda sobras para `'Devolvida'`
- A funcao `registrarConsumoConsignacao` deve aceitar consumo mesmo quando existem pagamentos parciais em andamento (apenas verificar se o lote nao esta `'Concluido'`)

---

### Mudancas na Interface

**Arquivo: `src/pages/OSConsignacao.tsx`**

#### 1. Dashboard - Novos 5 Cards

Substituir os 5 cards atuais por:

| Card | Calculo |
|---|---|
| Valor Total do Lote | Soma de `valorCusto * quantidadeOriginal` de todos os itens |
| Total Ja Pago | Soma dos `PagamentoParcial` com status `'Pago'` |
| A Pagar (Pendente) | Valor de itens `'Consumido'` + `'Em Pagamento'` ainda nao pagos |
| Saldo Disponivel (Estoque) | Valor de itens com status `'Disponivel'` |
| Total de Devolucoes | Valor de itens com status `'Devolvido'` |

#### 2. Dossie - Aba "Pecas Usadas" com selecao e pagamento parcial

- Adicionar coluna de `Checkbox` na tabela de pecas usadas (apenas para itens com status `'Consumido'`)
- Itens com status `'Em Pagamento'` exibem badge amarelo (sem checkbox)
- Itens com status `'Pago'` exibem badge verde (sem checkbox)
- Botao "Gerar Pagamento Parcial" aparece quando ha itens selecionados
- Ao clicar, abre formulario de dados de pagamento (Pix/Dinheiro) + AlertDialog de confirmacao

#### 3. Dossie - Nova aba "Historico de Pagamentos"

- Adicionar terceira aba no `Tabs` do dossie: "Historico de Pagamentos"
- Listar todos os `PagamentoParcial` do lote em cards com: ID da nota, Data, Valor, Quantidade de itens, Status (Pendente/Pago)

#### 4. Botao "Finalizar Lote e Confirmar Devolucoes"

- Exibido no dossie quando o lote esta `'Aberto'` e existe pelo menos 1 peca consumida
- AlertDialog com dupla confirmacao mostrando:
  - Pecas consumidas remanescentes (serao pagas)
  - Sobras (serao devolvidas)
  - Valor final
- Ao confirmar: chama `finalizarLote()`

#### 5. Remover/Adaptar o fluxo de "Acerto de Contas"

- O botao "Iniciar Acerto" na lista de lotes sera substituido pelo botao de "Finalizar Lote" (disponivel apenas no dossie)
- A `viewMode === 'acerto'` sera removida -- o fluxo de pagamento agora acontece dentro do dossie

#### 6. Badges de status dos itens

Adicionar badges para os novos status:
- `'Em Pagamento'`: badge amarelo/laranja
- `'Pago'`: badge verde escuro

#### 7. Status do lote na lista

Adicionar badge para `'Concluido'`: badge roxo/escuro

---

### Sequencia de Implementacao

1. Atualizar interfaces e tipos em `consignacaoApi.ts`
2. Implementar `gerarPagamentoParcial` e `confirmarPagamentoParcial`
3. Implementar `finalizarLote`
4. Remover/adaptar `iniciarAcertoContas` e a view de acerto
5. Atualizar os 5 cards do dashboard
6. Adicionar selecao de pecas e botao de pagamento parcial no dossie
7. Adicionar aba "Historico de Pagamentos" no dossie
8. Adicionar botao "Finalizar Lote e Confirmar Devolucoes"
9. Atualizar badges e status visuais

### Arquivos Afetados

- `src/utils/consignacaoApi.ts` (modelo de dados + novas funcoes)
- `src/pages/OSConsignacao.tsx` (interface completa)

