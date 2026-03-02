

# Controle de Visibilidade por Cargo — Sidebar, Dashboard e Rotas Protegidas

## Resumo

Implementar controle de acesso baseado no campo `role` da tabela `user_roles` (via funcao `has_role`) e no cargo do colaborador, filtrando:
1. Itens visiveis na Sidebar
2. Cards/secoes visiveis no Dashboard
3. Bloqueio de rotas por URL (redirecionamento para `/`)

## Mapeamento de Perfis de Acesso

| Perfil | Roles/Cargos | Modulos Permitidos |
|--------|-------------|-------------------|
| **Admin** | role `admin` OU Acesso Geral OU CARGO-001/010/011/012/014 | TODOS |
| **Gestor** | role `gestor` OU CARGO-008 | Tudo EXCETO Financeiro Global e RH Salarios |
| **Vendedor** | role `vendedor` OU CARGO-004 | Vendas, Estoque, Dados Antigo |
| **Estoquista** | role `estoquista` OU CARGO-013 | Vendas, Estoque, Dados Antigo |
| **Tecnico** | CARGO-005 | Assistencia, Estoque, Vendas |
| **Restrito** | CARGO-006/009 (Motoboy, Auxiliar) | Apenas Dashboard (boas-vindas) |

## Detalhes Tecnicos

### 1. Novo arquivo: `src/hooks/useUserPermissions.ts`

Hook centralizado que determina o perfil de acesso do usuario logado.

```text
Logica:
1. Ler user do useAuthStore (cargo, eh_gestor, eh_vendedor, eh_estoquista)
2. Ler role da tabela user_roles (ja disponivel via profile.role ou consulta)
3. Determinar perfil: admin > gestor > tecnico > vendedor/estoquista > restrito
4. Retornar:
   - perfil: 'admin' | 'gestor' | 'tecnico' | 'vendedor' | 'estoquista' | 'restrito'
   - allowedModules: string[] (ex: ['vendas', 'estoque', 'os', ...])
   - canAccessRoute(path: string): boolean
   - allowedNavItems: NavItem[] (itens filtrados da sidebar)
```

Fonte de dados: O `authStore` ja carrega `cargo` e flags `eh_gestor/eh_vendedor/eh_estoquista` do profile e colaborador. O campo `role` na tabela `profiles` tambem esta disponivel. Vamos adicionar `role` ao `fetchProfile` e ao estado do `User`.

### 2. Modificar: `src/store/authStore.ts`

- Adicionar campo `role?: string` na interface `User`
- No `fetchProfile`, ja retorna `role` (campo existe na tabela profiles)
- Passar `role` ao estado do usuario no `initialize` e `login`

### 3. Modificar: `src/components/layout/Sidebar.tsx`

- Importar `useUserPermissions`
- Filtrar `navItems` com base nos modulos permitidos antes de renderizar
- Mapeamento de navItem.href para modulo:

```text
'/' -> sempre visivel
'/rh' -> modulo 'rh'
'/financeiro/*' -> modulo 'financeiro'
'/estoque' -> modulo 'estoque'
'/vendas' -> modulo 'vendas'
'/garantias/*' -> modulo 'garantias'
'/os/*' -> modulo 'assistencia'
'/gestao-administrativa' -> modulo 'gestao'
'/relatorios' -> modulo 'relatorios'
'/cadastros' -> modulo 'cadastros'
'/dados-sistema-antigo/*' -> modulo 'dados-antigo'
'/settings' -> sempre visivel
```

Regras de visibilidade por perfil:

| Modulo | Admin | Gestor | Tecnico | Vendedor | Estoquista | Restrito |
|--------|-------|--------|---------|----------|------------|----------|
| rh | Sim | Nao | Nao | Nao | Nao | Nao |
| financeiro | Sim | Nao | Nao | Nao | Nao | Nao |
| estoque | Sim | Sim | Sim | Sim | Sim | Nao |
| vendas | Sim | Sim | Sim | Sim | Sim | Nao |
| garantias | Sim | Sim | Nao | Nao | Nao | Nao |
| assistencia | Sim | Sim | Sim | Nao | Nao | Nao |
| gestao | Sim | Sim | Nao | Nao | Nao | Nao |
| relatorios | Sim | Sim | Nao | Nao | Nao | Nao |
| cadastros | Sim | Sim | Nao | Nao | Nao | Nao |
| dados-antigo | Sim | Sim | Nao | Sim | Sim | Nao |
| settings | Sim | Sim | Sim | Sim | Sim | Sim |

### 4. Modificar: `src/components/auth/ProtectedRoute.tsx`

- Importar `useUserPermissions`
- Apos verificar autenticacao, checar `canAccessRoute(location.pathname)`
- Se nao permitido, redirecionar para `/` com `<Navigate to="/" replace />`

### 5. Modificar: `src/components/layout/Dashboard.tsx`

- Importar `useUserPermissions`
- Condicionar cards/secoes baseado no perfil:
  - **Restrito**: mostrar apenas mensagem de boas-vindas com nome do colaborador
  - **Vendedor/Estoquista**: mostrar apenas stats de Vendas e Estoque
  - **Tecnico**: mostrar stats de OS e Estoque
  - **Gestor**: tudo exceto comissao detalhada
  - **Admin**: tudo

### 6. Sincronizar `profiles.role` com `user_roles`

A tabela `profiles` tem coluna `role` (text) e a tabela `user_roles` armazena roles separadas. Para consistencia, o hook usara primariamente `user_roles` via `has_role()`, mas como o frontend nao pode chamar funcoes SQL diretamente no client, vamos:

- Usar o campo `profiles.role` como cache do role principal no frontend
- Garantir que o trigger `handle_new_user` ja sincroniza ambos (ja faz isso)
- Nao depender de `localStorage` para roles (seguranca)

## Arquivos Criados/Modificados

| Arquivo | Acao |
|---------|------|
| `src/hooks/useUserPermissions.ts` | CRIAR — hook centralizado de permissoes |
| `src/store/authStore.ts` | MODIFICAR — adicionar `role` ao User |
| `src/components/layout/Sidebar.tsx` | MODIFICAR — filtrar navItems por permissao |
| `src/components/auth/ProtectedRoute.tsx` | MODIFICAR — bloquear rotas nao permitidas |
| `src/components/layout/Dashboard.tsx` | MODIFICAR — condicionar secoes por perfil |

## Resultado Esperado

- Vendedores veem apenas: Painel, Vendas, Estoque, Dados Antigo, Configuracoes
- Tecnicos veem apenas: Painel, Assistencia, Estoque, Vendas, Configuracoes
- Gestores veem tudo exceto RH e Financeiro
- Admins/Acesso Geral veem tudo
- Motoboys/Auxiliares veem apenas o Painel com boas-vindas
- Tentativa de acessar URL proibida redireciona para o Painel

