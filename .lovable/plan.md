
# Plano: Importacao de 466 Aparelhos para o Estoque

## Resumo

Importar os 466 produtos do CSV `produtos-estoque_1.csv` para a tabela `produtos` no Supabase, tratando todas as inconsistencias de formato detectadas.

## Abordagem

Criar uma **Edge Function** (`import-produtos-estoque`) que:
1. Recebe o CSV como texto no body da requisicao
2. Parseia todas as 466 linhas com tratamento de dados
3. Mapeia nomes de lojas para UUIDs reais
4. Insere em lotes no Supabase (batches de 50)
5. Retorna relatorio de sucesso/erros

## Tratamento de Dados

| Campo CSV | Transformacao | Valor no DB |
|-----------|---------------|-------------|
| `valorCusto` "R$ 4.762,00" | Remove "R$", espaco, troca "." por "", "," por "." | `4762.00` (numeric) |
| `valorVendaSugerido` idem | Mesmo tratamento | numeric |
| `vendaRecomendada` idem | Mesmo tratamento | numeric |
| `saudeBateria` "84%" | Remove "%", parseInt | `84` (integer) |
| `quantidade` vazia | Default `1` | `1` |
| `tipo` "SEMINOVO"/"Seminovo" | Normaliza para "Seminovo" ou "Novo" | varchar |
| `loja` "Shopping Sul" | Mapeia para UUID `0fc4a1f3-...` | uuid |
| `condicao` vazio | Default vazio | varchar |
| `statusNota` vazio | Default "Concluido" (ja conferidos) | varchar |
| `origemEntrada` vazio | Default "Fornecedor" | varchar |
| `estoqueConferido` "true" | Boolean true | boolean |
| `assistenciaConferida` "true" | Boolean true | boolean |
| Caracteres corrompidos em modelos | Limpar caracteres nao-ASCII invisivel | varchar limpo |

## Mapeamento de Lojas

```text
CSV                -> UUID no Supabase
"Shopping Sul"     -> 0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad
"JK Shopping"      -> 9009b91c-0436-4070-9d30-670b8e6bd68e
"Aguas Lindas"     -> b2c6ac94-f08b-4c2e-955f-8a91d658d7d6
"Estoque - SIA"    -> fe27bdab-b6de-433c-8718-3f1690f2315d
"Online"           -> df3995f6-1da1-4661-a68f-20fb548a9468
"Matriz"           -> 6231ea0e-9ff3-4ad6-b822-6f9a8270afa6
```

## Implementacao Tecnica

### 1. Edge Function `import-produtos-estoque`

- Arquivo: `supabase/functions/import-produtos-estoque/index.ts`
- Metodo: POST
- Body: CSV completo como texto
- Autenticacao: requer token de admin
- Logica:
  - Split por linhas, skip header
  - Split cada linha por ";"
  - Aplica transformacoes de valor
  - Insere em batches de 50 via `supabase.from('produtos').insert(batch)`
  - Retorna JSON com total inserido e erros

### 2. Copiar CSV para o projeto

- Copiar `produtos-estoque_1.csv` para `public/data/` para referencia

### 3. Execucao

- Deploy da edge function
- Chamar via curl com o conteudo do CSV
- Verificar contagem final: `SELECT count(*) FROM produtos` deve retornar 466

## Validacoes Pos-Importacao

- Confirmar 466 registros na tabela
- Verificar que todos os `loja_id` sao UUIDs validos
- Confirmar que nenhum IMEI esta duplicado
- Verificar que valores monetarios estao corretos (amostragem)
