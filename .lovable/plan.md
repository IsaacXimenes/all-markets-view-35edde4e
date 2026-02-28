

# Plano: Remover Todos os Dados Mockados - Migrar para Supabase

## Resumo

Existem **17 arquivos** no sistema que ainda usam dados mockados (arrays em memoria) ou `localStorage` em vez do Supabase. O objetivo e migrar todos eles para o banco de dados, eliminando 100% dos mocks.

---

## Arquivos Pendentes de Migracao

### Grupo 1 - Arrays em memoria (mock puro)
| # | Arquivo | Linhas | Tabelas Supabase |
|---|---------|--------|------------------|
| 1 | `planosGarantiaApi.ts` | ~150 | `planos_garantia` (existe) |
| 2 | `valoresRecomendadosTrocaApi.ts` | ~100 | `valores_recomendados_troca` + `logs_valor_troca` (existem) |
| 3 | `garantiaExtendidaApi.ts` | ~200 | `tratativas_comerciais` (existe) |
| 4 | `garantiasApi.ts` (residual) | ~80 | `contatos_ativos_garantia` + `registros_analise_garantia` (existem) |
| 5 | `vendasDigitalApi.ts` | ~200 | `vendas_digitais` (existe) |
| 6 | `conferenciaGestorApi.ts` | ~400 | `conferencias_gestor` (existe) |
| 7 | `solicitacaoPecasApi.ts` | ~300 | `solicitacoes_pecas` + `notas_assistencia` + `lotes_pagamento` (existem) |
| 8 | `osApi.ts` (produtosPendentes) | ~200 | `produtos_pendentes_os` (existe) |
| 9 | `baseTrocasPendentesApi.ts` | ~100 | `base_trocas_pendentes` (existe) |
| 10 | `retiradaPecasApi.ts` | ~70 | `retiradas_pecas` (existe) |
| 11 | `loteRevisaoApi.ts` | ~500 | `lotes_revisao` (existe) |
| 12 | `notaEntradaFluxoApi.ts` | ~2000 | `notas_entrada` + `creditos_fornecedor` (existem) |
| 13 | `consignacaoApi.ts` | ~300 | `lotes_consignacao` + `itens_consignacao` (existem) |
| 14 | `pendenciasFinanceiraApi.ts` | ~420 | Derivada de notas (sem tabela propria) |
| 15 | `notificationsApi.ts` | ~50 | In-memory (pode permanecer client-side) |

### Grupo 2 - localStorage
| # | Arquivo | Tabelas Supabase |
|---|---------|------------------|
| 16 | `taxasEntregaApi.ts` | `taxas_entrega` (**PRECISA CRIAR**) |
| 17 | `fluxoVendasApi.ts` | `fluxo_vendas` (existe) |
| 18 | `atividadesGestoresApi.ts` | `atividades_gestores` + `execucoes_atividades` + `logs_atividades` (existem) |
| 19 | `gestaoAdministrativaApi.ts` | `conferencias_gestao` + `logs_conferencia_gestao` (existem) |
| 20 | `storiesMonitoramentoApi.ts` | Precisa tabela ou usa existente |

### Dados de referencia (mantidos como constantes)
- `cadastrosApi.ts`: origensVenda, produtosCadastro, tiposDesconto, cargos, modelosPagamento -- estes sao dados estaticos de baixa mutabilidade e ficam como constantes por decisao arquitetural.
- `feedbackApi.ts`: `getUsuarioLogado()` mock -- sera substituido pelo auth real.

---

## Tabelas a Criar

1. **`taxas_entrega`** - local, valor, status, logs (JSONB)
2. **`stories_monitoramento`** - competencia, loja_id, lote data (JSONB) -- ou verificar se ja existe

---

## Estrategia de Execucao

Para cada arquivo, o padrao e o mesmo ja utilizado nos arquivos migrados:

1. Importar `supabase` client
2. Criar cache de modulo (`let _cache: T[] = []`) + funcao `init*Cache()` async
3. Manter funcoes `get*()` sincronas lendo do cache
4. Converter `add/update/delete` para `async` com `await supabase.from(...)`
5. Seed automatico na primeira execucao (quando tabela vazia) usando os dados que hoje estao hardcoded
6. Remover todo localStorage e arrays mock
7. Atualizar componentes que chamam funcoes agora async (adicionar `await` + `try/catch`)

### Ordem de execucao (por complexidade crescente)

**Lote A (simples, ~6 arquivos por mensagem):**
1. `planosGarantiaApi.ts`
2. `valoresRecomendadosTrocaApi.ts`
3. `taxasEntregaApi.ts` (+ criar tabela)
4. `garantiaExtendidaApi.ts`
5. `baseTrocasPendentesApi.ts`
6. `retiradaPecasApi.ts`

**Lote B (medio, ~5 arquivos):**
7. `garantiasApi.ts` (residual contatosAtivos + analiseGarantia)
8. `vendasDigitalApi.ts`
9. `atividadesGestoresApi.ts`
10. `gestaoAdministrativaApi.ts`
11. `storiesMonitoramentoApi.ts`

**Lote C (complexo, ~5 arquivos):**
12. `fluxoVendasApi.ts`
13. `conferenciaGestorApi.ts`
14. `solicitacaoPecasApi.ts`
15. `osApi.ts` (produtosPendentes)
16. `pendenciasFinanceiraApi.ts`

**Lote D (muito complexo):**
17. `loteRevisaoApi.ts`
18. `consignacaoApi.ts`
19. `notaEntradaFluxoApi.ts` (~2000 linhas)

### Notas sobre `notificationsApi.ts`
O sistema de notificacoes e efemero (client-side, session-only). Pode permanecer em memoria sem Supabase, a menos que se deseje persistencia entre sessoes.

---

## Resultado Final

- **0 dados mockados** no sistema
- **0 uso de localStorage** para dados de negocio
- Todos os dados persistidos no Supabase com RLS ativo
- Cache local para performance, sincronizado com o banco

