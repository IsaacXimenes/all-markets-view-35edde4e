

# Auditoria Tecnica: Migracao Supabase - Thiago Imports ERP

## Resumo Executivo

A migracao esta em **~97%** de completude real (nao 100% como declarado). Existem **4 categorias** de pendencias tecnicas que afetam a integridade do sistema.

---

## 1. localStorage Residual em Dados de Negocio

### 1.1 Rodizios de Colaboradores (CRITICO)
**Arquivo**: `src/store/cadastroStore.ts`
- A funcionalidade de rodizio de colaboradores entre lojas **ainda persiste inteiramente em localStorage** (chave `cadastro_rodizios`)
- Operacoes afetadas: `adicionarRodizio`, `encerrarRodizio`, `verificarRodiziosExpirados`
- **Risco**: Dados de rodizio sao perdidos ao limpar o navegador ou trocar de dispositivo
- **Acao**: Criar tabela `rodizios_colaboradores` no Supabase e migrar as 3 funcoes de mutacao

### 1.2 OS Fallback Strategy (CONHECIDO)
**Arquivo**: `src/utils/fluxoVendasApi.ts` (linhas 658-718, 731-736)
- ~43 chamadas `localStorage.getItem/setItem` para entidades com ID iniciado por `OS-`
- Isso e uma excecao tecnica documentada e aceita, mas representa dados de conferencia de OS nao persistidos no banco
- **Risco**: Metadados de conferencia de Ordens de Servico sao volateis

### 1.3 Limpeza de Chaves Orfas no Logout
**Arquivo**: `src/store/authStore.ts` (linhas 60-74)
- O logout limpa chaves `gestao_conferencia_*`, `gestao_ajustes_*`, `stories_lotes_*`, `atividades_execucao_*` do localStorage
- Isso indica que esses modulos ainda podem ter resquicios de localStorage em uso durante a sessao
- **Acao**: Verificar se essas chaves ainda sao escritas em algum lugar ou se a limpeza e apenas legado morto

---

## 2. Usuarios Hardcoded (IDs Mockados)

**11 paginas** ainda usam IDs fixos em vez do usuario autenticado:

| Arquivo | ID Hardcoded | Contexto |
|---|---|---|
| `GarantiasEmAndamento.tsx` | `COL-001` | Timeline de garantia (3 ocorrencias) |
| `GarantiasNova.tsx` | `COL-001` | Registro de garantia |
| `GarantiasNovaManual.tsx` | `COL-001` | Garantia manual (2 ocorrencias) |
| `GarantiaDetalhes.tsx` | `COL-001` | Tratativa + devolucao (3 ocorrencias) |
| `GarantiaExtendidaDetalhes.tsx` | `COL-001` | Contato comercial (2 ocorrencias) |
| `VendasEditar.tsx` | `COL-001` + mock objeto | Edicao de venda |
| `VendasConferenciaGestorDetalhes.tsx` | `COL-001/002` | Fallback de gestores |
| `EstoqueProdutoPendenteDetalhes.tsx` | `COL-003` | Fallback de usuario |
| `EstoquePendenciasBaseTrocas.tsx` | `COL-001` | Fallback de recebimento |
| `FinanceiroExtratoContas.tsx` | `USR-SISTEMA` | Fallback de movimentacao |
| `FinanceiroFiado.tsx` | `USR-001` | Fallback de finalizacao |

**Acao**: Substituir todos por `useAuthStore(s => s.user)` com fallback seguro para `user?.colaborador?.id || 'SISTEMA'`.

---

## 3. Dados Mockados Ativos

### 3.1 Dashboard/Performance (ACEITO POR DESIGN)
- `src/utils/storesApi.ts`: Dados ficticios para `mockStoresData`, usado em `Performance.tsx` e `Index.tsx`
- Decisao de projeto documentada - nao e bug

### 3.2 Colaboradores Digitais Hardcoded
- `src/utils/vendasDigitalApi.ts` (linhas 81-90): Arrays estaticos `colaboradoresDigital` e `colaboradoresFinalizador` com IDs e nomes fixos
- **Acao**: Substituir por query em `colaboradores` filtrando por cargo/permissao

### 3.3 Seed Data (ACEITAVEL)
- `src/utils/atividadesGestoresApi.ts`: `MOCK_ATIVIDADES` e usado apenas como seed quando a tabela esta vazia - padrao correto
- `src/utils/notaEntradaFluxoApi.ts`: `inicializarNotasEntradaMock` - seed condicional, padrao correto

