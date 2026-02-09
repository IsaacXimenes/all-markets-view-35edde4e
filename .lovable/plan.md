

# Plano: Persistir e Exibir Anexos de Recebimento nos Detalhes

## Problema

Quando o usuario clica em "Ver Detalhes" de um trade-in ja finalizado, o modal abre mas as fotos de recebimento nao aparecem. Isso ocorre porque o `handleAbrirRecebimento` (linha 89) sempre reseta `fotosRecebimento` para um array vazio `[]`, e o modal exibe apenas esse estado local — nunca consulta os dados ja salvos no objeto `tradeIn.fotosRecebimento`.

Os dados estao corretamente armazenados na API (a funcao `registrarRecebimento` persiste as fotos no objeto). O problema e exclusivamente na interface.

## Correcao

### Arquivo: `src/pages/EstoquePendenciasBaseTrocas.tsx`

**1. Alterar `handleAbrirRecebimento`** (linhas 87-92):
- Se o trade-in ja estiver com status "Recebido", pre-carregar `fotosRecebimento` com os dados salvos (`tradeIn.fotosRecebimento`) e `observacoesRecebimento` com o texto salvo.
- Se estiver "Aguardando Devolucao", manter o comportamento atual (arrays vazios).

**2. Alterar o modal para modo leitura quando finalizado:**
- Quando o status for "Recebido", esconder o botao de upload e o botao "Confirmar Recebimento".
- Exibir as fotos de recebimento salvas em modo somente leitura (sem botao de remover).
- Exibir as observacoes como texto estatico em vez de textarea editavel.
- Exibir informacoes adicionais: data do recebimento, responsavel, e SLA congelado.
- Alterar o titulo do modal para "Detalhes do Recebimento".

## Resumo das Alteracoes

- 1 arquivo modificado: `EstoquePendenciasBaseTrocas.tsx`
- Logica: carregar dados persistidos ao abrir detalhes
- UI: modo leitura para itens finalizados vs modo edicao para itens aguardando

