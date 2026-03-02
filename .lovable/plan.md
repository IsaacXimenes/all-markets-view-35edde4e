
# Varredura Exaustiva — Relatorio de Auditoria Nivel Critico

## 1. Race Conditions (Condicoes de Corrida)

### 1.1 CRITICO: Numero de Venda Sequencial sem Atomicidade

**Vulnerabilidade encontrada em `vendasApi.ts` linhas 355-363:**

```text
getNextVendaNumber() le o maior numero do CACHE LOCAL e incrementa +1.
Se dois vendedores abrirem a tela de nova venda ao mesmo tempo, ambos
receberao o MESMO numero sequencial, causando duplicidade.
```

**Impacto**: Vendas com numeros duplicados (ex: VEN-2026-0045 aparece duas vezes).

**Correcao proposta**: Substituir a geracao de `numero` no frontend por uma **sequence do Postgres** (`nextval('vendas_numero_seq')`), usando um `DEFAULT` na coluna `numero` da tabela `vendas`. O frontend nao precisa mais calcular o numero — ele vem do banco apos o INSERT.

### 1.2 Estoque com Quantidade 1 — Venda Duplicada

Quando dois vendedores tentam vender o mesmo produto (estoque = 1), o fluxo atual e:
1. Frontend verifica `quantidade > 0` no cache local
2. INSERT na tabela `vendas` (sem verificar estoque no banco)
3. UPDATE do produto para `quantidade = 0`

**Risco**: Ambos passam na verificacao do passo 1 (cache local desatualizado). O produto e vendido duas vezes.

**Correcao proposta**: Usar `UPDATE produtos SET quantidade = quantidade - 1 WHERE id = $1 AND quantidade >= 1` com verificacao do `rowCount`. Se zero linhas afetadas, a venda deve ser rejeitada. Alternativamente, usar o campo `bloqueado_em_venda_id` (ja existe) como semaforo via UPDATE atomico.

### 1.3 withRetry e Duplicidade

O `withRetry` **NAO** gera duplicidade em cenarios de timeout. Analise:
- Erros 409 (Conflict): O status `409` esta na faixa 400-499, e o `isRetryableError` retorna `false` para status HTTP 400-499. Portanto, **nao retenta conflitos**. OK.
- Timeout real (fetch abortado): O retry pode causar insert duplicado se o primeiro request ja foi processado pelo servidor mas a resposta nao chegou. **Este e um risco real** para operacoes de INSERT sem chave de idempotencia.

**Correcao proposta**: Para operacoes criticas (addVenda, addOS), usar um campo `idempotency_key` (UUID gerado no frontend) com constraint UNIQUE. Se o retry causar duplicata, o banco rejeita com conflict.

---

## 2. Tipagem e Nomenclatura (Strict Type Check)

### 2.1 Uso massivo de `any` nos Mappers

Foram encontradas **390 ocorrencias** de `(row: any)` nos mappers de 38 arquivos API. Exemplos:
- `mapVendaFromDB(row: any)` — vendasApi.ts
- `mapProdutoFromDB(row: any)` — estoqueApi.ts
- `mapPagamentoFromDB(row: any)` — financeApi.ts

**Impacto funcional**: Baixo (os mappers fazem fallback com `|| ''` e `|| 0`). Os campos `null` do banco sao convertidos para strings vazias ou zero, prevenindo `cannot read property of null`.

**Correcao proposta**: Substituir `any` pelo tipo gerado do Supabase (`Database['public']['Tables']['vendas']['Row']`), que ja existe em `src/integrations/supabase/types.ts`. Isto daria **autocomplete** e deteccao de erros em tempo de compilacao. Porem, e uma refatoracao de baixo impacto funcional e alto esforco (38 arquivos).

**Recomendacao**: Prioridade BAIXA. Os fallbacks existentes previnem crashes. Tipagem estrita e uma melhoria de manutenibilidade, nao de seguranca.

### 2.2 Campos null vs string

Os mappers ja tratam todos os campos nullable com fallbacks:
- `row.cliente_nome || ''` — garante string vazia, nunca null
- `Number(row.valor_total) || 0` — garante numero, nunca NaN
- `(row.timeline as any[]) || []` — garante array, nunca null

