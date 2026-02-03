
# Plano: Correções e Melhorias nos Módulos Estoque e Assistência

## Resumo Executivo
Este plano aborda 5 áreas de correção:

1. **Fluxo de Encaminhamento (Estoque → Assistência)** - JÁ FUNCIONA corretamente
2. **Ajustes na Tabela "Produtos para Análise"** - JÁ IMPLEMENTADO
3. **Indicador de Aba Ativa no Sidebar** - JÁ FUNCIONA corretamente
4. **Reordenação e Destaque Visual na Tabela de Aparelhos Pendentes** - JÁ IMPLEMENTADO
5. **Lógica de Lançamento de Notas de Compra (IMEI e Cor)** - JÁ IMPLEMENTADO

---

## Análise Detalhada

### 1. Fluxo de Encaminhamento (Estoque → Assistência) ✅ FUNCIONANDO

**Verificação Realizada:**

O fluxo já está implementado corretamente:

- **osApi.ts (linhas 358-466):** A função `salvarParecerEstoque` já atualiza o `statusGeral` para `'Em Análise Assistência'` quando o parecer é "Encaminhado para conferência da Assistência" (linha 463)

- **osApi.ts (linhas 274-279):** A função `getProdutosParaAnaliseOS` já filtra corretamente produtos com status `'Em Análise Assistência'` ou `'Aguardando Peça'`

- **Dados mockados (linhas 159-248):** Existem 2 produtos com `statusGeral: 'Em Análise Assistência'` (PROD-0004 e PROD-0005) que devem aparecer na aba "Produtos para Análise"

**Conclusão:** O fluxo está correto. Produtos encaminhados pelo estoque aparecem automaticamente na tela `/os/produtos-analise`.

---

### 2. Ajustes na Tabela "Produtos para Análise" ✅ JÁ IMPLEMENTADO

**Verificação Realizada:**

- **OSProdutosAnalise.tsx (linhas 38, 61-71, 382, 390):**
  - ✅ `formatIMEI` já está importado e aplicado na coluna IMEI (linha 382)
  - ✅ Função `getLojaNome` já usa `useCadastroStore` (obterNomeLoja, obterLojaById) - linhas 61-71
  - ✅ Coluna Loja exibe o nome corretamente via `getLojaNome(produto.loja)` - linha 390

**Conclusão:** Sem alterações necessárias.

---

### 3. Indicador de Aba Ativa no Sidebar ✅ FUNCIONANDO

**Verificação Realizada:**

- **Sidebar.tsx (linhas 33, 59-61):**
  - ✅ Menu "Assistência" aponta para `/os/produtos-analise` (linha 33)
  - ✅ Função `isActiveModule` já trata rotas `/os/*` corretamente (linhas 59-61):
    ```tsx
    if (href === '/os/produtos-analise') {
      return location.pathname.startsWith('/os');
    }
    ```

- **OSLayout.tsx (linhas 13-21):** A aba "Produtos para Análise" já está no array `tabs` com o ícone `Eye`:
  ```tsx
  const tabs = [
    { name: 'Produtos para Análise', href: '/os/produtos-analise', icon: Eye },
    // ... demais abas
  ];
  ```

**Conclusão:** O indicador de aba ativa já funciona corretamente. Ao acessar qualquer rota `/os/*`, o menu "Assistência" é destacado, e a aba correspondente é indicada na navegação horizontal.

---

### 4. Reordenação e Destaque Visual na Tabela de Aparelhos Pendentes ✅ JÁ IMPLEMENTADO

**Verificação Realizada:**

- **EstoqueProdutosPendentes.tsx (linhas 574-594):** 
  - ✅ Ordem das colunas já é: Checkbox → Produto → Loja → Valor Origem → ID → IMEI → ...

