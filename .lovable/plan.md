

# Proximo Passo: Lote 5C - Modulos Restantes com Mock/localStorage

## Status Atual da Migracao

**Concluidos (Lotes 1-5B):**
- Cadastros (Lojas, Colaboradores, Clientes, Fornecedores, Contas, Maquinas)
- Estoque e Pecas (Produtos, Notas, Movimentacoes)
- Vendas e Financeiro (Vendas, Itens, Pagamentos, Despesas)
- Assistencia e Garantias (OS, Garantias - parcial)
- RH (Vales, Adiantamentos, Feedback, Salarios, Comissoes, Motoboy)
- Acessorios e Metas

**Pendentes - 15 arquivos em 3 categorias:**

---

## Categoria A: Arquivos com Mock Data (precisam de novas tabelas)

| Arquivo | Dados Mock | Tabela Necessaria |
|---|---|---|
| `fiadoApi.ts` | ~5 dividas, pagamentos, anotacoes | `dividas_fiado`, `pagamentos_fiado`, `anotacoes_fiado` |
| `vendasDigitalApi.ts` | ~5 pre-cadastros digitais | `vendas_digitais` |
| `conferenciaGestorApi.ts` | ~10 vendas conferencia | `vendas_conferencia` |
| `garantiaExtendidaApi.ts` | ~5 tratativas comerciais | `tratativas_comerciais` |
| `consignacaoApi.ts` | lotes consignacao (vazio) | `lotes_consignacao`, `itens_consignacao` |
| `coresApi.ts` | ~15 cores Apple | `cores_aparelho` |
| `planosGarantiaApi.ts` | ~10 planos garantia | `planos_garantia` |
| `valoresRecomendadosTrocaApi.ts` | ~70 valores recomendados | `valores_recomendados_troca` |
| `loteRevisaoApi.ts` | lotes revisao (vazio) | `lotes_revisao` |
| `retiradaPecasApi.ts` | retiradas (vazio) | `retiradas_pecas` |
| `pendenciasFinanceiraApi.ts` | pendencias (vazio) | `pendencias_financeiras` |
| `notaEntradaFluxoApi.ts` | notas entrada (vazio) + creditos | `notas_entrada`, `creditos_fornecedor` |

## Categoria B: Arquivos com localStorage (precisam de novas tabelas)

| Arquivo | Uso localStorage | Tabela Necessaria |
|---|---|---|
| `fluxoVendasApi.ts` | Estado do fluxo de vendas | `fluxo_vendas` |
| `atividadesGestoresApi.ts` | Atividades + execucoes diarias | `atividades_gestores`, `execucoes_atividades` |
| `agendaGestaoApi.ts` | Anotacoes gestao | `anotacoes_gestao` |
| `gestaoAdministrativaApi.ts` | Conferencias gestao | `conferencias_gestao` |

## Categoria C: In-memory pendentes em arquivos ja migrados

| Arquivo | Dados | Tabela Necessaria |
|---|---|---|
| `garantiasApi.ts` | contatosAtivos, registrosAnaliseGarantia | `contatos_ativos_garantia`, `registros_analise_garantia` |

---

## Plano de Execucao Sugerido

### Passo 1: Criar tabelas SQL (migracao unica)
Uma unica migracao SQL criando todas as ~20 tabelas restantes com RLS permissivo temporario.

### Passo 2: Migrar Categoria A (arquivos com mock data) - 12 arquivos
Para cada arquivo: remover mocks, implementar cache + init async, converter CRUD para Supabase.
Prioridade: `fiadoApi` e `conferenciaGestorApi` (mais complexos), depois os menores.

### Passo 3: Migrar Categoria B (localStorage) - 4 arquivos
Substituir `localStorage.getItem/setItem` por queries Supabase.
O `fluxoVendasApi.ts` e o mais complexo (~800 linhas).

### Passo 4: Completar Categoria C
Migrar `contatosAtivos` e `registrosAnaliseGarantia` do garantiasApi.

### Passo 5: Limpeza final
- Remover qualquer referencia residual a localStorage
- Verificar que nenhum dado mock permanece
- Validar build sem erros

---

## Estimativa

- ~20 novas tabelas SQL
- ~15 arquivos API refatorados
- ~5.000 linhas de codigo afetadas
- Recomendado dividir em 3-4 mensagens de implementacao

## Recomendacao

Comecar pelo **Passo 1 (criar todas as tabelas)** seguido do **Passo 2** focando nos arquivos mais criticos: `fiadoApi`, `conferenciaGestorApi`, `vendasDigitalApi` e `garantiaExtendidaApi`.

