

## Explosao de Origem nos Cards + Rastreabilidade nas Tabelas + Unificacao de Interface

### 1. Cards de Custo com Detalhamento por Origem da Peca

**Arquivo: `src/components/assistencia/CustoPorOrigemCards.tsx`**

Expandir a interface `CustosPorOrigem` para incluir sub-totais por `origemPeca` dentro de cada `origemServico`:

```text
Estrutura atual:
  custoBalcao: number
  custoGarantia: number
  custoEstoque: number
  investimentoConsignados: number

Nova estrutura (adicionar):
  detalheBalcao: { consignado: number, estoqueThiago: number, retirada: number, fornecedor: number, manual: number }
  detalheGarantia: { consignado: number, estoqueThiago: number, retirada: number, fornecedor: number, manual: number }
  detalheEstoque: { consignado: number, estoqueThiago: number, retirada: number, fornecedor: number, manual: number }
```

Atualizar as funcoes `calcularCustosPorOrigem` e `calcularCustosDePecas` para popular os sub-totais usando `p.origemPeca`.

No componente visual, abaixo de cada valor principal do `StatsCard`, renderizar uma lista compacta mostrando apenas as origens com valor > 0:
- Texto pequeno (text-xs text-muted-foreground)
- Formato: "Consignado: R$ X | Estoque Thiago: R$ Y | Retirada: R$ Z"

O StatsCard ja possui a prop `description` que pode ser usada, ou alternativamente adicionar um slot de children. A abordagem mais limpa sera substituir o `StatsCard` por cards customizados inline dentro do `CustoPorOrigemCards`, mantendo o mesmo visual mas adicionando a lista de sub-totais abaixo do valor.

**Impacto**: Automaticamente reflete em todos os locais que usam `CustoPorOrigemCards` (Dashboard, OSAssistencia, OSSolicitacoesPecas, FinanceiroNotasAssistencia).

### 2. Coluna "Origem da Peca" nas Tabelas de Pecas

**Arquivo: `src/pages/OSAssistenciaDetalhes.tsx`** (tabela de pecas da OS, linhas ~904-934)
- Adicionar nova coluna `TableHead` "Origem da Peca" apos a coluna "Origem" existente
- Exibir badges coloridos baseados em `peca.origemPeca`:
  - Consignado: badge violeta
  - Estoque Thiago: badge emerald
  - Retirada de Pecas: badge amber
  - Fornecedor: badge blue
  - Manual: badge gray
- Exibir tambem `peca.origemServico` como selo adicional se disponivel

**Arquivo: `src/pages/FinanceiroNotasAssistencia.tsx`** (tabela de detalhamento do lote, linhas ~460-500)
- Adicionar coluna "Origem" na tabela de solicitacoes dentro do modal de conferencia
- Buscar a OS vinculada via `getOrdemServicoById(sol.osId)` e extrair `origemPeca` das pecas correspondentes

**Arquivo: `src/pages/OSAnaliseGarantia.tsx`** (tabela principal, linhas ~348-434)
- Esta tabela lista registros de analise (nao pecas individuais), entao a coluna "Origem da Peca" nao se aplica diretamente aqui. Os registros ja possuem coluna "Origem" (Garantia/Estoque).

### 3. Unificacao da Interface de Selecao de Pecas

Apos comparacao detalhada dos modais de busca de peca:
- **OSAssistenciaNova.tsx** (linhas 2018-2145): Modal com filtro por descricao/modelo, filtro por loja, separacao minha loja vs outras lojas, badges de estoque coloridos, tags [CONSIGNADO]
- **OSAssistenciaEditar.tsx** (linhas 1282-1409): Modal identico ao da Nova OS

Os modais ja estao 100% unificados em termos de estrutura e funcionalidade. Ambos possuem:
- Mesmo layout de Dialog (max-w-4xl)
- Mesmos filtros (busca + loja)
- Mesma separacao minha loja / outras lojas
- Mesmos badges DNA da Peca (origemServico, origemPeca, valorCusto)
- Mesmo calculo baseado em valorCusto

Nenhuma alteracao necessaria neste item - apenas confirmacao de que a unificacao ja esta implementada.

### Arquivos Afetados

1. `src/components/assistencia/CustoPorOrigemCards.tsx` - explosao de origem nos cards
2. `src/pages/OSAssistenciaDetalhes.tsx` - nova coluna "Origem da Peca" na tabela de pecas
3. `src/pages/FinanceiroNotasAssistencia.tsx` - nova coluna "Origem" na tabela do lote no modal

### Resultado Esperado

- Cada card de custo (Balcao, Garantia, Estoque) tera uma lista compacta abaixo do valor total mostrando a composicao por origem da peca (Consignado, Estoque Thiago, Retirada, Fornecedor)
- Na pagina de Detalhes da OS, cada peca tera uma coluna adicional com badge identificando sua origem especifica
- No modal de conferencia do Financeiro, a tabela do lote incluira a origem de cada solicitacao
- A interface de selecao de pecas permanece unificada entre Nova e Edicao (ja implementada)

