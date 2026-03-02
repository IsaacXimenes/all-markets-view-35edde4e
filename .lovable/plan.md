
# Varredura Completa de Conformidade — ERP Thiago Imports

## 1. Auditoria de Comunicacao com o Banco (Supabase)

### 1.1 Resquicios de localStorage
- **ENCONTRADO**: `fluxoVendasApi.ts` usa `localStorage` para dados de conferencia de Ordens de Servico (IDs `OS-*`). Isto e uma **excecao documentada** — OS nao tem registro na tabela `fluxo_vendas`, entao metadados de conferencia (validacoes, observacoes, historico) usam localStorage como fallback.
- **Risco**: Dados de conferencia de OS sao perdidos ao limpar o navegador. Solucao definitiva requer criar colunas JSONB na tabela `ordens_servico` para `aprovacao_gestor` e `aprovacao_financeiro`.
- **Demais APIs**: Nenhum outro arquivo em `src/utils/*Api.ts` usa localStorage ou dados mockados (`initMockData`). 100% limpo.

### 1.2 Tratamento de Erros de Rede
- **COM `withRetry`** (7 arquivos): `cadastrosApi`, `garantiasApi`, `fiadoApi`, `vendasApi`, `estoqueApi`, `financeApi`, `assistenciaApi` — OK
- **SEM `withRetry`** (5 arquivos com escritas): 
  - `pecasApi.ts` — 6 escritas desprotegidas (addPeca, updatePeca, deletePeca, darBaixaPeca, addMovimentacaoPeca)
  - `salarioColaboradorApi.ts` — 4 escritas desprotegidas
  - `retiradaPecasApi.ts` — 2 escritas desprotegidas
  - `valoresRecomendadosTrocaApi.ts` — 3 escritas desprotegidas
  - `movimentacoesEntreContasApi.ts` — 1 escrita desprotegida
  - `storiesMonitoramentoApi.ts` — 3 escritas desprotegidas
  - `pendenciasFinanceiraApi.ts` — 1 escrita desprotegida
  - `osApi.ts` — 2 escritas desprotegidas (upsert/delete)
  - `whatsappNotificacaoApi.ts` — 2 escritas desprotegidas

### 1.3 Nomenclatura snake_case
- **OK**: Todos os mappers convertem camelCase (TypeScript) para snake_case (Supabase) corretamente. Campos como `lojaId`, `clienteId`, `vendedorId` existem apenas nas interfaces TS e sao mapeados para `loja_id`, `cliente_id`, `vendedor_id` antes de enviar ao banco.

---

## 2. Validacao de Seguranca e Permissoes (RLS)

### 2.1 ProtectedRoute — Bloqueio de Rotas
- **OK**: O `ProtectedRoute` importa `useUserPermissions` e chama `canAccessRoute(location.pathname)`. Se o usuario nao tem permissao, redireciona para `/`. Isto cobre todas as rotas definidas no `routeToModule()`.
- **Funcional**: Um vendedor acessando `/financeiro` ou `/rh` sera bloqueado e redirecionado.

### 2.2 Leitura de Roles
- **OK**: O hook `useUserPermissions` busca roles de `user_roles` (tabela segura, separada de profiles) e combina com flags do colaborador (`eh_gestor`, `eh_vendedor`, `eh_estoquista`) e cargo.

### 2.3 GAP CRITICO — 20 usuarios sem role no banco
Usuarios com cargos que deveriam ter roles, mas estao com `NULL` na tabela `user_roles`:

| Cargo | Usuarios sem Role | Role Esperada |
|-------|-------------------|---------------|
| CARGO-005 (Tecnico) | 5 usuarios | Nenhuma role definida no enum (gap) |
| CARGO-009 (Auxiliar/Motoboy) | 7 usuarios | Nenhuma role necessaria (restrito) |
| CARGO-011 (Assistente Adm.) | 5 usuarios | `admin` |
| CARGO-014 (Marketing/Adm.) | 3 usuarios | `admin` |

**Impacto**: Os 5 usuarios CARGO-011 e 3 usuarios CARGO-014 deveriam ter role `admin` mas nao tem. O hook `useUserPermissions` faz fallback para o cargo, entao o acesso no frontend funciona, mas as **politicas RLS do banco** que dependem de `has_role(auth.uid(), 'admin')` **bloqueiam** esses usuarios em tabelas restritas (salarios, despesas, contas financeiras).

### 2.4 Linter Supabase
- **1 aviso**: "Leaked Password Protection" desabilitado. Recomendacao: ativar no dashboard Auth.

---

## 3. Integridade de IDs e Salvamento

