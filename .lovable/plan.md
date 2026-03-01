
# Plano: Autenticacao Real com Supabase Auth + Profiles

## Status: ✅ IMPLEMENTADO

### O que foi feito:

1. **Tabela `profiles`** criada com trigger `handle_new_user` para auto-criação no signup
2. **75 usuarios** criados no Supabase Auth com senha temporária `TI@2025!temp`
3. **authStore.ts** refatorado: login async via Supabase Auth, `onAuthStateChange`, `first_login` check
4. **LoginForm.tsx** atualizado: validação `primeiro.ultimo`, transliteração de acentos para email
5. **ProtectedRoute.tsx** atualizado: loading state, redirecionamento para `/definir-senha` se `first_login=true`
6. **DefinirSenha.tsx** criada: página de primeiro acesso com validação de senha
7. **Navbar.tsx** atualizado: logout async, avatar com iniciais reais do colaborador
8. **App.tsx** atualizado: rota pública `/definir-senha`
9. **Edge Function `seed-users`**: cria/atualiza usuários e vincula a colaboradores

### Fluxo de login:
- Usuário digita `primeiro.ultimo` + senha
- Sistema converte para `primeiro.ultimo@thiagoimports.com.br` (acentos removidos)
- Autentica via Supabase Auth
- Se `first_login=true`, redireciona para `/definir-senha`
- Após definir senha, acessa o Dashboard normalmente

### Senha temporária padrão:
`TI@2025!temp` — Todos os 75 usuários precisam trocar no primeiro acesso.

### Nota:
- A tabela `colaboradores` está vazia, então os profiles não estão vinculados ainda. Quando os colaboradores forem cadastrados, executar `seed-users` novamente para vincular automaticamente.
