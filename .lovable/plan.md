
# Corrigir campo "Responsavel" nas movimentacoes para exibir nome

## Problema

Na funcao `mapMovFromDB` em `estoqueApi.ts` (linha 357), o campo `responsavel` recebe diretamente o `responsavel_id` (UUID) do banco:
```
responsavel: row.responsavel_id || '',
```
Isso faz com que a tabela de movimentacoes exiba o UUID em vez do nome do colaborador.

## Correcao

### `src/utils/estoqueApi.ts`

**1. No `initEstoqueCache` (linhas 380-392):** Apos carregar as movimentacoes e enriquecer com dados do produto, tambem resolver o `responsavel_id` para o nome do colaborador. Importar `getColaboradores` do `cadastroStore` ou do `cadastrosApi` para fazer o lookup.

Como o cache de colaboradores pode ja estar carregado via `cadastrosApi`, usar `getColaboradores()` para buscar a lista e resolver o nome:

```typescript
// Dentro do bloco de enriquecimento das movimentacoes (linha 382-391)
_movimentacoes = rawMovs.map(mov => {
  const row = (movRes.data || []).find((r: any) => r.id === mov.id);
  const produtoId = row?.produto_id;
  const responsavelId = row?.responsavel_id;
  let produto = mov.produto;
  let imei = mov.imei;
  let responsavel = mov.responsavel;

  if (produtoId) {
    const prod = _produtos.find(p => p.id === produtoId);
    if (prod) { produto = `${prod.marca} ${prod.modelo}`; imei = prod.imei; }
  }

  if (responsavelId) {
    const cols = getColaboradores();
    const col = cols.find(c => c.id === responsavelId);
    if (col) responsavel = col.nome;
  }

  return { ...mov, produto, imei, responsavel };
});
```

**2. No `mapMovFromDB` (linha 357):** Manter `responsavel: row.responsavel_id || ''` como fallback — o enriquecimento no `initEstoqueCache` sobreescreve com o nome.

Isso garante que tanto movimentacoes carregadas do banco quanto novas movimentacoes (que ja passam o nome na linha 276 do componente) exibam o nome do responsavel.

## Arquivo modificado
- `src/utils/estoqueApi.ts` — resolver responsavel_id para nome no carregamento do cache
