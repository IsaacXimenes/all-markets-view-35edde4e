

## Rastreabilidade de Custos por Origem e Integração Financeira

### Resumo

Implementar 3 funcionalidades interligadas: (1) coluna "Origem de Entrada" nas tabelas de solicitações de peça, (2) dashboard de montantes estratégicos segregados por origem com separação Aprovado vs. Pago, e (3) filtro por meio de pagamento na Conferência do Gestor.

---

### 1. Coluna "Origem de Entrada" nas Solicitações de Peça

**Arquivo: `src/utils/solicitacaoPecasApi.ts`**
- Adicionar campo `origemEntrada` na interface `SolicitacaoPeca` (tipo: `'Balcao' | 'Garantia' | 'Estoque'`)
- Na funcao `addSolicitacao`, buscar a OS vinculada via `getOrdemServicoById(data.osId)` e preencher automaticamente `origemEntrada` a partir de `os.origemOS`
- Atualizar os mocks existentes para incluir `origemEntrada` baseado na `origemOS` das OS vinculadas

**Arquivo: `src/pages/OSSolicitacoesPecas.tsx`**
- Adicionar coluna "Origem" no cabecalho da tabela (entre "Loja" e "OS")
- Renderizar badges coloridos:
  - Balcao: badge cinza/neutro
  - Garantia: badge laranja
  - Estoque: badge azul
- Para solicitacoes existentes sem `origemEntrada`, fazer lookup em tempo real via `getOrdemServicoById(sol.osId)?.origemOS`
- Atualizar `colSpan` da mensagem vazia de 12 para 13

---

### 2. Dashboard de Montantes Estrategicos por Origem

**Arquivo: `src/pages/OSSolicitacoesPecas.tsx`**

Substituir os 4 cards atuais (Pendentes, Aprovadas, Enviadas/Financeiro, Recebidas) por um dashboard mais completo:

**Linha 1 - Cards de contagem (manter, compactar):**
- Pendentes | Aprovadas | Financeiro | Recebidas (mantidos, mas em uma unica linha menor)

**Linha 2 - Cards de montantes por origem (novos):**
Tres cards lado a lado, cada um com dois valores:

| Card | Aprovado (Compromisso) | Pago (Caixa Real) |
|------|----------------------|-------------------|
| Pecas - Balcao | Soma das aprovadas com origemEntrada='Balcao' | Soma das que `isPecaPaga()` retorna true |
| Pecas - Garantia | Idem para 'Garantia' | Idem |
| Pecas - Estoque | Idem para 'Estoque' | Idem |

**Logica de calculo (useMemo):**
- "Aprovado": status em ['Aprovada', 'Pagamento - Financeiro', 'Recebida', 'Devolvida ao Fornecedor', 'Retida para Estoque'] - qualquer solicitacao que passou pela aprovacao
- "Pago": usar funcao `isPecaPaga(sol)` existente que verifica se ha nota concluida vinculada

**Linha 3 - Cards de fluxo de caixa:**
Dois cards maiores:

- **Card "Aguardando Pagamento"**: Quantidade e valor total de solicitacoes aprovadas mas sem baixa financeira (status 'Aprovada' ou 'Pagamento - Financeiro')
- **Card "Pagamento Realizado"**: Quantidade e valor total de solicitacoes com pagamento confirmado (`isPecaPaga` = true)

A transicao entre esses estados ja e automatica: a funcao `finalizarNotaAssistencia` no financeiro atualiza o status da solicitacao para 'Recebida'. Nenhuma alteracao de logica e necessaria - apenas a visualizacao.

---

### 3. Filtro por Meio de Pagamento na Conferencia do Gestor

**Arquivo: `src/pages/OSConferenciaGestor.tsx`**

- Adicionar estado `filtroMeioPagamento` (default: 'todos')
- Adicionar um `Select` na area de filtros com opcoes:
  - Todos
  - Pix
  - Cartao Credito
  - Cartao Debito
  - Dinheiro
  - Boleto/Crediario
- No `useMemo` de `osConferencia`, adicionar condicao: se `filtroMeioPagamento !== 'todos'`, filtrar apenas OS que contenham pelo menos um pagamento cujo `meio` inclua o texto selecionado
- Atualizar `limparFiltros` para resetar tambem `filtroMeioPagamento`

---

### Detalhes Tecnicos

**Arquivos modificados:**

| Arquivo | Alteracao |
|---------|-----------|
| `src/utils/solicitacaoPecasApi.ts` | Campo `origemEntrada` na interface + preenchimento auto no `addSolicitacao` + mocks |
| `src/pages/OSSolicitacoesPecas.tsx` | Coluna Origem + dashboard montantes + cards fluxo caixa |
| `src/pages/OSConferenciaGestor.tsx` | Filtro por meio de pagamento |

**Nenhum arquivo novo sera criado.**

A integracao entre Assistencia e Financeiro para transicao automatica de status ja existe na funcao `finalizarNotaAssistencia` (que muda solicitacao para 'Recebida' quando o financeiro confirma pagamento). Os novos cards apenas visualizam essa logica existente.

