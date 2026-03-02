
# Fluxos comprometidos apos migracao para Supabase

## Problemas Identificados

### 1. Movimentacoes de Pecas — dados perdidos ao recarregar (CRITICO)
**Arquivo:** `src/pages/OSMovimentacaoPecas.tsx` (linha 42)
`let movimentacoesPecas: MovimentacaoPeca[] = []` — variavel de modulo efemera. Ao recarregar a pagina, todas as movimentacoes de pecas desaparecem.

### 2. Movimentacoes de Acessorios — dados perdidos ao recarregar (CRITICO)
**Arquivo:** `src/pages/EstoqueMovimentacoesAcessorios.tsx` (linha 37)
`let movimentacoesData: MovimentacaoAcessorio[] = []` — mesmo problema. Movimentacoes de acessorios entre lojas nao persistem.

### 3. `updateProdutoLoja` nao atualiza `lojaAtualId` (BUG)
**Arquivo:** `src/utils/estoqueApi.ts` (linha 529)
`await updateProduto(id, { loja: novaLoja })` — falta `lojaAtualId: novaLoja`. O produto aparece na loja antiga nos filtros de disponibilidade.

### 4. Timeline de movimentacao exibe UUIDs de loja (BUG)
**Arquivo:** `src/utils/estoqueApi.ts` (linha 620)
`descricao: Aparelho recebido... Origem: ${mov.origem} -> Destino: ${mov.destino}` — `mov.origem` e `mov.destino` sao UUIDs. Deveria exibir nomes legiveis.

---

## Plano de Correcao

### Etapa 1: Criar tabelas no Supabase (migracao SQL)

Duas tabelas novas:

**`movimentacoes_pecas_estoque`** — id, peca_id, descricao_peca, modelo, quantidade, origem (text), destino (text), responsavel (text), motivo (text), data (date), status (text default 'Pendente'), data_recebimento (timestamptz), responsavel_recebimento (text), created_at

**`movimentacoes_acessorios_estoque`** — id, acessorio_id, nome_acessorio (text), quantidade (int), origem (text), destino (text), responsavel (text), motivo (text), data (date), status (text default 'Pendente'), data_recebimento (timestamptz), responsavel_recebimento (text), created_at

Ambas com RLS habilitado e politicas permissivas para usuarios autenticados.

### Etapa 2: Persistir Movimentacoes de Pecas
**Arquivo:** `src/pages/OSMovimentacaoPecas.tsx`
- Remover `let movimentacoesPecas` e `let movPecaCounter`
- Adicionar `useEffect` que carrega movimentacoes do banco na montagem
- `handleRegistrar`: inserir no Supabase via `supabase.from('movimentacoes_pecas_estoque').insert()`
- `handleConfirmarRecebimento`: atualizar status no banco via `.update()`
- `handleSalvarEdicao`: atualizar destino/motivo no banco
- Gerar `codigoLegivel` no formato `MOV-PEC-XXXX` baseado na contagem carregada

### Etapa 3: Persistir Movimentacoes de Acessorios
**Arquivo:** `src/pages/EstoqueMovimentacoesAcessorios.tsx`
- Remover `let movimentacoesData`
- Adicionar `useEffect` que carrega do banco
- `handleRegistrarMovimentacao`: inserir no Supabase
- `handleConfirmarRecebimento`: atualizar status no banco
- `handleSalvarEdicao`: atualizar no banco
- ID ja usa `MOV-ACESS-{timestamp}`, manter

### Etapa 4: Corrigir `updateProdutoLoja`
**Arquivo:** `src/utils/estoqueApi.ts` (linha 529)
Trocar:
```
await updateProduto(id, { loja: novaLoja });
```
Por:
```
await updateProduto(id, { loja: novaLoja, lojaAtualId: novaLoja });
```

### Etapa 5: Corrigir UUIDs na timeline
**Arquivo:** `src/utils/estoqueApi.ts` (linha 620)
Resolver nomes das lojas antes de gravar na timeline:
```
const nomeOrigem = useCadastroStore.getState().obterNomeLoja(mov.origem);
const nomeDestino = useCadastroStore.getState().obterNomeLoja(mov.destino);
descricao: `Aparelho recebido na loja de destino. Origem: ${nomeOrigem} -> Destino: ${nomeDestino}.`
```

## Arquivos Modificados
- Migracao SQL — 2 tabelas novas + RLS
- `src/pages/OSMovimentacaoPecas.tsx` — persistencia Supabase
- `src/pages/EstoqueMovimentacoesAcessorios.tsx` — persistencia Supabase
- `src/utils/estoqueApi.ts` — bugs updateProdutoLoja e timeline
