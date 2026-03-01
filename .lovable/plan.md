

# Plano: Automacao Global de Primeiro Acesso

## Situacao Atual

A maior parte do fluxo ja esta implementada:
- Trigger `handle_new_user` cria profile com username extraido do email -- OK
- Coluna `first_login` tem default `true` -- OK
- Login converte `primeiro.ultimo` para email -- OK
- `ProtectedRoute` redireciona para `/definir-senha` quando `first_login = true` -- OK
- Pagina `/definir-senha` atualiza senha e seta `first_login = false` -- OK

## Lacunas Identificadas

### 1. Trigger nao vincula colaborador automaticamente
O trigger `handle_new_user` atual apenas insere `id`, `username` e `nome_completo` vazio. Nao tenta vincular ao `colaborador_id` nem preenche flags de funcao.

### 2. Rota `/definir-senha` esta publica
Atualmente em `App.tsx` (linha 212), `/definir-senha` esta fora do `ProtectedRoute`. Isso significa que um usuario nao autenticado pode acessar a pagina, e um usuario autenticado que ja definiu senha tambem pode acessar.

### 3. Pagina `DefinirSenha` nao valida estado de autenticacao
A pagina nao verifica se o usuario esta logado nem se `first_login` e realmente `true`.

---

## Acoes

### Acao 1: Atualizar trigger `handle_new_user` no Supabase

Recriar a funcao para:
- Extrair username do email
- Buscar colaborador correspondente pelo nome (matching primeiro + ultimo nome)
- Preencher `colaborador_id`, `nome_completo`, `cargo`, `eh_gestor`, `eh_vendedor`, `eh_estoquista`
- Manter `first_login = true`

```text
handle_new_user():
  username = split(email, '@')[1]
  buscar colaborador onde LOWER(nome) contenha as partes do username
  se encontrar -> preencher colaborador_id + flags
  se nao -> inserir apenas username com first_login = true
```

### Acao 2: Proteger rota `/definir-senha`

Mover `/definir-senha` de rota publica para dentro de um wrapper protegido que:
- Exige autenticacao (redireciona para `/login` se nao autenticado)
- Permite acesso SOMENTE se `first_login = true`
- Redireciona para `/` se `first_login = false`

Criar um componente `FirstLoginRoute` que encapsula essa logica.

### Acao 3: Adicionar validacao na pagina `DefinirSenha`

Adicionar verificacao de estado do auth store:
- Se nao autenticado, redirecionar para `/login`
- Se `first_login` nao e `true`, redirecionar para `/`

---

## Detalhes Tecnicos

### Arquivos a editar

1. **Migration SQL** -- Recriar funcao `handle_new_user` com vinculacao de colaborador
2. **`src/App.tsx`** -- Mover rota `/definir-senha` para dentro de wrapper protegido
3. **`src/components/auth/ProtectedRoute.tsx`** -- Nenhuma alteracao necessaria (ja funciona)
4. **`src/components/auth/FirstLoginRoute.tsx`** -- Novo componente para proteger `/definir-senha`
5. **`src/pages/DefinirSenha.tsx`** -- Adicionar guards de autenticacao e estado

### Nova funcao SQL `handle_new_user`

A funcao atualizada ira:
1. Inserir o profile com username
2. Executar um UPDATE imediato tentando vincular ao colaborador pelo matching de nome
3. Copiar `nome`, `cargo`, `eh_gestor`, `eh_vendedor`, `eh_estoquista` do colaborador encontrado

### Componente `FirstLoginRoute`

```text
FirstLoginRoute:
  if loading -> spinner
  if !authenticated -> redirect /login
  if !firstLogin -> redirect /
  else -> render Outlet (pagina /definir-senha)
```

### Estimativa
- 1 migration SQL
- 1 novo componente (FirstLoginRoute)
- 2 arquivos editados (App.tsx, DefinirSenha.tsx)
- Complexidade: Baixa
