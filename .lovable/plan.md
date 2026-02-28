

# Plano: Lote C - Migrar 5 arquivos para Supabase

## Resumo

Migrar os 5 arquivos restantes do Lote C, eliminando arrays em memoria e localStorage. Destes, **4 tabelas precisam ser criadas** e 1 tabela ja existe (`pendencias_financeiras`).

---

## Tabelas a Criar (SQL Migration)

### 1. `conferencias_gestor`
Armazena vendas no fluxo de conferencia gestor/financeiro (atualmente array mock com 10 registros).

```text
id                  UUID PK (default uuid_generate_v4)
venda_id            VARCHAR NOT NULL
data_registro       TIMESTAMPTZ
loja_id             VARCHAR
loja_nome           VARCHAR
vendedor_id         VARCHAR
vendedor_nome       VARCHAR
cliente_nome        VARCHAR
valor_total         NUMERIC DEFAULT 0
tipo_venda          VARCHAR  -- 'Normal' | 'Digital' | 'Acessorios'
status              VARCHAR DEFAULT 'Conferencia - Gestor'
sla_dias            INTEGER DEFAULT 0
timeline            JSONB DEFAULT '[]'
gestor_conferencia  VARCHAR
gestor_nome         VARCHAR
observacao_gestor   TEXT
data_conferencia    TIMESTAMPTZ
financeiro_resp     VARCHAR
financeiro_nome     VARCHAR
data_finalizacao    TIMESTAMPTZ
conta_destino       VARCHAR
dados_venda         JSONB DEFAULT '{}'
created_at          TIMESTAMPTZ DEFAULT now()
```

### 2. `solicitacoes_pecas`
Solicitacoes de pecas para OS (atualmente array mock ~6 registros).

```text
id                  UUID PK
os_id               VARCHAR
peca                VARCHAR
quantidade          INTEGER DEFAULT 1
justificativa       TEXT
modelo_imei         VARCHAR
loja_solicitante    VARCHAR
data_solicitacao    TIMESTAMPTZ DEFAULT now()
status              VARCHAR DEFAULT 'Pendente'
fornecedor_id       VARCHAR
valor_peca          NUMERIC DEFAULT 0
responsavel_compra  VARCHAR
data_recebimento    DATE
data_envio          DATE
motivo_rejeicao     TEXT
conta_origem_pag    VARCHAR
data_pagamento      DATE
forma_pagamento     VARCHAR
origem_peca         VARCHAR
observacao          TEXT
banco_destinatario  VARCHAR
chave_pix           VARCHAR
os_cancelada        BOOLEAN DEFAULT false
motivo_tratamento   TEXT
tratada_por         VARCHAR
origem_entrada      VARCHAR
created_at          TIMESTAMPTZ DEFAULT now()
```

### 3. `notas_assistencia`
Notas de pagamento de pecas para assistencia (atualmente array mock ~8 registros).

```text
id                  UUID PK
solicitacao_id      VARCHAR
solicitacao_ids     JSONB DEFAULT '[]'
lote_id             VARCHAR
fornecedor          VARCHAR
loja_solicitante    VARCHAR
os_id               VARCHAR
data_criacao        TIMESTAMPTZ DEFAULT now()
valor_total         NUMERIC DEFAULT 0
status              VARCHAR DEFAULT 'Pendente'
itens               JSONB DEFAULT '[]'
resp_financeiro     VARCHAR
forma_pagamento     VARCHAR
conta_pagamento     VARCHAR
data_conferencia    DATE
forma_pag_enc       VARCHAR
conta_bancaria_enc  VARCHAR
nome_recebedor      VARCHAR
chave_pix_enc       VARCHAR
observacao_enc      TEXT
tipo_consignacao    BOOLEAN DEFAULT false
created_at          TIMESTAMPTZ DEFAULT now()
```

### 4. `lotes_pagamento_pecas`
Lotes de agrupamento de solicitacoes para pagamento consolidado.

