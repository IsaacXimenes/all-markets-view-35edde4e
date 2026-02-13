
# Plano - Correcoes em Vendas, Estoque, Financeiro e RH

## Problema 1: Pendentes Digitais - Coluna Responsavel mostra "COL-007"

Os mocks em `vendasDigitalApi.ts` usam IDs falsos (`COL-007`, `COL-008`, `COL-009`) que nao existem no `useCadastroStore`. O componente `VendasPendentesDigitais.tsx` ja usa `obterNomeColaborador(venda.responsavelVendaId)` (linha 161), mas como os IDs nao existem no store, retorna `undefined` e o fallback `venda.responsavelVendaNome` mostra nomes falsos como "Rafael Digital".

**Correcao em `src/utils/vendasDigitalApi.ts`:**
- Substituir os IDs `COL-007`, `COL-008`, `COL-009` por UUIDs reais do `useCadastroStore` (colaboradores ativos existentes)
- Atualizar os nomes correspondentes nos mocks e no array `colaboradoresDigital`

---

## Problema 2: Finalizar Venda Digital - Loja de Venda sempre sera "Loja Online"

Em `VendasFinalizarDigital.tsx` (linhas 685-691), o campo "Loja de Venda" usa `AutocompleteLoja` editavel. Para vendas digitais, a loja deve ser fixa como "Loja Online" (ID: `fcc78c1a`).

**Correcao em `src/pages/VendasFinalizarDigital.tsx`:**
- No `useEffect` de carregamento da venda (linha 146), setar `setLojaVenda('fcc78c1a')` automaticamente
- Substituir o `AutocompleteLoja` por um `Input` desabilitado exibindo "Loja Online"
- Garantir que o valor `fcc78c1a` seja usado no registro da venda

---

## Problema 3: Finalizar Venda Digital - Adequar quadros e modais conforme Nova Venda

A tela `VendasFinalizarDigital.tsx` precisa ser alinhada com `VendasNova.tsx` em todos os quadros e modais.

**Correcao em `src/pages/VendasFinalizarDigital.tsx`:**
- Verificar e alinhar o modal de selecao de produtos (max-w-4xl, colunas, filtros identicos ao VendasNova)
- Garantir que o quadro de acessorios tenha os mesmos controles (+/- quantidade)
- Alinhar o quadro de Trade-In com campos identicos
- Verificar que a secao de Garantia Extendida existe e segue o mesmo modelo
- Verificar o resumo financeiro (Lucro, Margem, Custo, prejuizo)
- Garantir que o PagamentoQuadro usa os mesmos parametros

---

## Problema 4: Estoque - Tipo Produto "Acessorio" nao filtra modelos

Nas telas `EstoqueNotaCadastrar.tsx` e `EstoqueNotaCadastrarProdutos.tsx`, ao selecionar "Acessorio" no campo Tipo Produto, o dropdown de Modelo continua mostrando modelos de aparelhos. A funcao `getModelosAparelhos(marca)` busca em `produtosCadastro` que so contem aparelhos.

**Correcao em `src/pages/EstoqueNotaCadastrar.tsx` e `src/pages/EstoqueNotaCadastrarProdutos.tsx`:**
- Importar `getAcessorios` de `acessoriosApi`
- Quando `tipoProduto === 'Acessorio'`:
  - Ocultar o campo Marca (ou tornar opcional)
  - Substituir o dropdown de Modelo por um dropdown listando as descricoes dos acessorios do cadastro
  - Desabilitar campos IMEI, Cor e Categoria (ja desabilitados)
- Quando `tipoProduto === 'Aparelho'`, manter o comportamento atual

---

## Problema 5: Estoque - Botao Voltar da Nova Nota navega para pagina inacessivel

Em `EstoqueNotaCadastrar.tsx` (linha 309), o botao "Voltar" navega para `/estoque/notas-compra`. Embora esta rota exista, ela nao faz parte das tabs do `EstoqueLayout`, o que pode confundir o usuario que acessou a nova nota a partir de `/estoque/notas-pendencias`.

