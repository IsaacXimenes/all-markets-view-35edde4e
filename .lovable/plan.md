

## Remocao da Aba Duplicada e Centralizacao no Modulo Estoque

### Problema

Foi criada uma aba "Aparelhos Pendentes" duplicada dentro do modulo de Assistencia (`/os/aparelhos-pendentes`) com uma pagina propria (`OSAparelhosPendentes.tsx`). Porem, ja existe a aba "Aparelhos Pendentes" no modulo de Estoque (`/estoque/produtos-pendentes`) com fluxo completo de parecer, timeline e detalhamento. O ciclo de vida do aparelho deve ser centralizado nesta aba existente do Estoque.

---

### O que sera feito

**1. Remover a aba duplicada do modulo Assistencia**

- Remover a linha "Aparelhos Pendentes" do array `tabs` em `OSLayout.tsx`
- Remover a mesma linha em `AssistenciaLayout.tsx`
- Remover a rota `/os/aparelhos-pendentes` de `App.tsx`
- O arquivo `OSAparelhosPendentes.tsx` pode ser mantido como referencia ou removido

**2. Adicionar status "Servico Concluido - Validar Aparelho" na aba existente do Estoque**

No `EstoqueProdutosPendentes.tsx`:
- Adicionar o novo status ao tipo `StatusAparelhosPendentes`
- Adicionar badge correspondente (laranja) no `getStatusBadge`
- Adicionar opcao no filtro de Status

**3. Atualizar o detalhamento do produto pendente para validacao pos-oficina**

No `EstoqueProdutoPendenteDetalhes.tsx`:
- Quando `statusGeral === 'Servico Concluido - Validar Aparelho'`, exibir:
  - Resumo do tecnico (vindo da OS vinculada)
  - Custo das pecas/insumos utilizados
  - Calculo do Custo Composto (Aquisicao + Reparos)
- Adicionar novas opcoes no select de Parecer:
  - "Aparelho Aprovado - Retornar ao Estoque" (aprova, soma custo, marca como Disponivel)
  - "Retrabalho - Devolver para Oficina" (recusa com motivo obrigatorio, OS volta para o tecnico)

**4. Sincronizacao entre OS e Produto Pendente**

No `assistenciaApi.ts` (logica de finalizacao da OS com origem Estoque):
- Ao mudar status para "Servico Concluido - Validar Aparelho", localizar o produto pendente correspondente pelo IMEI e atualizar seu `statusGeral` para o mesmo valor
- Adicionar entrada na timeline do produto pendente com os dados do servico

No `osApi.ts` (funcoes de produto pendente):
- Adicionar funcao `atualizarStatusProdutoPendente(imei, novoStatus, dadosOS)` para atualizar o registro na lista de pendentes

---

### Detalhes Tecnicos

#### Arquivos a modificar:

1. **`src/components/layout/OSLayout.tsx`** - Remover linha 14 (Aparelhos Pendentes)
2. **`src/components/layout/AssistenciaLayout.tsx`** - Remover linha 14 (Aparelhos Pendentes)
3. **`src/App.tsx`** - Remover rota `/os/aparelhos-pendentes` e import do `OSAparelhosPendentes`
4. **`src/pages/EstoqueProdutosPendentes.tsx`** - Adicionar status e badge para "Servico Concluido - Validar Aparelho"
5. **`src/pages/EstoqueProdutoPendenteDetalhes.tsx`** - Adicionar opcoes de parecer para validacao pos-oficina (Aprovar/Retrabalho) com exibicao de custo composto
6. **`src/utils/osApi.ts`** - Funcao para atualizar status do produto pendente via IMEI
7. **`src/utils/assistenciaApi.ts`** - Na finalizacao de OS com origem Estoque, chamar a atualizacao do produto pendente

#### Fluxo resultante:

```text
Estoque (Aparelhos Pendentes)
    |
    v  [Encaminhar para Assistencia]
Oficina (Tecnico executa)
    |
    v  [Finalizar OS]
Estoque (Aparelhos Pendentes) - Status: "Servico Concluido - Validar Aparelho"
    |
    +-- [Aprovar] --> Custo somado, aparelho "Disponivel"
    |
    +-- [Retrabalho] --> OS volta para Oficina, status "Retrabalho - Recusado pelo Estoque"
```

Toda a validacao acontece na mesma aba `/estoque/produtos-pendentes`, no detalhamento do registro existente, sem criar abas ou paginas novas.
