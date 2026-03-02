
# Corrigir IDs Sequenciais, RLS e Resiliencia de Conexao no ERP

## Diagnostico

### 1. IDs Sequenciais
- **Vendas**: JA possui `numero` (integer) no banco e gera `VEN-YYYY-XXXX` — OK
- **Ordens de Servico (OS)**: NAO possui coluna sequencial. A tabela `ordens_servico` usa apenas UUID. A funcao `getNextOSNumber()` gera UUID puro. A UI exibe UUIDs completos (ex: `a1b2c3d4-e5f6-...`) em tabelas, detalhes e recibos
- **Financeiro (Despesas/Pagamentos)**: NAO possuem campo sequencial. Usam apenas UUID como identificador
- **Movimentacoes Pecas/Acessorios**: JA possuem `codigo_legivel` — OK

### 2. RLS
- 44 tabelas usam `auth_all` com `auth.uid() IS NOT NULL` — adequado
- 4 politicas das tabelas `movimentacoes_pecas_estoque` e `movimentacoes_acessorios_estoque` usam `WITH CHECK (true)` sem verificar autenticacao — risco de seguranca

### 3. Mappers snake_case
- Todos os mappers de API (vendas, assistencia, financeiro, estoque) ja convertem corretamente entre camelCase (frontend) e snake_case (banco). Nenhuma inconsistencia critica encontrada

### 4. Retry de Conexao
- Nao existe nenhum mecanismo de retry no sistema. Qualquer falha temporaria de rede resulta em erro imediato sem recuperacao

---

## Plano de Correcao

### Etapa 1: Migracao SQL — Adicionar campos sequenciais e corrigir RLS

**Alteracoes no banco:**

1. Adicionar `numero_sequencial INTEGER` na tabela `ordens_servico` com valor auto-incrementado
2. Adicionar `numero_sequencial INTEGER` na tabela `despesas`
3. Adicionar `numero_sequencial INTEGER` na tabela `pagamentos_financeiros`
4. Criar sequencias para cada tabela (sequence PostgreSQL)
5. Corrigir as 4 politicas de RLS das tabelas de movimentacoes para exigir `auth.uid() IS NOT NULL`

```text
-- Sequencias
CREATE SEQUENCE os_numero_seq START 1001;
CREATE SEQUENCE despesa_numero_seq START 1001;
CREATE SEQUENCE pagamento_fin_numero_seq START 1001;

-- Colunas
ALTER TABLE ordens_servico ADD COLUMN numero_sequencial INTEGER DEFAULT nextval('os_numero_seq');
ALTER TABLE despesas ADD COLUMN numero_sequencial INTEGER DEFAULT nextval('despesa_numero_seq');
ALTER TABLE pagamentos_financeiros ADD COLUMN numero_sequencial INTEGER DEFAULT nextval('pagamento_fin_numero_seq');

-- Corrigir RLS movimentacoes
DROP POLICY ... (4 politicas com true);
CREATE POLICY ... FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY ... FOR UPDATE USING (auth.uid() IS NOT NULL);
```

### Etapa 2: Criar utilitario de retry — `src/utils/supabaseRetry.ts`

Funcao wrapper `withRetry` que:
- Aceita qualquer operacao async do Supabase
- Tenta ate 3 vezes com intervalo exponencial (1s, 2s, 4s)
- Apenas retenta em erros de rede/timeout (nao em erros 400/403/422)
- Loga tentativas no console

```text
export async function withRetry<T>(
  operation: () => Promise<{ data: T; error: any }>,
  maxRetries = 3
): Promise<{ data: T; error: any }>
```

### Etapa 3: Atualizar `assistenciaApi.ts` — ID sequencial para OS

- Alterar `OrdemServico` interface: adicionar campo `numeroSequencial?: number`
- Alterar `mapOSFromDB`: ler `row.numero_sequencial`
- Alterar `getNextOSNumber()`: retornar numero baseado no max do cache + 1 (formato `OS-XXXX`)
- Alterar `addOrdemServico()`: NAO enviar `numero_sequencial` (o banco gera automaticamente via sequence)
- Aplicar `withRetry` nas operacoes de INSERT e UPDATE

### Etapa 4: Atualizar `financeApi.ts` — ID sequencial para Despesas e Pagamentos

- Alterar interfaces `Despesa` e `Pagamento`: adicionar `numeroSequencial?: number`
- Alterar mappers: ler `row.numero_sequencial`
- Aplicar `withRetry` nas operacoes de INSERT e UPDATE

### Etapa 5: Atualizar UI — Exibir IDs sequenciais

**`OSAssistencia.tsx`** (listagem):
- Trocar `{os.id}` por `OS-{String(os.numeroSequencial).padStart(4, '0')}` na coluna N OS
- Manter navegacao por UUID (rota `/os/assistencia/${os.id}`)

**`OSAssistenciaDetalhes.tsx`** (detalhes):
- Titulo: exibir `OS-XXXX` em vez do UUID
- Recibo: usar `OS-XXXX` no texto
- QR Code: manter UUID para rastreabilidade tecnica

**`OSAssistenciaNova.tsx`** (criacao):
- Mostrar "Nova OS" sem numero pre-definido (sera gerado pelo banco)

**`FinanceiroCentralDespesas.tsx`** e telas de pagamentos:
- Exibir `DEP-XXXX` e `PAG-XXXX` quando disponivel

### Etapa 6: Aplicar retry nas APIs principais

Envolver chamadas criticas com `withRetry` em:
- `assistenciaApi.ts`: addOrdemServico, updateOrdemServico
- `vendasApi.ts`: addVenda, updateVenda
- `financeApi.ts`: addDespesa, updateDespesa, criarPagamentosDeVenda
- `estoqueApi.ts`: addProduto, updateProduto, addMovimentacao

---

## Arquivos Modificados
- **Migracao SQL** — 3 sequencias, 3 colunas, 4 politicas RLS corrigidas
- **`src/utils/supabaseRetry.ts`** — novo arquivo utilitario
- **`src/utils/assistenciaApi.ts`** — numero sequencial + retry
- **`src/utils/financeApi.ts`** — numero sequencial + retry
- **`src/utils/vendasApi.ts`** — retry
- **`src/utils/estoqueApi.ts`** — retry
- **`src/pages/OSAssistencia.tsx`** — exibir OS-XXXX
- **`src/pages/OSAssistenciaDetalhes.tsx`** — exibir OS-XXXX
- **`src/pages/OSAssistenciaNova.tsx`** — ajuste de criacao
- **`src/pages/FinanceiroCentralDespesas.tsx`** — exibir DEP-XXXX

## Resultado Esperado
- OS exibidas como `OS-1001`, `OS-1002` etc.
- Despesas como `DEP-1001`, Pagamentos como `PAG-1001`
- Vendas mantidas como `VEN-2026-0001` (ja funcional)
- RLS corrigido nas tabelas de movimentacoes
- Falhas de rede retentadas automaticamente ate 3x
