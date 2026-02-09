

# Plano: Melhorias nos Modulos Gestao Administrativa e Financeiro

## 1. Filtro de Periodo na Conferencia Diaria (`GestaoAdministrativa.tsx`)

Adicionar campos "Data Inicio" e "Data Fim" como filtro primario, mantendo o filtro de competencia como secundario. A competencia pre-carrega o mes, mas o periodo permite refinar por intervalo de datas.

**Alteracoes:**
- Adicionar estados `dataInicio` e `dataFim` (tipo `Date | undefined`)
- Adicionar dois DatePickers (Popover + Calendar) na area de filtros, antes do filtro de competencia
- Quando o usuario seleciona uma competencia, pre-preencher `dataInicio` e `dataFim` com o primeiro e ultimo dia do mes
- Filtrar o array `conferencias` pelo intervalo de datas selecionado

## 2. Checkbox com Confirmacao em Duas Etapas (`GestaoAdministrativa.tsx`)

Ao clicar no checkbox de conferencia, em vez de marcar/desmarcar diretamente, abrir um modal de confirmacao.

**Alteracoes:**
- Criar estado para o modal de confirmacao (`modalConfirmacaoCheck`) com dados do metodo/dia sendo alterado
- Ao clicar no checkbox, abrir o modal mostrando: Data, Metodo, Valor e a acao (Marcar/Desmarcar)
- Somente ao confirmar no modal, executar o `toggleConferencia` (que ja gera log tanto para marcar quanto desmarcar)
- O log ja esta implementado na API para ambos os cenarios (linhas 293-307 do `gestaoAdministrativaApi.ts`)

## 3. Filtro de Periodo nos Lotes de Stories (`GestaoAdmStoriesLotes.tsx`)

Mesma logica do item 1: adicionar DatePickers de "Data Inicio" e "Data Fim" junto ao filtro de competencia.

**Alteracoes:**
- Adicionar estados `dataInicio` e `dataFim`
- Adicionar DatePickers na area de filtros
- Filtrar `lotesFiltrados` pelo intervalo de datas (campo `lote.data`)

## 4. Autocomplete para Selects de Loja/Vendedor nas abas de Gestao Administrativa

Substituir os `<Select>` estaticos por componentes `AutocompleteLoja` e `AutocompleteColaborador` em:
- `GestaoAdministrativa.tsx`: filtros de Loja e Vendedor
- `GestaoAdmStoriesLotes.tsx`: filtro de Loja

**Alteracoes:**
- Importar `AutocompleteLoja` e `AutocompleteColaborador`
- Substituir os `<Select>` correspondentes
- Ajustar os valores "todas"/"todos" para string vazia (padrao dos Autocompletes) e tratar na logica de filtragem

## 5. Coluna Comprovante no Financeiro Conferencia (`FinanceiroConferencia.tsx`)

Substituir a miniatura/preview por texto simples.

**Alteracoes:**
- Na linha 1068-1073, trocar `<ComprovantePreview>` por um `<Badge>` com texto "Contem Anexo"
- Manter `<ComprovanteBadgeSemAnexo>` para quando nao ha anexo
- O comprovante completo continua visivel ao abrir o detalhamento lateral

## Resumo dos Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/GestaoAdministrativa.tsx` | Filtro periodo, checkbox 2 etapas, autocomplete loja/vendedor |
| `src/pages/GestaoAdmStoriesLotes.tsx` | Filtro periodo, autocomplete loja |
| `src/pages/FinanceiroConferencia.tsx` | Coluna comprovante: texto "Contem Anexo" |

## Detalhes Tecnicos

- DatePickers usam `Popover` + `Calendar` do Shadcn com `pointer-events-auto`
- Autocomplete reutiliza `AutocompleteLoja` (prop `apenasLojasTipoLoja`) e `AutocompleteColaborador`
- O modal de confirmacao do checkbox usa `Dialog` existente com botoes "Confirmar" e "Cancelar"
- Nenhuma alteracao na API `gestaoAdministrativaApi.ts` (logs de marcar/desmarcar ja funcionam)

