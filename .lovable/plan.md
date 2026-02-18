

## Correcoes e Melhorias: Aparelhos Pendentes + Finalizacao com Pecas

### Problemas Identificados

1. **Quadro "Servico Concluido" nao mostra campos financeiros completos**: Faltam "Valor de Entrada", "Valor Original" e "Loja Atual" (com nome, nao ID)
2. **Status fica "Em servico" apos finalizacao com peca**: O `editStatus` nao e atualizado apos a finalizacao, e como o usuario esta em modo edicao, o badge mostra o valor antigo
3. **Pecas utilizadas nao aparecem no quadro de Aparelhos Pendentes**: A OS vinculada tem as pecas, mas elas nao sao exibidas no card de validacao

---

### Alteracoes

#### 1. Atualizar `editStatus` apos finalizacao (`src/pages/OSAssistenciaDetalhes.tsx`)

Na funcao `handleConfirmarFinalizacao` (apos linha 365), adicionar:

```typescript
setEditStatus(novoStatus);
```

Isso garante que o badge de status exibido durante edicao reflita o status atualizado ("Servico Concluido - Validar Aparelho") em vez de permanecer em "Em servico".

#### 2. Adicionar campos financeiros e pecas ao card de validacao (`src/pages/EstoqueProdutoPendenteDetalhes.tsx`)

No card "Servico Concluido - Validacao Pendente" (linhas 492-541):

**Novos campos no grid financeiro (apos "Custo Composto"):**
- "Valor de Entrada" -> `produto.valorOrigem`
- "Valor Original" -> `produto.valorCustoOriginal`  
- "Valor de Custo" -> `produto.valorCustoOriginal` (custo atual sem assistencia)
- "Custo Assistencia" -> `produto.custoAssistencia`
- "Venda Recomendada" -> Badge "Pendente" (sera preenchido apos aprovacao)
- "Loja Atual" -> `obterNomeLoja(produto.loja)` (nome da loja, nao ID)

**Nova secao de pecas utilizadas:**
- Listar `osVinculada.pecas` em uma mini-tabela com descricao, valor e origem
- Exibir apenas quando existirem pecas na OS vinculada

### Layout do card atualizado

```text
+----------------------------------------------------------+
| Servico Concluido - Validacao Pendente                   |
|----------------------------------------------------------|
| Resumo do Tecnico: [texto]                               |
| Custo Pecas (OS): R$ xxx | OS ID: OS-XXX                |
|----------------------------------------------------------|
| Pecas Utilizadas:                                        |
| | Descricao | Valor | Origem |                          |
| | Tela LCD  | R$200 | Estoque|                          |
|----------------------------------------------------------|
| Val. Entrada | Val. Original | Val. Custo                |
| R$ 3.100     | R$ 3.100      | R$ 3.100                  |
|                                                          |
| Custo Assist.| Venda Recom.  | Loja Atual                |
| R$ 350       | Pendente      | Loja Centro               |
|                                                          |
| Custo Composto: R$ 3.450                                 |
+----------------------------------------------------------+
```

### Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/OSAssistenciaDetalhes.tsx` | Adicionar `setEditStatus(novoStatus)` em `handleConfirmarFinalizacao` |
| `src/pages/EstoqueProdutoPendenteDetalhes.tsx` | Expandir card de validacao com campos financeiros, loja e pecas |

