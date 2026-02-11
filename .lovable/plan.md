

# Plano de Implementacao - Ajustes em Vendas, Financeiro e RH

## 1. Nova Venda - Preencher Loja automaticamente ao selecionar Responsavel

**Arquivo:** `src/pages/VendasNova.tsx`

Ao selecionar o colaborador no campo "Responsavel", o sistema consultara o `obterColaboradorById` do `useCadastroStore` para obter o `loja_id` do colaborador e preenchera automaticamente o campo "Loja de Venda" com essa loja.

- Alterar o `onChange` do `AutocompleteColaborador` (linha ~1118) para uma funcao que, alem de `setVendedor(id)`, busca o colaborador via `obterColaboradorById(id)` e chama `setLojaVenda(colaborador.loja_id)`.

## 2. Venda Balcao - Modal de Acessorios e Valor Unit. editavel

**Arquivo:** `src/pages/VendasAcessorios.tsx`

### 2.1 Redimensionar modal de acessorios
- Alterar `max-w-3xl` para `max-w-4xl` na DialogContent do modal de selecao de acessorios (linha 936).

### 2.2 Tornar Valor Unit. editavel na tabela de acessorios
- Na tabela de acessorios adicionados (linha ~658), substituir o texto estatico `formatCurrency(item.valorUnitario)` por um input editavel com mascara de moeda.
- Ao alterar o valor unitario, recalcular `valorTotal = valorUnitario * quantidade`.

## 3. Financeiro - Conferencia de Contas: Remover Historico de Conferencias

**Arquivo:** `src/pages/FinanceiroConferencia.tsx`

- Remover o bloco "Historico de Conferencias" (linhas ~1282-1306) do painel lateral de detalhes da venda, que exibe o card com icone `History` e a lista de conferencias realizadas. Manter apenas as informacoes do registro atual (validacoes de pagamento, observacoes, aprovacao do gestor, etc.).

## 4. RH Feedback - Scroll nos modais

**Arquivo:** `src/pages/RHFeedback.tsx`

### 4.1 Modal de Detalhes sem scroll
- O modal de detalhes (linha 355) ja tem `max-h-[90vh]` e `ScrollArea`, mas pode estar com problema de overflow. Ajustar para garantir que o `ScrollArea` ocupe o espaco disponivel corretamente com `overflow-y-auto` e altura adequada.

### 4.2 Modal de Registrar Feedback sem scroll
- Mesmo ajuste no modal de registro (linha 532).

### 4.3 Select de colaborador mostrando codigo + nome
- Na linha 554-555, o `SelectItem` exibe `{c.id} - {c.nome} ({c.cargo})`. Remover o `c.id` para exibir apenas `{c.nome} ({c.cargo})`.

### 4.4 Layout do Anexar Documento + icone de camera
- Substituir o input de arquivo (linhas 623-656) por um layout mais visual com dois botoes: um para upload de arquivo e outro com icone de camera para captura direta.
- Adicionar import do icone `Camera` do lucide-react.

## Detalhes Tecnicos

### Arquivo: `src/pages/VendasNova.tsx`
- Criar funcao `handleVendedorChange(id)` que faz:
  ```
  setVendedor(id);
  if (id) {
    const col = obterColaboradorById(id);
    if (col) setLojaVenda(col.loja_id);
  }
  ```
- Substituir `onChange={setVendedor}` por `onChange={handleVendedorChange}` no AutocompleteColaborador.

### Arquivo: `src/pages/VendasAcessorios.tsx`
- Modal: `max-w-3xl` -> `max-w-4xl`
- Na tabela, coluna Valor Unit.: trocar de texto para `InputComMascara` com mascara "moeda", com `onBlur` para recalcular o total.
- Funcao `handleUpdateValorUnitario(itemId, novoValor)` que atualiza o item no array `acessorios`.

### Arquivo: `src/pages/FinanceiroConferencia.tsx`
- Remover linhas 1282-1306 (bloco do Historico de Conferencias).

### Arquivo: `src/pages/RHFeedback.tsx`
- Modal detalhes e registro: ajustar ScrollArea para funcionar com scroll.
- SelectItem: `{c.id} - {c.nome}` -> `{c.nome} ({c.cargo})`
- Anexar documento: layout com dois botoes (Upload e Camera) em cards visuais, usando `useRef` para input file e input capture.

