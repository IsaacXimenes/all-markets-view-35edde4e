

## Plano: Centralizar Visualizacao de Conferencia na Tela de Detalhes da Nota

### Problema Atual
Existem duas telas separadas com logica duplicada:
- **Detalhes da Nota** (`NotaDetalhesContent.tsx`) -- visualizacao completa com assistencia e botoes de Conferir/Recusar
- **Conferencia** (`EstoqueNotaConferencia.tsx`) -- tela separada com sua propria copia dos botoes de assistencia

O usuario quer que ao clicar "Conferir" (na lista de notas ou nos detalhes), abra a **mesma tela de detalhes** (`NotaDetalhesContent`), unificando tudo em um so lugar.

### Mudancas Propostas

#### 1. Redirecionar "Conferir Produtos" para a tela de detalhes (`src/components/estoque/NotaDetalhesContent.tsx`)
- O botao "Conferir Produtos" no detalhamento da nota passara a navegar para `/estoque/nota/{id}/conferencia` normalmente (isso ja funciona).
- **Nenhuma mudanca aqui**, pois a tela de conferencia continuara existindo para o fluxo de check individual + triagem.
- A tela de detalhes ja contem os botoes de Conferir/Recusar assistencia -- esta correto.

#### 2. Remover secao duplicada de Assistencia Tecnica da Conferencia (`src/pages/EstoqueNotaConferencia.tsx`)
- Remover toda a secao "Assistencia Tecnica" (Collapsible com tabela de itens e botoes Conferir/Recusar) da pagina de conferencia.
- Remover o modal de recusa duplicado dessa pagina.
- Remover estados e handlers relacionados: `assistenciaOpen`, `modalRecusaOpen`, `itemRecusa`, `motivoRecusa`, `refreshAssist`, `handleConferirItem`, `handleAbrirRecusa`, `handleConfirmarRecusa`.
- Remover imports que ficarem sem uso (`getOrdemServicoById`, `updateOrdemServico`, `getProdutoByIMEI`, `atualizarCustoAssistencia`, `updateProduto`, `atualizarItemRevisao`, `sincronizarNotaComLote`, `registrarEventoTecnicoNaNota`, `Wrench`, `XCircle`, `RotateCcw`).

#### 3. Garantir navegacao de "Conferir" na lista de notas para os detalhes (`src/components/estoque/TabelaNotasPendencias.tsx` e `src/pages/EstoqueNotasPendencias.tsx`)
- Alterar a navegacao do botao "Conferir" na tabela de notas pendentes: em vez de ir para `/estoque/nota/{id}/conferencia`, ir para `/estoque/nota/{id}` (detalhes da nota).
- Assim o usuario sempre vera a tela completa com cards, produtos, assistencia (com botoes de acao) e timeline.
- A partir dessa tela, o botao "Conferir Produtos" dentro do detalhamento leva para a conferencia especifica quando necessario.

### Resultado Final
- **Tela de Detalhes** (centralizada): exibe tudo -- cards, produtos, assistencia com botoes de Conferir/Recusar, encaminhamento, timeline.
- **Tela de Conferencia**: foca exclusivamente na conferencia fisica dos itens (marcar conferido, explodir, IMEI, cor, categoria, triagem). Sem duplicacao de assistencia.
- **Botao "Conferir" na lista**: leva para detalhes da nota, nao para a conferencia diretamente.

### Detalhes Tecnicos

**Arquivos modificados:**
- `src/pages/EstoqueNotaConferencia.tsx` -- remover secao de assistencia duplicada, modal de recusa, estados e handlers relacionados
- `src/components/estoque/TabelaNotasPendencias.tsx` -- alterar navegacao do botao "Conferir" para `/estoque/nota/{id}`
- `src/pages/EstoqueNotasPendencias.tsx` -- alterar `handleConferir` para navegar para `/estoque/nota/{id}`

**Sem alteracao:**
- `src/components/estoque/NotaDetalhesContent.tsx` -- ja possui os botoes de Conferir/Recusar na assistencia (mantido como esta)
- `src/pages/EstoqueNotaDetalhes.tsx` -- ja renderiza `NotaDetalhesContent` (mantido como esta)

