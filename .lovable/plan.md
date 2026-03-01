
# Plano: Finalizar Login, Primeiro Acesso e Automacao de Responsavel

## Estado Atual

Apos analise detalhada, a maior parte do fluxo ja esta implementada:

- **Login primeiro.ultimo**: Funciona. `LoginForm.tsx` converte username para email com transliteracao de acentos. OK.
- **Trigger `handle_new_user`**: Existe e vincula colaborador automaticamente por matching de nome. OK.
- **Rota `/definir-senha` protegida**: `FirstLoginRoute` exige autenticacao + `first_login = true`. OK.
- **Pagina `DefinirSenha`**: Atualiza senha via `supabase.auth.updateUser` e seta `first_login = false`. OK.
- **`ProtectedRoute`**: Redireciona para `/definir-senha` se `first_login = true`. OK.
- **RLS em `profiles`**: Usuarios autenticados podem ler todos os profiles e atualizar o proprio. OK.
- **65 arquivos** ja importam `useAuthStore` e muitos ja usam o colaborador logado.

## Lacunas a Resolver

### 1. Paginas de criacao com campo "Responsavel" editavel (deveria ser auto-preenchido e bloqueado)

Os seguintes modulos ainda permitem selecao manual do responsavel em vez de usar o usuario logado automaticamente:

| Pagina | Campo | Situacao |
|--------|-------|----------|
| `VendasNova.tsx` | `vendedor` (Responsavel) | Autocomplete editavel, deveria auto-preencher com colaborador logado |
| `VendasAcessorios.tsx` | `vendedor` (Responsavel) | Autocomplete editavel, deveria auto-preencher com colaborador logado |
| `OSAssistenciaNova.tsx` | `tecnicoId` | Editavel, nao auto-preenche |
| `EstoqueNotaCadastrar.tsx` | `responsavelLancamento` | Ja inicializa com `user?.colaborador?.id` mas ainda permite edicao |

### 2. Inicializacao automatica do responsavel em formularios

Alguns formularios inicializam o campo com string vazia em vez de usar o colaborador logado.

---

## Acoes

### Acao 1: Auto-preencher e bloquear "Responsavel" em VendasNova

- Inicializar `vendedor` com `user?.colaborador?.id` em vez de string vazia
- Inicializar `lojaVenda` automaticamente baseado no rodizio ou loja do colaborador
- Trocar o `AutocompleteColaborador` por um `Input` com `disabled` mostrando o nome do colaborador logado
- Manter a logica de determinacao de loja (rodizio) na inicializacao

### Acao 2: Auto-preencher e bloquear "Responsavel" em VendasAcessorios

- Mesma logica da Acao 1: inicializar `vendedor` com colaborador logado e bloquear campo

### Acao 3: Auto-preencher tecnico em OSAssistenciaNova

- Inicializar `tecnicoId` com `user?.colaborador?.id` quando o usuario logado for tecnico
- Manter editavel apenas para gestores (que podem atribuir OS a outros tecnicos)

### Acao 4: Garantir campo bloqueado em EstoqueNotaCadastrar

- O campo ja inicializa com o colaborador logado, mas ainda permite edicao
- Trocar o `AutocompleteColaborador` por `Input` com `disabled`

### Acao 5: Validar pagina DefinirSenha com guards internos

- Adicionar verificacao de `isAuthenticated` e `isFirstLogin` dentro do componente
- Redirecionar para `/login` se nao autenticado ou para `/` se `first_login` ja e `false`
- Isso complementa a protecao da rota `FirstLoginRoute`

---

## Detalhes Tecnicos

### Arquivos a editar

1. **`src/pages/VendasNova.tsx`** -- Auto-preencher vendedor com colaborador logado, bloquear campo, auto-determinar loja
2. **`src/pages/VendasAcessorios.tsx`** -- Mesmo tratamento de VendasNova
3. **`src/pages/OSAssistenciaNova.tsx`** -- Auto-preencher tecnico com colaborador logado (quando aplicavel)
4. **`src/pages/EstoqueNotaCadastrar.tsx`** -- Bloquear campo responsavel (ja inicializa corretamente)
5. **`src/pages/DefinirSenha.tsx`** -- Adicionar guards de autenticacao internos

### Padrao de auto-preenchimento

```text
// Em cada formulario:
const { user } = useAuthStore();

// Inicializacao
const [vendedor] = useState(user?.colaborador?.id || '');

// No JSX: campo somente leitura
<Input value={user?.colaborador?.nome || 'Nao identificado'} disabled className="bg-muted" />
```

### Logica de loja automatica (VendasNova)

Ao auto-preencher o vendedor, o sistema tambem determina a loja:
1. Verifica se o colaborador tem rodizio ativo
2. Se sim, usa a loja de destino do rodizio
3. Se nao, usa a loja cadastrada do colaborador

### Estimativa
- 5 arquivos editados
- Complexidade: Baixa
- Nenhuma migration SQL necessaria (trigger e RLS ja estao corretos)
