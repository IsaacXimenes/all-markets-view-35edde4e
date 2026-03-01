

# Plano: Corrigir fluxo de movimentacoes e erros de RLS no seed

## Problemas Identificados

### 1. Erros de RLS no seed (taxas_entrega, planos_garantia, valores_recomendados_troca)
As tres tabelas possuem RLS com politica `auth.uid() IS NOT NULL`. Quando o app carrega sem usuario autenticado (tela de login), o SELECT retorna vazio por causa do RLS. O codigo interpreta como "tabela vazia" e tenta fazer INSERT (seed), que tambem falha por RLS. Os dados ja existem no banco (25 taxas, 9 planos, 68 valores), entao o seed nao deveria ser executado.

**Correcao**: Nos tres arquivos (`taxasEntregaApi.ts`, `planosGarantiaApi.ts`, `valoresRecomendadosTrocaApi.ts`), verificar se o usuario esta autenticado antes de tentar seed. Se nao autenticado, pular o seed silenciosamente e aguardar o proximo carregamento apos login.

### 2. Fluxo de movimentacoes quebrado - mapeamento DB incompleto
O `mapMovFromDB` define `produto: ''` e `imei: ''` porque a tabela `movimentacoes_estoque` nao tem essas colunas. Os campos `produto` (nome do aparelho) e `imei` precisam ser derivados do cache de produtos via `produto_id`.

**Correcao**: Apos carregar as movimentacoes, cruzar com o cache de produtos para preencher `produto` e `imei` a partir do `produto_id`.

### 3. addMovimentacao - produto_id null e responsavel_id como string
- `produto_id` e inserido como `null`, quando deveria ser o UUID do produto
- `responsavel_id` recebe o NOME do colaborador (string), mas a coluna espera UUID. Isso causa falha no INSERT

**Correcao**: 
- Buscar o produto pelo IMEI e enviar o `produto_id` correto
- Em `EstoqueMovimentacoes.tsx`, enviar o ID do colaborador (UUID) separado do nome, e armazenar o nome apenas no cache local

### 4. confirmarRecebimentoMovimentacao - mesmos problemas de referencia
A funcao busca produto por IMEI no cache, mas se o mapeamento esta vazio, nao encontra. Precisa usar `produto_id` da movimentacao para localizar.

## Arquivos a Modificar

### `src/utils/estoqueApi.ts`
- `mapMovFromDB`: Enriquecer com dados do produto (produto, imei) apos o cache ser carregado
- `initEstoqueCache`: Apos carregar produtos e movimentacoes, fazer o cruzamento de dados
- `addMovimentacao`: Receber `produtoId` e enviar para o DB; armazenar nome e IMEI no cache local
- `confirmarRecebimentoMovimentacao`: Usar `produto_id` da movimentacao ao inves de buscar por IMEI

### `src/pages/EstoqueMovimentacoes.tsx`
- `handleRegistrarMovimentacao`: Enviar o ID do produto corretamente; separar responsavel nome de responsavel ID

### `src/utils/taxasEntregaApi.ts`
- `initTaxasEntregaCache`: Verificar se ha sessao ativa antes de tentar seed

### `src/utils/planosGarantiaApi.ts`
- `initPlanosGarantiaCache`: Verificar se ha sessao ativa antes de tentar seed

### `src/utils/valoresRecomendadosTrocaApi.ts`
- `initValoresTrocaCache`: Verificar se ha sessao ativa antes de tentar seed

## Detalhes Tecnicos

### Correcao do mapeamento de movimentacoes
```text
mapMovFromDB atualmente:
  produto: ''    --> precisa cruzar com _produtos via produto_id
  imei: ''       --> precisa cruzar com _produtos via produto_id

initEstoqueCache:
  1. Carregar produtos
  2. Carregar movimentacoes
  3. Para cada movimentacao, buscar produto pelo produto_id e preencher nome + IMEI
```

### Correcao do addMovimentacao
```text
Antes:  produto_id: null, responsavel_id: mov.responsavel (NOME)
Depois: produto_id: produto.id (UUID), responsavel_id: responsavelId (UUID separado)
```

### Correcao do seed
```text
Antes de tentar seed, verificar:
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // Nao tenta seed sem autenticacao
```

