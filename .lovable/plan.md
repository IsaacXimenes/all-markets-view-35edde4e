

# Importar Base de Maquinas de Cartao do Excel

## Resumo

Inserir 18 maquinas de cartao na tabela `maquinas_cartao` do Supabase com todas as taxas de parcelamento extraidas do arquivo Excel. A tabela esta atualmente vazia.

## Dados do Excel

18 maquinas com taxas detalhadas por bandeira, loja e parcelamento (debito + 1x ate 18x):

| # | Nome Maquina | Loja | CNPJ | Conta de Origem | Debito | Parcelas ate |
|---|---|---|---|---|---|---|
| 1 | Cielo - Elo | Matriz | 53295194000166 | Bradesco Thiago Eduardo | 1.38% | 12x |
| 2 | Cielo - Visa/Master | Matriz | 53295194000166 | Bradesco Thiago Eduardo | 0.86% | 12x |
| 3 | Cielo - Elo | Online | 53197533000106 | Bradesco Thiago Imports | 1.46% | 12x |
| 4 | Cielo - Visa | Online | 53197533000106 | Bradesco Thiago Imports | 1.10% | 12x |
| 5 | Cielo - Master | Online | 53197533000106 | Bradesco Thiago Imports | 0.91% | 12x |
| 6 | Cielo - Elo | Shopping Sul | 55449390000173 | Bradesco Acessorios | 2.37% | 12x |
| 7 | Cielo - Visa | Shopping Sul | 55449390000173 | Bradesco Acessorios | 1.83% | 12x |
| 8 | Cielo - Master | Shopping Sul | 55449390000173 | Bradesco Acessorios | 1.03% | 12x |
| 9 | Cielo - Elo | Assistencia | 54872234000158 | Bradesco Assistencia | 2.49% | 12x |
| 10 | Cielo - Visa | Assistencia | 54872234000158 | Bradesco Assistencia | 1.89% | 12x |
| 11 | Cielo - Master | Assistencia | 54872234000158 | Bradesco Assistencia | 1.89% | 12x |
| 12 | Cielo - Elo | JK | 62.968.637/0001-23 | Sicoob JK | 1.47% | 12x |
| 13 | Cielo - Visa | JK | 62.968.637/0001-23 | Sicoob JK | 1.02% | 12x |
| 14 | Cielo - Master | JK | 62.968.637/0001-23 | Sicoob JK | 0.92% | 12x |
| 15 | Pagbank - Elo | Shopping Aguas Lindas | (sem CNPJ) | Pagbank | 1.50% | 18x |
| 16 | Pagbank - Visa | Shopping Aguas Lindas | (sem CNPJ) | Pagbank | 1.08% | 18x |
| 17 | Pagbank - Master | Shopping Aguas Lindas | (sem CNPJ) | Pagbank | 1.08% | 18x |
| 18 | Terceirizada - TODAS | Todas Unidades | (sem CNPJ) | Escritorio Terceirizado | 2.96% | 18x |

## Implementacao

### Migration SQL

Criar migration que insere as 18 maquinas diretamente na tabela `maquinas_cartao` com:

- **nome**: Nome da maquina conforme Excel (ex: "Cielo - Elo - Matriz")
- **cnpj_vinculado**: CNPJ conforme Excel (texto, nao e FK)
- **conta_origem**: Nome da conta conforme Excel (texto, nao e FK)
- **status**: "Ativo" para todas
- **percentual_maquina**: Valor da coluna Debito
- **taxas**: JSON com `{ debito: X, credito: { 1: Y, 2: Z, ... } }`
- **parcelamentos**: JSON array com `[{ parcelas: 1, taxa: Y }, { parcelas: 2, taxa: Z }, ...]`

Cada maquina tera suas taxas especificas por numero de parcelas conforme o Excel.

### Observacao sobre a coluna "nome"

Para diferenciar maquinas com mesmo operador mas lojas diferentes, o nome incluira a loja. Exemplo: "Cielo - Elo - Matriz", "Cielo - Elo - Online", "Cielo - Elo - Shopping Sul".

## Detalhes Tecnicos

| Item | Valor |
|---|---|
| Total de registros | 18 |
| Tabela | maquinas_cartao (Supabase) |
| Tipo de operacao | INSERT via migration SQL |
| Campos preenchidos | nome, cnpj_vinculado, conta_origem, status, percentual_maquina, taxas, parcelamentos |
| Arquivo criado | supabase/migrations/xxx_seed_maquinas_cartao.sql |
| Arquivo atualizado | src/integrations/supabase/types.ts (automatico) |

