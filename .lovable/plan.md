
Objetivo validado com base no código atual: corrigir o fluxo de assistência para que (1) item “Novo” não possa ser marcado como defeito/encaminhado para assistência e (2) retorno técnico (status, custo, parecer, timeline e abatimento) sincronize corretamente na Nota de Entrada, inclusive para casos já lançados que ficaram inconsistentes.

## Diagnóstico (causa-raiz)

1. Regra “Novo não vai para defeito” está incompleta
- Na Central de Decisão (`src/pages/EstoqueNotaConferencia.tsx`), o botão “Defeito” está habilitado para qualquer produto.
- No encaminhamento pós-cadastro (`src/components/estoque/NotaDetalhesContent.tsx`), os elegíveis incluem todo “Aparelho com IMEI”, sem excluir categoria `Novo`.

2. Nota não atualiza após tratativa da assistência
- A sincronização no fechamento da OS (`src/pages/OSAssistenciaDetalhes.tsx`) depende de `osFresh.loteRevisaoId` e `osFresh.loteRevisaoItemId`.
- A OS criada na Análise de Tratativas (`src/pages/OSAnaliseGarantia.tsx`) não está persistindo esses campos no `addOrdemServico(...)`.
- Resultado: item do lote fica em “Em Andamento”, sem custo em `loteRevisao`, e `sincronizarNotaComLote(...)` não é executado como esperado.

3. Timeline da nota não recebe eventos do ciclo técnico
- Existem eventos na timeline da OS, mas a timeline da Nota não recebe de forma confiável: “técnico assumiu”, “finalizou”, “parecer técnico”, “retorno para nota”, “abatimento”.
- Como a vinculação do lote/OS falha, os eventos financeiros e de retorno da nota também não entram.

## Plano de implementação

### 1) Bloquear defeito/assistência para categoria Novo

Arquivos:
- `src/pages/EstoqueNotaConferencia.tsx`
- `src/components/estoque/NotaDetalhesContent.tsx`

Ajustes:
- Central de Decisão:
  - Desabilitar botão “Defeito” quando `produto.categoria === 'Novo'`.
  - Adicionar tooltip/mensagem clara: “Produto Novo não pode ser reportado como defeito”.
  - Blindagem na lógica: em `handleAtribuirCaminho(...)`, impedir programaticamente caminho amarelo para “Novo” (não só via UI).
  - Validação final em `handleFinalizarTriagem(...)` para recusar triagem inválida (caso manipulação de estado).
- Encaminhamento na tela de detalhes da nota:
  - Ajustar `produtosElegiveis` para excluir categoria `Novo`.
  - Manter regra mínima: apenas `Aparelho + IMEI + não encaminhado + categoria permitida`.

### 2) Corrigir vínculo OS ↔ Lote no momento da aprovação da análise

Arquivo:
- `src/pages/OSAnaliseGarantia.tsx`

Ajustes:
- Ao criar OS via `addOrdemServico(...)`, incluir campos:
  - `loteRevisaoId: registroAprovado.metadata?.loteRevisaoId`
  - `loteRevisaoItemId: registroAprovado.metadata?.loteRevisaoItemId`
- Persistir também o vínculo item→OS no lote (já existe parcial), garantindo consistência:
  - `atualizarItemRevisao(loteId, itemId, { osId: novaOS.id, statusReparo: 'Em Andamento' })`
- Garantir que descrição/observação mantenham contexto da nota e motivo, para rastreabilidade.

### 3) Garantir sincronização robusta na finalização técnica

Arquivo:
- `src/pages/OSAssistenciaDetalhes.tsx`

Ajustes:
- No fluxo de finalização (`handleConfirmarFinalizacao`):
  - Manter `fresh fetch` (`getOrdemServicoById`) antes de salvar.
  - Com vínculo de lote válido, atualizar item:
    - `statusReparo: 'Concluido'`
    - `custoReparo: valorCustoTecnico`
  - Executar `sincronizarNotaComLote(...)`.
  - Se todos itens concluídos, finalizar lote (`finalizarLoteComLogisticaReversa`), preservando comportamento atual.
