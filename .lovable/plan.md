

## Correções de Segurança no Fluxo de Peças Não Utilizadas

### Problema Geral
O modal "Gerenciar Peça Não Utilizada" em `OSOficina.tsx` possui falhas de validação que permitem ações inconsistentes, como marcar peças como "Pagas" quando o pagamento ainda está pendente, e continuar exibindo peças que já tiveram seu ciclo encerrado.

---

### 1. Corrigir Validação de Status de Pagamento

**Arquivo:** `src/pages/OSOficina.tsx`

**Problema atual (linhas 871-872):**
A lógica considera "Paga" qualquer peça que NÃO esteja em `['Pendente', 'Aprovada', 'Enviada', 'Aguardando Aprovação']`. Isso faz com que status como `'Pagamento - Financeiro'` (pagamento ainda em andamento) sejam tratados como "Paga".

**Correção:**
Usar a função `isPecaPaga` de `solicitacaoPecasApi.ts` que já verifica corretamente se há nota concluída. Importar e usar essa função no modal em vez da lógica local imprecisa. Também ajustar a mesma lógica na função `handleMarcarNaoUtilizada` (linhas 293-295) para consistência.

Exibir badges com textos corretos:
- Status real "Paga" (verde) -- apenas se `isPecaPaga` retornar true
- "Aguardando Pagamento" (amarelo) -- para status intermediários como `'Pagamento - Financeiro'`
- "Não Paga" (cinza) -- para peças pendentes/aprovadas

Quando a peça NÃO for paga, o botão de ação mostrará "Cancelar Solicitação" em vez de "Marcar Não Utilizada", e a mensagem informativa será ajustada.

Bloquear a incorporação ao estoque (cenário B) se a peça não tiver pagamento concluído.

---

### 2. Filtrar Peças com Ciclo Encerrado

**Arquivo:** `src/pages/OSOficina.tsx`

**Problema atual (linha 277-278):**
O filtro exclui apenas `'Cancelada'` e `'Rejeitada'`, mas não exclui `'Devolvida ao Fornecedor'` e `'Retida para Estoque'` -- que são estados finais do tratamento de peça.

**Correção:**
Expandir o filtro em `handleAbrirGerenciarPeca` para também excluir esses estados terminais:
```
const statusFinais = ['Cancelada', 'Rejeitada', 'Devolvida ao Fornecedor', 'Retida para Estoque'];
```

Aplicar o mesmo filtro nos dois pontos onde solicitações são carregadas para exibir o botão (linhas 433-434 e 453-454).

---

### 3. Bloquear Incorporação para Peças Devolvidas

Já resolvido pelo item 2 -- peças com status `'Devolvida ao Fornecedor'` serão filtradas e não aparecerão no modal. Como segurança adicional, a função `handleMarcarNaoUtilizada` verificará se o status atual da solicitação é um estado final antes de executar qualquer ação.

---

### 4. Visibilidade Condicional do Botão

**Arquivo:** `src/pages/OSOficina.tsx`

Com a correção do item 2, o filtro já exclui todos os estados finais. Se todas as solicitações estiverem em estado final, `solicitacoesOS.length` será 0 e o botão será ocultado automaticamente.

---

### Detalhes Técnicos

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/OSOficina.tsx` | Importar `isPecaPaga`; expandir filtro de status finais em 3 pontos; corrigir lógica de pagamento no modal e na função de ação; adicionar validação de segurança antes de executar |

Nenhum arquivo novo será criado. Todas as alterações são no `OSOficina.tsx`.

