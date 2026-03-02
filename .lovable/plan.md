

# Plano: Corrigir Modal de Acessorios na Nova Venda

## Problemas identificados

1. **ID gigante (UUID)**: Na tabela do modal de acessorios (linha 3566), o campo exibe `acessorio.id` que e o UUID do Supabase. Deve exibir `acessorio.codigo` (padrao AC-XXX) ou, se nao houver codigo, mostrar o ID truncado.

2. **Sem filtro por loja**: O filtro de acessorios (linhas 657-663) nao restringe pela loja da venda. A pagina `VendasAcessorios.tsx` ja implementa o padrao correto usando `getLojasPorPoolEstoque`.

## Alteracoes

### Arquivo: `src/pages/VendasNova.tsx`

**1. Filtrar acessorios por loja (linhas 657-663)**

Atualizar o `acessoriosFiltrados` para incluir o filtro por pool de estoque, seguindo o mesmo padrao de `VendasAcessorios.tsx`:

```ts
const acessoriosFiltrados = useMemo(() => {
  const lojasPool = lojaVenda ? getLojasPorPoolEstoque(lojaVenda) : [];
  return acessoriosEstoque.filter(a => {
    if (a.quantidade <= 0) return false;
    if (lojaVenda && !lojasPool.includes(a.loja)) return false;
    if (buscaAcessorio && !a.descricao.toLowerCase().includes(buscaAcessorio.toLowerCase())) return false;
    return true;
  });
}, [acessoriosEstoque, buscaAcessorio, lojaVenda]);
```

**2. Substituir UUID pelo codigo legivel (linha 3566)**

Trocar `{acessorio.id}` por `{acessorio.codigo || acessorio.id.slice(0, 8)}` para exibir o codigo padronizado AC-XXX ou, na ausencia, os primeiros 8 caracteres do UUID.

## Resumo

| Arquivo | Alteracao |
|---------|----------|
| `src/pages/VendasNova.tsx` | Filtrar acessorios pelo pool de estoque da loja + exibir codigo legivel no lugar do UUID |

