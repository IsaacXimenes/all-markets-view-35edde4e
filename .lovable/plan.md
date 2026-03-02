
# Cadastrar 18 Contas Financeiras com IDs Padronizados (CTA-XXX)

## Resumo
Adicionar a coluna `codigo_legivel` na tabela `contas_financeiras` para armazenar o ID padronizado (CTA-001, CTA-002, etc.) e inserir as 18 contas do CSV.

## Etapa 1 - Migration: adicionar coluna `codigo_legivel`

Adicionar a coluna `codigo_legivel VARCHAR UNIQUE` na tabela `contas_financeiras`, seguindo o mesmo padrao usado em `movimentacoes_acessorios_estoque` e `movimentacoes_pecas_estoque`.

## Etapa 2 - Inserir as 18 contas via INSERT

Mapeamento de lojas:

```text
Loja - Matriz                -> 6231ea0e-9ff3-4ad6-b822-6f9a8270afa6
Loja - Online                -> df3995f6-1da1-4661-a68f-20fb548a9468
Loja - JK Shopping           -> 9009b91c-0436-4070-9d30-670b8e6bd68e
Loja - Aguas Lindas Shopping -> b2c6ac94-f08b-4c2e-955f-8a91d658d7d6
Loja - Shopping Sul          -> 0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad
Geral - Dinheiro             -> geral-dinheiro (valor especial)
Geral - Assistencia          -> geral-assistencia (valor especial)
```

Todas as 18 contas serao inseridas com:
- `codigo_legivel`: CTA-001 ate CTA-022 (conforme CSV)
- `saldo_inicial = 0`, `saldo_atual = 0`
- `status = 'Ativo'`, `habilitada = true`
- `nota_fiscal` = true quando "Propria", false quando "Terceirizada"
- `historico_alteracoes = '[]'`

## Etapa 3 - Atualizar o frontend

### cadastrosApi.ts
- Adicionar `codigoLegivel` ao tipo `ContaFinanceira`
- Mapear `codigo_legivel` do banco para o campo do frontend
- Gerar automaticamente o proximo codigo (CTA-XXX) ao adicionar nova conta

### CadastrosContasFinanceiras.tsx
- Exibir a coluna "ID" com o `codigoLegivel` (CTA-XXX) em vez do UUID

### PagamentoQuadro.tsx (se necessario)
- Verificar se o select de "Conta Destino" exibe corretamente as contas apos a insercao

## Detalhes Tecnicos

| Arquivo | Acao |
|---------|------|
| Migration SQL | ALTER TABLE adicionar `codigo_legivel` |
| INSERT SQL (via insert tool) | 18 registros com dados do CSV |
| src/utils/cadastrosApi.ts | Mapear `codigo_legivel`, gerar proximo ID |
| src/pages/CadastrosContasFinanceiras.tsx | Exibir CTA-XXX na coluna ID |
