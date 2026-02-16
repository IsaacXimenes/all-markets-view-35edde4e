

## Correção: Preservar Parecer Estoque no Ciclo Estoque-Assistência

### Problema

Atualmente, quando um produto retorna da Assistência para os Produtos Pendentes (seja por validação ou recusa), o campo `parecerEstoque` é limpo (`undefined`) na linha 559 do arquivo `osApi.ts`. Isso causa perda das informações do quadro de Parecer Estoque e impede o rastreamento do histórico quando há ciclos de ida e volta entre Estoque e Assistência.

### Correção

**Arquivo: `src/utils/osApi.ts` (linha 558-559)**

Remover a linha que limpa o `parecerEstoque`:

```
// ANTES:
produto.parecerEstoque = undefined;

// DEPOIS:
// parecerEstoque preservado - não limpar para manter histórico do ciclo
```

O parecer original do Estoque permanece visível no quadro, e todas as devoluções/reenvios ficam registradas apenas na timeline, como o usuário solicitou.

**Arquivo: `src/pages/EstoqueProdutoPendenteDetalhes.tsx` (linhas 364-388)**

Ajustar a lógica do formulário de parecer para que, quando o produto retornar da Assistência (`statusGeral === 'Retornado da Assistência'`), o quadro exiba o parecer existente em modo somente leitura (como já faz) e adicione abaixo um botão ou formulário separado para o novo parecer de deferimento. Atualmente, a condição `!produto.parecerEstoque` controla se mostra o formulário ou o parecer preenchido - como o parecer não será mais limpo, precisamos permitir novo parecer quando o status for "Retornado da Assistência" mesmo com parecer existente.

A solução é: quando `statusGeral === 'Retornado da Assistência'`, exibir o parecer original como histórico e mostrar o formulário de deferimento abaixo dele, permitindo que o estoquista registre o novo parecer de deferimento sem perder o original.

### Resumo de Arquivos

| Arquivo | Alteração |
|---|---|
| `src/utils/osApi.ts` | Remover `produto.parecerEstoque = undefined` (linha 559) |
| `src/pages/EstoqueProdutoPendenteDetalhes.tsx` | Quando "Retornado da Assistência", mostrar parecer existente + formulário de deferimento |

