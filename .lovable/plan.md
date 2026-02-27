
# Correcoes no Modulo de Vendas e Estoque

## 4 Problemas Identificados

### 1. Remover "Valor Recomendado" quando tipo = "Entrega"
No quadro "Retirada / Logistica", quando o tipo de retirada e "Entrega", aparece um campo "Valor Recom." (read-only). Este campo deve ser removido.

**Arquivos afetados:**
- `src/pages/VendasNova.tsx` (linhas 2175-2181) -- remover div "Valor Recom." e a logica de comparacao com `valorRecomendadoEntrega` (linhas 2195, 2199-2204)
- `src/pages/VendasEditar.tsx` (linhas 1465-1470) -- mesma remocao
- `src/pages/VendasFinalizarDigital.tsx` (linhas 1835-1840) -- mesma remocao

O estado `valorRecomendadoEntrega` pode ser removido ou simplesmente ignorado. O grid passara de 5 colunas para 4 (`grid-cols-1 md:grid-cols-4`).

### 2. "Retirada em Outra Loja" deve mostrar apenas lojas tipo "Loja"
Quando selecionado "Retirada em Outra Loja", o campo de loja retorna todas as unidades ativas (incluindo Estoque, Assistencia, etc.). Deve retornar somente unidades do tipo "Loja".

**Correcao:** Trocar `lojas.filter(l => l.ativa)` por `lojasTipoLoja` (que ja esta disponivel via `obterLojasTipoLoja()`) nos 3 arquivos:
- `src/pages/VendasNova.tsx` (linha 2239) -- ja tem `lojasTipoLoja` disponivel
- `src/pages/VendasEditar.tsx` (linha 1529) -- verificar se `lojasTipoLoja` esta disponivel, senao importar
- `src/pages/VendasFinalizarDigital.tsx` (linha 1896) -- idem

### 3. Filtro de loja no EstoqueProdutos - revisar
O componente `AutocompleteLoja` no filtro de loja da aba "Aparelhos" (EstoqueProdutos.tsx, linha 243) nao usa `apenasLojasTipoLoja` -- retorna todas as unidades (Estoque, Assistencia, etc.). Como e filtro de estoque de aparelhos, faz sentido manter todas as unidades para poder filtrar aparelhos em qualquer local. Porem, se o usuario quer somente lojas, basta adicionar a prop `apenasLojasTipoLoja` ao componente. Sera adicionada essa prop para filtrar somente lojas tipo "Loja".

### 4. Data de registro da movimentacao fica com dia anterior
Na aba de Movimentacao de Aparelhos, ao registrar um lancamento, a data usa `new Date().toISOString().split('T')[0]`. O metodo `toISOString()` converte para UTC, entao no fuso horario de Brasilia (UTC-3), qualquer hora apos 21:00 local (00:00 UTC) mostra a data correta, mas entre 00:00 e 02:59 local mostra o dia anterior. O problema e mais amplo: `toISOString()` sempre converte para UTC.

**Correcao:** Substituir por formatacao local:
```
const hoje = new Date();
const dataLocal = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
```

Arquivo: `src/pages/EstoqueMovimentacoes.tsx` (linha 269)

---

## Resumo dos Arquivos Modificados

1. **`src/pages/VendasNova.tsx`** -- Remover "Valor Recom.", ajustar grid para 4 colunas, usar `lojasTipoLoja` em "Retirada em Outra Loja"
2. **`src/pages/VendasEditar.tsx`** -- Mesmas correcoes
3. **`src/pages/VendasFinalizarDigital.tsx`** -- Mesmas correcoes
4. **`src/pages/EstoqueProdutos.tsx`** -- Adicionar `apenasLojasTipoLoja` no filtro de loja
5. **`src/pages/EstoqueMovimentacoes.tsx`** -- Corrigir data para usar formatacao local em vez de UTC
