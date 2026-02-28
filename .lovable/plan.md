

# O que falta para 100% da migração Supabase

## Resumo dos gaps identificados

Existem **3 categorias** de pendências que separam os 95% atuais dos 100%:

---

## 1. localStorage residual em paginas de negocio (~3% do gap)

Varias paginas ainda usam `localStorage` para persistir dados de negocio que deveriam estar no banco:

| Arquivo | O que usa localStorage | Acao |
|---|---|---|
| `FinanceiroConferenciaNotas.tsx` | Status de notas, timeline de aprovacao, pagamentos, responsavel financeiro (~15 chaves localStorage) | Migrar para campos na tabela `notas_entrada` (ja existente) |
| `FinanceiroTetoBancario.tsx` | Notas emitidas por conta/mes, data de emissao, validacao de pagamentos | Criar tabela `notas_fiscais_emitidas` ou adicionar campos em tabela existente |
| `FinanceiroConferencia.tsx` | Observacoes do financeiro, historico de conferencias, validacao de pagamentos | Migrar para campos na tabela `conferencias_gestor` ou `fluxo_vendas` |
| `VendasConferenciaLancamento.tsx` | Status de conferencia de lancamento | Migrar para `fluxo_vendas` |
| `EstoqueNotasCompra.tsx` | Status estendido de notas | Migrar para `notas_entrada` |

**Total**: ~50 chamadas `localStorage.getItem/setItem` espalhadas nessas 5 paginas.

---

## 2. Usuarios logados mockados/hardcoded (~1.5% do gap)

Pelo menos **7 paginas** usam um `usuarioLogado` hardcoded em vez de ler do `authStore`:

| Arquivo | Usuario mockado |
|---|---|
| `Vendas.tsx` | `{ id: 'COL-007', nome: 'Carlos Vendedor' }` |
| `VendasConferenciaLancamento.tsx` | `{ id: 'COL-007', nome: 'Carlos Lancador' }` |
| `FinanceiroConferencia.tsx` | `{ id: 'COL-008', nome: 'Ana Financeiro' }` |
| `FinanceiroPagamentosDowngrade.tsx` | `{ id: 'USR-FIN-001', nome: 'Financeiro Admin' }` |
| `RHVales.tsx` | `{ id: 'COL-001', nome: 'Lucas Mendes' }` |
| `RHAdiantamentos.tsx` | `{ id: 'COL-001', nome: 'Lucas Mendes' }` |
| `feedbackApi.ts` | `{ id: '7c1231ea', nome: 'Fernanda Gabrielle...' }` |

**Acao**: Substituir por `useAuthStore.getState()` para usar o usuario real autenticado.

---

## 3. Dashboard com dados ficticios (storesApi) (~0.5% do gap)

A pagina `Performance.tsx` e o `Index.tsx` (dashboard) usam `mockStoresData` do `storesApi.ts` com dados totalmente ficticios. Ja foi decidido manter assim por design, mas para 100% real seria necessario:

- Substituir por queries agregadas nas tabelas `vendas`, `produtos`, `garantias` etc.
- Calcular metricas reais (faturamento, ticket medio, ranking) a partir dos dados do Supabase.

---

## Plano de implementacao para chegar a 100%

### Etapa 1 - Eliminar localStorage residual (maior impacto)
1. Em `FinanceiroConferenciaNotas.tsx`: mover status, timeline e pagamentos para campos JSONB ja existentes na tabela `notas_entrada`
2. Em `FinanceiroTetoBancario.tsx`: criar tabela `notas_fiscais_emitidas` (ou JSONB em `vendas`) para controle de emissao
3. Em `FinanceiroConferencia.tsx`: mover observacoes e validacoes para `fluxo_vendas` (campos JSONB ja existentes)
4. Em `VendasConferenciaLancamento.tsx` e `EstoqueNotasCompra.tsx`: usar campos existentes nas tabelas ja migradas

### Etapa 2 - Substituir usuarios mockados
1. Importar `useAuthStore` em cada pagina afetada
2. Substituir constantes hardcoded por `const user = useAuthStore(s => s.user)`
3. Usar `user.id` e `user.nome` nas chamadas de API

### Etapa 3 - Dashboard real (opcional)
1. Criar queries agregadas para metricas de vendas por loja
2. Substituir `mockStoresData` por dados reais

---

### Estimativa de esforco

| Etapa | Arquivos | Complexidade |
|---|---|---|
| localStorage residual | 5 arquivos | Media-Alta (logica dispersa) |
| Usuarios mockados | 7 arquivos | Baixa (substituicao direta) |
| Dashboard real | 2-3 arquivos | Media (queries agregadas) |

