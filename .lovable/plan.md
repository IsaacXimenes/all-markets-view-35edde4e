
# Auditoria 360 - ERP Thiago Imports

## 1. Integridade dos Cadastros

| Tabela | Registros | Status |
|--------|-----------|--------|
| Profiles | 75 | OK |
| Colaboradores (ativos) | 76 | OK |
| Lojas | 17 | OK |
| Maquinas Cartao | 18 | OK (corrigido hoje) |
| Clientes | 0 | Vazio (aguardando cadastros reais) |
| Fornecedores | 0 | Vazio (aguardando cadastros reais) |

**Vinculo profiles-colaboradores**: 75/75 profiles possuem `colaborador_id` preenchido. Nenhum profile orfao.

**User Roles distribuidos**: 4 admins, 16 gestores, 26 vendedores, 11 estoquistas.

**Veredicto**: APROVADO

---

## 2. Seguranca e RLS - CRITICO

**Todas as 74 tabelas possuem RLS habilitado** (nenhuma tabela sem `rowsecurity`).

Porem, o scan de seguranca encontrou **21 vulnerabilidades**, sendo **20 de nivel ERROR**:

| Problema | Tabelas Afetadas |
|----------|-----------------|
| Dados pessoais de clientes publicamente legiveis | `clientes` (CPF, email, telefone, endereco) |
| Dados de colaboradores expostos | `colaboradores` (CPF, salarios, comissoes) |
| Dados financeiros expostos | `vendas`, `contas_financeiras`, `despesas`, `venda_pagamentos`, `movimentacoes_entre_contas` |
| Dados de RH expostos | `salarios_colaboradores`, `adiantamentos`, `vales`, `comissao_por_loja` |
| Dados operacionais expostos | `produtos`, `fornecedores`, `notas_entrada`, `maquinas_cartao`, `garantias`, `ordens_servico`, `dividas_fiado`, `vendas_conferencia` |
| Credenciais WhatsApp expostas | `config_whatsapp` (tokens API) |
| Protecao de senhas vazadas desativada | Configuracao Auth |

**Diagnostico**: RLS esta HABILITADO em todas as tabelas, mas as policies estao excessivamente permissivas (provavelmente `USING (true)` para SELECT). Os dados estao acessiveis a qualquer usuario autenticado sem restricao de role/loja.

**Acao necessaria**: Implementar policies restritivas utilizando as funcoes `has_role()`, `get_user_loja_id()` e `is_acesso_geral()` ja existentes no banco. Sera necessario:

1. Substituir policies `SELECT` permissivas em ~20 tabelas criticas
2. Aplicar regras: Vendedor ve apenas sua loja, Gestor ve sua loja, Admin ve tudo
3. Tabelas de RH (`salarios_colaboradores`, `adiantamentos`, `vales`) restritas a admin
4. `config_whatsapp` restrita a admin
5. Ativar "Leaked Password Protection" no painel Auth do Supabase

---

## 3. Fluxo de Autenticacao

| Item | Status |
|------|--------|
| Login `primeiro.ultimo` com transliteracao | OK |
| Redirecionamento `/definir-senha` para `first_login=true` | OK |
| `FirstLoginRoute` protege acesso | OK |
| `ProtectedRoute` bloqueia nao-autenticados | OK |
| `updatePassword` marca `first_login=false` | OK |
| 74/75 usuarios ainda com `first_login=true` | Esperado (ninguem definiu senha ainda) |

**Veredicto**: APROVADO

---

## 4. Automacao de Responsavel

Conforme memoria do sistema, todos os campos de "Responsavel" foram padronizados para usar `useAuthStore.getState().user`. Usuarios de "Acesso Geral" podem editar manualmente.

**Veredicto**: APROVADO (ja implementado conforme padrao)

---

## 5. Performance e Erros

### Erros no Console (ativos):

| Erro | Arquivo | Causa |
|------|---------|-------|
| `invalid input syntax for type uuid: "CONF-001"` | `conferenciaGestorApi.ts` | Seed tenta inserir IDs string em colunas UUID |
| `invalid input syntax for type uuid: "SOL-020"` | `solicitacaoPecasApi.ts` | Seed tenta inserir IDs string em colunas UUID |
| `invalid input syntax for type uuid: "NOTA-ASS-002"` | `solicitacaoPecasApi.ts` | Seed tenta inserir IDs string em colunas UUID |

