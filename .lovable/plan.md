

# Paridade de Modais entre VendasEditar e VendasNova + Timeline de Alteracoes

## Contexto

Ao editar uma venda a partir da Conferencia de Lancamento ou Conferencia do Gestor, o sistema abre a pagina `VendasEditar`. Porem, essa pagina possui modais e funcionalidades simplificados em comparacao com a `VendasNova`. O usuario espera que a experiencia de edicao seja identica, com registro de timeline a cada alteracao.

## Diferencas identificadas entre VendasEditar e VendasNova

### Modal de Selecionar Produto
- **VendasNova**: Possui abas "Produtos - Estoque" e "Produtos - Pendentes", filtra produtos pela loja da venda, mostra produtos de outras lojas como "apenas visualizacao" (bloqueados), valida produtos bloqueados/emprestados/em movimentacao
- **VendasEditar**: Modal simples com todos os produtos sem filtro por loja da venda, sem aba de pendentes, sem bloqueio de visualizacao de outras lojas

### Modal de Base de Troca
- **VendasNova**: Inclui campo "Entrega do Aparelho" (Entregue no Ato / Com o Cliente), upload de Termo de Responsabilidade, upload de Fotos do Aparelho, leitor de codigo de barras para IMEI, mascara de IMEI formatada (00-000000-000000-0)
- **VendasEditar**: Modal basico sem tipo de entrega, sem uploads de termo/fotos, sem scanner de codigo de barras, mascara de IMEI simples

### Tabela de Trade-In (quadro principal)
- **VendasNova**: Mostra colunas de Status de Entrega e Anexos (icones clicaveis para Termo e Fotos), abas Upgrade/Downgrade, validacao de Downgrade com campo Chave PIX obrigatoria, cards de conformidade
- **VendasEditar**: Tabela basica sem coluna de status/anexos, sem Upgrade/Downgrade, sem Chave PIX

### Quadro de Resumo
- **VendasNova**: Inclui comissao do vendedor, cards de Downgrade/PIX, card de informacao Sinal, prejuizo em acessorios
- **VendasEditar**: Resumo mais simples, sem cards de Downgrade

### Timeline de alteracoes
- **VendasEditar**: Ja detecta alteracoes e registra via `registrarEdicaoVenda` e `registrarEdicaoFluxo`, mas sem granularidade por campo especifico no registro da timeline unificada

## Solucao

### 1. Arquivo: `src/pages/VendasEditar.tsx` - Modal de Selecionar Produto

- Adicionar abas "Produtos - Estoque" e "Produtos - Pendentes" identicas a VendasNova
- Filtrar produtos pela loja da venda (usando `getLojaEstoqueReal`)
- Mostrar produtos de outras lojas como "apenas visualizacao" (badge "Outra loja", botao desabilitado)
- Bloquear produtos com `bloqueadoEmVendaId`, `statusMovimentacao`, `statusEmprestimo`
- Importar `getLojaEstoqueReal` e `getProdutosPendentes`

### 2. Arquivo: `src/pages/VendasEditar.tsx` - Modal de Base de Troca

- Adicionar campo "Entrega do Aparelho" (Select: "Entregue no Ato" / "Com o Cliente")
- Adicionar secao condicional para "Com o Cliente" com:
  - Upload de Termo de Responsabilidade (file input)
  - Upload de Fotos do Aparelho (file input multiplo)
  - Alerta visual explicando a obrigatoriedade
- Adicionar botao de Scanner de Codigo de Barras (BarcodeScanner)
- Atualizar mascara de IMEI para formato 00-000000-000000-0
- Atualizar validacao em `handleAddTradeIn` para exigir `tipoEntrega`, `termoResponsabilidade` e `fotosAparelho` quando "Com o Cliente"

### 3. Arquivo: `src/pages/VendasEditar.tsx` - Tabela de Trade-In

- Adicionar abas Upgrade/Downgrade (identicas a VendasNova)
- Adicionar colunas "Status" e "Anexos" na tabela de trade-ins
- Adicionar logica de deteccao automatica Upgrade/Downgrade
- Adicionar campo Chave PIX obrigatoria para Downgrade
- Adicionar cards de conformidade (Upgrade em Conformidade / Downgrade em Conformidade)
- Adicionar card de Saldo a Devolver com info de PIX
- Adicionar estados: `tipoOperacaoTroca`, `chavePix`, `saldoDevolver`, `hasValidDowngrade`, `isUpgradeInvalido`
- Importar `Tooltip`, `TooltipContent`, `TooltipTrigger`, `Camera`, `Image`, `BarcodeScanner`

### 4. Arquivo: `src/pages/VendasEditar.tsx` - Quadro de Resumo

- Adicionar card de Comissao do Vendedor
- Adicionar card de prejuizo em acessorios
- Adicionar card de PIX a Devolver (Downgrade)
- Adicionar card de informacao de Sinal
- Bloquear quadro de pagamentos em Downgrade
- Importar `calcularComissaoVenda`, `getComissaoColaborador`

### 5. Arquivo: `src/pages/VendasEditar.tsx` - Timeline de Alteracoes

- Na funcao `handleConfirmarSalvar`, apos detectar alteracoes, registrar entrada na timeline unificada (`addTimelineEntry`) com:
  - `entidadeId`: ID da venda
  - `entidadeTipo`: 'Produto' (ou tipo adequado)
  - `tipo`: 'edicao_venda'
  - `titulo`: 'Venda Editada'
  - `descricao`: resumo das alteracoes (ex: "Cliente alterado, Pagamentos alterados, Total alterado")
  - `metadata`: objeto com array de `alteracoesDetectadas`
- Importar `addTimelineEntry` de `timelineApi`

### 6. Arquivo: `src/pages/VendasEditar.tsx` - Preview de Anexos

- Adicionar estado `previewAnexo` para visualizacao de Termo e Fotos
- Adicionar modal de preview identico ao de VendasNova
- Adicionar funcao `abrirPreviewAnexo`

## Arquivos a modificar

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/VendasEditar.tsx` | Paridade completa de modais, tabelas, quadros e funcionalidades com VendasNova + registro de timeline |

## Observacoes

- A pagina de Conferencia do Gestor ja possui o botao "Editar" no painel lateral (linha 874), que navega para `/vendas/editar/${vendaSelecionada.id}`
- A pagina de Conferencia de Lancamento ja possui o botao de editar (icone Pencil) na tabela (linha 649)
- Nao e necessario alterar as paginas de conferencia, apenas o VendasEditar precisa ter paridade com VendasNova

