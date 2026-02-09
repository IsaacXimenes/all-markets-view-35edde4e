
# Plano: Corrigir botao Salvar desabilitado na Conferencia de Lancamento (Editar Venda)

## Problema Identificado

O botao "Salvar" na tela de Editar Venda esta desabilitado mesmo quando nao ha pendencia financeira. A causa raiz e uma inconsistencia entre as validacoes de `VendasNova.tsx` e `VendasEditar.tsx`:

- **Nova Venda**: O campo `localRetirada` NAO e obrigatorio no `canSubmit` (linha 789)
- **Editar Venda**: O campo `localRetirada` E obrigatorio no `canSubmit` (linha 556)

Quando o usuario cria uma venda sem preencher o "Local de Retirada", a venda e registrada normalmente. Porem, ao tentar editar essa venda (ex: alterar o meio de pagamento), o botao Salvar fica permanentemente desabilitado porque `localRetirada` esta vazio.

## Solucao

Alinhar a validacao de `VendasEditar.tsx` com `VendasNova.tsx`, removendo `localRetirada` como campo obrigatorio no `canSubmit`. O campo continuara disponivel para preenchimento, mas nao bloqueara o salvamento.

## Arquivo Modificado

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/VendasEditar.tsx` | Remover `localRetirada` da condicao `canSubmit` |

## Detalhe Tecnico

```text
// Antes (linha 556-566):
return (
  lojaVenda &&
  vendedor &&
  clienteId &&
  origemVenda &&
  localRetirada &&    // <-- REMOVER esta linha
  (itens.length > 0 || acessoriosVenda.length > 0) &&
  pagamentoCompleto &&
  !tradeInNaoValidado &&
  motoboyValido
);

// Depois:
return (
  lojaVenda &&
  vendedor &&
  clienteId &&
  origemVenda &&
  (itens.length > 0 || acessoriosVenda.length > 0) &&
  pagamentoCompleto &&
  !tradeInNaoValidado &&
  motoboyValido
);
```

Tambem sera necessario remover `localRetirada` do array de dependencias do `useMemo` na mesma linha 567.
