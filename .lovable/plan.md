
# Plano de Correções: Sistema de Notas de Entrada

## Resumo do Problema

Você identificou dois problemas:
1. **Colunas Qtd Inf./Cad./Conf. e % Conf. não atualizam** após conferir aparelhos
2. **Responsável no modal de pagamento** deve ser o usuário logado

---

## Problema 1: Dados não sincronizados entre módulos

### Causa Raiz
Quando você confere produtos e salva, a função `finalizarConferencia` atualiza os dados na memória corretamente. Porém:
- As telas de **Notas Pendências (Estoque)** e **Notas Pendências (Financeiro)** carregam os dados uma única vez ao abrir
- Esses dados ficam "congelados" em um estado local
- Para ver as atualizações, é necessário clicar no botão "Atualizar" manualmente

Além disso, há um erro no cálculo do percentual de conferência:
- Atualmente usa `qtdInformada` como base (quantidade declarada na nota)
- Deveria usar `qtdCadastrada` (quantidade de produtos efetivamente registrados)

### Solução
1. **Atualização automática dos dados** - Após salvar conferência, redirecionar e forçar recarga dos dados
2. **Corrigir cálculo do percentual** - Usar `qtdCadastrada` como denominador

### Arquivos a alterar
- `src/pages/EstoqueNotaConferencia.tsx` - Forçar refresh ao retornar
- `src/components/estoque/TabelaNotasPendencias.tsx` - Corrigir cálculo do percentual
- `src/pages/EstoqueNotasPendencias.tsx` - Adicionar listener para atualização
- `src/pages/FinanceiroNotasPendencias.tsx` - Sincronizar com mesma fonte de dados

---

## Problema 2: Campo Responsável no Modal de Pagamento

### Causa Raiz
O modal de pagamento (`ModalFinalizarPagamento.tsx`) tenta pegar o "usuário logado" da seguinte forma:
- Busca o primeiro colaborador financeiro do cadastro
- Isso não representa o usuário realmente autenticado

O sistema de autenticação (`authStore.ts`) armazena apenas o username ("123"), sem vínculo com os colaboradores cadastrados.

### Solução
1. **Melhorar o authStore** para armazenar informações do colaborador logado
2. **Vincular login ao cadastro de colaboradores** - Buscar colaborador pelo username ou criar campo de email/login
3. **Modal usar o authStore** para identificar o responsável automaticamente

### Arquivos a alterar
- `src/store/authStore.ts` - Adicionar campo para dados do colaborador
- `src/components/estoque/ModalFinalizarPagamento.tsx` - Usar authStore ao invés do primeiro financeiro

---

## Detalhes Técnicos

### Correção 1: Cálculo do Percentual de Conferência

```text
Arquivo: src/components/estoque/TabelaNotasPendencias.tsx

Linha 202-205 - Alterar:
  const calcularPercentualConferencia = (nota: NotaEntrada): number => {
    if (nota.qtdCadastrada === 0) return 0;
    return Math.round((nota.qtdConferida / nota.qtdCadastrada) * 100);
  };
```

### Correção 2: Sincronização de Dados

```text
Arquivo: src/pages/EstoqueNotasPendencias.tsx e FinanceiroNotasPendencias.tsx

Adicionar useEffect que recarrega dados ao receber foco da janela
ou usar um timestamp de atualização compartilhado
```

### Correção 3: Modal de Pagamento com Usuário Logado

```text
Arquivo: src/components/estoque/ModalFinalizarPagamento.tsx

1. Importar useAuthStore
2. Buscar colaborador pelo username do auth
3. Preencher campo responsável com o nome do colaborador encontrado
```

### Correção 4: Melhorar AuthStore (Opcional)

```text
Arquivo: src/store/authStore.ts

Adicionar campo 'colaboradorId' para vincular ao cadastro de colaboradores
```

---

## Sequência de Implementação

1. Corrigir o cálculo do percentual na tabela
2. Implementar sincronização automática de dados entre telas
3. Atualizar modal de pagamento para usar usuário logado do authStore
4. (Opcional) Melhorar sistema de autenticação para vincular ao cadastro

---

## Resultado Esperado

Após as correções:
- ✅ Ao conferir produtos, as colunas Qtd Inf./Cad./Conf. e % Conf. atualizarão automaticamente
- ✅ A visão do Financeiro mostrará os mesmos dados sincronizados
- ✅ O campo Responsável no pagamento será preenchido com o usuário realmente logado
