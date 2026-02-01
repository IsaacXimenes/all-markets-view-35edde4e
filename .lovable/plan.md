
# Plano de Implementação: Correções em Múltiplos Módulos

## Resumo das Alterações Solicitadas

O usuário identificou 8 correções/melhorias em diferentes módulos do sistema.

---

## 1. VENDAS - Redimensionar Modal de Itens

**Arquivo:** `src/pages/VendasNova.tsx`

**Problema:** O modal de seleção de produtos (linha 2570) está com tamanho `max-w-4xl`, que pode ser pequeno para visualizar todos os dados.

**Solução:** Aumentar o tamanho do modal para `max-w-6xl` ou `max-w-7xl` para melhor visualização da tabela de produtos.

**Alteração:**
```typescript
// De:
<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">

// Para:
<DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
```

---

## 2. ASSISTÊNCIA - Remover Aba "Lista de Reparos"

**Arquivo:** `src/components/layout/OSLayout.tsx`

**Problema:** A aba "Lista de Reparos" (linha 13) precisa ser removida do layout de navegação.

**Solução:** Remover a entrada correspondente do array `tabs`.

**Alteração:**
```typescript
// Remover esta linha:
{ name: 'Lista de Reparos', href: '/os/produtos-analise', icon: Package },
```

---

## 3. ASSISTÊNCIA > Estoque Assistência - Coluna Loja

**Arquivo:** `src/pages/OSPecas.tsx`

**Problema:** A coluna "Loja" está exibindo o ID da loja (ex: LOJA-001) em vez do nome.

**Análise:** O código já usa `getLojaNome(peca.lojaId)` que chama `obterNomeLoja()` do CadastroStore. O problema está nos dados mockados em `src/utils/pecasApi.ts` que usam IDs como "LOJA-001" em vez dos UUIDs reais do CadastroStore.

**Solução:** Atualizar os dados mockados em `pecasApi.ts` para usar UUIDs válidos do CadastroStore.

---

## 4. ASSISTÊNCIA > Análise de Tratativas - Colunas Técnico e Loja

**Arquivo:** `src/pages/OSAnaliseGarantia.tsx`

**Problema:** 
1. Usa `getColaboradoresByPermissao` e `getLojas` da API antiga (`cadastrosApi`)
2. Ao aprovar uma OS, os dados são enviados com IDs antigos para a tela de Assistência

**Solução:** 
1. Substituir importações da API antiga pelo `useCadastroStore`
2. Usar `obterNomeLoja()` e `obterNomeColaborador()` para exibição
3. Passar UUIDs corretos ao criar a OS

**Alterações principais:**
- Linha 17: Substituir `import { getColaboradoresByPermissao, getLojas }` por `useCadastroStore`
- Linha 26-27: Usar `obterTecnicos()` e `obterLojasTipoLoja()` do store
- Linha 126-133: Usar IDs corretos do store ao chamar `addOrdemServico`

---

## 5. ASSISTÊNCIA > Card Produtos de Troca - Coluna Valor Produto

**Arquivo:** `src/pages/OSAssistencia.tsx`

**Problema:** O card de "Produtos de Troca (Trade-In)" exibe o valor total (R$5.000,00), mas o usuário quer ver esse valor também na coluna "Valor Produto" da tabela.

**Análise:** A tabela já tem uma coluna "Valor Produto" (linha 394) que usa a função `getValorProduto(os)` (linhas 168-177). Para produtos de Trade-In, essa função retorna "-" se `origemOS` não for 'Venda'.

**Solução:** Modificar a função `getValorProduto` para também considerar produtos de origem "Base de Troca" ou buscar o valor dos produtos pendentes relacionados.

---

## 6. ESTOQUE - Remover Aba "Notas Urgência"

**Arquivo:** `src/components/layout/EstoqueLayout.tsx`

**Problema:** A aba "Notas Urgência" precisa ser removida.

**Solução:** Remover a entrada correspondente do array `tabs`.

**Alteração:**
```typescript
// Remover esta linha:
{ name: 'Notas Urgência', href: '/estoque/notas-urgencia', icon: Zap },
```

---

## 7. ESTOQUE > Notas Pendentes - Flag de Urgência

**Arquivos:** 
- `src/pages/EstoqueNotaCadastrar.tsx`
- `src/utils/notaEntradaFluxoApi.ts`
- `src/components/estoque/TabelaNotasPendencias.tsx`

**Problema:** Ao cadastrar nova nota, deve haver uma flag "Solicitação de Urgência" e o registro deve carregar essa identificação.

**Solução:**

1. **Interface NotaEntrada** (notaEntradaFluxoApi.ts):
   - Adicionar campo `urgente: boolean`

2. **Formulário de Cadastro** (EstoqueNotaCadastrar.tsx):
   - Adicionar checkbox "Solicitação de Urgência" no formulário
   - Passar o valor para `criarNotaEntrada`

3. **Tabela** (TabelaNotasPendencias.tsx):
   - Exibir badge/ícone de urgência nas notas marcadas

4. **Remover botão** (EstoqueNotasPendencias.tsx):
   - Remover o botão "Lançamento Urgência" que redirecionava para `/estoque/notas-urgencia`

---

## 8. ESTOQUE > Notas Pendentes - Remover Campo "QTD de Aparelhos Informada"

**Arquivo:** `src/pages/EstoqueNotaCadastrar.tsx`

**Problema:** O campo "Qtd de Aparelhos Informada" (linhas 193-203) deve ser removido do formulário de cadastro de nova nota.

**Solução:** Remover o campo do formulário e ajustar o grid para ocupar o espaço corretamente.

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|-----------|
| `src/pages/VendasNova.tsx` | Aumentar tamanho do modal de produtos |
| `src/components/layout/OSLayout.tsx` | Remover aba "Lista de Reparos" |
| `src/components/layout/EstoqueLayout.tsx` | Remover aba "Notas Urgência" |
| `src/pages/OSAnaliseGarantia.tsx` | Usar CadastroStore para técnicos e lojas |
| `src/pages/OSAssistencia.tsx` | Ajustar função getValorProduto para Trade-In |
| `src/utils/pecasApi.ts` | Corrigir lojaId nos dados mockados |
| `src/pages/EstoqueNotaCadastrar.tsx` | Adicionar flag urgência, remover campo QTD |
| `src/utils/notaEntradaFluxoApi.ts` | Adicionar campo `urgente` na interface |
| `src/components/estoque/TabelaNotasPendencias.tsx` | Exibir indicador de urgência |
| `src/pages/EstoqueNotasPendencias.tsx` | Remover botão "Lançamento Urgência" |

---

## Ordem de Implementação

1. Remover abas (OSLayout e EstoqueLayout)
2. Redimensionar modal de Vendas
3. Corrigir dados mockados de peças (pecasApi.ts)
4. Corrigir OSAnaliseGarantia para usar CadastroStore
5. Ajustar coluna Valor Produto em OSAssistencia
6. Implementar flag de urgência no cadastro de notas
7. Remover campo QTD de Aparelhos Informada
8. Remover botão "Lançamento Urgência"
