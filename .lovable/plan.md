
# Regra: Colaboradores de "Acesso Geral" podem selecionar responsaveis manualmente

## Contexto

A loja "Acesso Geral" (ID: `90dc7c04-d4f8-4c95-82d7-13f600be4e31`, tipo "Administrativo") agrupa colaboradores com visao administrativa do sistema (Thiago, Fellipe, Isaac, Leandro, Matheus). Esses usuarios precisam poder atribuir responsabilidade a outros colaboradores em vez de ficarem travados no proprio nome.

## Problema

Atualmente, todos os campos de "Responsavel" sao auto-preenchidos com o colaborador logado e bloqueados (`disabled`). Isso impede que usuarios de Acesso Geral (gestores administrativos) facam lancamentos em nome de outros colaboradores.

## Solucao

Criar uma funcao utilitaria `isAcessoGeral()` que verifica se o colaborador logado pertence a loja "Acesso Geral". Quando sim, os campos de responsavel permanecem editaveis (Autocomplete/Select). Quando nao, seguem a regra atual de auto-preenchimento bloqueado.

---

## Acoes

### Acao 1: Adicionar `loja_id` ao Colaborador no AuthStore

O `authStore.ts` atualmente nao carrega o `loja_id` do colaborador. Sem esse dado, nao e possivel verificar se o usuario pertence a "Acesso Geral".

- Adicionar `loja_id?: string` a interface `Colaborador`
- Incluir `loja_id` no SELECT de `fetchColaborador`
- Mapear `loja_id` no retorno

### Acao 2: Criar helper `isUsuarioAcessoGeral()`

Criar uma funcao utilitaria reutilizavel (ou exportar do authStore) que retorna `true` se o `loja_id` do colaborador logado corresponde ao ID da loja "Acesso Geral".

Abordagem: buscar a loja pelo nome "Acesso Geral" no cadastroStore e comparar com o `loja_id` do usuario. Isso evita hardcodar o UUID.

```text
// src/utils/permissoesUtils.ts
export function isUsuarioAcessoGeral(user, obterLojas): boolean {
  if (!user?.colaborador?.loja_id) return false;
  const lojas = obterLojas();
  const acessoGeral = lojas.find(l => l.nome === 'Acesso Geral');
  return acessoGeral?.id === user.colaborador.loja_id;
}
```

### Acao 3: Atualizar paginas com campo "Responsavel"

Em cada pagina que tem campo de responsavel bloqueado, adicionar a verificacao: se `isUsuarioAcessoGeral()` retorna `true`, renderizar o componente editavel (Autocomplete ou Select); caso contrario, manter o Input disabled.

Paginas afetadas:

| Pagina | Campo | Comportamento |
|--------|-------|---------------|
| `VendasNova.tsx` | vendedor | Se Acesso Geral: Autocomplete editavel. Senao: Input disabled |
| `VendasAcessorios.tsx` | vendedor | Mesma logica |
| `OSAssistenciaNova.tsx` | tecnicoId | Se Acesso Geral: Select editavel. Senao: auto-preenchido |
| `EstoqueNotaCadastrar.tsx` | responsavelLancamento | Se Acesso Geral: Autocomplete editavel. Senao: Input disabled |
| `EstoqueNovaMovimentacaoMatriz.tsx` | responsavelLancamento | Se Acesso Geral: Select editavel. Senao: Input disabled |
| `OSMovimentacaoPecas.tsx` | responsavel | Se Acesso Geral: editavel. Senao: disabled |
| `OSSolicitacoesPecas.tsx` | responsavelCompra | Se Acesso Geral: editavel. Senao: disabled |

### Acao 4: Ajustar inicializacao do campo

Para usuarios de Acesso Geral, o campo de responsavel ainda deve inicializar com o colaborador logado como valor padrao, mas permitir alteracao. Para demais usuarios, o valor e fixo e imutavel.

---

## Detalhes Tecnicos

### Arquivos a criar
- `src/utils/permissoesUtils.ts` -- helper `isUsuarioAcessoGeral`

### Arquivos a editar
1. `src/store/authStore.ts` -- adicionar `loja_id` a interface e ao fetch
2. `src/pages/VendasNova.tsx` -- condicional no campo vendedor
3. `src/pages/VendasAcessorios.tsx` -- condicional no campo vendedor
4. `src/pages/OSAssistenciaNova.tsx` -- condicional no campo tecnico
5. `src/pages/EstoqueNotaCadastrar.tsx` -- condicional no campo responsavel
6. `src/pages/EstoqueNovaMovimentacaoMatriz.tsx` -- condicional no campo responsavel
7. `src/pages/OSMovimentacaoPecas.tsx` -- condicional no campo responsavel
8. `src/pages/OSSolicitacoesPecas.tsx` -- condicional no campo responsavel

### Padrao condicional no JSX

```text
const acessoGeral = isUsuarioAcessoGeral(user, obterLojas);

// No JSX:
{acessoGeral ? (
  <AutocompleteColaborador ... />  // editavel
) : (
  <Input value={user?.colaborador?.nome} disabled className="bg-muted" />
)}
```

### Estimativa
- 1 arquivo novo + 8 arquivos editados
- Complexidade: Baixa-Media
- Nenhuma migration SQL necessaria
