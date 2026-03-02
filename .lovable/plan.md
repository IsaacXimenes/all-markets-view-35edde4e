
# Correcao: Movimentacao Confirmada sem Atualizar Loja do Produto

## Diagnostico

Identifiquei **duas causas** para o problema:

### Causa 1 — Dados desatualizados da movimentacao anterior a migracao

A movimentacao `58847d48` foi criada e confirmada em **01/03/2026**, um dia ANTES da migracao que criou os RPCs atomicos (`transferir_estoque` e `confirmar_recebimento_movimentacao`). O codigo antigo de confirmacao:
- Atualizou `tipo_movimentacao` para `Recebido` no banco
- Atualizou `loja_id` do produto para o destino (Matriz)
- Persistiu apenas a `timeline` no banco
- **NAO atualizou** `loja_atual_id` nem limpou `movimentacao_id` — esses campos ficaram com os valores antigos (SIA)

Estado atual no banco:
- `loja_id` = Matriz (correto)
- `loja_atual_id` = SIA (errado — deveria ser Matriz)
- `movimentacao_id` = ainda preenchido (deveria ser NULL)

Como a interface usa `loja_atual_id` como referencia de localizacao fisica, o produto aparece no SIA em vez da Matriz.

### Causa 2 — Chamada sem `await` em EstoqueMovimentacoes.tsx

Na linha 146 de `EstoqueMovimentacoes.tsx`, a funcao `confirmarRecebimentoMovimentacao` (que e `async`) e chamada **sem `await`**:

```text
const result = confirmarRecebimentoMovimentacao(movimentacaoParaConfirmar, nomeResponsavel);
```

Como `result` e uma Promise (sempre truthy), o toast de sucesso aparece imediatamente, mas a execucao real do RPC pode falhar silenciosamente. Isso pode causar o mesmo problema em movimentacoes futuras.

---

## Plano de Correcao

### Correcao 1: Ajustar dados inconsistentes no banco (SQL)

Criar uma query de correcao que sincronize `loja_atual_id` e limpe `movimentacao_id` para todos os produtos com movimentacoes ja confirmadas (Recebido) mas com dados desatualizados:

```text
UPDATE produtos p
SET loja_atual_id = me.loja_destino_id,
    movimentacao_id = NULL
FROM movimentacoes_estoque me
WHERE me.id = p.movimentacao_id
  AND me.tipo_movimentacao = 'Recebido'
  AND (p.loja_atual_id != me.loja_destino_id OR p.movimentacao_id IS NOT NULL);
```

Isso corrige o iPhone 17 PRO MAX 256GB (e qualquer outro produto que tenha o mesmo problema).

### Correcao 2: Adicionar `await` na confirmacao (EstoqueMovimentacoes.tsx)

Tornar `handleConfirmarRecebimento` uma funcao `async` e adicionar `await` na chamada:

```text
const result = await confirmarRecebimentoMovimentacao(movimentacaoParaConfirmar, nomeResponsavel);
```

Isso garante que erros do RPC sejam capturados e o toast de erro seja exibido caso a operacao falhe.

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/` | Query de correcao para sincronizar produtos desatualizados |
| `src/pages/EstoqueMovimentacoes.tsx` | Adicionar `await` na chamada de `confirmarRecebimentoMovimentacao` |
