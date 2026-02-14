
# Formatacao de Datas e Otimizacao de Desempenho - Dados Sistema Antigo

## Resumo

Duas melhorias: (1) formatar colunas de data como DD/MM/AAAA em 6 abas, e (2) otimizar o desempenho do parsing dos arquivos Excel com cache e opcao `cellDates`.

---

## 1. Formatacao de Datas

O problema atual e que o Excel armazena datas como numeros seriais (ex: `45234`) ou strings inconsistentes. O `useXlsxData` nao faz nenhum tratamento -- apenas converte tudo para string via `String()`.

### Solucao

Adicionar um novo parametro `dateColumns` ao hook `useXlsxData` que recebe uma lista de nomes de colunas (ja mapeados) que devem ser formatados como data DD/MM/AAAA.

No momento do mapeamento dos dados, ao encontrar uma coluna listada em `dateColumns`, o hook tentara converter o valor:
- Se for numero serial do Excel: converter usando `XLSX.SSF.parse_date_code()` ou `new Date((valor - 25569) * 86400000)`
- Se for string de data reconhecivel: converter com `new Date()`
- Se falhar: manter o valor original

### Abas afetadas e colunas:

| Aba | Coluna mapeada | Chave original |
|-----|---------------|----------------|
| Compras | Data Compra | DATA_COMPRA |
| Compras Pagamentos | Data Pagamento | DATA_PAGAMETO |
| Entradas | Data Entrada | DATA DE ENTRADA |
| Ordem de Servico | Data | DATA |
| Vendas | Data Venda | DATA VENDA |
| Vendas Pagamentos | Data Pagamento | DATA_PAGAMETO |

Cada pagina passara `dateColumns: ['Data Compra']` (ou equivalente) ao hook.

---

## 2. Otimizacao de Desempenho

### Problema
Cada vez que o usuario navega entre abas, o hook refaz o `fetch` + parsing do Excel do zero, mesmo que o arquivo ja tenha sido carregado antes.

### Solucao: Cache em memoria

- Criar um cache simples (objeto `Map` no modulo do hook) com chave = URL do arquivo
- Na primeira carga, armazenar o resultado parseado (data + headers)
- Nas cargas seguintes, retornar do cache instantaneamente
- Adicionar `{ cellDates: true }` ao `XLSX.read()` para que datas ja venham como objetos Date nativos, simplificando a conversao

---

## Detalhes Tecnicos

### Arquivos a modificar:

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useXlsxData.ts` | Adicionar parametro `dateColumns`, cache por URL, opcao `cellDates: true` |
| `src/pages/DadosAntigoCompras.tsx` | Adicionar `dateColumns: ['Data Compra']` |
| `src/pages/DadosAntigoComprasPagamentos.tsx` | Adicionar `dateColumns: ['Data Pagamento']` |
| `src/pages/DadosAntigoEntradas.tsx` | Adicionar `dateColumns: ['Data Entrada']` |
| `src/pages/DadosAntigoOrdemServico.tsx` | Adicionar `dateColumns: ['Data']` |
| `src/pages/DadosAntigoVendas.tsx` | Adicionar `dateColumns: ['Data Venda']` |
| `src/pages/DadosAntigoVendasPagamentos.tsx` | Adicionar `dateColumns: ['Data Pagamento']` |

### Logica de conversao de data no hook:

```text
Para cada celula em dateColumns:
  1. Se valor for Date -> formatar DD/MM/AAAA
  2. Se valor for numero -> converter serial Excel para Date -> formatar
  3. Se valor for string parseavel -> new Date() -> formatar
  4. Senao -> manter original
```

### Cache:

```text
const xlsxCache = new Map<string, { data: any[], headers: string[] }>();

// No inicio do fetch:
if (xlsxCache.has(cacheKey)) {
  // retorna do cache, pula fetch
}
```

Isso eliminara o tempo de espera ao navegar entre abas ja visitadas.
