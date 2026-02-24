
Objetivo: corrigir o fluxo de Nota de Entrada → Assistência para que (1) o envio não “salte” para Serviços sem rastreabilidade e (2) o retorno do serviço apareça corretamente no contexto da Nota de Entrada (aba de Estoque).

1) Diagnóstico do problema atual (causas-raiz)

- O encaminhamento feito em “Nota de Entrada” está registrando origem incorreta em alguns pontos:
  - Em `src/pages/EstoqueNotaCadastrar.tsx` e `src/pages/EstoqueNotaCadastrarProdutos.tsx`, o envio para análise usa `encaminharParaAnaliseGarantia(nota.id, 'Estoque', ...)`.
  - Isso usa o ID da nota como `origemId`, mas o fluxo de Assistência espera rastreabilidade por item/aparelho (produto da nota ou item de lote), não pela nota inteira.

- Em `src/pages/OSAnaliseGarantia.tsx`, ao aprovar uma tratativa de origem Estoque:
  - O código tenta resolver `origemId` como produto pendente (`getProdutoPendenteById`).
  - Quando `origemId` vem como ID da nota/produto da nota, a resolução falha parcialmente e a OS é criada sem vínculo completo de retorno para o ciclo da nota/lote.
  - Resultado percebido: usuário vê comportamento “indo para Serviços” sem feedback claro de retorno no quadro da nota.

- O indicador de revisão na listagem de notas não reflete o ciclo completo:
  - Em `src/components/estoque/TabelaNotasPendencias.tsx`, a coluna “Revisão” mostra “Em Revisão - Lote ...” de forma estática quando existe lote, sem refletir bem “Encaminhado / Em andamento / Finalizado (retorno)”.

2) Estratégia de correção

Vamos unificar o encaminhamento da Nota de Entrada para o mesmo trilho de rastreabilidade por lote/item (já existente) e reforçar os vínculos até a criação da OS, para que o retorno apareça corretamente no Estoque.

3) Implementação planejada (arquivos e mudanças)

3.1 `src/pages/EstoqueNotaCadastrar.tsx`
- Ajustar o fluxo de “produtos marcados para assistência”:
  - Em vez de chamar `encaminharParaAnaliseGarantia` com `novaNota.id`, criar lote de revisão com itens individuais (produto + motivo).
  - Encaminhar via `encaminharLoteParaAssistencia`.
  - Marcar IMEIs em revisão técnica com `marcarProdutosEmRevisaoTecnica`.
- Garantir que o vínculo use ID de produto da nota (produto individual) e não ID da nota.
- Atualizar mensagem de sucesso para “encaminhado para Análise de Tratativas”.

3.2 `src/pages/EstoqueNotaCadastrarProdutos.tsx`
- Mesma correção do item 3.1:
  - Trocar envio direto por lote com itens individuais.
  - Garantir rastreabilidade por aparelho com motivo.
- Manter regra de habilitação (somente aparelho com IMEI preenchido) já existente.

3.3 `src/utils/loteRevisaoApi.ts`
- Preservar o comportamento já correto de encaminhar para análise (`encaminharParaAnaliseGarantia`) sem criar OS direta.
- Enriquecer o encaminhamento com metadados de vínculo (item/lote/nota) para facilitar rastreio no passo de aprovação da análise.
- Ajustar retorno/tipagem legada de `osIds` para não induzir interpretação de OS criada nesse momento.

3.4 `src/utils/garantiasApi.ts`
- Evoluir `RegistroAnaliseGarantia` para aceitar metadados opcionais de rastreabilidade de estoque (ex.: `notaEntradaId`, `produtoNotaId`, `loteRevisaoId`, `loteRevisaoItemId`, `imeiAparelho`, `modeloAparelho`).
- Evoluir `encaminharParaAnaliseGarantia` para receber metadados opcionais (sem quebrar chamadas antigas).

