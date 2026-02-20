

## Padronizacao do Seletor de Pecas e Refinamentos na Consignacao

### Resumo

Implementar um seletor de pecas estilo "Nova Venda" no modulo de Assistencia, com visualizacao colunada e transparencia de estoque entre lojas. Adicionar campos informativos de valores de referencia. Sincronizar automaticamente a Unidade de Servico com a Loja da OS. Filtrar apenas lojas tipo "Assistencia" na criacao de lotes de consignacao. Refinar a auditoria de acerto e padronizar a UI da aba de Consignacao.

---

### 1. Seletor de Pecas estilo "Nova Venda" (`src/pages/OSAssistenciaNova.tsx`)

**Situacao atual (linhas 1179-1224):** Quando o tecnico seleciona "Peca no estoque", o sistema usa um `<Select>` simples com badges inline. Isso dificulta a visualizacao do estoque por loja.

**Alteracao:** Substituir o `<Select>` por um botao "Buscar Peca no Estoque" que abre um `<Dialog>` modal com:
- Campo de busca por descricao/modelo
- Filtro por loja (Select com todas as lojas de assistencia)
- Tabela colunada com colunas: Descricao | Modelo | Loja | Qtd | Valor Custo | Valor Recomendado | Acoes (botao "Selecionar")
- Pecas de outras lojas visiveis porem desabilitadas (apenas visualizacao), com separador visual identico ao de VendasNova (linha 2824-2863)
- Filtrar apenas pecas com `status === 'Disponivel'` e sem `statusMovimentacao`

**Novos campos informativos (somente leitura):** Apos selecionar a peca, exibir abaixo do seletor:
- "Valor Recomendado: R$ X,XX" (campo `valorRecomendado` da peca)
- "Valor de Custo: R$ X,XX" (campo `valorCusto` da peca)
- Ambos em `<Input disabled>` com `className="bg-muted"`

### 2. Sincronizacao Unidade de Servico com Loja da OS (`src/pages/OSAssistenciaNova.tsx`)

**Situacao atual (linha 1282-1288):** O campo "Unidade de Servico" em cada peca/servico e selecionavel manualmente via `AutocompleteLoja`.

**Alteracao:** Preencher automaticamente `peca.unidadeServico` com o valor de `lojaId` (loja da OS). Implementar via `useEffect` que observa mudancas em `lojaId` e atualiza todas as pecas que ainda nao tem `unidadeServico` definido. Manter o campo editavel para casos excepcionais.

### 3. Filtro de Lojas na Consignacao (`src/pages/OSConsignacao.tsx`)

**Situacao atual (linha 256):** O campo Loja no formulario de novo lote usa `<AutocompleteLoja apenasLojasTipoLoja />`, que retorna todas as lojas tipo "Loja".

**Alteracao:** Substituir `apenasLojasTipoLoja` por `filtrarPorTipo="Assistência"` para retornar apenas unidades de assistencia.

### 4. Correcao do Tecnico no Quadro de Pecas Usadas (`src/pages/OSConsignacao.tsx`)

**Situacao atual (linha 542):** O campo `item.tecnicoConsumo` ja e exibido, mas pode estar vazio quando o consumo e feito via `darBaixaPeca` sem passar o nome do tecnico real.

**Alteracao em `src/utils/consignacaoApi.ts` (funcao `registrarConsumoConsignacao`):** Garantir que o parametro `tecnico` nunca seja "Sistema" quando um tecnico real existe. O valor ja e passado corretamente pelo caller (`darBaixaPeca`), mas validar que o callback `onConsumoPecaConsignada` em `pecasApi.ts` recebe o tecnico real da OS.

**Alteracao em `src/utils/pecasApi.ts` (funcao `darBaixaPeca`):** Verificar que o parametro `tecnico` e repassado corretamente ao callback `onConsumoPecaConsignada`. Atualmente (linha ~220), o fallback e `'Sistema'` - manter, pois o caller (OSAssistenciaNova) ja passa o tecnico real.

### 5. Timeline Automatica no Acerto (`src/pages/OSConsignacao.tsx`)

**Situacao atual:** Ao clicar "Gerar Lote Financeiro", a timeline registra apenas o evento generico de acerto.

**Alteracao em `handleConfirmarAcerto`:** Antes de chamar `iniciarAcertoContas`, injetar na timeline do lote um resumo consolidado de todas as tratativas: consumos (com OS e tecnico), transferencias entre lojas e devolucoes. Isso sera feito iterando `loteSelecionado.timeline` e criando um registro de fechamento com descricao consolidada.

### 6. Padronizacao Visual da Consignacao (`src/pages/OSConsignacao.tsx`)

**Alteracoes pontuais de UI:**
- Cards de dashboard: usar `StatsCard` ou padronizar com icones alinhados e fontes consistentes (text-xs para labels, text-2xl para valores)
- Botoes: garantir variantes consistentes (`variant="default"` para acoes primarias, `variant="outline"` para secundarias)
- Espacamento: verificar `gap-4` e `space-y-6` em conformidade com outras abas
- Tabelas: usar `ResponsiveTableContainer` do design system
- Formularios: usar `Label` do design system com `text-sm font-medium`

A aba ja segue boa parte do padrao. Os ajustes serao incrementais para alinhar estilos de badges, fontes e espacamentos.

---

### Detalhes Tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/OSAssistenciaNova.tsx` | Substituir Select de pecas por Dialog modal colunado; adicionar campos Valor Recomendado e Valor de Custo (read-only); auto-preencher Unidade de Servico com lojaId |
| `src/pages/OSConsignacao.tsx` | Filtrar lojas por tipo "Assistencia" no novo lote; injetar timeline consolidada no acerto; ajustes visuais de padronizacao |
| `src/utils/pecasApi.ts` | Sem alteracao funcional (validar passagem do tecnico no callback) |
| `src/utils/consignacaoApi.ts` | Sem alteracao funcional (fluxo de tecnico ja correto) |

### Sequencia de Implementacao

1. `OSAssistenciaNova.tsx` - Novo modal de selecao de pecas + campos de referencia + auto-fill unidade
2. `OSConsignacao.tsx` - Filtro de lojas assistencia + timeline acerto + ajustes visuais

