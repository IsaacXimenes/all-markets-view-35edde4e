

# Plano: Corrigir botao "Salvar" na movimentacao de aparelhos

## Problema

A funcao `handleRegistrarMovimentacao` em `EstoqueMovimentacoes.tsx` (linha 220) chama `await addMovimentacao(...)` sem `try-catch`. Se o INSERT no banco falhar (por ex: erro de RLS, sessao expirada, ou qualquer outro motivo), a excecao e silenciada e o usuario nao recebe nenhum feedback — o dialogo simplesmente nao fecha e nada acontece.

## Causa Raiz

O `addMovimentacao` em `estoqueApi.ts` (linha 568) faz `if (error) throw error;` — ou seja, lanca excecao em caso de falha. Mas a chamada no componente nao captura essa excecao.

## Correcao

### `src/pages/EstoqueMovimentacoes.tsx`
- Envolver a chamada `addMovimentacao` em um bloco `try-catch`
- No `catch`, exibir toast com a mensagem de erro para o usuario ter visibilidade do problema
- Logar o erro no console para depuracao

### Codigo da correcao (linhas 268-296)

```text
Antes:
  const novaMovimentacao = await addMovimentacao({...});
  setMovimentacoes([...]);
  setDialogOpen(false);
  ...
  toast({ title: 'Movimentacao registrada', ... });

Depois:
  try {
    const novaMovimentacao = await addMovimentacao({...});
    setMovimentacoes([...]);
    setDialogOpen(false);
    ...
    toast({ title: 'Movimentacao registrada', ... });
  } catch (err: any) {
    console.error('[MOV] Erro ao registrar movimentacao:', err);
    toast({
      title: 'Erro ao registrar movimentacao',
      description: err?.message || 'Verifique se voce esta logado e tente novamente',
      variant: 'destructive',
    });
  }
```

## Arquivo modificado
- `src/pages/EstoqueMovimentacoes.tsx` — adicionar try-catch no handleRegistrarMovimentacao