3.5 `src/pages/OSAnaliseGarantia.tsx`
- Na aprovação de tratativa de origem Estoque:
  - Resolver dados do aparelho por prioridade:
    1) metadados explícitos do registro de análise;
    2) produto pendente (`getProdutoPendenteById`) quando aplicável;
    3) fallback por produto da nota/lote quando origem vier desse fluxo.
  - Criar OS com vínculo completo de rastreabilidade (`origemOS='Estoque'`, `loteRevisaoId`, `loteRevisaoItemId` quando existir).
  - Ajustar status inicial da OS para seguir o fluxo operacional esperado (Aguardando Análise), evitando discrepância com o funil da Assistência.

3.6 `src/components/estoque/TabelaNotasPendencias.tsx`
- Melhorar coluna “Revisão” para mostrar estado real do lote:
  - Em Revisão
  - Encaminhado
  - Em Andamento
  - Finalizado (retorno concluído)
- Exibir resumo (ex.: concluídos/total) para dar visibilidade imediata de retorno na aba de nota.

3.7 `src/pages/EstoqueEncaminharAssistencia.tsx`
- Ajustar mensagem de sucesso:
  - Remover referência a “OS geradas” no ato do encaminhamento (pois nesse ponto deve ir para Análise de Tratativas).
  - Mensagem deve refletir “encaminhado para análise”.

4) Sequência de execução (ordem recomendada)

1. Base de dados de fluxo/rastreabilidade:
   - `garantiasApi.ts` (metadados no registro de análise)
   - `loteRevisaoApi.ts` (encaminhamento com metadados)

2. Aprovação e criação de OS com vínculo correto:
   - `OSAnaliseGarantia.tsx`

3. Correção dos dois pontos de entrada de Nota:
   - `EstoqueNotaCadastrar.tsx`
   - `EstoqueNotaCadastrarProdutos.tsx`

4. Visibilidade de retorno no Estoque:
   - `TabelaNotasPendencias.tsx`
   - ajuste de mensagem em `EstoqueEncaminharAssistencia.tsx`

5) Riscos e cuidados

- Compatibilidade: existem outros fluxos que também usam `encaminharParaAnaliseGarantia`; a assinatura será expandida de forma opcional para não quebrar chamadas já existentes.
- Integridade de estado: manter padrão de “fresh fetch” nos pontos críticos de Assistência para não sobrescrever timeline/status.
- Evitar regressão no fluxo de produtos pendentes antigos (origem por `ProdutoPendente`), mantendo fallback atual.

6) Critérios de aceite (validação funcional)

- Ao encaminhar aparelho da Nota de Entrada:
  - Deve aparecer primeiro em `OS > Análise de Tratativas`.
  - Não deve aparecer como OS ativa antes da aprovação na análise.

- Ao aprovar a análise:
  - OS deve ser criada com origem Estoque e vínculo de rastreabilidade do item/lote.

- Ao finalizar serviço:
  - Status de item/lote deve ser atualizado.
  - A aba de notas no Estoque deve mostrar progresso/retorno da revisão (incluindo finalização quando aplicável).

- Fluxo legado:
  - Encaminhamentos de Garantia e de Produtos Pendentes continuam funcionando.

7) Teste end-to-end recomendado (roteiro)

- Roteiro 1 (nota/cadastro direto):
  1. Criar nota em `/estoque/nota/cadastrar`.
  2. Adicionar aparelho com IMEI.
  3. Marcar para assistência com motivo.
  4. Salvar.
  5. Verificar entrada em `/os/analise-garantia`.

- Roteiro 2 (aprovação e retorno):
  1. Aprovar tratativa na Análise.
  2. Abrir OS criada, finalizar serviço com resumo.
  3. Voltar em `/estoque/notas-pendencias`.
  4. Confirmar atualização de revisão/retorno na linha da nota.

- Roteiro 3 (regressão):
  - Validar um caso de origem Estoque vindo de Produto Pendente e um caso de Garantia para garantir que nada foi quebrado.
