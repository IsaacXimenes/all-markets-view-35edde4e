
# Plano - Correcoes no Modulo de Assistencia e Financeiro (5 problemas)

## Problema 1: Campo "Descrição" nao retorna opcoes do estoque ao marcar "Estoque" na edicao da OS

Na tela de detalhes/edicao (`OSAssistenciaDetalhes.tsx`, linhas 448-459), o campo de descricao da peca e sempre um `Input` livre, mesmo quando o checkbox "Estoque" esta marcado. Na tela de Nova Assistencia (`OSAssistenciaNova.tsx`, linhas 1108-1140), quando `pecaNoEstoque` e true, o campo muda para um `Select` com as pecas do estoque filtradas por loja.

**Correcao em `OSAssistenciaDetalhes.tsx`:** Replicar a logica da Nova Assistencia no bloco de edicao de pecas. Quando `peca.pecaNoEstoque === true`, renderizar um `Select` com as pecas do estoque (via `getPecas()`) filtradas pela loja da OS (`editLojaId`), exibindo descricao, quantidade e origem. Quando nao marcado, manter o Input livre.

---

## Problema 2: Solicitacoes de Pecas perdidas ao salvar edicao

A solicitacao de peca e adicionada corretamente via `addSolicitacao` (linha 653), e o refresh e feito (linha 662). Porem, ao clicar "Salvar Alteracoes" (`handleSaveChanges`, linha 103), o `updateOrdemServico` nao afeta as solicitacoes (sao independentes). O problema real e que apos salvar e sair do modo de edicao, as solicitacoes continuam visiveis. Preciso verificar se o estado `solicitacoesOS` e mantido apos `setIsEditing(false)`. O reload (linhas 129-131) esta correto.

**Investigacao adicional:** O problema pode estar no fato de que ao adicionar a solicitacao, o status da OS deveria mudar para "Solicitacao Enviada", mas isso nao esta sendo feito automaticamente na edicao. Tambem, a solicitacao precisa ter o campo `lojaSolicitante` corretamente preenchido. Vou garantir que a logica de persistencia funcione e que o `getSolicitacoesByOS` retorne os dados corretamente apos o save.

---

## Problema 3: Coluna "Loja" no quadro de Informacoes da OS retorna apenas lojas tipo "Loja"

Na linha 61, `const lojas = obterLojasTipoLoja();` filtra apenas lojas com `tipo === 'Loja'`. Deveria filtrar por tipo "Assistencia" (conforme correcao anterior aplicada na Unidade de Servico).

**Correcao em `OSAssistenciaDetalhes.tsx`:** Substituir `obterLojasTipoLoja()` por `obterLojasPorTipo('Assistência')` ou usar `AutocompleteLoja` com `filtrarPorTipo="Assistência"` no campo de Loja da edicao (linhas 786-796), mantendo consistencia com o padrao do sistema.

---

## Problema 4: Responsavel Financeiro vazio ao conferir nota

A funcao `obterFinanceiros()` (cadastroStore, linha 251-254) filtra colaboradores cujo cargo contenha "financeiro". Nenhum colaborador mockado possui essa palavra no cargo - existem "Gestor (a)", "Vendedor (a)", "Estoquista", "Tecnico", "Assistente Administrativo".

**Correcao em `src/store/cadastroStore.ts`:** Ampliar o filtro de `obterFinanceiros` para incluir cargos relevantes: "Assistente Administrativo" e "Gestor (a)", que sao os perfis que tipicamente atuam no financeiro. Alternativamente, usar `AutocompleteColaborador` em vez do `Select` para permitir busca em todos os colaboradores ativos.

**Correcao em `src/pages/FinanceiroNotasAssistencia.tsx`:** Substituir o `Select` de "Responsavel Financeiro" por `AutocompleteColaborador` para consistencia com o padrao do sistema e garantir que sempre haja opcoes disponiveis.

---

## Problema 5: Integracao da saida com o Extrato Geral e por Conta

A funcao `finalizarNotaAssistencia` (solicitacaoPecasApi.ts, linhas 527-588) atualiza o status da nota e das solicitacoes, mas nao registra nenhuma despesa/saida no sistema financeiro. O Extrato Geral (`FinanceiroExtrato.tsx`) le despesas via `getDespesas()` do `financeApi.ts`.

**Correcao em `src/utils/solicitacaoPecasApi.ts`:** Na funcao `finalizarNotaAssistencia`, apos finalizar a nota, chamar `addDespesa` do `financeApi.ts` para registrar a saida financeira com:
- descricao: "Pagamento Nota Assistencia [ID]"
- valor: valorTotal da nota
- conta: contaPagamento informada
- tipo/categoria: "Assistencia"
- data: data atual
- status: "Pago"

Isso fara o valor aparecer automaticamente no Extrato Geral e no Extrato por Contas.

---

## Secao Tecnica

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/OSAssistenciaDetalhes.tsx` | Adicionar Select de pecas do estoque quando checkbox "Estoque" marcado; trocar Loja de `obterLojasTipoLoja` para `AutocompleteLoja` com filtro tipo Assistencia |
| `src/store/cadastroStore.ts` | Ampliar filtro de `obterFinanceiros` para incluir "Assistente Administrativo" e "Gestor (a)" |
| `src/pages/FinanceiroNotasAssistencia.tsx` | Substituir Select de Responsavel Financeiro por `AutocompleteColaborador` |
| `src/utils/solicitacaoPecasApi.ts` | Na `finalizarNotaAssistencia`, registrar despesa via `addDespesa` para integracao com Extrato |