- Incluir evento explícito para retorno da assistência com parecer técnico no momento da finalização (detalhes do resumo e custo) para refletir no histórico da nota.

### 4) Reconciliar dados já inconsistentes (casos em produção/mock já lançados)

Arquivo:
- `src/utils/loteRevisaoApi.ts`

Ajustes:
- Criar função de reconciliação (ex.: `reconciliarLoteComOS(loteId, responsavel)`):
  - Para cada item com `osId`, buscar OS atual.
  - Se OS estiver em estado concluído/validar/liquidado e item ainda “Em Andamento/Pendente”, promover para `Concluido` e copiar `valorCustoTecnico`.
  - Chamar `sincronizarNotaComLote(...)` após reconciliação.
- Resultado: corrige nota já “travada” em status/custo sem depender de nova interação técnica.

Arquivo complementar:
- `src/components/estoque/NotaDetalhesContent.tsx`
- Disparar reconciliação ao abrir detalhes da nota (efeito controlado), para autocorreção de registros antigos como o seu cenário atual.

### 5) Timeline da Nota com eventos técnicos essenciais

Arquivos:
- `src/utils/loteRevisaoApi.ts`
- `src/pages/OSAssistenciaDetalhes.tsx`
- (se necessário) `src/pages/OSAparelhosPendentes.tsx`

Ajustes:
- Registrar na timeline da nota, no mínimo:
  - início/assunção técnica (quando status entra em “Em serviço”, quando aplicável),
  - finalização técnica com parecer e custo,
  - retorno para validação de estoque,
  - abatimento aplicado (já existe parcial em `sincronizarNotaComLote`, será reforçado).
- Para evitar duplicidade, usar marcador textual consistente nos `detalhes` (ex.: `OS:<id>|EVENTO:<tipo>|DATA:<iso>`), e checar antes de inserir.

## Sequência de execução recomendada

1. Regras de bloqueio “Novo” (Conferência + Detalhes da Nota).
2. Correção de vínculo lote/metadados na criação da OS em Análise.
3. Reforço da sincronização no fechamento da OS.
4. Implementação de reconciliação retroativa.
5. Ajustes de timeline da nota e validações anti-duplicidade.
6. Validação manual ponta a ponta com os mesmos passos reportados.

## Critérios de aceite

1. Botão de defeito/encaminhamento
- Produto categoria `Novo` nunca pode ser marcado como defeito nem entrar em assistência.
- Produto `Seminovo` continua permitido.

2. Atualização da Nota após assistência
- Ao finalizar OS de item vindo de nota:
  - status do item no quadro “Assistência Técnica” da nota muda de “Em Andamento” para “Concluído” (ou correspondente),
  - coluna “Custo Reparo” é preenchida,
  - coluna “Parecer” mostra resumo técnico.

3. Abatimento financeiro
- `valorAbatimento` e `valorPendente` da nota atualizados conforme custo concluído do lote (respeitando regra de tipo de pagamento).

4. Timeline
- Nota registra eventos técnicos e financeiros do ciclo de assistência (assunção/finalização/retorno/abatimento) sem duplicações.

5. Reprocessamento de casos já inconsistentes
- Ao abrir uma nota com vínculo antigo inconsistente, o sistema reconcilia e exibe status/custos corretos.

## Validação E2E (obrigatória)

- Fluxo 1 (regra Novo):
  1) Conferir uma nota com item `Novo`.
  2) Verificar que “Defeito” está desabilitado e não selecionável.
- Fluxo 2 (seu cenário reportado):
  1) Encaminhar item `Seminovo` para assistência.
  2) Aprovar na Análise de Tratativas e gerar OS.
  3) Registrar custo/parecer, finalizar serviço.
  4) Confirmar na nota: status atualizado, custo exibido, parecer exibido, timeline preenchida, abatimento aplicado.
- Fluxo 3 (retroativo):
  1) Abrir nota já existente com item “Em andamento” indevido.
  2) Confirmar autocorreção via reconciliação ao carregar os detalhes.
