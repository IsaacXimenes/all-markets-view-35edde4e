
# Plano: Cadastrar 76 Colaboradores da Planilha no Supabase

## Resumo

Inserir os 76 colaboradores do arquivo `Colaboradores.xlsx` diretamente na tabela `colaboradores` do Supabase, criando as lojas/setores faltantes e os cargos necessarios.

---

## Problema Identificado

A planilha referencia **lojas/setores** e **cargos** que nao existem no sistema atual:

**Lojas existentes (5):** Aguas Lindas Shopping, JK Shopping, Matriz, Online, Shopping Sul

**Lojas/Setores faltantes na planilha (10):**
- Acesso Geral
- Assistencia - Aguas Lindas
- Assistencia - Shopping JK
- Assistencia - Shopping Sul
- Assistencia - SIA
- Estoque - Aguas Lindas Shopping
- Estoque - Shopping JK
- Estoque - Shopping Sul
- Estoque - SIA
- Financeiro
- Marketing
- Motoboy

**Cargos existentes:** Gerente Geral, Gerente Financeiro, Gerente de Estoque, Vendedor, Tecnico Assistencia, Auxiliar Administrativo, Analista Financeiro, Supervisor de Loja, Motoboy

**Cargos da planilha que precisam ser mapeados:**
- "Socio Administrador" -- novo cargo
- "Assistente Administrativo" -- mapear para Auxiliar Administrativo ou criar novo
- "Analista de Dados" -- novo cargo
- "Gestor Geral" -- mapear para Gerente Geral
- "Tecnico" -- mapear para Tecnico Assistencia
- "Gestor (a)" / "Gestor(a)" -- mapear para Supervisor de Loja
- "Vendedor (a)" -- mapear para Vendedor
- "Estoquista" -- novo cargo ou mapear para Gerente de Estoque
- "Marketing" -- novo cargo
- "Motoboy" -- ja existe

---

## Acoes

### 1. Criar lojas/setores faltantes no Supabase
Inserir na tabela `lojas` os setores que a planilha referencia e que nao existem. Cada um com tipo adequado (Assistencia, Estoque, Financeiro, Administrativo, etc.).

### 2. Adicionar cargos faltantes no codigo
Atualizar o array `cargos` em `cadastrosApi.ts` para incluir:
- CARGO-010: Socio Administrador
- CARGO-011: Assistente Administrativo
- CARGO-012: Analista de Dados
- CARGO-013: Estoquista
- CARGO-014: Marketing
- CARGO-015: Gestor Geral (alias do Gerente Geral se preferir)

### 3. Inserir 76 colaboradores via SQL
Usar o insert tool do Supabase para inserir todos os colaboradores com:
- `nome`, `cpf` da planilha
- `loja_id` mapeado para o UUID da loja correspondente
- `cargo` mapeado para o CARGO-ID correto
- `data_admissao` convertida (datas "00/00/0000" serao tratadas como NULL)
- `salario_fixo` = 2000 (todas as entradas mostram R$ 2.000)
- `ativo` = true, `status` = 'Ativo'
- `eh_vendedor`, `eh_gestor`, `eh_estoquista` derivados do cargo

### 4. Vincular profiles aos colaboradores
Apos inserir os colaboradores, atualizar a tabela `profiles` para vincular `colaborador_id` ao registro correspondente (match por nome).

---

## Detalhes Tecnicos

### Mapeamento Loja (planilha -> tipo na tabela lojas)

| Planilha | Tipo |
|---|---|
| Acesso Geral | Administrativo |
| Assistencia - Aguas Lindas | Assistencia |
| Assistencia - Shopping JK | Assistencia |
| Assistencia - Shopping Sul | Assistencia |
| Assistencia - SIA | Assistencia |
| Estoque - Aguas Lindas Shopping | Estoque |
| Estoque - Shopping JK | Estoque |
| Estoque - Shopping Sul | Estoque |
| Estoque - SIA | Estoque |
| Financeiro | Financeiro |
| Marketing | Administrativo |
| Motoboy | Administrativo |

### Mapeamento Cargo (planilha -> CARGO-ID)

| Planilha | Cargo ID |
|---|---|
| Socio Administrador | CARGO-010 |
| Assistente Administrativo | CARGO-011 |
| Analista de Dados | CARGO-012 |
| Gestor Geral | CARGO-001 (Gerente Geral) |
| Tecnico | CARGO-005 (Tecnico Assistencia) |
| Gestor (a) / Gestor(a) | CARGO-008 (Supervisor de Loja) |
| Vendedor (a) | CARGO-004 (Vendedor) |
| Estoquista | CARGO-013 |
| Marketing | CARGO-014 |
| Motoboy | CARGO-009 |

### Flags derivadas do cargo

| Cargo | eh_gestor | eh_vendedor | eh_estoquista |
|---|---|---|---|
| Socio Administrador | true | false | false |
| Gestor Geral / Gestor(a) | true | false | false |
| Vendedor (a) | false | true | false |
| Estoquista | false | false | true |
| Tecnico | false | false | false |
| Motoboy | false | false | false |
| Assistente Administrativo | false | false | false |
| Analista de Dados | false | false | false |
| Marketing | false | false | false |

### Datas de admissao
- "00/00/0000" e "1/1/00" serao convertidas para NULL
- Demais datas serao convertidas de formato americano (M/D/YY) para YYYY-MM-DD

### Arquivos a editar
1. **`src/utils/cadastrosApi.ts`** -- Adicionar novos cargos ao array `cargos`

### Operacoes de banco (insert tool)
1. INSERT em `lojas` -- 12 novas lojas/setores
2. INSERT em `colaboradores` -- 76 registros
3. UPDATE em `profiles` -- vincular `colaborador_id` por match de nome

### Estimativa
- 1 arquivo editado
- ~80 registros inseridos no banco
- Complexidade: Media (mapeamento de dados)
