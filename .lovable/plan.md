
# Replicacao de Seguranca, Atomicidade e Performance — Todos os Modulos

## Visao Geral

Aplicar os mesmos padroes de seguranca ja implementados no modulo de Vendas (sequence atomica, RPC de estoque, idempotencia, protecao FK) em todos os demais modulos do ERP: Assistencia, Estoque, Financeiro, RH e Cadastros.

---

## 1. Assistencia Tecnica

### 1.1 RPC `consumir_peca_os` — Baixa Atomica de Pecas
Criar funcao RPC no Postgres que decremente a quantidade da peca somente se `quantidade >= 1` e `status = 'Disponivel'`. Retorna `true` se sucesso, `false` se estoque insuficiente.

Substituir a logica em `assistenciaApi.ts` (funcao `reduzirEstoquePecas`, linhas 357-373) que faz verificacao local e `updatePeca` manual pela chamada atomica via `supabase.rpc('consumir_peca_os', { p_peca_id, p_quantidade, p_os_id })`.

### 1.2 Numero de OS via Sequence
A tabela `ordens_servico` ja possui `numero_sequencial` com sequence (iniciando em 1001). Porem, a funcao `getNextOSNumber()` (linha 252-256) ainda calcula o proximo numero pelo cache local.

**Correcao**: Marcar `getNextOSNumber` como `@deprecated` e garantir que `addOrdemServico` nao envie `numero_sequencial` no INSERT — deixando o banco gerar via DEFAULT. O numero e lido do retorno `data.numero_sequencial`. (Ja funciona assim parcialmente, mas a funcao legada ainda e exportada.)

### 1.3 Tecnico Responsavel — Preenchimento Automatico
Ja implementado pela regra de arquitetura `responsavel-field-automation`. O campo `tecnicoId` e preenchido com o colaborador logado via `useAuthStore`. Nenhuma alteracao de codigo necessaria — apenas documentar a restricao no plan.

---

## 2. Estoque (Logistica)

### 2.1 RPC `transferir_estoque` — Movimentacao Atomica
Criar funcao RPC que execute em uma unica transacao:
1. Marca produto como `status_movimentacao = 'Em movimentacao'` e atualiza `loja_atual_id` para destino
2. Insere registro na tabela `movimentacoes_estoque`
3. Se qualquer passo falhar, faz rollback completo

Substituir em `estoqueApi.ts` a logica de `addMovimentacao` (linhas 578-598) que faz insert + updateProduto separadamente.

### 2.2 RPC `confirmar_recebimento_movimentacao` — Recepcao Atomica
Criar RPC que atualize `tipo_movimentacao = 'Recebido'` na movimentacao e `loja_id`, `loja_atual_id`, `status_movimentacao = NULL` no produto em uma unica transacao. Substituir `confirmarRecebimentoMovimentacao` (linhas 601-627).

### 2.3 Alerta de Estoque Critico
A tabela `produtos` nao possui coluna `quantidade_minima`. Adicionar coluna `quantidade_minima INTEGER DEFAULT 0`. No frontend, adicionar funcao `getProdutosEstoqueCritico()` que filtra `quantidade > 0 AND quantidade <= quantidade_minima`. Exibir badge/alerta no dashboard do estoque.

---

## 3. Financeiro e RH

### 3.1 Idempotencia em Despesas
Adicionar coluna `idempotency_key UUID UNIQUE` na tabela `despesas`. Em `financeApi.ts`, gerar `crypto.randomUUID()` antes de cada INSERT em `addDespesa` (linha 198). O `withRetry` ja existente respeita a constraint UNIQUE automaticamente.

### 3.2 Idempotencia em Pagamentos Financeiros
Adicionar coluna `idempotency_key UUID UNIQUE` na tabela `pagamentos_financeiros`. Atualizar `criarPagamentosDeVenda` (financeApi.ts linha 172) para enviar a chave.

### 3.3 Idempotencia em Salarios
Adicionar coluna `idempotency_key UUID UNIQUE` na tabela `salarios_colaboradores`. Atualizar `addSalario` (salarioColaboradorApi.ts) para gerar e enviar a chave.

### 3.4 Calculo de Comissoes — Manter no Frontend
A logica de comissao atual e simples (10% loja fisica, 6% online, aplicado sobre lucro residual) e ja esta centralizada em `calculoComissaoVenda.ts`. Mover para RPC no banco teria complexidade desproporcional pois depende de dados de multiplas tabelas (vendas, itens, trade-ins, taxas) e regras que mudam frequentemente. **Recomendacao**: manter no frontend, ja que o calculo e somente leitura (exibicao) e nao altera dados diretamente.

