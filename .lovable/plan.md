

# Corrigir Encaminhamento Individual de OS e Sincronizacao com Estoque

## Problema 1: OS Agrupada em vez de Individual

Atualmente, a funcao `encaminharLoteParaAssistencia` cria **uma unica OS** para todos os aparelhos do lote, agrupando-os em `itensLoteRevisao`. O correto e criar **uma OS separada para cada aparelho**, pois cada um tera tratativa, pecas e custos diferentes.

## Problema 2: Finalizacao nao comunica com Estoque

A logica de finalizacao em `OSAssistenciaDetalhes.tsx` tenta sincronizar via `itensLoteRevisao` (que e um array de multiplos itens dentro de uma unica OS). Com a mudanca para OS individuais, a sincronizacao precisa funcionar usando `imeiAparelho` e `loteRevisaoId` + `loteRevisaoItemId` da OS individual.

## Solucao

### 1. Arquivo: `src/utils/loteRevisaoApi.ts`

**Funcao `encaminharLoteParaAssistencia`** - Alterar para criar uma OS por aparelho:

- Em vez de uma unica `addOrdemServico` com todos os itens, iterar sobre `lote.itens` e criar uma OS para cada item
- Cada OS tera:
  - `modeloAparelho`: marca + modelo do item especifico
  - `imeiAparelho`: IMEI do item especifico
  - `loteRevisaoId`: ID do lote (para rastreabilidade)
  - `loteRevisaoItemId`: ID do item no lote
  - `origemOS`: 'Estoque'
  - **Sem** `itensLoteRevisao` (campo nao necessario quando OS e individual)
  - `descricao`: motivo da assistencia especifico do aparelho
- Armazenar todos os IDs de OS gerados em `lote.osIds`
- Vincular cada `item.osId` ao ID da sua OS individual

### 2. Arquivo: `src/pages/OSAssistenciaDetalhes.tsx`

**Finalizacao de servico** - Corrigir sincronizacao com estoque para OS individuais:

- Quando a OS tem `loteRevisaoId` e `loteRevisaoItemId` (OS individual de lote):
  - Chamar `marcarProdutoRetornoAssistencia(imeiAparelho)` para marcar o produto como retornado
  - Chamar `atualizarItemRevisao(loteRevisaoId, loteRevisaoItemId, ...)` para atualizar custo e status do item no lote
  - Verificar se **todos** os itens do lote estao concluidos; se sim, chamar `finalizarLoteComLogisticaReversa`
- Chamar `atualizarStatusProdutoPendente` usando o IMEI da OS individual

### 3. Arquivo: `src/pages/OSAssistenciaEditar.tsx`

- Manter o banner informativo do lote de revisao
- Remover referencia a `itensLoteRevisao` (que nao existira mais em OS individuais)
- Os campos de modelo, IMEI e descricao ja estarao preenchidos individualmente

### 4. Arquivo: `src/utils/assistenciaApi.ts`

- Garantir que o campo `loteRevisaoItemId` esteja na interface `OrdemServico`

## Detalhes tecnicos

### Fluxo corrigido

```text
Nota de Entrada (3 aparelhos defeituosos)
  |
  v
Lote de Revisao REV-NOTA-XXXXX
  |
  +-- OS-001 (iPhone 14, IMEI 350...) -> Tratativa individual
  +-- OS-002 (Galaxy S23, IMEI 350...) -> Tratativa individual
  +-- OS-003 (iPhone 15 Pro, IMEI 350...) -> Tratativa individual
  |
  v (ao finalizar cada OS)
  Sincroniza item no lote + marca retorno no estoque
  |
  v (quando todas finalizadas)
  Lote finalizado automaticamente
```

### Arquivos a modificar
- `src/utils/loteRevisaoApi.ts` — criar OS individual por item
- `src/utils/assistenciaApi.ts` — campo `loteRevisaoItemId` na interface
- `src/pages/OSAssistenciaDetalhes.tsx` — sincronizacao na finalizacao para OS individual
- `src/pages/OSAssistenciaEditar.tsx` — remover UI de `itensLoteRevisao` agrupados
- `src/pages/EstoqueEncaminharAssistencia.tsx` — nenhuma mudanca necessaria (ja funciona corretamente)