**Status**: SEM risco de `cannot read property of null`. OK.

---

## 3. Foreign Keys e Integridade Referencial

### 3.1 Delete de Loja com Vendas Vinculadas

A tabela `vendas` tem FK `loja_id -> lojas(id)` **sem ON DELETE CASCADE**. Default do Postgres: `RESTRICT`.

**Comportamento**: Se tentar excluir uma loja com vendas, o banco retorna erro de FK. O frontend:
- `deleteContaFinanceira`, `deleteColaborador`, `deleteFornecedor`: Apenas fazem `console.error` e removem do cache local **sem verificar o erro**. A tela nao "quebra", mas o item desaparece do cache enquanto persiste no banco.

**Impacto**: O item some da interface mas continua no banco. No proximo refresh, ele reaparece. Confuso para o usuario.

**Correcao proposta**:
1. Adicionar `try/catch` com `toast.error('Nao e possivel excluir: existem registros vinculados')` em todas as funcoes de delete.
2. So remover do cache apos confirmacao de sucesso (sem erro).

### 3.2 Mapa de Foreign Keys e Regras de Delete

| Tabela Filha | FK para | Regra Delete |
|--------------|---------|-------------|
| venda_itens | vendas | CASCADE |
| venda_trade_ins | vendas | CASCADE |
| venda_pagamentos | vendas | CASCADE |
| os_pagamentos | ordens_servico | CASCADE |
| os_pecas | ordens_servico | CASCADE |
| financeiro | vendas | RESTRICT |
| garantias | vendas | RESTRICT |
| movimentacoes_estoque | produtos | RESTRICT |
| colaboradores | lojas | RESTRICT |
| despesas | lojas | RESTRICT |
| pecas | lojas | RESTRICT |
| produtos | lojas | RESTRICT |

**Risco principal**: Deletar um produto que tem movimentacoes ou garantias vinculadas falha silenciosamente. O mesmo para lojas e colaboradores.

---

## 4. Performance e Re-renders

### 4.1 `select('*')` em todas as consultas

Foram encontradas **303 ocorrencias** de `.select('*')` em 40 arquivos. Como todas as consultas carregam dados para cache na inicializacao (e nao em tempo real), o impacto e:
- **Inicializacao**: Ligeiramente mais lenta (trafega colunas JSONB grandes como `timeline`, `historico_custo`)
- **Runtime**: Zero impacto (dados vem do cache local, nao do Supabase)

**Recomendacao**: Prioridade BAIXA. Otimizar `select` so faz diferenca se tabelas ultrapassarem 1000+ registros com colunas JSONB pesadas.

### 4.2 Re-renders Infinitos

Nao foram encontrados loops de requisicao. A arquitetura de cache impede isso:
- Dados sao carregados UMA VEZ na inicializacao (`initXxxCache`)
- Getters sao sincronos (`getProdutos()`, `getVendas()`)
- Mutacoes atualizam o cache local + banco em paralelo
- Componentes re-renderizam apenas quando o estado local muda (useState/useEffect controlados)

### 4.3 Dados de Referencia In-Memory (nao persistidos)

**Encontrado em `cadastrosApi.ts` linhas 177-311**: Origens de Venda, Produtos Cadastro, Tipos Desconto, Cargos e Modelos de Pagamento estao **hardcoded em arrays JavaScript**. Alteracoes feitas pelo usuario (add/update/delete) sao **perdidas ao recarregar a pagina**.

**Impacto**: Medio. Esses dados de referencia raramente mudam, mas se um usuario adicionar uma nova origem de venda, ela desaparece no proximo refresh.

**Correcao proposta**: Migrar para tabelas Supabase (`origens_venda`, `tipos_desconto`, `cargos`, `modelos_pagamento`, `produtos_cadastro`). Porem, como sao dados semi-estaticos, a prioridade e MEDIA.

---

## 5. Auditoria de Seguranca RLS (Bypass Check)

### 5.1 Vendedor injetando loja_id diferente no INSERT

**Politica atual de INSERT em vendas:**
```text
vendas_insert: WITH CHECK (
  is_acesso_geral(auth.uid()) OR
  has_role(auth.uid(), 'gestor') OR
  has_role(auth.uid(), 'vendedor')
)
```