**Correcao em `src/pages/EstoqueNotaCadastrar.tsx`:**
- Alterar o `navigate('/estoque/notas-compra')` para `navigate('/estoque/notas-pendencias')` (linha 309)
- Atualizar o texto para "Voltar para Notas Pendencias"

---

## Problema 6: Financeiro - Pagamento Downgrade sumindo apos execucao

Dois problemas identificados:

**6a) Registro desaparecendo do historico:**
Em `FinanceiroPagamentosDowngrade.tsx` (linhas 42-47), o filtro de `vendasFinalizadas` verifica `tipoOperacao === 'Downgrade' || pagamentoDowngrade || contaOrigemDowngrade`. Esses campos sao armazenados em `fluxoData` (localStorage). O `useFluxoVendas` com `incluirHistorico: true` inclui vendas finalizadas adicionais, porem o filtro pode falhar se os dados nao forem carregados corretamente apos a execucao. Verificar que o `recarregar()` esta refrescando corretamente.

**6b) Extrato por Conta nao registra saida:**
Em `FinanceiroExtratoContas.tsx` (linha 138-139), a correspondencia de despesas com contas usa `c.nome === despesa.conta`. Porem, `finalizarVendaDowngrade` (em `fluxoVendasApi.ts`, linha 640) salva `conta: contaOrigem` onde `contaOrigem` e o **ID da conta** (ex: `CTA-002`), nao o nome. Isso causa a falha de match e a despesa nao aparece no extrato.

**Correcao em `src/pages/FinanceiroExtratoContas.tsx`:**
- Na linha 138, alterar o match para verificar tanto por nome quanto por ID:
  `const contaEncontrada = contasFinanceiras.find(c => c.nome === despesa.conta || c.id === despesa.conta);`

**Correcao em `src/pages/FinanceiroPagamentosDowngrade.tsx`:**
- Garantir que apos executar o PIX, o registro permanece visivel na aba "Historico" com status "FINALIZADO"

---

## Problema 7: RH Feedback - Modal de Registro sem scroll vertical

Em `RHFeedback.tsx` (linha 533), o modal de "Registrar Novo FeedBack" ja usa `ScrollArea` (linha 541) dentro de um `DialogContent` com `max-h-[90vh] overflow-hidden flex flex-col`. O scroll ja esta implementado, mas pode nao estar funcionando corretamente.

**Correcao em `src/pages/RHFeedback.tsx`:**
- Garantir que o `ScrollArea` tenha uma altura maxima definida (ex: `max-h-[70vh]`)
- Verificar que o `DialogContent` permite overflow correto
- Adicionar `overflow-y-auto` como fallback se o ScrollArea nao funcionar

---

## Secao Tecnica

| Arquivo | Alteracoes |
|---------|-----------|
| `src/utils/vendasDigitalApi.ts` | Substituir IDs falsos (COL-007/008/009) por UUIDs reais do cadastro de colaboradores |
| `src/pages/VendasFinalizarDigital.tsx` | Fixar Loja de Venda como "Loja Online" (fcc78c1a, disabled). Alinhar modais/quadros com VendasNova |
| `src/pages/EstoqueNotaCadastrar.tsx` | Filtrar modelos por tipo produto (Aparelho vs Acessorio). Corrigir botao Voltar para /estoque/notas-pendencias |
| `src/pages/EstoqueNotaCadastrarProdutos.tsx` | Filtrar modelos por tipo produto (Aparelho vs Acessorio) |
| `src/pages/FinanceiroExtratoContas.tsx` | Corrigir match de despesas: comparar tanto por nome quanto por ID da conta |
| `src/pages/FinanceiroPagamentosDowngrade.tsx` | Garantir persistencia do registro no historico apos finalizacao |
| `src/pages/RHFeedback.tsx` | Corrigir scroll vertical no modal de registro de feedback |
