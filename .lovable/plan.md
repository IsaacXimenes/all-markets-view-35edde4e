
# Correcoes no Fluxo de Tratativa de Garantia

## Problemas Identificados

1. **Aparelhos de qualquer loja aparecem na selecao** -- O modal de selecao de aparelho em `GarantiaDetalhes.tsx` (linha 68-76) filtra apenas por `quantidade > 0` e busca textual, sem filtrar pela loja da venda original (`garantia.lojaVenda`).

2. **Aparelhos com status diferente de "Disponivel" aparecem** -- O filtro nao verifica o status derivado do aparelho (via `getStatusAparelho`). Aparelhos "Em movimentacao", "Emprestimo", "Bloqueado", etc. nao devem aparecer.

3. **Anexos nao expandem ao clicar na miniatura** -- O componente `FileUploadComprovante` mostra uma miniatura de 12x12px mas nao abre um dialog de visualizacao ampliada. O padrao correto ja existe no `ComprovantePreview` que usa um `Dialog` para expandir a imagem.

4. **IMEI nao aparece nas Tratativas Registradas** -- No card "Tratativas Registradas" (linhas 555-570), tanto para emprestimo quanto para troca, so mostra `aparelhoEmprestadoModelo` / `aparelhoTrocaModelo`, sem o IMEI.

5. **Devolucao nao limpa campos de emprestimo no estoque** -- Nos dois fluxos de devolucao (GarantiaDetalhes.tsx linhas 694-711 e GarantiasEmAndamento.tsx linhas 141-183), o `updateProduto` nao limpa `statusEmprestimo`, `emprestimoGarantiaId`, `emprestimoClienteId`, `emprestimoClienteNome`, `emprestimoOsId`, `emprestimoDataHora`. Por isso o aparelho continua como "Emprestimo" no estoque.

6. **Historico de emprestimo nao registrado na timeline do produto** -- Nem o emprestimo nem a devolucao registram entradas na timeline interna do produto (`produto.timeline`). Apenas a timeline da garantia recebe entradas.

7. **Alerta desatualizado sobre aprovacao do gestor** -- Em `GarantiaDetalhes.tsx` (linhas 505-512), ainda existe um `Alert` dizendo "Esta tratativa requer aprovacao do gestor", mas o fluxo de aprovacao foi removido.

---

## Alteracoes Planejadas

### 1. `src/pages/GarantiaDetalhes.tsx` -- Filtro de aparelhos por loja e status

**Linhas 68-76** -- Alterar o `useMemo` de `aparelhosDisponiveis`:
- Filtrar por `p.loja === garantia.lojaVenda` (apenas aparelhos da loja da venda original)
- Filtrar por `getStatusAparelho(p) === 'Disponivel'` (apenas aparelhos disponiveis)
- Importar `getStatusAparelho` de `estoqueApi`

### 2. `src/pages/GarantiaDetalhes.tsx` -- IMEI nas Tratativas Registradas

**Linhas 555-570** -- Adicionar IMEI nos cards de emprestimo e troca:
- Emprestimo: exibir `t.aparelhoEmprestadoModelo` + `t.aparelhoEmprestadoImei`
- Troca: exibir `t.aparelhoTrocaModelo` + `t.aparelhoTrocaImei`

### 3. `src/pages/GarantiaDetalhes.tsx` -- Anexos com visualizacao expandida

**Linhas 136-172 do FileUploadComprovante** -- Como o componente `FileUploadComprovante` e usado para upload/preview de estado, a solucao e adicionar funcionalidade de clique para expandir a miniatura usando um `Dialog` (mesmo padrao de `ComprovantePreview`).

Alternativa mais simples: Envolver a miniatura da `FileUploadComprovante` (quando ja tem valor) em um botao que abre um `Dialog` com a imagem ampliada. Isso sera feito no proprio `FileUploadComprovante.tsx` para beneficiar todos os usos.

### 4. `src/pages/GarantiaDetalhes.tsx` -- Remover alerta de aprovacao

**Linhas 505-512** -- Remover o `Alert` que diz "Esta tratativa requer aprovacao do gestor antes da execucao das acoes de estoque."

### 5. `src/pages/GarantiaDetalhes.tsx` -- Corrigir devolucao (limpar campos de emprestimo + timeline do produto)

**Linhas 694-711** -- No `updateProduto` da devolucao, adicionar:
```
statusEmprestimo: null,
emprestimoGarantiaId: undefined,
emprestimoClienteId: undefined,
emprestimoClienteNome: undefined,
emprestimoOsId: undefined,
emprestimoDataHora: undefined,
```

Adicionar entrada na timeline do produto (emprestimo e devolucao):
```
produto.timeline.push({ tipo: 'saida_matriz', titulo: 'Devolucao Emprestimo Garantia', descricao: '...' })
```

### 6. `src/pages/GarantiasEmAndamento.tsx` -- Mesma correcao de devolucao

**Linhas 141-183** -- No `handleDevolucao`, o `updateTratativa` e chamado mas o produto nao e atualizado no estoque. Adicionar:
- `updateProduto` com limpeza dos campos de emprestimo (mesmo que item 5)
- Registrar na timeline do produto
- Importar `updateProduto`, `addMovimentacao`, `getProdutoById` de estoqueApi

### 7. `src/components/estoque/FileUploadComprovante.tsx` -- Miniatura clicavel com dialog

Adicionar estado `showPreviewDialog` e um `Dialog` que mostra a imagem em tamanho completo quando o usuario clica na miniatura (12x12). Isso segue o padrao do `ComprovantePreview`.

---

## Resumo dos Arquivos Modificados

1. **`src/pages/GarantiaDetalhes.tsx`** -- Filtro loja+status, IMEI nas tratativas, remover alerta aprovacao, corrigir devolucao
2. **`src/pages/GarantiasEmAndamento.tsx`** -- Corrigir devolucao (limpar campos emprestimo, timeline produto)
3. **`src/components/estoque/FileUploadComprovante.tsx`** -- Miniatura clicavel com dialog de visualizacao ampliada