Estes erros sao causados por seeds com IDs hardcoded nao-UUID que falham no insert, mas o sistema continua funcionando com o cache local (dados fantasma).

### Seeds/Mocks ainda ativos em producao:

| Arquivo | Tipo | Acao |
|---------|------|------|
| `conferenciaGestorApi.ts` | seedData com 10 conferencias falsas | Remover seed, iniciar vazio |
| `solicitacaoPecasApi.ts` | seedSolicitacoes (6 registros) + seedNotas (8 registros) | Remover seed, iniciar vazio |
| `atividadesGestoresApi.ts` | MOCK_ATIVIDADES (6 atividades) | Remover seed, iniciar vazio |
| `valoresRecomendadosTrocaApi.ts` | SEED_VALORES (dados de referencia) | **Manter** - sao dados de referencia de precos reais |
| `taxasEntregaApi.ts` | SEED_TAXAS (taxas de entrega por regiao) | **Manter** - sao dados operacionais reais |
| `storesApi.ts` | mockStoresData (dashboard) | **Manter** - excecao por design (dashboard visual) |
| `notificationsApi.ts` | Efemero em memoria | **Manter** - excecao por design |

### localStorage residual:

| Arquivo | Uso | Status |
|---------|-----|--------|
| `fluxoVendasApi.ts` | Conferencia de OS (IDs iniciados por "OS-") | **Excecao documentada** - OS nao integradas na tabela fluxo_vendas |

---

## Plano de Correcao

### Fase 1 - Remover Seeds Problematicos (3 arquivos)

1. **`conferenciaGestorApi.ts`**: Remover `seedData` e logica de seed no `init`. Iniciar cache vazio.
2. **`solicitacaoPecasApi.ts`**: Remover `seedSolicitacoes`, `seedNotas` e logica de seed nos dois inits. Iniciar caches vazios.
3. **`atividadesGestoresApi.ts`**: Remover `MOCK_ATIVIDADES` e logica de seed. Iniciar cache vazio.

Isso eliminara os 3 erros UUID no console.

### Fase 2 - Blindagem RLS (20 tabelas criticas)

Implementar policies restritivas usando as funcoes SECURITY DEFINER ja existentes:

**Modelo de policy por grupo:**

```text
Grupo RH (admin only):
  salarios_colaboradores, adiantamentos, vales, comissao_por_loja
  -> SELECT: has_role(auth.uid(), 'admin') OR is_acesso_geral(auth.uid())

Grupo Financeiro (gestor/admin):
  contas_financeiras, despesas, movimentacoes_entre_contas, venda_pagamentos
  -> SELECT: has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor') OR is_acesso_geral(auth.uid())

Grupo Operacional (filtro por loja):
  vendas, produtos, ordens_servico, garantias, notas_entrada, fornecedores
  -> SELECT: has_role(auth.uid(), 'admin') OR is_acesso_geral(auth.uid()) 
             OR get_user_loja_id(auth.uid()) = loja_id

Grupo Sensivel (admin only):
  config_whatsapp
  -> SELECT: has_role(auth.uid(), 'admin')

Dados pessoais:
  clientes, colaboradores
  -> SELECT: autenticado (manter leitura geral pois sao usados em autocompletes)
  -> Criar VIEW sem CPF para consultas gerais
```

### Fase 3 - Configuracao Auth

Ativar "Leaked Password Protection" no painel do Supabase (manual, via dashboard).

---

## Resumo Executivo

| Area | Status | Acao |
|------|--------|------|
| Cadastros e dados | APROVADO | Nenhuma |
| Vinculo profiles-colaboradores | APROVADO | Nenhuma |
| Autenticacao e primeiro acesso | APROVADO | Nenhuma |
| Automacao de responsavel | APROVADO | Nenhuma |
| Seeds/mocks residuais | 3 FALHAS | Remover seeds de 3 arquivos |
| Erros no console | 3 ERROS | Corrigidos ao remover seeds |
| RLS/Seguranca | 20 FALHAS CRITICAS | Implementar policies restritivas em ~20 tabelas |
| Leaked Password Protection | AVISO | Ativar no dashboard Supabase |
| localStorage residual | 1 EXCECAO | Documentada e aceita (OS fallback) |
