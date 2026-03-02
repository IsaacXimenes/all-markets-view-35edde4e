
# Blindagem de Seguranca - Correcao de 5 Erros Criticos (LGPD)

## Resumo do Diagnostico

O Security Scan identificou 5 vulnerabilidades de exposicao de dados em tabelas com informacoes sensiveis. Todas as tabelas ja possuem RLS ativado, mas as politicas estao permissivas demais. A correcao sera feita inteiramente no banco de dados (RLS), garantindo que os dados nao saiam do Supabase para usuarios nao autorizados.

---

## Correcoes Detalhadas

### 1. Tabela `profiles` (ERRO CRITICO)
**Problema:** Politica "Authenticated users can read all profiles" permite que qualquer usuario autenticado leia TODOS os perfis (usernames, nomes, colaborador_id, cargos).

**Correcao:** Substituir a politica ampla por uma que permita:
- Usuario ve o proprio perfil (ja existe: `auth.uid() = id`)
- Admin/Acesso Geral ve todos os perfis (necessario para gestao)
- Gestor ve perfis da sua loja (necessario para autocomplete)
- Remover a politica "Authenticated users can read all profiles"

### 2. Tabela `colaboradores` (ERRO CRITICO)
**Problema:** Atualmente so `is_acesso_geral` e o proprio colaborador podem ler. Mas o `cadastroStore` carrega TODOS os colaboradores para dropdowns (autocomplete de vendedor, gestor, responsavel). Os dados incluem CPF, telefone, salario.

**Correcao:**
- Criar funcao SECURITY DEFINER `get_colaboradores_basicos()` que retorna APENAS campos nao-sensiveis (id, nome, cargo, loja_id, eh_gestor, eh_vendedor, eh_estoquista, ativo, foto) para qualquer usuario autenticado
- Manter a politica restritiva na tabela (admin/acesso_geral + proprio registro para dados completos)
- Adicionar politica para admin (`has_role('admin')`) poder ler todos os registros completos
- Atualizar o `cadastroStore` para usar a funcao basica nos carregamentos de dropdown

### 3. Tabela `clientes` (ERRO CRITICO)
**Problema:** Politica atual permite ALL (select/insert/update/delete) para qualquer `auth.uid() IS NOT NULL`. Dados sensiveis: CPF, telefone, email, endereco completo.

**Correcao:** Substituir a politica unica por 4 politicas granulares:
- **SELECT:** Admin/Acesso Geral (todos) + Gestor (propria loja) + Vendedor (propria loja)
- **INSERT:** Admin/Acesso Geral + Gestor + Vendedor (precisam cadastrar clientes)
- **UPDATE:** Admin/Acesso Geral + Gestor (propria loja)
- **DELETE:** Admin/Acesso Geral apenas

### 4. Tabela `contas_financeiras` (ERRO CRITICO)
**Problema:** Gestor pode ler dados bancarios (conta, agencia, CNPJ, saldo). Deveria ser Admin/Financeiro apenas.

**Correcao:** Remover `has_role('gestor')` da politica `contas_fin_select`. Apenas admin e acesso_geral mantem acesso.

### 5. Tabela `vendas` (ERRO)
**Problema:** Vendedor pode ver TODAS as vendas da sua loja, incluindo dados de clientes de outros vendedores.

**Correcao:** A politica `vendas_select` ja filtra vendedor por `vendedor_id = get_user_colaborador_id()`. Adicionar `has_role('admin')` ao SELECT para admins que nao sao acesso_geral. Manter gestor vendo vendas da loja (necessario para gestao).

---

## Modificacoes no Frontend

### Arquivo: `src/store/cadastroStore.ts`
- Alterar o carregamento de colaboradores para usar a funcao `get_colaboradores_basicos()` via RPC ao inves de `supabase.from('colaboradores').select('*')`
- Isso garante que dados sensiveis (CPF, salario) nunca cheguem ao navegador de usuarios sem permissao

### Arquivo: `src/utils/cadastrosApi.ts`
- Atualizar `getColaboradoresAsync()` para usar a mesma funcao RPC
- Manter as funcoes de CRUD (add/update/delete) inalteradas (ja protegidas por RLS)

---

## Resumo de Alteracoes no Banco

| Tabela | Acao |
|--------|------|
| `profiles` | Remover politica "read all", adicionar politica restritiva por role |
| `colaboradores` | Criar funcao `get_colaboradores_basicos()`, adicionar politica admin |
| `clientes` | Substituir politica ALL por 4 politicas granulares |
| `contas_financeiras` | Remover acesso gestor do SELECT |
| `vendas` | Adicionar admin ao SELECT |

## Resumo de Alteracoes no Frontend

| Arquivo | Acao |
|---------|------|
| `src/store/cadastroStore.ts` | Usar RPC para carregar colaboradores basicos |
| `src/utils/cadastrosApi.ts` | Usar RPC no `getColaboradoresAsync` |
