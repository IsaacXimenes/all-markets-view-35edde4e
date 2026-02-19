

## Agrupamento de Pagamentos por Fornecedor

### Resumo

Implementar a funcionalidade de agrupar solicitacoes de pecas do mesmo fornecedor em um unico lote de pagamento, com trava de seguranca por fornecedor na selecao, visualizacao de lotes agrupados no Financeiro, e baixa automatica em cascata ao confirmar pagamento.

---

### 1. API - Novo conceito de Lote (`src/utils/solicitacaoPecasApi.ts`)

**Nova interface `LotePagamento`:**
```
- id: string (ex: 'LOTE-001')
- fornecedorId: string
- solicitacaoIds: string[]
- valorTotal: number
- dataCriacao: string
- status: 'Pendente' | 'Concluido'
- responsavelFinanceiro?: string
- formaPagamento?: string
- contaPagamento?: string
- dataConferencia?: string
```

**Nova funcao `agruparParaPagamento`:**
- Recebe array de IDs de solicitacoes aprovadas (todas do mesmo fornecedor)
- Valida que todas sao do mesmo fornecedor
- Muda status de cada solicitacao para 'Pagamento - Financeiro'
- Cria um unico `LotePagamento` contendo todos os IDs
- Cria uma unica `NotaAssistencia` com tipo 'Lote', consolidando todos os itens e vinculando o `loteId`
- Registra na timeline de cada OS vinculada

**Atualizar `NotaAssistencia`:**
- Adicionar campo opcional `loteId?: string`
- Adicionar campo opcional `solicitacaoIds?: string[]` (para lotes com multiplas solicitacoes)

**Nova funcao `finalizarLotePagamento`:**
- Reutiliza logica similar a `finalizarNotaAssistencia` mas iterando sobre todas as solicitacoes do lote
- Marca todas as solicitacoes como 'Recebida'
- Atualiza timeline de cada OS com referencia ao lote
- Registra uma unica despesa consolidada no financeiro

---

### 2. Selecao Inteligente com Trava de Fornecedor (`src/pages/OSSolicitacoesPecas.tsx`)

**Logica de selecao:**
- Novo estado `fornecedorSelecionadoAgrupamento: string | null`
- Ao selecionar a primeira solicitacao aprovada, capturar o `fornecedorId`
- Checkboxes de solicitacoes com fornecedor diferente ficam `disabled`
- Ao limpar todas as selecoes, resetar o fornecedor travado
- Exibir toast de alerta se tentar selecionar fornecedor diferente

**Botao "Agrupar para Pagamento":**
- Substituir/complementar o botao "Encaminhar Selecionados" existente
- Quando ha 2+ solicitacoes selecionadas do mesmo fornecedor: mostrar "Agrupar para Pagamento (X itens)"
- Quando ha apenas 1 selecionada: manter comportamento atual "Encaminhar Selecionados (1)"
- Modal de confirmacao exibindo fornecedor, lista de pecas e valor total consolidado

---

### 3. Visualizacao de Lotes no Financeiro (`src/pages/FinanceiroNotasAssistencia.tsx`)

**Coluna "Tipo" existente:**
- Notas com `loteId` exibem badge "Lote Agrupado" (icone de pacote) em vez de "Pecas"
- Notas normais continuam exibindo "Pecas"

**Modal de Detalhamento do Lote:**
- Quando o financeiro clica em "Conferir" em uma nota de lote, o modal exibe:
  - Cabecalho: Fornecedor, valor total consolidado
  - Tabela detalhada: Data Solicitacao | ID OS | Peca | Qtd | Valor Individual
  - Secao de pagamento (campos existentes: conta, forma, comprovante)
- Ao clicar "Finalizar Nota", executa a baixa em cascata de todas as solicitacoes do lote

**Baixa em cascata:**
- A funcao `finalizarNotaAssistencia` sera estendida para verificar se a nota possui `solicitacaoIds` (lote)
- Se sim, itera sobre todos os IDs, marcando cada solicitacao como 'Recebida' e registrando na timeline: "Pagamento confirmado via Lote #[ID] em [Data]"
- Registra uma unica despesa financeira com o valor total

---

### Detalhes Tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/utils/solicitacaoPecasApi.ts` | Interface `LotePagamento`, campos `loteId` e `solicitacaoIds` em `NotaAssistencia`, funcao `agruparParaPagamento`, extensao de `finalizarNotaAssistencia` para lotes |
| `src/pages/OSSolicitacoesPecas.tsx` | Trava de fornecedor nos checkboxes, botao "Agrupar para Pagamento", modal de confirmacao com detalhamento |
| `src/pages/FinanceiroNotasAssistencia.tsx` | Badge "Lote Agrupado", modal expandido com tabela de detalhamento individual, baixa em cascata |

Nenhum arquivo novo sera criado. O fluxo de encaminhamento individual (1 solicitacao) permanece funcional e inalterado.