---

## 4. Integridade Tecnica

### 4.1 Mapeamento API vs Tabelas: CORRETO
Todas as 38 APIs em `src/utils/*Api.ts` importam `supabase` e mapeiam para tabelas existentes. O padrao e consistente:
- `mapFromDB` / `mapToDB` para conversao de nomes (camelCase <-> snake_case)
- Colunas JSONB para dados complexos (`timeline`, `pagamentos`, `dados_extras`)
- Cache de modulo com `init*Cache` para leituras sincronas

### 4.2 Tratamento de Erros: INCONSISTENTE
Existem **dois padroes** de tratamento de erro:
- **30 APIs** usam `if (error) throw error` - propagam para a UI (correto)
- **10 APIs** usam `if (error) console.error(error)` - engolem o erro silenciosamente (problematico)
  - Notavelmente: `cadastrosApi.ts` (deletes), `notaEntradaFluxoApi.ts` (sync), `pendenciasFinanceiraApi.ts` (inserts/updates)
- **Risco**: Operacoes podem falhar sem feedback ao usuario

### 4.3 Zustand + Supabase Sync: FUNCIONAL COM RESSALVA
- `osStore.ts`: Usa `persist` middleware (localStorage) mas dados reais vem do Supabase. O store serve como cache de sessao - aceitavel
- `cadastroStore.ts`: Sincroniza com Supabase exceto rodizios (ver item 1.1)
- `authStore.ts`: Persist para sessao de auth - correto

### 4.4 Foreign Keys: AUSENTES NO SCHEMA
O schema do Supabase mostra que **nenhuma tabela possui foreign keys reais** - todas as relacoes sao feitas por convencao no codigo (string matching de IDs). Isso e uma decisao arquitetural, mas significa que:
- Nao ha protecao contra dados orfaos no banco
- Deletes em cascata nao existem
- A integridade referencial depende 100% do codigo da aplicacao

---

## Plano de Correcao (Priorizado)

### Prioridade 1 - Rodizios para Supabase
1. Criar tabela `rodizios_colaboradores` com colunas: `id`, `colaborador_id`, `loja_origem_id`, `loja_destino_id`, `data_inicio`, `data_fim`, `observacao`, `ativo`, `criado_por_id`, `criado_por_nome`, `created_at`
2. Migrar `adicionarRodizio`, `encerrarRodizio`, `verificarRodiziosExpirados` para async com Supabase
3. Remover `RODIZIOS_KEY` e todas as referencias a localStorage

### Prioridade 2 - Substituir IDs Hardcoded
1. Em cada uma das 11 paginas listadas, importar `useAuthStore`
2. Substituir `'COL-001'` / `'USR-001'` por `user?.colaborador?.id || 'SISTEMA'`
3. Substituir nomes mockados por `user?.colaborador?.nome || 'Sistema'`

### Prioridade 3 - Padronizar Tratamento de Erros
1. Nos 10 arquivos com `console.error` silencioso, adicionar re-throw ou retorno de erro para a UI
2. Garantir que toda mutacao tenha feedback via `toast.error()` no componente chamador

### Prioridade 4 - Colaboradores Digitais
1. Substituir arrays estaticos em `vendasDigitalApi.ts` por query dinamica na tabela `colaboradores`

### Prioridade 5 - Limpeza de Codigo Legado
1. Remover prefixos de chaves orfas no `authStore.ts` logout (se nao escritas em nenhum lugar)
2. Remover `syncFromLocalStorage` do `osStore.ts`
3. Renomear `inicializarDadosMockados` e `carregarDoLocalStorage` no `cadastroStore.ts`

---

## Estimativa

| Prioridade | Arquivos | Complexidade | Impacto |
|---|---|---|---|
| P1 - Rodizios | 1 arquivo + 1 migration | Media | Alto - dados de negocio volateis |
| P2 - IDs Hardcoded | 11 arquivos | Baixa | Medio - rastreabilidade de acoes |
| P3 - Erros | 10 arquivos | Baixa | Medio - UX silenciosamente quebrada |
| P4 - Digitais | 1 arquivo | Baixa | Baixo - dados estaticos |
| P5 - Limpeza | 3 arquivos | Baixa | Baixo - higiene de codigo |

