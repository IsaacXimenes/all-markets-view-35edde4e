
# Plano: Autenticacao Real com Supabase Auth + Profiles

## Visao Geral

Migrar o sistema de login fake (credenciais 123/123 no Zustand) para autenticacao real via Supabase Auth, com regra de usuario `primeiro.ultimo` convertido para email `@thiagoimports.com.br`, tabela `profiles` vinculada a `colaboradores`, e fluxo de primeiro acesso com definicao de senha.

---

## 1. Criar Tabela `profiles` e Trigger

**Migracao SQL:**

```text
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR NOT NULL UNIQUE,        -- ex: isaac.ximenes
  nome_completo VARCHAR NOT NULL,
  colaborador_id UUID REFERENCES colaboradores(id),
  cargo VARCHAR,
  eh_gestor BOOLEAN DEFAULT false,
  eh_vendedor BOOLEAN DEFAULT false,
  eh_estoquista BOOLEAN DEFAULT false,
  first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger para auto-criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, nome_completo)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 2. Criar Usuarios no Supabase Auth via Edge Function

**Nova edge function: `seed-users`**

- Recebe a lista dos 77 usernames autorizados
- Para cada um, chama `supabase.auth.admin.createUser()` com:
  - email: `{username}@thiagoimports.com.br`
  - password: senha temporaria padrao (ex: `TI@2025!temp`)
  - email_confirm: true
- Apos criacao, atualiza `profiles` com `nome_completo` derivado do username (capitalizado) e vincula ao `colaborador_id` correspondente na tabela `colaboradores` (match por nome similar)
- Esta funcao sera executada uma unica vez para popular a base

## 3. Refatorar `authStore.ts`

**Mudancas:**
- Remover `VALID_USERNAME`, `VALID_PASSWORD`, `DEFAULT_COLABORADOR`
- `login` passa a ser async: recebe `username` (primeiro.ultimo), converte para `username@thiagoimports.com.br`, chama `supabase.auth.signInWithPassword()`
- Apos login, busca `profiles` com `colaborador_id` e popula `user.colaborador` com dados reais
- `logout` chama `supabase.auth.signOut()`
- Adicionar `isFirstLogin: boolean` ao estado
- Adicionar listener `onAuthStateChange` para manter sessao sincronizada
- Manter `isAnimating` para a transicao visual existente

**Interface atualizada:**
```text
interface AuthState {
  isAuthenticated: boolean;
  isAnimating: boolean;
  isFirstLogin: boolean;
  isLoading: boolean;
  user: User | null;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  setAnimating: (value: boolean) => void;
}
```

## 4. Refatorar `LoginForm.tsx`

**Mudancas:**
- Placeholder do campo usuario: `primeiro.ultimo`
- Validacao regex: `/^[a-záàâãéèêíóôõúüç]+\.[a-záàâãéèêíóôõúüç]+$/i`
- Se formato invalido: "Formato invalido. Use primeiro.ultimo"
- Se Supabase retornar erro: "Usuario sem permissao de acesso"
- `onSubmit` agora chama `login(username, password)` que e async
- Manter toda a UI/animacao existente (LoginCard, BiometricTransition)

## 5. Criar Pagina `DefinirSenha.tsx`

**Nova pagina:**
- Rota: `/definir-senha`
- Campos: Nova Senha + Confirmar Senha
- Validacao: minimo 6 caracteres, senhas devem coincidir
- Ao submeter: chama `supabase.auth.updateUser({ password })` e atualiza `profiles.first_login = false`
- Redireciona para `/` apos sucesso
- Visual consistente com o tema escuro/dourado do login

## 6. Atualizar `ProtectedRoute.tsx`

**Mudancas:**
- Adicionar estado de loading (enquanto verifica sessao Supabase)
- Se `isFirstLogin === true`, redirecionar para `/definir-senha`
- Se nao autenticado, redirecionar para `/login`
- Mostrar spinner durante verificacao

## 7. Atualizar `App.tsx`

**Mudancas:**
- Adicionar rota publica `/definir-senha`
- Mover inicializacao de caches para DEPOIS da autenticacao (dentro do ProtectedRoute ou AppInitializer condicional)
- Chamar `authStore.initialize()` no AppInitializer para configurar `onAuthStateChange`

## 8. Atualizar `Navbar.tsx`

- Logout agora chama `supabase.auth.signOut()` via store
- Avatar mostra iniciais do nome real do colaborador

## 9. RLS - Politica de Leitura de Profiles

Adicionar politica para que funcoes autenticadas possam ler profiles (necessario para buscar dados do colaborador logado):

```text
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

---

## Detalhes Tecnicos

### Arquivos a criar
1. `src/pages/DefinirSenha.tsx` - Pagina de primeiro acesso
2. `supabase/functions/seed-users/index.ts` - Edge function para criar os 77 usuarios

### Arquivos a editar
1. `src/store/authStore.ts` - Refatoracao completa para Supabase Auth
2. `src/components/login/LoginForm.tsx` - Validacao primeiro.ultimo + async login
3. `src/components/auth/ProtectedRoute.tsx` - Loading state + redirecionamento first_login
4. `src/App.tsx` - Nova rota /definir-senha + inicializacao condicional
5. `src/components/layout/Navbar.tsx` - Logout async + iniciais reais
6. `src/pages/Login.tsx` - Adaptar para novo fluxo async

### Migracao SQL
1. Criar tabela `profiles` com trigger
2. Inserir RLS policies

### Edge Function
1. `seed-users` - Criar 77 usuarios com senha temporaria e vincular a colaboradores

### Ordem de execucao
1. Migracao SQL (tabela + trigger + RLS)
2. Refatorar authStore para Supabase Auth
3. Refatorar LoginForm com validacao primeiro.ultimo
4. Criar pagina DefinirSenha
5. Atualizar ProtectedRoute com loading + first_login check
6. Atualizar App.tsx com nova rota
7. Atualizar Navbar
8. Criar e executar edge function seed-users

### Risco
- **Medio**: Apos implementar, o login 123/123 deixara de funcionar. Todos os 77 usuarios precisarao usar suas credenciais reais.
- **RLS**: As tabelas existentes ja exigem `auth.uid() IS NOT NULL`, entao apos o login real via Supabase Auth, todas as queries continuarao funcionando normalmente.
- **Campos de Responsavel**: Ja estao automatizados via `useAuthStore` - ao popular `user.colaborador` com dados reais do banco, todos os formularios refletirao o usuario logado automaticamente.