```text
id                  UUID PK
fornecedor_id       VARCHAR
solicitacao_ids     JSONB DEFAULT '[]'
valor_total         NUMERIC DEFAULT 0
data_criacao        TIMESTAMPTZ DEFAULT now()
status              VARCHAR DEFAULT 'Pendente'
resp_financeiro     VARCHAR
forma_pagamento     VARCHAR
conta_pagamento     VARCHAR
data_conferencia    DATE
created_at          TIMESTAMPTZ DEFAULT now()
```

### 5. `produtos_pendentes_os`
Produtos pendentes aguardando analise de estoque/assistencia (atualmente array mock ~6 registros).

```text
id                  UUID PK
imei                VARCHAR
imagem              TEXT
marca               VARCHAR
modelo              VARCHAR
cor                 VARCHAR
tipo                VARCHAR  -- 'Novo' | 'Seminovo'
condicao            VARCHAR
origem_entrada      VARCHAR
nota_ou_venda_id    VARCHAR
valor_custo         NUMERIC DEFAULT 0
valor_custo_original NUMERIC DEFAULT 0
valor_origem        NUMERIC DEFAULT 0
saude_bateria       INTEGER DEFAULT 100
loja                VARCHAR
data_entrada        DATE
fornecedor          VARCHAR
parecer_estoque     JSONB
parecer_assistencia JSONB
timeline            JSONB DEFAULT '[]'
custo_assistencia   NUMERIC DEFAULT 0
status_geral        VARCHAR DEFAULT 'Pendente Estoque'
contador_encaminhamentos INTEGER DEFAULT 0
created_at          TIMESTAMPTZ DEFAULT now()
```

Todas as tabelas terao RLS habilitado com politica `auth.uid() IS NOT NULL`.

---

## Estrategia de Migracao por Arquivo

### 1. `fluxoVendasApi.ts` (~820 linhas)
**Situacao atual:** Usa localStorage (`fluxo_vendas_data`) para persistir dados do fluxo de conferencia de vendas.

**Estrategia:** Este arquivo armazena dados complementares (status, timeline, aprovacoes) que **estendem** vendas existentes na tabela `fluxo_vendas` do Supabase (que ja existe). A migracao substituira `getFluxoData()`/`saveFluxoData()` por operacoes no Supabase via cache local.

**Acoes:**
- Criar `initFluxoVendasCache()` que carrega dados da tabela `fluxo_vendas`
- Converter `inicializarVendaNoFluxo`, `aprovarLancamento`, `recusarGestor`, `aprovarGestor`, `devolverFinanceiro`, `finalizarVenda`, `registrarEdicaoFluxo`, `enviarParaPagamentoDowngrade`, `finalizarVendaDowngrade`, `finalizarVendaFiado` para async com upsert no Supabase
- Remover localStorage completamente
- Atualizar `useFluxoVendas.ts` hook para chamar init no mount
- Atualizar pages: `VendasNova`, `VendaDetalhes`, `VendasConferenciaGestor`, `FinanceiroConferencia`, `FinanceiroPagamentosDowngrade`, `FinanceiroFiado`, `VendasConferenciaLancamento`, `VendasEditar`, `VendasEditarGestor`

### 2. `conferenciaGestorApi.ts` (~592 linhas)
**Situacao atual:** Array mock `vendasConferencia` com 10 registros hardcoded.

**Estrategia:** Criar tabela `conferencias_gestor` e migrar para padrao cache + async.

**Acoes:**
- Criar `initConferenciasGestorCache()` com seed dos 10 registros na primeira execucao
- Converter `validarVendaGestor`, `finalizarVendaFinanceiro`, `adicionarVendaParaConferencia` para async
- Atualizar pages: `VendasConferenciaGestor`, `VendasConferenciaGestorDetalhes`

### 3. `solicitacaoPecasApi.ts` (~850 linhas)
**Situacao atual:** 3 arrays mock (`solicitacoes`, `notasAssistencia`, `lotesPagamento`).

**Estrategia:** Criar 3 tabelas e migrar todas as funcoes CRUD.