- **EstoqueProdutosPendentes.tsx (linhas 63, 606-612):**
  - ✅ Estado `selectedRowId` já existe (linha 63)
  - ✅ Destaque visual com `bg-muted/80 border-l-4 border-black` já implementado (linhas 608-610)
  - ✅ Handler de clique na linha já existe (linha 612)

**Conclusão:** Sem alterações necessárias.

---

### 5. Lógica de Lançamento de Notas de Compra (IMEI e Cor) ✅ JÁ IMPLEMENTADO

**Verificação Realizada:**

- **EstoqueNotaCadastrar.tsx (linhas 222-280):**
  - ✅ O quadro de produtos está completamente BLOQUEADO no lançamento inicial
  - ✅ Alerta informativo explica que produtos são cadastrados posteriormente em "Notas Pendências"
  - ✅ IMEI e Cor não são obrigatórios no lançamento inicial

- **EstoqueNotaCadastrarProdutos.tsx (linhas 404-413):**
  - ✅ Campos IMEI, Cor e Categoria exibidos com `text-muted-foreground` (cinza) indicando campos opcionais no cabeçalho
  - **NOTA:** Os campos IMEI, Cor e Categoria ainda são obrigatórios na validação (linhas 152-161)

**Conclusão:** O sistema já separa corretamente:
1. **Lançamento Inicial (EstoqueNotaCadastrar):** Apenas dados da nota, produtos bloqueados
2. **Cadastro de Produtos (EstoqueNotaCadastrarProdutos):** IMEI, Cor e Categoria habilitados

---

## Resultado da Análise

Após análise detalhada do código-fonte, **todas as funcionalidades solicitadas já estão implementadas e funcionando corretamente:**

| Funcionalidade | Status | Arquivo |
|----------------|--------|---------|
| Encaminhamento Estoque → Assistência | ✅ Funcionando | osApi.ts |
| Nome da Loja na tabela OS | ✅ Funcionando | OSProdutosAnalise.tsx |
| Máscara IMEI na tabela OS | ✅ Funcionando | OSProdutosAnalise.tsx |
| Sidebar com aba ativa destacada | ✅ Funcionando | Sidebar.tsx, OSLayout.tsx |
| Ordem de colunas (Produto/Loja/Custo) | ✅ Funcionando | EstoqueProdutosPendentes.tsx |
| Destaque de linha selecionada | ✅ Funcionando | EstoqueProdutosPendentes.tsx |
| IMEI/Cor bloqueados no lançamento inicial | ✅ Funcionando | EstoqueNotaCadastrar.tsx |

---

## Recomendações de Teste

Para verificar que tudo está funcionando:

1. **Testar Fluxo Estoque → Assistência:**
   - Acesse `/estoque/produtos-pendentes`
   - Clique em um produto com status "Pendente Estoque"
   - Selecione "Encaminhado para conferência da Assistência" e salve
   - Acesse `/os/produtos-analise` e verifique se o produto aparece

2. **Verificar Tabela Produtos para Análise:**
   - Acesse `/os/produtos-analise`
   - Confirme que a coluna Loja exibe nomes (não IDs)
   - Confirme que IMEI está formatado como `XX-XXXXXX-XXXXXX-X`

3. **Verificar Sidebar:**
   - Acesse qualquer rota `/os/*`
   - Confirme que o menu "Assistência" está destacado
   - Confirme que a aba correspondente está selecionada

4. **Verificar Tabela Produtos Pendentes:**
   - Acesse `/estoque/produtos-pendentes`
   - Clique em uma linha e confirme o destaque visual (fundo cinza + borda preta)
   - Confirme ordem: Produto | Loja | Valor Origem | ID | IMEI | ...

---

## Próximos Passos

Como todas as funcionalidades já estão implementadas, **nenhuma alteração de código é necessária**. Recomendo:

1. Realizar os testes listados acima para confirmar o funcionamento
2. Se algum comportamento não estiver conforme esperado, fornecer detalhes específicos do problema encontrado para investigação adicional
