

# Melhorias no Modulo de Consignacao

## Resumo

Cinco ajustes no modulo de Consignacao da Assistencia: autocomplete no campo Modelo, correcao do botao "$", reorganizacao dos botoes por aba, automacao do pagamento via Financeiro, e habilitacao permanente de "Fechar Lote" e "Registrar Devolucao" no Inventario.

---

## 1. Autocomplete no Campo Modelo (Novo Lote e Edicao)

**Problema:** O campo "Modelo" usa um `<Select>` estatico com `produtosCadastro`. Conforme a regra global, deve ser um Autocomplete pesquisavel.

**Alteracao:** Substituir os 3 `<Select>` de Modelo (novo lote linha 443, edicao linha 588, novos itens edicao linha 625) por um componente Autocomplete que filtra `produtosCadastro` por texto digitado, usando `<Popover>` + `<Command>` (padrao cmdk ja usado no projeto).

**Arquivo:** `src/pages/OSConsignacao.tsx`

---

## 2. Botao "$" nao deve abrir "Editar Itens do Lote"

**Problema:** O botao "$" na lista (linha 1265) abre o detalhamento com `detalhamentoReadOnly: false`, o que exibe o card "Editar Itens do Lote" (linha 558). O usuario quer apenas gerar pagamento, nao editar.

**Alteracao:** No onClick do botao "$" (linha 1265-1273), definir `setDetalhamentoReadOnly(true)` em vez de `false`. Isso oculta o card de edicao. O usuario ainda tera acesso a aba "Pecas Usadas" para selecionar itens e gerar pagamento parcial. Ajustar a condicao do card "Gerar Pagamento Parcial" na aba Pecas Usadas para permitir operacao mesmo em modo readOnly quando vindo do "$".

**Solucao tecnica:** Criar um novo estado `modoPagamento` (boolean). O botao "$" seta `modoPagamento = true` e `detalhamentoReadOnly = true`. O card de "Gerar Pagamento Parcial" fica visivel quando `!loteConcluido && (!detalhamentoReadOnly || modoPagamento)`. O card de edicao segue oculto (so visivel quando `!detalhamentoReadOnly && loteAberto`).

**Arquivo:** `src/pages/OSConsignacao.tsx`

---

## 3. Esconder "Finalizar Lote" e "Confirmar Devolucoes" da aba "Pecas Usadas"

**Problema:** Os botoes "Finalizar Lote" e devoluces ficam fora das abas (linhas 984-1079), visiveis independente da aba selecionada.

**Alteracao:** 
- Mover o card "Finalizar Lote e Confirmar Devolucoes" (linhas 984-1079) para dentro do `<TabsContent value="inventario">`.
- Adicionar botoes de devolucao individual por item na tabela do Inventario (coluna "Acoes") para itens com status "Disponivel".
- Controlar a aba ativa via estado `activeTab` para condicionar a visibilidade.

**Arquivo:** `src/pages/OSConsignacao.tsx`

---

## 4. Automacao de Status de Pagamento via Financeiro

**Problema:** Atualmente, a confirmacao de pagamento e feita manualmente na aba "Historico de Pagamentos" da Assistencia (botao "Confirmar" linha 931-973). O correto e que o pagamento seja confirmado automaticamente quando o Financeiro finaliza a nota.

**Alteracoes:**

### 4a. `src/utils/solicitacaoPecasApi.ts` - `finalizarNotaAssistencia`
- Apos a linha que processa lotes de pagamento (linha 600-610), adicionar logica: se `nota.tipoConsignacao === true`, chamar `confirmarPagamentoParcial` do `consignacaoApi` usando `nota.solicitacaoId` (loteId) e o pagamento vinculado ao `nota.id` (notaFinanceiraId), passando o responsavel financeiro e o comprovante.

### 4b. `src/pages/OSConsignacao.tsx` - Historico de Pagamentos
- Remover o botao "Confirmar" (AlertDialog linhas 931-973) da aba Historico de Pagamentos. Pagamentos pendentes exibem apenas o badge "Pendente" sem acao manual. A confirmacao vem exclusivamente do Financeiro.

### 4c. `src/utils/consignacaoApi.ts` - Nova funcao auxiliar
- Criar funcao `confirmarPagamentoPorNotaId(loteId, notaFinanceiraId, responsavel, comprovanteUrl)` que busca o pagamento parcial pela `notaFinanceiraId` e chama `confirmarPagamentoParcial` internamente. Isso facilita a integracao do Financeiro sem precisar saber o `pagamentoId`.

**Arquivos:** `src/utils/consignacaoApi.ts`, `src/utils/solicitacaoPecasApi.ts`, `src/pages/OSConsignacao.tsx`

---

## 5. Habilitar "Fechar Lote" e "Registrar Devolucao" Sempre no Inventario

**Problema:** "Finalizar Lote" so aparece quando `loteAberto && temConsumidos` (linha 985). Deveria estar sempre habilitado no Inventario, independente do status dos itens.

**Alteracoes:**

### 5a. Botao "Finalizar Lote"
- Remover condicao `loteAberto && temConsumidos`. Exibir sempre que `lote.status !== 'Concluido'` e estiver na aba Inventario.

### 5b. Botao "Registrar Devolucao" com selecao individual
- Na tabela do Inventario, adicionar coluna "Acoes" com botao de devolucao por item (icone Undo2) para itens com status "Disponivel".
- Cada clique abre o AlertDialog de confirmacao em duas etapas (ja existente, linhas 1286-1314) para aquele item especifico.
- Remover restricao de status do lote para devolucao - permitir devolver itens mesmo que o lote esteja em "Aguardando Pagamento".

**Arquivo:** `src/pages/OSConsignacao.tsx`

---

## Sequencia de Implementacao

1. `src/utils/consignacaoApi.ts` - Criar `confirmarPagamentoPorNotaId`
2. `src/utils/solicitacaoPecasApi.ts` - Integrar automacao na `finalizarNotaAssistencia`
3. `src/pages/OSConsignacao.tsx` - Aplicar todas as alteracoes de UI (itens 1, 2, 3, 4b, 5)

