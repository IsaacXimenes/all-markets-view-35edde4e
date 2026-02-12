
# Plano - Correcoes no Modulo de Assistencia e Retirada de Pecas

## Problema 1: OS criada pela Analise de Tratativas sem dados completos

A OS criada pelo fluxo de aprovacao na Analise de Tratativas (`OSAnaliseGarantia.tsx`) chega na tela de detalhes (`OSAssistenciaDetalhes.tsx`) com:
- `pecas: []` (array vazio, sem pecas/servicos)
- `clienteId` pode estar vazio se o match por nome falhar
- `pagamentos: []` (array vazio)

Isso faz com que o quadro de Cliente apareca em branco e o quadro de Pecas/Servicos esteja vazio e sem possibilidade de insercao.

**Correcao:** A tela de detalhes da OS (`OSAssistenciaDetalhes.tsx`) precisa permitir a edicao completa das pecas, pagamentos e cliente quando a OS esta aberta (status diferente de "Servico concluido"). Atualmente o modo de edicao (`isEditing`) so permite alterar cliente, loja, tecnico, status, setor e descricao - falta a edicao inline de pecas/servicos e o quadro de solicitacoes.

### Alteracoes em `src/pages/OSAssistenciaDetalhes.tsx`:
- Adicionar botoes "Adicionar Peca/Servico" e "Remover" no card de Pecas/Servicos quando `isEditing === true`
- Permitir edicao inline dos campos de cada peca (descricao, valor, desconto, checkboxes)
- Integrar o formulario de Solicitacao de Pecas (mesmo layout da Nova Assistencia) sempre visivel, nao apenas quando `solicitacoesOS.length > 0`
- Exibir o formulario para adicionar novas solicitacoes quando em modo edicao

---

## Problema 2: Quadro de Solicitacao de Pecas nao aparece

O codigo atual so renderiza o card de Solicitacoes se `solicitacoesOS.length > 0`. Como a OS recem-criada nao tem solicitacoes, o quadro nao aparece.

### Alteracao em `src/pages/OSAssistenciaDetalhes.tsx`:
- Remover a condicional `solicitacoesOS.length > 0` e sempre exibir o card de Solicitacoes de Pecas
- Quando vazio, exibir mensagem "Nenhuma solicitacao registrada" com botao para adicionar
- Quando `isEditing`, exibir formulario para adicionar novas solicitacoes (peca, quantidade, justificativa, prioridade)

---

## Problema 3: Retirada de Pecas em Aparelhos Pendentes mostra "Aparelho indisponivel"

O `ModalRetiradaPecas` chama `verificarDisponibilidadeRetirada(produto.id)` que usa `getProdutoById` do `estoqueApi.ts`. Essa funcao busca apenas no inventario principal (produtos ja liberados), mas itens em Aparelhos Pendentes estao no `osApi.ts` como `ProdutoPendente` e ainda nao migraram para o estoque.

### Alteracao em `src/utils/retiradaPecasApi.ts`:
- Na funcao `verificarDisponibilidadeRetirada`, alem de buscar em `getProdutoById`, tambem buscar em `getProdutoPendenteById` do `osApi.ts`
- Se o aparelho for encontrado como ProdutoPendente, considerar disponivel (sem verificar quantidade, pois pendentes tem quantidade implicita de 1)

### Alteracao em `src/utils/retiradaPecasApi.ts`:
- Na funcao `solicitarRetiradaPecas`, tambem aceitar aparelhos do tipo ProdutoPendente
- Ao iniciar retirada de um ProdutoPendente, atualizar seu `statusGeral` para "Retirada de Pecas" via `updateProdutoPendente`

---

## Secao Tecnica

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/OSAssistenciaDetalhes.tsx` | Adicionar edicao inline de pecas/servicos no modo edicao; sempre exibir card de solicitacoes; adicionar formulario de novas solicitacoes; importar addSolicitacao |
| `src/utils/retiradaPecasApi.ts` | Em `verificarDisponibilidadeRetirada` e `solicitarRetiradaPecas`, buscar tambem em `getProdutoPendenteById`; atualizar statusGeral do ProdutoPendente ao iniciar retirada |

**Logica da verificacao de disponibilidade corrigida:**
```text
verificarDisponibilidadeRetirada(id)
  |
  +-- Buscar em getProdutoById (estoque principal)
  |     Se encontrado -> verificacoes normais (bloqueio, movimentacao, etc.)
  |
  +-- Se nao encontrado -> Buscar em getProdutoPendenteById (pendentes)
        Se encontrado -> disponivel (sem check de quantidade)
        Se nao encontrado -> "Aparelho nao encontrado"
```
