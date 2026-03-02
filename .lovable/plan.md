
# Auditoria Completa e Correcoes Finais — ERP Thiago Imports

## Status Atual (Ja Implementado)

As seguintes correcoes ja foram aplicadas com sucesso:

| Item | Status |
|------|--------|
| Sequences + `numero_sequencial` em OS, Despesas, Pagamentos | OK |
| `withRetry` em assistenciaApi, vendasApi (addVenda), estoqueApi, financeApi | OK |
| RLS corrigido nas tabelas de movimentacoes (INSERT/UPDATE) | OK |
| `formatOSNumber()` exibindo `OS-XXXX` na listagem e detalhes | OK |
| `updateProdutoLoja` sincronizando `lojaAtualId` | OK |
| Timeline de movimentacao exibindo nomes de lojas | OK |
| Mappers snake_case em todos os modulos principais | OK |

Nenhum erro 403, 400 ou 500 foi detectado nos logs de rede e console atuais. Nenhum loop infinito de requisicoes identificado.

---

## Problemas Restantes Identificados

### 1. `withRetry` ausente em 30+ APIs secundarias (MEDIO)
As seguintes APIs fazem escritas no Supabase **sem retry**, vulneraveis a falhas de rede:
- `cadastrosApi.ts` (addLoja, addCliente, addColaborador, addFornecedor, updateLoja, updateCliente, etc.)
- `garantiasApi.ts` (addGarantia, updateGarantia)
- `fiadoApi.ts` (addDividaFiado, addPagamentoFiado)
- `feedbackApi.ts` (addFeedback)
- `retiradaPecasApi.ts` (insert/update retiradas)
- `osApi.ts` (delete produto pendente)
- `garantiaExtendidaApi.ts` (addTratativa, updateTratativa)
- `movimentacoesEntreContasApi.ts` (addMovimentacao)
- `valoresRecomendadosTrocaApi.ts` (criar, atualizar)
- `gestaoAdministrativaApi.ts` (logs conferencia)
- `vendasApi.ts` — `cancelarVenda` e `updateVenda` **nao usam** `withRetry`

### 2. Erro silencioso em operacoes de escrita (UI) (MEDIO)
Varios handlers de salvamento em paginas capturam erros mas nao mostram feedback adequado ao usuario:
- `OSMovimentacaoPecas.tsx` — catch loga no console mas nao informa o usuario
- `EstoqueMovimentacoesAcessorios.tsx` — idem
- Algumas paginas de Cadastros fazem `throw` sem `catch` no nivel da UI

### 3. Descricao de pagamento financeiro usa UUID (BAIXO)
Em `criarPagamentosDeVenda`, a descricao salva e `Venda #${venda.id}` (UUID completo). Deveria usar o numero sequencial: `Venda #VEN-YYYY-XXXX`.

### 4. Vendas: cancelar e editar sem retry (MEDIO)
`cancelarVenda` e `updateVenda` em `vendasApi.ts` fazem `await supabase.from('vendas').update(...)` direto, sem `withRetry`.

---

## Plano de Correcao

### Etapa 1: Aplicar `withRetry` em APIs secundarias criticas

**Arquivos a modificar:**
- `src/utils/cadastrosApi.ts` — envolver addLoja, addCliente, addColaborador, addFornecedor, updateLoja, updateCliente, updateColaborador, updateFornecedor com `withRetry`
- `src/utils/garantiasApi.ts` — envolver operacoes de escrita
- `src/utils/fiadoApi.ts` — envolver inserts/updates
- `src/utils/vendasApi.ts` — envolver `cancelarVenda` e `updateVenda`

Estrategia: importar `withRetry` e substituir chamadas `await supabase.from(...).insert/update(...)` por `await withRetry(() => supabase.from(...).insert/update(...))`.

### Etapa 2: Melhorar feedback de erro na UI

**Arquivos a modificar:**
- `src/pages/OSMovimentacaoPecas.tsx` — adicionar `toast.error('Erro ao salvar: ' + error.message)` nos blocos catch
- `src/pages/EstoqueMovimentacoesAcessorios.tsx` — idem
- Criar padrao de tratamento de erro reutilizavel nos handlers

Padrao proposto para todos os catch blocks:
```text
catch (error: any) {
  console.error('[MODULO] Erro:', error);
  toast.error(
    error?.message?.includes('permission') ? 'Erro de permissao. Faca login novamente.' :
    error?.message?.includes('duplicate') ? 'Registro duplicado detectado.' :
    error?.message || 'Erro ao salvar. Tente novamente.'
  );
}
```

### Etapa 3: Corrigir descricao de pagamento financeiro

**Arquivo:** `src/utils/financeApi.ts`
Na funcao `criarPagamentosDeVenda`, trocar:
```text
descricao: `Venda #${venda.id} - ${venda.clienteNome}`
```
Por:
```text
descricao: `Venda #VEN-${new Date().getFullYear()}-${String(venda.numero || 0).padStart(4, '0')} - ${venda.clienteNome}`
```
E adicionar `numero` a interface `VendaParaPagamento`.

### Etapa 4: Retry em cancelarVenda e updateVenda

**Arquivo:** `src/utils/vendasApi.ts`
Envolver as chamadas `supabase.from('vendas').update(...)` em `cancelarVenda` e `updateVenda` com `withRetry`.

---

## Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/utils/cadastrosApi.ts` | withRetry em 8+ funcoes de escrita |
| `src/utils/garantiasApi.ts` | withRetry em inserts/updates |
| `src/utils/fiadoApi.ts` | withRetry em 4 funcoes |
| `src/utils/vendasApi.ts` | withRetry em cancelarVenda, updateVenda |
| `src/utils/financeApi.ts` | Descricao com numero sequencial |
| `src/pages/OSMovimentacaoPecas.tsx` | Toast de erro detalhado |
| `src/pages/EstoqueMovimentacoesAcessorios.tsx` | Toast de erro detalhado |

## Resultado Esperado

- Todas as operacoes de escrita criticas protegidas com retry automatico (3 tentativas)
- Mensagens de erro claras e contextuais para o usuario em caso de falha
- Descricoes de pagamento financeiro usando IDs legiveis em vez de UUIDs
- Nenhuma operacao de escrita silenciosamente falhando sem feedback
