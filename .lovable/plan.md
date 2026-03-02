

# Plano: Corrigir falha ao cadastrar lote de Consignacao

## Causa raiz

As tabelas no Supabase usam colunas `id` do tipo `uuid`, mas o codigo gera IDs textuais como `CONS-001` e `CONS-ITEM-001`. Ao fazer o `upsert`, o Postgres rejeita o valor por incompatibilidade de tipo. O mesmo ocorre com `pecas.lote_consignacao_id` que e `uuid` mas recebe a string `CONS-XXX`.

## Solucao

Adicionar colunas `codigo` (text) nas tabelas para manter os IDs legiveis, e usar UUIDs reais para as chaves primarias.

### 1. Migracao SQL

```sql
-- Adicionar coluna codigo nas tabelas
ALTER TABLE lotes_consignacao ADD COLUMN IF NOT EXISTS codigo text;
ALTER TABLE itens_consignacao ADD COLUMN IF NOT EXISTS codigo text;

-- Alterar lote_consignacao_id em pecas para text (aceitar CONS-XXX)
ALTER TABLE pecas ALTER COLUMN lote_consignacao_id TYPE text;
```

### 2. Alteracoes em `src/utils/consignacaoApi.ts`

**Gerar UUIDs reais para o banco + manter codigo legivel:**

Na funcao `criarLoteConsignacao` (linha 190):
- Gerar `id` com `crypto.randomUUID()` para o lote
- Manter o `CONS-XXX` como campo `codigo` no objeto e na coluna do banco
- Fazer o mesmo para itens: UUID real no `id`, `CONS-ITEM-XXX` no `codigo`

**Atualizar `loteToDb`** (linha 99): incluir `codigo` no mapeamento.

**Atualizar `itemToDb`** (linha 109): incluir `codigo` no mapeamento.

**Atualizar `mapLoteFromDb`** (linha 88): ler `codigo` do banco e usar como campo de exibicao.

**Atualizar `mapItemFromDb`** (linha 71): ler `codigo` do banco.

**Atualizar interfaces** `LoteConsignacao` e `ItemConsignacao`: adicionar campo `codigo` opcional.

**Ajustar `nextLoteId` e `nextItemId`**: o calculo do proximo sequencial deve buscar pelo campo `codigo` em vez de `id`.

### 3. Alteracoes em `src/pages/OSConsignacao.tsx`

Onde o codigo exibe `lote.id` como identificador visivel (tabela de lotes, toast, timeline), substituir por `lote.codigo || lote.id` para manter a exibicao legivel.

## Resumo

| Recurso | Alteracao |
|---------|----------|
| Migracao SQL | Adicionar `codigo` em lotes_consignacao e itens_consignacao; alterar tipo de pecas.lote_consignacao_id |
| `src/utils/consignacaoApi.ts` | Usar UUID real no id, CONS-XXX no codigo; atualizar mappings e interfaces |
| `src/pages/OSConsignacao.tsx` | Exibir `codigo` em vez de `id` nos pontos de exibicao |

