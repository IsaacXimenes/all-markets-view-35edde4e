
# Plano de Migração Completa: localStorage/Mock Data para Supabase

## Visao Geral

O sistema possui mais de **40 arquivos API** com dados mockados em memoria e/ou persistidos via `localStorage`. A migracaoo completa requer refatorar cada um desses arquivos para usar `supabase.from().select/insert/update/delete`. Ao final, todas as telas estarao vazias e prontas para cadastros reais.

---

## Escopo Total: Arquivos a Migrar

### Grupo 1: Cadastros (parcialmente feito)
Ja migrados: `lojas` e `colaboradores` no `cadastroStore.ts`.

Pendentes no `cadastrosApi.ts`:
- **Clientes** (~6 clientes mock) -> tabela `clientes`
- **Fornecedores** (~20 fornecedores mock) -> tabela `fornecedores`
- **Contas Financeiras** (~22 contas mock) -> tabela `contas_financeiras`
- **Maquinas de Cartao** (~6 maquinas mock) -> tabela `maquinas_cartao`
- **Origens de Venda, Tipos Desconto, Cargos, Modelos Pagamento, Produtos Cadastro, Cores** -> Dados de referencia que ficam em memoria (manter como constantes ou criar tabelas auxiliares)

### Grupo 2: Estoque (estoqueApi.ts - 2180 linhas)
- **Produtos** (~15 produtos mock) -> tabela `produtos`
- **Notas de Compra** (~10 notas mock) -> tabela `notas_compra`
- **Movimentacoes** (in-memory) -> tabela `movimentacoes_estoque`
- **Movimentacoes Matriz** (in-memory) -> necessita nova tabela ou JSONB

### Grupo 3: Pecas (pecasApi.ts)
- **Pecas** (~13 pecas mock) -> tabela `pecas`
- **Movimentacoes de Pecas** -> tabela `movimentacoes_pecas`

### Grupo 4: Vendas (vendasApi.ts - 1136 linhas)
- **Vendas** (~5 vendas mock + localStorage) -> tabela `vendas`
- **Itens de Venda** -> tabela `venda_itens`
- **Pagamentos de Venda** -> tabela `venda_pagamentos`
- **Trade-Ins** -> tabela `venda_trade_ins`

### Grupo 5: Financeiro (financeApi.ts - 725 linhas)
- **Pagamentos** (~10 mock) -> tabela `pagamentos_financeiros`
- **Despesas** (~10 mock) -> tabela `despesas`

### Grupo 6: Assistencia (assistenciaApi.ts - 684 linhas)
- **Ordens de Servico** (~10 OS mock) -> tabela `ordens_servico`
- **Pecas de OS** -> tabela `os_pecas`
- **Pagamentos de OS** -> tabela `os_pagamentos`

### Grupo 7: Garantias (garantiasApi.ts - 1162 linhas)
- **Garantias** (mock + localStorage) -> tabela `garantias`

### Grupo 8: Modulos Secundarios (~20 arquivos)
- `acessoriosApi.ts` -> tabela `acessorios`
- `metasApi.ts` -> tabela `metas_lojas`
- `fiadoApi.ts`, `comissoesApi.ts`, `adiantamentosApi.ts`, `valesApi.ts` -> localStorage/mock
- `osApi.ts` (produtos pendentes) -> mock
- `consignacaoApi.ts`, `solicitacaoPecasApi.ts`, `retiradaPecasApi.ts` -> mock
- `taxasEntregaApi.ts`, `planosGarantiaApi.ts`, `baseTrocasPendentesApi.ts` -> localStorage/mock
- `feedbackApi.ts`, `motoboyApi.ts`, `loteRevisaoApi.ts` -> mock
- `movimentacoesEntreContasApi.ts`, `agendaGestaoApi.ts`, `storiesMonitoramentoApi.ts` -> localStorage
- `conferenciaGestorApi.ts`, `gestaoAdministrativaApi.ts`, `pendenciasFinanceiraApi.ts` -> mock
- `notificationsApi.ts`, `whatsappNotificacaoApi.ts` -> mock

---

## Estrategia de Execucao

Devido ao volume (40+ arquivos, 15.000+ linhas de codigo), a migracao sera feita em **lotes sequenciais**, cada lote focando em um grupo de modulos relacionados.

### Lote 1: Cadastros Restantes
**Arquivos:** `cadastrosApi.ts`
**Acoes:**
- Refatorar funcoes de Clientes (`getClientes`, `addCliente`, `updateCliente`, `deleteCliente`) para async com Supabase
- Refatorar funcoes de Fornecedores (CRUD completo)
- Refatorar funcoes de Contas Financeiras (CRUD completo)
- Refatorar funcoes de Maquinas de Cartao (CRUD completo)
- Remover arrays mock de clientes, fornecedores, contas, maquinas
- Manter dados de referencia estaticos (cores, cargos, modelos pagamento, origens venda, tipos desconto, produtos cadastro) como constantes -- nao precisam de tabela