**Acoes:**
- Criar `initSolicitacoesPecasCache()`, `initNotasAssistenciaCache()`, `initLotesPagamentoCache()`
- Converter ~15 funcoes de mutacao para async (aprovar, rejeitar, encaminhar, agrupar, finalizar, cancelar, desvincular, marcar cancelada, tratar)
- Atualizar pages: `OSSolicitacoesPecas`, `OSPecas`, `OSMovimentacaoPecas`, `FinanceiroNotasAssistencia`, `OSHistoricoNotas`

### 4. `osApi.ts` - produtosPendentes (~911 linhas)
**Situacao atual:** Array mock `produtosPendentes` com 6 registros + array `produtosMigrados`.

**Estrategia:** Criar tabela `produtos_pendentes_os` e migrar funcoes de CRUD. As funcoes puras (SLA, validacoes) permanecem sincronas.

**Acoes:**
- Criar `initProdutosPendentesCache()` com seed dos 6 registros
- Converter `addProdutoPendente`, `salvarParecerEstoque`, `salvarParecerAssistencia`, `updateProdutoPendente`, `migrarTradeInsParaPendentes`, `migrarProdutosNotaParaPendentes` para async
- Atualizar pages: `EstoqueProdutosPendentes`, `EstoqueProdutoPendenteDetalhes`, `OSProdutosAnalise`, `OSProdutoDetalhes`

### 5. `pendenciasFinanceiraApi.ts` (~423 linhas)
**Situacao atual:** Array em memoria `pendenciasFinanceiras`. Tabela `pendencias_financeiras` **ja existe** no Supabase.

**Estrategia:** Migrar para padrao cache + async usando a tabela existente.

**Acoes:**
- Criar `initPendenciasFinanceirasCache()` que carrega do Supabase
- Converter `criarPendenciaFinanceira`, `atualizarPendencia`, `finalizarPagamentoPendencia`, `forcarFinalizacaoPendencia` para async
- Remover `inicializarPendenciasDeNotas()` (inicializacao sera via cache)
- Remover referencia a localStorage em `inicializarPendenciasDeNotas`
- Atualizar pages: `FinanceiroNotasPendencias`, `EstoqueNotasPendencias`

---

## Atualizacoes Transversais

### App.tsx (AppInitializer)
Registrar 6 novas funcoes de init no `Promise.all`:
- `initFluxoVendasCache`
- `initConferenciasGestorCache`
- `initSolicitacoesPecasCache`
- `initNotasAssistenciaCache`
- `initLotesPagamentoCache`
- `initProdutosPendentesCache`
- `initPendenciasFinanceirasCache`

### osStore.ts
Remover `syncFromLocalStorage` e uso de localStorage para OS, pois dados agora vem do Supabase.

---

## Ordem de Execucao

1. **SQL Migration**: Criar 5 tabelas + RLS (1 migration)
2. **fluxoVendasApi.ts**: Migrar de localStorage para tabela `fluxo_vendas` existente
3. **conferenciaGestorApi.ts**: Migrar array mock para `conferencias_gestor`
4. **solicitacaoPecasApi.ts**: Migrar 3 arrays para 3 tabelas novas
5. **osApi.ts**: Migrar `produtosPendentes` para `produtos_pendentes_os`
6. **pendenciasFinanceiraApi.ts**: Migrar array para tabela existente
7. **App.tsx + hooks**: Registrar inits e converter handlers async
8. **Pages (UI)**: Converter handlers para async/await (~15-20 paginas)

---

## Complexidade Estimada

Este e o lote mais complexo ate agora:
- **5 APIs** com ~3600 linhas totais de codigo
- **5 tabelas** (4 novas + 1 existente)
- **~20 paginas** com handlers a converter
- **Interdependencias** entre `fluxoVendasApi` e `vendasApi`, entre `solicitacaoPecasApi` e `assistenciaApi`/`consignacaoApi`, entre `osApi` e `estoqueApi`/`garantiasApi`

Sera executado em 2-3 mensagens sequenciais para evitar erros.

