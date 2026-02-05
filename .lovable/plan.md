
# Plano: Correção da Exibição de Loja após Movimentação Matriz

## Problema Identificado

Quando o usuário registra uma **Movimentação Matriz** (Estoque - SIA → Loja - Matriz), na aba de Aparelhos:
1. A coluna **Loja** ainda mostra "Estoque - SIA" em vez de "Loja - Matriz"
2. Aparece o badge **"Em movimentação"** (que não deveria aparecer para movimentações matriz)

## Análise Técnica

### Comportamento Atual

A função `criarMovimentacaoMatriz` já está correta:
- Define `produto.lojaAtualId = dados.lojaDestinoId` (Loja - Matriz)
- **NÃO** define `statusMovimentacao = 'Em movimentação'` (linha com comentário "REMOVIDO")

A tela `EstoqueProdutos.tsx` já usa a lógica correta:
- Linha 66: `const lojaEfetiva = p.lojaAtualId || p.loja;`
- Linha 385: `getLojaNome(produto.lojaAtualId || produto.loja)`

### Causa Provável

O problema pode estar relacionado a:
1. **Badge "Em movimentação"** aparecendo porque o produto tinha esse status definido de outra origem (movimentações de aparelhos comuns que usam os mesmos IMEIs)
2. **Filtro de loja** não considerando corretamente `lojaAtualId` em todos os lugares
3. **Dados mockados antigos** que podem ter `statusMovimentacao` definido

---

## 1. Remover Badge "Em movimentação" para Produtos em Movimentação Matriz

Atualmente, o badge aparece se `statusMovimentacao === 'Em movimentação'`, independente do tipo de movimentação. Para movimentações matriz, o produto **NÃO** deve mostrar esse badge (já que está disponível para venda na loja destino).

### Alteração em EstoqueProdutos.tsx (linha 355-360):

```typescript
// ANTES: Badge aparece para qualquer statusMovimentacao
{produto.statusMovimentacao === 'Em movimentação' && (
  <Badge>Em movimentação</Badge>
)}

// DEPOIS: Badge NÃO aparece se produto tem lojaAtualId (movimentação matriz)
{produto.statusMovimentacao === 'Em movimentação' && !produto.lojaAtualId && (
  <Badge>Em movimentação</Badge>
)}
```

**Lógica**: Se o produto tem `lojaAtualId` definido, significa que foi transferido via Movimentação Matriz e está disponível para venda - não deve mostrar "Em movimentação".

---

## 2. Garantir Limpeza de statusMovimentacao na Movimentação Matriz

Para evitar conflitos, a função `criarMovimentacaoMatriz` deve garantir que `statusMovimentacao` seja limpo:

### Alteração em estoqueApi.ts (função criarMovimentacaoMatriz):

```typescript
dados.itens.forEach(item => {
  const produto = produtos.find(p => p.id === item.aparelhoId);
  if (produto) {
    produto.lojaAtualId = dados.lojaDestinoId; // Loja - Matriz
    produto.movimentacaoId = novaMovimentacao.id;
    // Garantir que não tenha status de movimentação comum
    produto.statusMovimentacao = null; // Limpar qualquer status anterior
    // ... resto do código
  }
});
```

---

## 3. Verificar Filtro de Loja no getProdutosDisponivelMatriz

A função já está correta, mas vamos garantir que não retorne produtos que já foram transferidos:

### Validação (já existente):

```typescript
export const getProdutosDisponivelMatriz = (): Produto[] => {
  return produtos.filter(p => 
    p.loja === ESTOQUE_SIA_ID && 
    !p.lojaAtualId &&  // ✅ Exclui produtos já transferidos
    !p.statusMovimentacao &&
    !p.bloqueadoEmVendaId &&
    p.statusNota === 'Concluído'
  );
};
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EstoqueProdutos.tsx` | Não mostrar badge "Em movimentação" se produto tem `lojaAtualId` |
| `src/utils/estoqueApi.ts` | Limpar `statusMovimentacao` na função `criarMovimentacaoMatriz` |

---

## Resultado Esperado

Após as correções:

1. **Ao registrar Movimentação Matriz**:
   - Produto aparece imediatamente como "Loja - Matriz" na aba de Aparelhos
   - Produto **NÃO** mostra badge "Em movimentação"
   - Produto fica disponível para venda na Loja - Matriz

2. **Movimentações de Aparelhos Comuns**:
   - Continuam funcionando normalmente
   - Badge "Em movimentação" aparece apenas para essas movimentações
   - Produto bloqueado para venda até receber na loja destino
