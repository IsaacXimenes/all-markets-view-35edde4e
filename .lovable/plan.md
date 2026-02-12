

# Plano - Correcoes no Modulo de Assistencia (6 problemas)

## Problema 1: Pagamentos nao editaveis nos Detalhes da OS

Na tela `OSAssistenciaDetalhes.tsx`, o card de Pagamentos (linhas 653-685) nao tem modo de edicao. Ele sempre renderiza a tabela estatica, sem condicional `isEditing`.

**Correcao:** Quando `isEditing === true`, renderizar o componente `PagamentoQuadro` (mesmo usado na Nova Assistencia) em vez da tabela estatica. Adicionar estado `editPagamentosQuadro` para rastrear pagamentos editados e incluir no `handleSaveChanges`.

---

## Problema 2: OS criada pela Analise de Tratativas sem cliente quando origem e Estoque

Em `OSAnaliseGarantia.tsx` (linhas 171-173), quando a origem e "Estoque", o codigo so define `origemOS = 'Estoque'` sem buscar nenhum dado adicional (clienteId, modelo, IMEI). Esses dados ficam vazios.

**Correcao:** No bloco `else if (registroAprovado.origem === 'Estoque')`, buscar o produto pendente via `getProdutoPendenteById(registroAprovado.origemId)` e extrair modelo/IMEI do produto. O clienteId pode ficar vazio (preenchido depois na edicao).

---

## Problema 3: Editar na Nova Assistencia deve abrir mesmo layout do Detalhe com campos habilitados

Atualmente ao clicar no lapis (Edit) na listagem `OSAssistencia.tsx`, o sistema navega para `/os/assistencia/${id}` (detalhes em modo leitura). O usuario quer que ao clicar no lapis, abra a mesma tela de detalhes mas ja com edicao habilitada.

**Correcao:** Na acao de editar da tabela em `OSAssistencia.tsx`, navegar para `/os/assistencia/${os.id}?edit=true`. No `OSAssistenciaDetalhes.tsx`, ler o parametro `edit` do URL e iniciar com `isEditing = true` quando presente.

---

## Problema 4: Mensagens de validacao ao preencher Origem de Compra

Na `OSAssistenciaNova.tsx` (linhas 1464-1496), o alerta de campos obrigatorios inclui "Origem da Compra" (linha 1466) e "Modelo do Aparelho" (linha 1467). O usuario relata que ao preencher esses campos as mensagens de validacao persistem indevidamente. Tambem os labels (linhas 889, 905) ficam com `text-destructive` enquanto vazios, gerando ruido visual.

**Correcao:** Remover "Origem da Compra" e "Modelo do Aparelho" da lista de campos obrigatorios no alerta (linhas 1466-1467). Remover as classes `text-destructive` e `border-destructive` condicionais dos campos de Origem e Modelo.

---

## Problema 5: Unidade de Servico retorna lojas em vez de cadastros tipo Assistencia

No card de Pecas/Servicos da `OSAssistenciaNova.tsx` (linha 1181-1185), o `AutocompleteLoja` usa `apenasLojasTipoLoja={true}`, que filtra apenas lojas do tipo "Loja". O usuario precisa que retorne cadastros do tipo "Assistencia".

**Correcao:** Alterar de `apenasLojasTipoLoja={true}` para `filtrarPorTipo="Assistência"` no AutocompleteLoja da Unidade de Servico. O componente ja suporta essa prop nativamente (linha 48 do AutocompleteLoja.tsx).

---

## Problema 6: Solicitacoes de pecas perdidas ao registrar OS

Na `OSAssistenciaNova.tsx` (linhas 730-753), as solicitacoes sao persistidas via `addSolicitacao` apos a criacao da OS. Porem o estado `solicitacoesPecas` e local (React state) e nao sobrevive a navegacao. O problema e que apos registrar a OS, o sistema navega para `/os/assistencia` e os dados locais se perdem. Ao editar a OS via detalhes, as solicitacoes deveriam ser carregadas via `getSolicitacoesByOS`, o que ja acontece (linha 76).

O problema real e que ao salvar edicoes no `handleSaveChanges` (linhas 91-111), as solicitacoes adicionadas no formulario de edicao sao salvas via `addSolicitacao` (linha 630-643), mas o `setSolicitacoesOS` que atualiza a UI faz refresh correto. Preciso investigar se o `getSolicitacoesByOS` esta retornando dados corretamente.

**Correcao:** Garantir que apos `handleSaveChanges` no detalhes, o estado `solicitacoesOS` seja recarregado via `getSolicitacoesByOS(os.id)`. Tambem no registro original (Nova Assistencia), verificar que `addSolicitacao` esta sendo chamado corretamente e que os dados persistem na API mock.

---

## Secao Tecnica

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/OSAssistenciaDetalhes.tsx` | Adicionar PagamentoQuadro em modo edicao; ler param `?edit=true` para iniciar em modo edicao; recarregar solicitacoes apos salvar |
| `src/pages/OSAnaliseGarantia.tsx` | Buscar dados do produto pendente quando origem e "Estoque" para preencher modelo/IMEI |
| `src/pages/OSAssistencia.tsx` | Alterar navegacao do botao Edit para incluir `?edit=true` |
| `src/pages/OSAssistenciaNova.tsx` | Remover validacao de Origem da Compra; alterar Unidade de Servico para filtrar por tipo "Assistencia"; verificar persistencia de solicitacoes |

