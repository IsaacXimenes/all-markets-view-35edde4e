
# Plano: Corrigir Fluxo de Recebimento da Base de Trocas

## Problemas Identificados

### 1. Item sumindo da aba "Pendências - Base de Trocas"
- A lista atual usa `getTradeInsPendentesAguardando()` que filtra apenas status `'Aguardando Devolução'`
- Quando o recebimento é confirmado, o status muda para `'Recebido'` e o item some da lista
- **Solução**: Exibir todos os trade-ins (pendentes e finalizados) na mesma aba, com distinção visual por status

### 2. Produto não aparece em "Aparelhos Pendentes"
- A função `addProdutoPendente` na `osApi.ts` verifica duplicatas por IMEI
- Se o IMEI já existe nos dados mockados, retorna o existente sem adicionar novo
- O console loga "já existe nos pendentes, retornando existente" mas a UI não reflete
- **Solução**: Verificar se a migração está criando novo ou retornando existente e notificar adequadamente

## Alterações Necessárias

### Arquivo 1: `src/utils/baseTrocasPendentesApi.ts`

| Linha | Alteração |
|-------|-----------|
| 119-121 | Criar nova função `getTradeInsPendentesRecebidos()` para filtrar status 'Recebido' |
| 115-117 | Renomear uso da função `getTradeInsPendentes()` para retornar todos (já existe) |

Adicionar função:
```typescript
export function getTradeInsPendentesRecebidos(): TradeInPendente[] {
  return tradeInsPendentes.filter(t => t.status === 'Recebido');
}
```

### Arquivo 2: `src/pages/EstoquePendenciasBaseTrocas.tsx`

| Linha | Alteração |
|-------|-----------|
| 41 | Mudar de `getTradeInsPendentesAguardando()` para `getTradeInsPendentes()` |
| 159 | Mudar de `getTradeInsPendentesAguardando()` para `getTradeInsPendentes()` |
| Tabela | Adicionar coluna "Status" com badge visual (Aguardando/Finalizado) |
| Ação | Desabilitar botão "Registrar Recebimento" para itens com status 'Recebido' |
| Imports | Adicionar import de `getTradeInsPendentes` |

Estrutura visual da tabela atualizada:
```text
| Modelo | Cliente | IMEI | Loja | SLA Devolução | Status | Ações |
|--------|---------|------|------|---------------|--------|-------|
| iPhone 12 | João | ... | Matriz | 3 dias | ⏳ Aguardando | [Receber] |
| iPhone 11 | Maria | ... | JK | - | ✅ Finalizado | [Ver] |
```

### Cards de Estatísticas
Manter os 4 cards existentes mas incluir:
- Total de aparelhos aguardando devolução
- Total de aparelhos recebidos (finalizados)

## Fluxo Corrigido

```text
1. Trade-In registrado na venda → Status: "Aguardando Devolução"
2. Usuário clica "Registrar Recebimento" → Modal com fotos
3. Confirma recebimento:
   a. Status atualizado para "Recebido" (mantém na lista com badge verde)
   b. Produto migrado para Aparelhos Pendentes (osApi)
   c. Redireciona para /estoque/produtos-pendentes
4. Item permanece visível na aba Base de Trocas como "Finalizado"
```

## Resumo das Mudanças

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| baseTrocasPendentesApi.ts | API | Adicionar função para buscar recebidos |
| EstoquePendenciasBaseTrocas.tsx | UI | Exibir todos os itens, adicionar coluna Status, desabilitar ações para finalizados |
