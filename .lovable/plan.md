

# Corrigir movimentacao de aparelhos: status e loja

## Problemas Identificados

### 1. Produto nao fica "Em movimentacao"
Na funcao `addMovimentacao` (linha 591-593), o codigo chama `updateProduto` com `statusMovimentacao: 'Em movimentação'`, mas o `produtoId` depende de `mov.produtoId` ser passado corretamente. O componente passa `produtoSelecionado.id` (linha 278), que deve ser um UUID valido. O problema pode estar na RLS impedindo o UPDATE silenciosamente, ou no cache nao sendo atualizado na UI.

### 2. Confirmacao de recebimento nao altera a loja (BUG PRINCIPAL)
Na funcao `confirmarRecebimentoMovimentacao` (linha 620), o codigo atualiza apenas `loja: mov.destino`, mas **NAO atualiza `lojaAtualId`**. Como o sistema usa `lojaAtualId` como localizacao fisica prioritaria (conforme arquitetura), o produto continua aparecendo na loja de origem.

## Correcoes

### Arquivo: `src/utils/estoqueApi.ts`

**1. `addMovimentacao` (linha 591-593):** Adicionar log de erro caso `updateProduto` falhe, e garantir que o cache local tambem atualiza o produto:

```typescript
if (produtoId) {
  const prodAtualizado = await updateProduto(produtoId, { 
    statusMovimentacao: 'Em movimentação', 
    movimentacaoId: data.id 
  });
  if (!prodAtualizado) {
    console.error('[MOV] Falha ao marcar produto como Em movimentação:', produtoId);
  }
}
```

**2. `confirmarRecebimentoMovimentacao` (linha 620):** Atualizar TAMBEM o campo `lojaAtualId` para o destino da movimentacao, garantindo que a localizacao fisica efetiva seja alterada:

Trocar:
```typescript
await updateProduto(produto.id, { 
  loja: mov.destino, 
  statusMovimentacao: null, 
  movimentacaoId: undefined, 
  timeline 
});
```

Por:
```typescript
await updateProduto(produto.id, { 
  loja: mov.destino, 
  lojaAtualId: mov.destino, 
  statusMovimentacao: null, 
  movimentacaoId: undefined, 
  timeline 
});
```

Isso faz com que tanto `loja` (campo base) quanto `lojaAtualId` (localizacao fisica efetiva) apontem para a loja de destino ao confirmar o recebimento.

## Resumo das alteracoes
- **1 arquivo:** `src/utils/estoqueApi.ts`
- **2 pontos:** `addMovimentacao` (log de falha) e `confirmarRecebimentoMovimentacao` (incluir `lojaAtualId` no update)

