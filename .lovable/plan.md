
# Blindagem Total do Estoque: Auditoria, Validacoes e Sincronizacao entre Modulos

## 1. Nova Tabela de Auditoria: `estoque_audit_log`

Criar uma tabela dedicada para registrar TODAS as operacoes que alteram estoque, com campos completos para rastreabilidade:

```text
estoque_audit_log
+------------------+-------------------+
| Campo            | Tipo              |
+------------------+-------------------+
| id               | uuid (PK)         |
| produto_id       | uuid (FK)         |
| tipo_acao        | text              |
|   (Entrada, Saida, Transferencia,    |
|    Ajuste, Cancelamento)             |
| quantidade_antes | integer           |
| quantidade_depois| integer           |
| loja_origem_id   | uuid              |
| loja_destino_id  | uuid              |
| referencia_id    | text              |
|   (venda_id, os_id, nota_id, etc.)   |
| referencia_tipo  | text              |
|   (Venda, OS, NotaCompra, Ajuste,    |
|    Transferencia, Cancelamento)      |
| usuario_id       | uuid              |
| usuario_nome     | text              |
| descricao        | text              |
| created_at       | timestamptz       |
+------------------+-------------------+
```

**RLS:** Somente admin e acesso_geral podem ler. INSERT liberado para authenticated (o sistema registra via funcoes).

## 2. Trigger Automatico no Postgres

Criar um trigger `AFTER UPDATE` na tabela `produtos` que dispara automaticamente quando o campo `quantidade` muda. O trigger grava o log com `quantidade_antes` (OLD) e `quantidade_depois` (NEW), garantindo que NENHUMA alteracao de estoque passe despercebida, mesmo que o frontend falhe.

## 3. Reforco da RPC `decrementar_estoque_produto`

Atualizar a funcao para:
- Gravar automaticamente um registro no `estoque_audit_log` dentro da mesma transacao
- Retornar `false` (e nao decrementar) se `quantidade < 1` (ja faz isso, manter)

## 4. Reforco da RPC `transferir_estoque`

A funcao ja valida atomicamente, mas vamos adicionar:
- Mensagem de erro detalhada com saldo disponivel: `"Falha na Transferencia: Saldo insuficiente na origem (Disponivel: X)"`
- Registro automatico no audit log

## 5. Constraint de Banco: Bloqueio de Estoque Negativo

Adicionar `CHECK (quantidade >= 0)` na tabela `produtos` para impedir QUALQUER operacao que resulte em estoque negativo, independentemente da origem. Isso e a trava de seguranca definitiva no nivel mais baixo.

Adicionar o mesmo na tabela `pecas`: `CHECK (quantidade >= 0)`.

## 6. Nova Aba "Historico de Auditoria" no Modulo Estoque

Criar pagina `EstoqueAuditoria.tsx` com:
- Tabela com colunas: Data/Hora, Usuario, Tipo Acao, Produto (Marca/Modelo), IMEI, Qtd Antes, Qtd Depois, Loja Origem, Loja Destino, Referencia
- Filtros: por tipo de acao, periodo, loja, usuario
- Dados carregados diretamente do Supabase (sem cache, pois e log de consulta)
- Adicionar aba no EstoqueLayout

## 7. Revisao dos Fluxos (Deep Check)

### 7a. Venda -> Estoque
**Status atual:** `addVenda` ja chama `decrementar_estoque_produto` via RPC atomica e registra `addMovimentacao`. O `numero_venda` (vendaId) ja e passado no motivo da movimentacao.

**Melhoria:** Passar o `vendaId` e `numero` como `referencia_id` e `referencia_tipo = 'Venda'` no audit log (via trigger automatico).

### 7b. OS -> Estoque (Pecas)
**Status atual:** `darBaixaPeca` usa RPC `consumir_peca_os` que ja registra movimentacao na tabela `movimentacoes_pecas`.

**Melhoria:** Adicionar registro no `estoque_audit_log` dentro da RPC `consumir_peca_os` para pecas tambem, com `referencia_tipo = 'OS'`.

### 7c. Venda -> Financeiro
**Status atual:** `addVenda` ja chama `criarPagamentosDeVenda` que insere na tabela `pagamentos_financeiros`. Funciona corretamente.

**Melhoria:** Nenhuma correcao necessaria -- o fluxo esta correto.

### 7d. Venda -> Comissao
**Status atual:** `addVenda` ja salva `comissao_vendedor` na tabela `vendas`. O calculo e feito no frontend (`calculoComissaoVenda.ts`).

**Melhoria:** Nenhuma correcao necessaria -- a comissao ja e calculada e salva com a venda.

## 8. Feedback Visual de Conflito de Estoque

No `VendasNova.tsx` e `VendasFinalizarDigital.tsx`, quando `decrementar_estoque_produto` retorna `false`:
- Exibir toast vermelho destacado: "CONFLITO DE ESTOQUE: Este item acabou de ser vendido por outro usuario!"
- Remover o item da venda automaticamente
- Bloquear a finalizacao ate resolver

---

## Resumo de Arquivos

### Banco de Dados (Migration)
- Criar tabela `estoque_audit_log`
- Criar trigger `trg_audit_produto_quantidade` na tabela `produtos`
- Adicionar `CHECK (quantidade >= 0)` em `produtos` e `pecas`
- Atualizar RPC `decrementar_estoque_produto` para gravar audit log
- Atualizar RPC `transferir_estoque` com mensagem de erro detalhada
- Atualizar RPC `consumir_peca_os` para gravar audit log

### Frontend
| Arquivo | Acao |
|---------|------|
| `src/pages/EstoqueAuditoria.tsx` | Criar nova pagina de auditoria |
| `src/components/layout/EstoqueLayout.tsx` | Adicionar aba "Auditoria" |
| `src/App.tsx` | Adicionar rota `/estoque/auditoria` |
| `src/utils/vendasApi.ts` | Melhorar feedback de conflito de estoque |
| `src/pages/VendasNova.tsx` | Toast vermelho para conflito de concorrencia |
| `src/pages/VendasFinalizarDigital.tsx` | Toast vermelho para conflito de concorrencia |