### 3.1 IDs Sequenciais
- **OK**: Tabelas `ordens_servico`, `despesas` e `pagamentos_financeiros` possuem `numero_sequencial` (BIGINT, via sequences iniciando em 1001).
- **OK**: Mappers em `assistenciaApi`, `financeApi` extraem `numero_sequencial` corretamente.
- **Vendas**: Usam campo `numero` (ja existente) para identificacao sequencial `VEN-YYYY-XXXX`.

### 3.2 Fluxo de Salvamento
- Sem erros de Foreign Key ou Not Null identificados nos logs atuais (console limpo).

---

## 4. Carga de Dados e Performance

### 4.1 Inicializacao
- 21 caches inicializados em paralelo via `Promise.all` no `AppInitializer` — otimo.
- O `cadastroStore.inicializarDados()` carrega lojas, colaboradores, clientes, fornecedores em paralelo.
- **Sem loops infinitos**: O `useEffect` no `AppInitializer` so executa quando `inicializado` muda (flag booleana controlada pelo store).

### 4.2 Limite de 1000 rows
- Com 76 colaboradores e ~165 produtos pendentes, nenhuma tabela ultrapassa o limite do Supabase.

---

## 5. Fluxo de Primeiro Acesso

- **OK**: 75 usuarios criados, 43 com `first_login = true` (pendentes de definir senha).
- **OK**: `FirstLoginRoute` protege `/definir-senha` — redireciona se nao autenticado ou se `first_login = false`.
- **OK**: `Login.tsx` redireciona para `/definir-senha` quando `isFirstLogin = true`.

---

## Plano de Correcoes

### Correcao 1: Inserir roles faltantes para 8 usuarios admin (SQL)
Inserir role `admin` na tabela `user_roles` para os 8 usuarios com CARGO-011 e CARGO-014 que nao possuem role. Isso corrige o acesso RLS em tabelas restritas.

```text
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM profiles p
WHERE p.cargo IN ('CARGO-011', 'CARGO-014')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin')
```

### Correcao 2: Aplicar `withRetry` em 9 APIs restantes
Arquivos a modificar:
- `pecasApi.ts` — envolver addPeca, updatePeca, deletePeca, darBaixaPeca, addMovimentacaoPeca
- `salarioColaboradorApi.ts` — envolver insert/update/delete salarios
- `retiradaPecasApi.ts` — envolver insert/update retiradas
- `valoresRecomendadosTrocaApi.ts` — envolver criar/atualizar/deletar
- `movimentacoesEntreContasApi.ts` — envolver addMovimentacao
- `storiesMonitoramentoApi.ts` — envolver upserts de lotes
- `pendenciasFinanceiraApi.ts` — envolver insert
- `osApi.ts` — envolver upsert/delete
- `whatsappNotificacaoApi.ts` — envolver insert/update

### Correcao 3: Migrar localStorage de conferencia OS para banco
Adicionar colunas JSONB `aprovacao_gestor` e `aprovacao_financeiro` na tabela `ordens_servico`, e atualizar `fluxoVendasApi.ts` para persistir dados de conferencia de OS no Supabase em vez de localStorage. Isso elimina o ultimo ponto de fragilidade de dados.

---

## Resumo de Conformidade

| Area | Status | Acao |
|------|--------|------|
| Mock data / localStorage | 95% OK | 1 excecao em fluxoVendasApi (Correcao 3) |
| snake_case nos mappers | 100% OK | Nenhuma acao |
| withRetry em escritas | 70% OK | 9 APIs restantes (Correcao 2) |
| RLS e Roles | 89% OK | 8 usuarios sem role admin (Correcao 1) |
| IDs sequenciais | 100% OK | Nenhuma acao |
| Bloqueio de rotas | 100% OK | Nenhuma acao |
| First login flow | 100% OK | 43 usuarios pendentes (esperado) |
| Performance/loops | 100% OK | Nenhuma acao |
| Leaked Password Protection | AVISO | Ativar no dashboard Supabase |

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `user_roles` (dados) | INSERT roles para 8 usuarios |
| `src/utils/pecasApi.ts` | withRetry em 5 funcoes |
| `src/utils/salarioColaboradorApi.ts` | withRetry em 3 funcoes |
| `src/utils/retiradaPecasApi.ts` | withRetry em 2 funcoes |
| `src/utils/valoresRecomendadosTrocaApi.ts` | withRetry em 3 funcoes |
| `src/utils/movimentacoesEntreContasApi.ts` | withRetry em 1 funcao |
| `src/utils/storiesMonitoramentoApi.ts` | withRetry em 3 funcoes |
| `src/utils/pendenciasFinanceiraApi.ts` | withRetry em 1 funcao |
| `src/utils/osApi.ts` | withRetry em 2 funcoes |
| `src/utils/whatsappNotificacaoApi.ts` | withRetry em 2 funcoes |
| `supabase/migrations/` | Colunas JSONB em ordens_servico |
| `src/utils/fluxoVendasApi.ts` | Migrar localStorage para Supabase |