---

## 4. Cadastros — Protecao de Exclusao (FK Restrict)

### 4.1 Deletes ja Protegidos
Na auditoria anterior, os deletes de Loja, Colaborador, Fornecedor, Conta Financeira e Maquina de Cartao ja foram atualizados para `throw new Error(...)` caso o banco retorne erro de FK. **Status: OK.**

### 4.2 Delete de Maquina de Cartao
O `deleteMaquinaCartao` (linha 812) ja possui o tratamento. **Status: OK.**

### 4.3 Mensagens de Erro Amigaveis
As mensagens atuais sao genericas ("existem registros vinculados"). Melhorar para indicar especificamente qual modulo possui vinculos (ex: "Nao e possivel excluir esta loja: existem vendas, OS ou colaboradores vinculados"). Implementar detectando o `error.code` do Postgres (`23503` = FK violation) e o `error.details` para identificar a tabela filha.

---

## 5. Performance — Selecao Especifica de Colunas

### 5.1 Abordagem Pragmatica
O sistema usa cache local carregado na inicializacao. Otimizar `select('*')` para colunas especificas so impacta o tempo de carga inicial. Com menos de 1000 registros por tabela, o ganho e marginal.

**Acao**: Otimizar apenas as 3 tabelas mais pesadas (com JSONB grandes):
- `produtos`: excluir `timeline`, `historico_custo`, `historico_valor_recomendado` do select inicial; carregar sob demanda no detalhe
- `ordens_servico`: excluir `timeline`, `evidencias` do select de listagem
- `notas_compra`: excluir `timeline`, `produtos` do select de listagem

Criar funcoes `getProdutoDetalhes(id)`, `getOSDetalhes(id)` que fazem `select('*')` individual quando o usuario abre o detalhe.

---

## Migracao SQL (unica)

```text
-- 1. RPC consumir_peca_os
CREATE OR REPLACE FUNCTION public.consumir_peca_os(
  p_peca_id UUID, p_quantidade INTEGER, p_os_id UUID DEFAULT NULL
) RETURNS BOOLEAN ...
  UPDATE pecas SET quantidade = quantidade - p_quantidade
  WHERE id = p_peca_id AND quantidade >= p_quantidade AND status = 'Disponível';
  -- Se afetou linhas, insere movimentacao e retorna true

-- 2. RPC transferir_estoque
CREATE OR REPLACE FUNCTION public.transferir_estoque(
  p_produto_id UUID, p_loja_origem UUID, p_loja_destino UUID,
  p_responsavel_id UUID, p_motivo TEXT
) RETURNS UUID ...
  -- Em uma transacao: INSERT movimentacao + UPDATE produto

-- 3. RPC confirmar_recebimento_movimentacao  
CREATE OR REPLACE FUNCTION public.confirmar_recebimento_movimentacao(
  p_movimentacao_id UUID, p_loja_destino UUID
) RETURNS BOOLEAN ...
  -- UPDATE movimentacao + UPDATE produto atomicamente

-- 4. Colunas de idempotencia
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;
ALTER TABLE pagamentos_financeiros ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;
ALTER TABLE salarios_colaboradores ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;

-- 5. Coluna de estoque minimo
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS quantidade_minima INTEGER DEFAULT 0;
```

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/` | RPCs + colunas de idempotencia + quantidade_minima |
| `src/integrations/supabase/types.ts` | Atualizar tipos gerados |
| `src/utils/assistenciaApi.ts` | Usar RPC `consumir_peca_os` em `reduzirEstoquePecas` |
| `src/utils/estoqueApi.ts` | Usar RPCs `transferir_estoque` e `confirmar_recebimento`; adicionar `getProdutosEstoqueCritico()`; selecao otimizada de colunas em `initEstoqueCache` |
| `src/utils/financeApi.ts` | Idempotency_key em `addDespesa` e `criarPagamentosDeVenda` |
| `src/utils/salarioColaboradorApi.ts` | Idempotency_key em `addSalario` |
| `src/utils/cadastrosApi.ts` | Melhorar mensagens de erro FK com deteccao de tabela filha |
| `src/utils/pecasApi.ts` | Usar RPC `consumir_peca_os` em `darBaixaPeca` |
