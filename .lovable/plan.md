
# Plano - Adicionar Campo de Colaborador Responsavel por Atividade

## Objetivo

Adicionar um campo de selecao de colaborador em cada linha do checklist de atividades, permitindo que o gestor atribua qual colaborador da loja vai realizar cada atividade. O filtro de colaboradores sera automatico conforme a loja do quadro.

## Alteracoes

### 1. Ampliar a interface ExecucaoAtividade (`src/utils/atividadesGestoresApi.ts`)

Adicionar dois novos campos opcionais:
- `colaboradorDesignadoId?: string` - ID do colaborador selecionado
- `colaboradorDesignadoNome?: string` - Nome do colaborador (para exibicao em logs e historico)

Atualizar a funcao `toggleExecucao` para incluir o nome do colaborador designado nos detalhes do log, quando houver.

### 2. Adicionar coluna "Colaborador" na tabela do checklist (`src/pages/GestaoAdmAtividades.tsx`)

- Adicionar uma nova coluna "Colaborador" entre "Atividade" e "Horario Previsto"
- Utilizar o componente `AutocompleteColaborador` inline na celula da tabela, com a prop `filtrarPorLoja` preenchida automaticamente com o `lojaId` do quadro correspondente
- O campo sera editavel enquanto a atividade estiver pendente, permitindo trocar o colaborador mesmo apos a selecao
- Ao selecionar um colaborador, a execucao sera atualizada via uma nova funcao `atualizarColaboradorExecucao` na API
- O colaborador designado nao altera a logica de pontuacao nem status - serve como registro de quem foi designado para realizar a tarefa

### 3. Nova funcao na API (`src/utils/atividadesGestoresApi.ts`)

Criar `atualizarColaboradorExecucao(data, atividadeId, lojaId, colaboradorId, colaboradorNome)` que:
- Localiza a execucao no localStorage
- Atualiza os campos `colaboradorDesignadoId` e `colaboradorDesignadoNome`
- Salva de volta no localStorage

---

## Secao Tecnica

**Arquivos alterados:**
1. `src/utils/atividadesGestoresApi.ts` - Adicionar campos na interface e funcao de atualizacao
2. `src/pages/GestaoAdmAtividades.tsx` - Adicionar coluna com AutocompleteColaborador filtrado por loja

**Componente reutilizado:** `AutocompleteColaborador` com prop `filtrarPorLoja={lojaId}` para exibir apenas colaboradores vinculados aquela unidade.

**Estilo:** O autocomplete inline na tabela tera tamanho compacto (classe `text-sm`) para manter a legibilidade do quadro.
