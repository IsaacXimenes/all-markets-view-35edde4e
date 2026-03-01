

# Plano: Importar 120 Aparelhos Pendentes para o Estoque

## Resumo

Importar os 120 produtos do CSV `produtos-pendentes-2026-03-01.csv` para a tabela `produtos_pendentes_os` no Supabase. A tabela esta vazia atualmente.

## Analise do CSV

- **Total**: 120 linhas de dados (sem header)
- **Separador**: ponto-e-virgula (;)
- **Colunas**: ID (vazio), IMEI, Produto, Cor, Origem, Fornecedor, Loja, Valor Custo, Saude Bateria, SLA (dias), Status
- **Todos os status**: "Pendente Estoque"
- **Todas as origens**: "Fornecedor"
- **Lojas presentes**: Shopping Sul, JK Shopping, Aguas Lindas, Estoque - SIA
- **Cores**: PRETO, BRANCO, AZUL, ROSA, INDISPONIVEL, ".", "-" (precisa normalizar)
- **Bateria**: Alguns vazios (sem %)
- **Fornecedor**: Todos "-" (nenhum especificado)

## Abordagem

Criar uma **Edge Function** (`import-produtos-pendentes`) similar a `import-produtos-estoque`, adaptada para a tabela `produtos_pendentes_os`.

## Tratamento de Dados

| Campo CSV | Transformacao | Campo DB |
|-----------|---------------|----------|
| ID (vazio) | Gerar UUID automatico | `id` |
| IMEI | Trim | `imei` |
| Produto "IPHONE 14 128GB" | Extrair marca="Apple" e modelo limpo | `marca`, `modelo` |
| Cor ".", "-", "INDISPONIVEL" | Normalizar para null quando invalido | `cor` |
| Origem "Fornecedor" | Direto | `origem_entrada` |
| Fornecedor "-" | Salvar como null | `fornecedor` |
| Loja "Shopping Sul" | Mapear para UUID da loja | `loja` |
| Valor Custo "R$ 1.995,00" | Parse para numerico `1995.00` | `valor_custo`, `valor_custo_original`, `valor_origem` |
| Saude Bateria "84%" | Parse int, vazio = 100 | `saude_bateria` |
| Status "Pendente Estoque" | Direto | `status_geral` |
| - | Data de hoje | `data_entrada` |
| - | "Seminovo" | `tipo`, `condicao` |

## Mapeamento de Lojas (mesmo do import anterior)

```text
"Shopping Sul"   -> 0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad
"JK Shopping"    -> 9009b91c-0436-4070-9d30-670b8e6bd68e
"Aguas Lindas"   -> b2c6ac94-f08b-4c2e-955f-8a91d658d7d6
"Estoque - SIA"  -> fe27bdab-b6de-433c-8718-3f1690f2315d
```

**Nota importante**: A tabela `produtos_pendentes_os` usa `loja` como VARCHAR. O campo armazena o UUID como string, seguindo o padrao ja existente no `mapProdutoToRow`.

## Deteccao de Marca

Todos os produtos sao iPhones. A logica extraira "Apple" como marca e o restante como modelo:
- "IPHONE 14 128GB" -> marca: "Apple", modelo: "iPhone 14 128GB"
- "IPHONE 15 PRO MAX 256GB" -> marca: "Apple", modelo: "iPhone 15 Pro Max 256GB"

## Implementacao Tecnica

### 1. Edge Function `import-produtos-pendentes`

- Arquivo: `supabase/functions/import-produtos-pendentes/index.ts`
- Metodo: POST
- Body: CSV como texto
- Logica:
  - Split por linhas, skip header
  - Split cada linha por ";"
  - Aplica transformacoes (valor, bateria, cor, marca/modelo)
  - Insere em batches de 50 via `supabase.from('produtos_pendentes_os').insert(batch)`
  - Ignora duplicatas por IMEI
  - Retorna relatorio

### 2. Execucao e Validacao

- Deploy da edge function
- Chamar com o conteudo do CSV
- Verificar: `SELECT count(*) FROM produtos_pendentes_os` deve retornar 120
- Conferir que os dados aparecem na aba "Aparelhos Pendentes"

