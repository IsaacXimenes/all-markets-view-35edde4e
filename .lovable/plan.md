

# Plano: Simplificar Permissoes de Modulos

## Nova regra

- **Todos os funcionarios** veem todos os modulos, EXCETO Financeiro e RH.
- **Funcionarios lotados na unidade "Financeiro"** (ID: 0485360d) tambem podem ver Financeiro e RH.
- **Funcionarios lotados em "Acesso Geral"** (ID: 90dc7c04) possuem acesso total a tudo, como ja funciona hoje.

## Alteracao

### Arquivo: `src/hooks/useUserPermissions.ts`

A logica atual e baseada em perfis (admin, gestor, tecnico, vendedor, estoquista, restrito), cada um com um conjunto fixo de modulos. Vamos simplificar radicalmente:

1. **Remover o `MODULE_MAP` por perfil** -- nao sera mais necessario.

2. **Nova logica de `allowedModules`:**
   - Definir a lista completa de modulos.
   - Se o usuario for Acesso Geral (`isAcessoGeral`), retornar todos os modulos.
   - Verificar se o `loja_id` do colaborador corresponde a unidade "Financeiro" (`0485360d-4e6e-458c-96a4-0e6ba6705214`). Se sim, tambem retornar todos.
   - Caso contrario, retornar todos os modulos EXCETO `'rh'` e `'financeiro'`.

3. **Manter o `perfil`** para uso em outras partes do sistema (ex: RLS, exibicao condicional), mas ele nao controlara mais a visibilidade de modulos no Sidebar/rotas.

4. **`canAccessRoute` e `canAccessModule`** continuam funcionando normalmente, pois consomem `allowedModules`.

### Logica simplificada (pseudocodigo):

```text
ALL_MODULES = [rh, financeiro, estoque, vendas, garantias, assistencia, gestao, relatorios, cadastros, dados-antigo, settings]
RESTRICTED = [rh, financeiro]

se isAcessoGeral -> ALL_MODULES
se loja_id == ID_FINANCEIRO -> ALL_MODULES
senao -> ALL_MODULES sem RESTRICTED
```

### Nenhuma outra alteracao necessaria

O Sidebar (`Sidebar.tsx`) e o `ProtectedRoute.tsx` ja consomem `canAccessModule` e `canAccessRoute` do hook, entao a mudanca no hook se propaga automaticamente para toda a interface.

## Resumo

| Arquivo | Alteracao |
|---------|----------|
| `src/hooks/useUserPermissions.ts` | Simplificar logica: todos veem tudo, exceto Financeiro e RH (restritos a lotados no Financeiro ou Acesso Geral) |