**VULNERABILIDADE**: A politica permite que qualquer vendedor insira uma venda com **qualquer `loja_id`**. Nao ha verificacao de que o `loja_id` enviado corresponde a loja do vendedor (`get_user_loja_id(auth.uid())`).

**Impacto**: Um vendedor pode manipular o frontend (ou usar a API diretamente) para registrar vendas em nome de outra loja, alterando metricas de performance e comissoes.

**Correcao proposta**: Alterar a politica de INSERT para:
```text
WITH CHECK (
  is_acesso_geral(auth.uid()) OR
  has_role(auth.uid(), 'gestor') OR
  (has_role(auth.uid(), 'vendedor') AND loja_id = get_user_loja_id(auth.uid()))
)
```

### 5.2 Gestor pode inserir vendas em loja alheia

Mesmo problema: gestores podem inserir vendas com `loja_id` de outra loja. Correcao similar.

### 5.3 Produtos INSERT sem filtro de loja

Politica `produtos_insert`:
```text
WITH CHECK (is_acesso_geral(auth.uid()) OR has_role(auth.uid(), 'estoquista'))
```
Estoquista pode inserir produto em qualquer loja. Risco menor (estoquistas sao confiaveis), mas inconsistente.

---

## Resumo de Criticidade

| Achado | Severidade | Correcao |
|--------|-----------|----------|
| Race condition em numero de venda | CRITICA | Sequence no Postgres |
| Venda dupla de estoque 1 | CRITICA | UPDATE atomico com WHERE quantidade >= 1 |
| withRetry sem idempotencia | ALTA | Campo idempotency_key com UNIQUE |
| RLS vendas_insert sem filtro loja_id | ALTA | Adicionar AND loja_id = get_user_loja_id() |
| Delete silencioso com FK RESTRICT | MEDIA | try/catch com toast de erro |
| Dados de referencia in-memory | MEDIA | Migrar para tabelas Supabase |
| 390x `any` nos mappers | BAIXA | Tipagem com types do Supabase |
| select('*') em 303 consultas | BAIXA | Otimizar colunas selecionadas |

## Plano de Correcoes Propostas

### Correcao 1: Sequence para numero de venda (SQL + vendasApi.ts)
- Criar sequence `vendas_numero_seq` com START em max(numero)+1
- Adicionar DEFAULT `nextval('vendas_numero_seq')` na coluna `numero`
- Remover `getNextVendaNumber()` do frontend; ler `numero` do retorno do INSERT

### Correcao 2: Update atomico de estoque (vendasApi.ts)
- Substituir `updateProduto(id, { quantidade: 0 })` por query atomica:
  `UPDATE produtos SET quantidade = quantidade - 1 WHERE id = $1 AND quantidade >= 1`
- Verificar resultado antes de prosseguir com a venda

### Correcao 3: RLS vendas_insert com filtro de loja (SQL)
- ALTER POLICY vendas_insert para incluir `AND loja_id = get_user_loja_id(auth.uid())` no WITH CHECK para vendedores

### Correcao 4: Delete com tratamento de erro (cadastrosApi.ts, estoqueApi.ts)
- Adicionar verificacao de `error` em todas as funcoes delete
- So remover do cache se `!error`
- Mostrar toast de erro ao usuario

### Correcao 5: Campo idempotency_key em vendas (SQL + vendasApi.ts)
- Adicionar coluna `idempotency_key UUID UNIQUE` na tabela vendas
- Gerar UUID no frontend antes do INSERT
- withRetry evita duplicatas automaticamente via constraint UNIQUE

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/` | Sequence vendas_numero_seq, coluna idempotency_key, ALTER POLICY vendas_insert |
| `src/utils/vendasApi.ts` | Remover getNextVendaNumber, usar retorno do INSERT, update atomico de estoque |
| `src/utils/cadastrosApi.ts` | Tratamento de erro em deletes (deleteColaborador, deleteFornecedor, etc.) |
| `src/utils/estoqueApi.ts` | Tratamento de erro em deletes, update atomico de quantidade |
| `src/pages/VendasNova.tsx` | Remover chamada a getNextVendaNumber |
| `src/pages/VendasAcessorios.tsx` | Remover chamada a getNextVendaNumber |
