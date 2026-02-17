

## Correcoes: Integracao Estoque na Edicao + Redimensionar Modal Historico

### Parte 1: Integracao do Estoque na Edicao de OS (Aba Servico)

**Problema:** No `handleSave` de `OSAssistenciaEditar.tsx`, ao salvar a OS com pecas do tipo "Peca no estoque", a funcao `darBaixaPeca` nao e chamada. Na tela de Nova Assistencia isso funciona porque `darBaixaPeca` e chamada ao salvar. Na edicao, simplesmente nao foi implementado.

**Correcao:** No `handleSave` de `src/pages/OSAssistenciaEditar.tsx`, antes de chamar `updateOrdemServico`, adicionar logica para dar baixa nas pecas do estoque que sao novas (que nao existiam na OS original). Isso evita dar baixa duplicada em pecas que ja foram descontadas.

Logica:
1. Identificar pecas com `pecaNoEstoque === true` e `pecaEstoqueId` preenchido
2. Comparar com as pecas originais da OS (`osOriginal.pecas`) para encontrar apenas as novas
3. Para cada peca nova do estoque, chamar `darBaixaPeca(pecaEstoqueId, quantidadePeca, osId)`
4. Se falhar (estoque insuficiente), mostrar toast de erro e abortar

---

### Parte 2: Redimensionar Modal de Historico de Movimentacao

**Problema:** No `src/pages/OSPecas.tsx`, o modal de historico (linhas 498-566) tem componentes que ultrapassam os limites do modal em telas menores. O `DialogContent` usa `max-w-2xl` mas a tabela interna com 5 colunas pode transbordar.

**Correcao no `src/pages/OSPecas.tsx`:**
1. Alterar `DialogContent` de `max-w-2xl` para `max-w-3xl max-h-[85vh]`
2. Envolver o conteudo interno em um `ScrollArea` com altura controlada
3. Adicionar `overflow-x-auto` na div da tabela para scroll horizontal em telas pequenas
4. Reduzir o padding e tamanho de fontes dos itens da tabela para melhor encaixe

---

### Detalhes Tecnicos

**Arquivo `src/pages/OSAssistenciaEditar.tsx` - handleSave (apos linha ~264):**

```text
// Dar baixa no estoque para pecas novas
const pecasOriginaisIds = osOriginal?.pecas?.map(p => p.pecaEstoqueId).filter(Boolean) || [];

for (const peca of pecas) {
  if (peca.pecaNoEstoque && peca.pecaEstoqueId && !pecasOriginaisIds.includes(peca.pecaEstoqueId)) {
    const resultado = darBaixaPeca(peca.pecaEstoqueId, peca.quantidadePeca || 1, id);
    if (!resultado.sucesso) {
      toast({ title: 'Erro no estoque', description: resultado.mensagem, variant: 'destructive' });
      return;
    }
  }
}
```

**Arquivo `src/pages/OSPecas.tsx` - Modal Historico (linhas 499-565):**

- `DialogContent`: adicionar `max-w-3xl max-h-[85vh] flex flex-col`
- Conteudo do modal: envolver em `ScrollArea` com `className="flex-1 overflow-auto"`
- Div da tabela: adicionar `overflow-x-auto` para garantir scroll horizontal

