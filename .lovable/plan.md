

# Politicas de Row Level Security (RLS) - Protecao de Dados Sensiveis

## Contexto Atual

Todas as tabelas usam uma unica politica `auth_all` que permite acesso total a qualquer usuario autenticado. Nao existe tabela `user_roles`. O conceito de "admin" no sistema corresponde a usuarios da loja "Acesso Geral" (ID: `90dc7c04-d4f8-4c95-82d7-13f600be4e31`), atualmente: isaac.ximenes, fellipe.rodrigues, leandro.amorim, matheus.mota.

## Arquitetura Proposta

Seguindo as boas praticas de seguranca do Supabase, criaremos:

1. **Tabela `user_roles`** com enum `app_role` (admin, gestor, vendedor, estoquista)
2. **Funcoes `SECURITY DEFINER`** para consultas seguras sem recursao
3. **Politicas granulares** por tabela, substituindo o `auth_all` generico

---

## Etapa 1: Criar infraestrutura de roles

### Migration SQL

- Criar enum `app_role` com valores: `admin`, `gestor`, `vendedor`, `estoquista`
- Criar tabela `user_roles` (user_id referenciando auth.users, role app_role, unique constraint)
- Habilitar RLS na tabela `user_roles` (somente admins podem gerenciar)
- Popular automaticamente:
  - Usuarios da loja "Acesso Geral" recebem role `admin`
  - Usuarios com `eh_gestor = true` recebem role `gestor`
  - Usuarios com `eh_vendedor = true` recebem role `vendedor`
  - Usuarios com `eh_estoquista = true` recebem role `estoquista`

### Funcoes SECURITY DEFINER

```text
has_role(user_id, role) -> boolean
  Verifica se o usuario tem determinada role

get_user_loja_id(user_id) -> uuid
  Retorna o loja_id do colaborador vinculado ao usuario

get_user_colaborador_id(user_id) -> uuid
  Retorna o colaborador_id vinculado ao profile do usuario

is_acesso_geral(user_id) -> boolean
  Verifica se o usuario pertence a loja Acesso Geral (admin)
```

## Etapa 2: Politicas por grupo de tabelas

### Grupo 1 - RH (Salarios e Dados Pessoais)

**Tabelas:** `colaboradores`, `salarios_colaboradores`, `historico_salarios`, `adiantamentos`, `vales`

| Tabela | SELECT | INSERT/UPDATE/DELETE |
|--------|--------|----------------------|
| `colaboradores` | Admin: tudo. Demais: apenas seu proprio registro (dados sensiveis como salario, cpf ficam protegidos) | Somente admin |
| `salarios_colaboradores` | Somente admin | Somente admin |
| `historico_salarios` | Somente admin | Somente admin |
| `adiantamentos` | Admin: tudo. Colaborador: apenas os seus | Admin para tudo, colaborador nao altera |
| `vales` | Admin: tudo. Colaborador: apenas os seus | Somente admin |

**Politica para `colaboradores` (SELECT):**
```text
Admin/Acesso Geral -> ve tudo
Demais -> ve apenas seu proprio registro (colaborador_id do profile = id da tabela)
```

### Grupo 2 - Estoque e Inventario

**Tabelas:** `produtos`, `movimentacoes_estoque`

| Tabela | SELECT | INSERT/UPDATE/DELETE |
|--------|--------|----------------------|
| `produtos` | Admin: tudo. Gestor/Estoquista: apenas da sua loja | Admin e estoquista para escrita |
| `movimentacoes_estoque` | Admin: tudo. Demais: apenas movimentacoes da sua loja (origem ou destino) | Admin e estoquista |

**Politica para `produtos` (SELECT):**
```text
Admin -> ve todos os produtos
Gestor/Vendedor/Estoquista -> apenas produtos onde loja_id = sua loja
```

### Grupo 3 - Financeiro e Vendas

**Tabelas:** `vendas`, `financeiro`, `despesas`

| Tabela | SELECT | INSERT/UPDATE/DELETE |
|--------|--------|----------------------|
| `vendas` | Admin: tudo. Gestor: vendas da sua loja. Vendedor: apenas suas vendas | Admin e gestor para edicao |
| `financeiro` | Admin: tudo. Gestor: da sua loja | Somente admin |
| `despesas` | Admin: tudo. Gestor: da sua loja | Admin e gestor |

**Politica para `vendas` (SELECT):**
```text
Admin -> todas as vendas
Gestor -> vendas onde loja_id = sua loja
Vendedor -> vendas onde vendedor_id = seu colaborador_id
```

## Etapa 3: Ajustes na Interface (Frontend)

Nenhum ajuste critico necessario no frontend. O sistema ja aplica filtros por loja no dashboard e listagens (verificado no codigo existente com `useAuthStore` e `useIsAcessoGeral`). O RLS atuara como uma camada de seguranca adicional no backend -- se um vendedor tentar acessar dados de outra loja via API, o banco retornara vazio ao inves de dados.

A logica existente de `isAcessoGeral` no frontend continuara funcionando normalmente, pois usuarios admin terao acesso total via RLS.

---

## Detalhes Tecnicos

### Arquivos a criar/editar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx_create_user_roles_and_rls.sql` | Migration com enum, tabela, funcoes e politicas |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente apos migration |

### Tabelas impactadas (9 tabelas)

`colaboradores`, `salarios_colaboradores`, `historico_salarios`, `adiantamentos`, `vales`, `produtos`, `movimentacoes_estoque`, `vendas`, `financeiro`, `despesas`

### Processo por tabela

Para cada tabela:
1. Remover politica `auth_all` existente
2. Criar politicas especificas (SELECT, INSERT, UPDATE, DELETE separados)
3. Usar funcoes SECURITY DEFINER para evitar recursao

### Populacao inicial de roles

```text
INSERT INTO user_roles (user_id, role)
  -- Admins: usuarios da loja Acesso Geral
  SELECT p.id, 'admin'
  FROM profiles p
  JOIN colaboradores c ON p.colaborador_id = c.id
  WHERE c.loja_id = '90dc7c04-d4f8-4c95-82d7-13f600be4e31'

  UNION ALL
  -- Gestores
  SELECT p.id, 'gestor'
  FROM profiles p WHERE p.eh_gestor = true

  UNION ALL
  -- Vendedores
  SELECT p.id, 'vendedor'
  FROM profiles p WHERE p.eh_vendedor = true

  UNION ALL
  -- Estoquistas
  SELECT p.id, 'estoquista'
  FROM profiles p WHERE p.eh_estoquista = true
```

### Riscos e mitigacoes

- **Risco**: Politicas muito restritivas podem bloquear funcionalidades existentes
- **Mitigacao**: Todas as funcoes usam SECURITY DEFINER, evitando recursao. Admins (Acesso Geral) sempre tem acesso total como fallback
- **Risco**: Novos usuarios criados nao terao role
- **Mitigacao**: Atualizar o trigger `handle_new_user` para inserir roles automaticamente baseado nas flags do colaborador

