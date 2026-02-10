
# Plano: Corrigir fluxo Estoque > Analise de Tratativas > Produtos para Analise

## Problema

Ao encaminhar um produto pendente para a Assistencia, ele aparece simultaneamente na aba "Analise de Tratativas" E na aba "Produtos para Analise". O correto e:

1. Estoque encaminha para Assistencia --> produto aparece em **Analise de Tratativas** (pendente de recebimento)
2. Assistencia confirma recebimento em Analise de Tratativas --> produto move para **Produtos para Analise**

## Causa raiz

O `salvarParecerEstoque` define `statusGeral = 'Em Análise Assistência'`, e `getProdutosParaAnaliseOS` filtra por esse mesmo status, fazendo o produto aparecer direto em Produtos para Analise.

## Solucao

Criar um status intermediario `'Aguardando Recebimento Assistência'` que separa os dois momentos do fluxo.

---

## Alteracoes

### 1. `src/utils/osApi.ts`

- Adicionar `'Aguardando Recebimento Assistência'` ao tipo `statusGeral` da interface `ProdutoPendente`
- Na funcao `salvarParecerEstoque` (linha 474): mudar de `'Em Análise Assistência'` para `'Aguardando Recebimento Assistência'`
- Na funcao `getProdutosParaAnaliseOS` (linha 276): manter filtro apenas por `'Em Análise Assistência'` e `'Aguardando Peça'` (sem incluir o novo status)

### 2. `src/pages/OSAnaliseGarantia.tsx`

- Na funcao `handleConfirmarAprovacao` (linha 124): alem de criar a OS, atualizar o `statusGeral` do produto pendente de `'Aguardando Recebimento Assistência'` para `'Em Análise Assistência'` usando `updateProdutoPendente`
- Isso fara o produto aparecer em Produtos para Analise somente apos a confirmacao

### 3. `src/pages/EstoqueProdutosPendentes.tsx` (se necessario)

- Verificar se filtros e badges reconhecem o novo status para exibicao correta na tabela de pendentes

---

## Fluxo corrigido

```text
Estoque > Parecer "Encaminhado para Assistência"
  --> statusGeral = "Aguardando Recebimento Assistência"
  --> Produto aparece em Análise de Tratativas
  --> NÃO aparece em Produtos para Análise

Assistência > Análise de Tratativas > "Aprovar"
  --> statusGeral = "Em Análise Assistência"
  --> Produto aparece em Produtos para Análise
  --> OS criada
```

## Arquivos a editar

- `src/utils/osApi.ts` - novo status intermediario + ajuste no salvarParecerEstoque
- `src/pages/OSAnaliseGarantia.tsx` - atualizar status do produto ao aprovar
- `src/pages/EstoqueProdutosPendentes.tsx` - verificar compatibilidade com novo status (se necessario)
