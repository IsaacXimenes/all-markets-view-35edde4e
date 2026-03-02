

# Correcao Emergencial: Recursao Infinita na Politica de RLS da Tabela `profiles`

## Diagnostico

O erro exato retornado pelo Supabase e:
```
"infinite recursion detected in policy for relation 'profiles'"
```

A politica `profiles_select_restritivo` faz um JOIN de volta na tabela `profiles` para verificar se o gestor pertence a mesma loja. Isso cria uma recursao infinita porque o Postgres precisa avaliar a politica RLS para ler `profiles`, mas a propria politica requer ler `profiles`.

## Correcao

Remover a politica problematica `profiles_select_restritivo` e substituir por uma versao que usa funcoes `SECURITY DEFINER` (que ignoram RLS) para resolver a loja do usuario, quebrando o ciclo de recursao.

### Migration SQL

1. **DROP** da politica `profiles_select_restritivo` (causa da recursao)
2. **Criar funcao** `get_user_loja_id_direct` com `SECURITY DEFINER` que busca o `loja_id` do colaborador vinculado ao usuario SEM passar por RLS
3. **Criar nova politica** `profiles_select_safe` que permite:
   - `auth.uid() = id` (proprio perfil -- SEMPRE funciona)
   - `is_acesso_geral(auth.uid())` (Acesso Geral)
   - `has_role(auth.uid(), 'admin')` (Admin)
   - Gestor ve perfis da mesma loja usando a funcao SECURITY DEFINER (sem recursao)

### Detalhes Tecnicos

```text
Fluxo ANTES (quebrado):
  profiles RLS -> JOIN profiles -> profiles RLS -> JOIN profiles -> ... (infinito)

Fluxo DEPOIS (corrigido):
  profiles RLS -> get_user_loja_id_direct(auth.uid()) [SECURITY DEFINER, ignora RLS]
               -> compara com loja do perfil alvo via colaboradores [sem RLS em colaboradores para esta funcao]
```

## Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| Migration SQL | DROP politica recursiva, criar funcao SECURITY DEFINER, criar politica segura |

Nenhuma alteracao no frontend e necessaria -- o codigo ja busca `profiles` corretamente via `auth.uid() = id`. O problema e exclusivamente na politica RLS do banco.

