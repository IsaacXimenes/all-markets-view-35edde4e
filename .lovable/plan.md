

# Plano: Limpeza de Mocks e Padronizacao Final

## Diagnostico Atual

Apos analise detalhada dos 8 arquivos especificados, a conclusao e que **a migracao para Supabase ja esta completa** em todos eles. Os pedidos do usuario se baseiam em uma percepcao desatualizada do codigo. Segue o status real:

| Arquivo | Tabela Supabase | Status |
|---|---|---|
| `notaEntradaFluxoApi.ts` | `notas_entrada` + `creditos_fornecedor` | Migrado - com mock morto |
| `loteRevisaoApi.ts` | `lotes_revisao` | Migrado |
| `consignacaoApi.ts` | `lotes_consignacao` + `itens_consignacao` | Migrado - erro silencioso |
| `conferenciaGestorApi.ts` | `conferencias_gestor` | Migrado - seed condicional |
| `solicitacaoPecasApi.ts` | `solicitacoes_pecas` + `notas_assistencia` + `lotes_pagamento_pecas` | Migrado - seed condicional |
| `pendenciasFinanceiraApi.ts` | `pendencias_financeiras` | Migrado |
| `osApi.ts` | Supabase (multiplas tabelas) | Migrado |
| `fluxoVendasApi.ts` | `fluxo_vendas` | Migrado (exceto OS Fallback) |

**Nao e necessario criar tabelas** -- `conferencias_gestor`, `solicitacoes_pecas`, `notas_assistencia`, `lotes_pagamento_pecas` ja existem no banco.

**Nao e necessario corrigir snake_case** -- todos os mappers (`mapFromDB`/`mapToDB`) ja fazem a conversao corretamente.

---

## Acoes Reais Necessarias

### 1. Remover `inicializarNotasEntradaMock` (codigo morto)
- **Arquivo**: `src/utils/notaEntradaFluxoApi.ts` (linhas 1729-1872)
- A funcao `inicializarNotasEntradaMock` e a auxiliar `criarNotaEntradaComDataHora` nao sao chamadas em nenhum lugar do projeto
- Remover ~143 linhas de codigo morto + comentario final na linha 2227
- Zero impacto funcional

### 2. Padronizar erros em `consignacaoApi.ts`
- **Arquivo**: `src/utils/consignacaoApi.ts` (linhas 128-136)
- `syncLoteToDb` e `syncItemToDb` usam `console.error` sem `throw`
- Adicionar `throw error` para propagar falhas ao UI
- Padrao: cache so atualiza apos banco confirmar

### 3. Padronizar erros em APIs secundarias restantes
- **`acessoriosApi.ts`**: Funcoes de update de quantidade
- **`retiradaPecasApi.ts`**: `saveRetirada`
- **`garantiasApi.ts`**: `aprovarAnalise`, `recusarAnalise`
- **`metasApi.ts`**: `updateMeta`, `deleteMeta`
- **`estoqueApi.ts`**: `updateProduto`

### 4. Converter seed condicional em `initNotasEntradaCache`
- Atualmente, se a tabela `notas_entrada` esta vazia, nenhum seed e inserido (diferente de `conferenciaGestorApi` e `solicitacaoPecasApi` que tem seed)
- Opcao: manter como esta (sem seed) -- correto para producao, pois notas sao criadas organicamente

---

## Detalhes Tecnicos

### Arquivos a editar

1. **`src/utils/notaEntradaFluxoApi.ts`**
   - Deletar linhas 1729-1872 (funcao `inicializarNotasEntradaMock` + `criarNotaEntradaComDataHora`)
   - Deletar comentario da linha 2227

2. **`src/utils/consignacaoApi.ts`**
   - Linhas 128-131: Adicionar `throw error` apos `console.error` em `syncLoteToDb`
   - Linhas 133-136: Adicionar `throw error` apos `console.error` em `syncItemToDb`

3. **`src/utils/acessoriosApi.ts`**
   - Localizar funcoes de mutacao com `console.error` sem throw e adicionar propagacao

4. **`src/utils/retiradaPecasApi.ts`**
   - Adicionar `throw error` em `saveRetirada`

5. **`src/utils/garantiasApi.ts`**
   - Adicionar `throw error` em `aprovarAnalise`, `recusarAnalise`, `encaminharParaAnalise`

6. **`src/utils/metasApi.ts`**
   - Adicionar `throw error` em `updateMeta`, `deleteMeta`

7. **`src/utils/estoqueApi.ts`**
   - Adicionar `throw error` em `updateProduto`

### Nao serao alterados (ja corretos)
- `conferenciaGestorApi.ts` -- ja usa `throw error` nas mutacoes
- `solicitacaoPecasApi.ts` -- ja usa `throw error` nas mutacoes
- `pendenciasFinanceiraApi.ts` -- ja corrigido na auditoria anterior
- `notaEntradaFluxoApi.ts` (exceto remocao de mock morto) -- ja usa `throw error` em `syncNotaToDb`

### Estimativa
- 7 arquivos editados
- ~150 linhas removidas (mock morto)
- ~20 linhas adicionadas (throw error)
- Complexidade: Baixa
- Risco: Zero -- apenas limpeza e padronizacao de erros

