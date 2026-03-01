

# Corrigir Dados e Exibicao das Maquinas de Cartao

## Problema

Os dados foram inseridos com o nome da loja embutido no campo `nome` da maquina (ex: "Cielo - Elo - Assistencia"), e o campo `cnpj_vinculado` armazena o CNPJ bruto. A interface tenta buscar a loja pelo CNPJ como se fosse um ID, o que falha.

Resultado atual: Nome = "Cielo - Elo - Assistencia", Loja Vinculada = "54872234000158", CNPJ = "-"

Resultado esperado: Nome = "Cielo - Elo", Loja Vinculada = "Assistencia", CNPJ = "54.872.234/0001-58"

## Solucao

### 1. Adicionar coluna `loja_vinculada` na tabela (Migration)

Adicionar coluna `loja_vinculada VARCHAR` na tabela `maquinas_cartao` para armazenar o nome da loja separadamente.

### 2. Atualizar os 18 registros existentes (Insert tool - dados)

- Extrair a parte da loja do campo `nome` e mover para `loja_vinculada`
- Remover a parte da loja do campo `nome`
- Exemplo: "Cielo - Elo - Assistencia" vira nome="Cielo - Elo", loja_vinculada="Assistencia"

Mapeamento completo:
| nome atual | nome novo | loja_vinculada |
|---|---|---|
| Cielo - Elo - Assistencia | Cielo - Elo | Assistencia |
| Cielo - Elo - JK | Cielo - Elo | JK |
| Cielo - Elo - Matriz | Cielo - Elo | Matriz |
| Cielo - Elo - Online | Cielo - Elo | Online |
| Cielo - Elo - Shopping Sul | Cielo - Elo | Shopping Sul |
| Cielo - Master - Assistencia | Cielo - Master | Assistencia |
| Cielo - Master - JK | Cielo - Master | JK |
| Cielo - Master - Online | Cielo - Master | Online |
| Cielo - Master - Shopping Sul | Cielo - Master | Shopping Sul |
| Cielo - Visa - Assistencia | Cielo - Visa | Assistencia |
| Cielo - Visa - JK | Cielo - Visa | JK |
| Cielo - Visa - Online | Cielo - Visa | Online |
| Cielo - Visa - Shopping Sul | Cielo - Visa | Shopping Sul |
| Cielo - Visa/Master - Matriz | Cielo - Visa/Master | Matriz |
| Pagbank - Elo - Shopping Aguas Lindas | Pagbank - Elo | Shopping Aguas Lindas |
| Pagbank - Master - Shopping Aguas Lindas | Pagbank - Master | Shopping Aguas Lindas |
| Pagbank - Visa - Shopping Aguas Lindas | Pagbank - Visa | Shopping Aguas Lindas |
| Terceirizada - TODAS - Todas Unidades | Terceirizada - TODAS | Todas Unidades |

### 3. Atualizar interface e API

**`src/utils/cadastrosApi.ts`**:
- Adicionar campo `lojaVinculada` na interface `MaquinaCartao`
- Atualizar `mapRowToMaquinaCartao` para incluir `loja_vinculada`
- Atualizar `addMaquinaCartao` para salvar `loja_vinculada`

**`src/pages/CadastrosMaquinas.tsx`**:
- Coluna "Loja Vinculada": exibir `maquina.lojaVinculada` diretamente (sem lookup)
- Coluna "CNPJ": exibir `maquina.cnpjVinculado` formatado com mascara (`formatCNPJ` ou `formatCPFCNPJ`)
- Export CSV: mesma logica

## Detalhes Tecnicos

| Item | Detalhe |
|---|---|
| Nova coluna | `loja_vinculada VARCHAR` em `maquinas_cartao` |
| Formatacao CNPJ | Usar `formatCPFCNPJ` de `src/utils/formatUtils.ts` |
| Arquivos alterados | migration SQL, `cadastrosApi.ts`, `CadastrosMaquinas.tsx`, `types.ts` (auto) |