### Lote 2: Estoque e Pecas
**Arquivos:** `estoqueApi.ts`, `pecasApi.ts`
**Acoes:**
- Refatorar CRUD de Produtos para Supabase (tabela `produtos`)
- Refatorar Notas de Compra para Supabase (tabela `notas_compra`)
- Refatorar Movimentacoes (tabela `movimentacoes_estoque`)
- Refatorar CRUD de Pecas para Supabase (tabela `pecas`)
- Refatorar Movimentacoes de Pecas (tabela `movimentacoes_pecas`)
- Remover arrays mock (15 produtos, 10 notas, 13 pecas)
- Todas as funcoes de leitura/escrita passam a ser `async`

### Lote 3: Vendas e Financeiro
**Arquivos:** `vendasApi.ts`, `financeApi.ts`, `fluxoVendasApi.ts`
**Acoes:**
- Refatorar Vendas CRUD para Supabase (tabela `vendas` + `venda_itens` + `venda_pagamentos` + `venda_trade_ins`)
- Remover `loadFromStorage`/`saveVendasToStorage`
- Refatorar Pagamentos e Despesas para Supabase
- Remover dados mock de pagamentos e despesas

### Lote 4: Assistencia e Garantias
**Arquivos:** `assistenciaApi.ts`, `garantiasApi.ts`, `garantiaExtendidaApi.ts`
**Acoes:**
- Refatorar OS CRUD para Supabase (tabela `ordens_servico` + `os_pecas` + `os_pagamentos`)
- Remover array mock de 10 OS
- Refatorar Garantias para Supabase (tabela `garantias`)
- Remover `loadFromStorage`/`saveToStorage` de garantias

### Lote 5: Modulos Secundarios
**Arquivos:** Todos os ~20 arquivos restantes
**Acoes:**
- Modulos com tabela Supabase existente: migrar para queries reais (`acessoriosApi`, `metasApi`)
- Modulos sem tabela: necessitam novas tabelas via migracao SQL (ex: `adiantamentos`, `vales`, `fiado`, `comissoes`, `solicitacoes_pecas`, `consignacoes`, `taxas_entrega`, `planos_garantia`, `feedback`, `motoboy`, `lote_revisao`, `produtos_pendentes`)
- Modulos de infraestrutura (notificacoes, whatsapp, agenda gestao, stories): migrar localStorage para Supabase ou simplificar

---

## Migracoes SQL Necessarias

Antes dos lotes de codigo, sera necessario criar tabelas adicionais para modulos que ainda nao possuem tabelas no Supabase:

- `adiantamentos` (RH)
- `vales` (RH)
- `comissoes` (RH)
- `fiado` (Financeiro)
- `solicitacoes_pecas` (OS)
- `consignacoes` (Estoque)
- `taxas_entrega` (Cadastros)
- `planos_garantia` (Cadastros)
- `feedback_colaboradores` (RH)
- `demandas_motoboy` (Logistica)
- `lotes_revisao` (Estoque)
- `produtos_pendentes` (OS)
- `movimentacoes_matriz` (Estoque)
- `origens_venda`, `tipos_desconto`, `cargos`, `modelos_pagamento` (se necessario persistir no banco)

---

## Padrao de Migracao por Arquivo

Para cada arquivo `*Api.ts`:

1. Importar `supabase` de `@/integrations/supabase/client`
2. Remover arrays mock (`let dados = [...]`)
3. Remover helpers `loadFromStorage`/`saveToStorage`
4. Converter funcoes `get*` para `async` com `supabase.from('tabela').select('*')`
5. Converter funcoes `add*` para `async` com `supabase.from('tabela').insert()`
6. Converter funcoes `update*` para `async` com `supabase.from('tabela').update().eq('id', id)`
7. Converter funcoes `delete*` para `async` com `supabase.from('tabela').delete().eq('id', id)`
8. Mapear campos camelCase do TS para snake_case do Supabase
9. Tratar erros com `try/catch` e retornos adequados
10. Atualizar componentes React que chamam essas funcoes para usar `async/await`

---

## Resultado Esperado

- **0 dados mockados** em qualquer arquivo `*Api.ts`
- **0 chamadas a localStorage** para persistencia de dados de negocio
- **Todas as telas vazias** prontas para cadastros reais
- **Supabase como unica fonte de verdade** para todos os dados
- **Tratamento de erros** em todas as operacoes de banco
- **Funcoes async/await** em toda a camada de dados

---

## Nota Importante

Este plano envolve a refatoracao de **~15.000 linhas de codigo** em 40+ arquivos. A implementacao sera feita em lotes para manter o sistema funcional a cada etapa. Cada lote sera testavel de forma independente -- ao final de cada lote, as telas correspondentes estarao funcionando com Supabase (porem vazias).
