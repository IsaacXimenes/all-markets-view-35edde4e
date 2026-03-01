

# Plano: Importar acessorios do CSV para o estoque

## Resumo

Importar 377 linhas de acessorios do arquivo `acessorios_2026-03-01.csv` para a tabela `acessorios`. Todos os itens sao da loja "Aguas Lindas Shopping".

## Analise do Arquivo

- **Formato**: CSV delimitado por ponto-e-virgula (`;`)
- **Total de linhas**: 377 registros (excluindo cabecalho)
- **Loja**: Todas da "Aguas Lindas Shopping" (com encoding quebrado no CSV)
- **Colunas**: ID (vazio), Descricao, Categoria, Fornecedor, Quantidade, Valor Custo, Valor Recomendado, IMEI, Loja
- **Categorias**: Capas, Peliculas, Audio, Carregadores, Acessorios Geral, entre outros
- **Itens com IMEI**: JBL, controles PS5, alguns chips

## Problema Identificado

1. A edge function `import-acessorios` aceita XLSX ou JSON, mas nao CSV delimitado por ponto-e-virgula
2. O `LOJA_MAP` nao inclui "Aguas Lindas Shopping" (apenas "Estoque - Aguas Lindas")
3. Linhas com descricao "0" ou vazia precisam ser filtradas

## Etapas

### 1. Atualizar a Edge Function `import-acessorios`

- Adicionar suporte a CSV delimitado por ponto-e-virgula (content-type `text/csv` ou deteccao automatica)
- Adicionar mapeamento da loja "Aguas Lindas Shopping" e variantes com encoding quebrado ao `LOJA_MAP`
- Filtrar linhas com descricao invalida ("0", vazia)

### 2. Copiar o CSV e executar a importacao

- Copiar o arquivo para `public/data/`
- Deploy da edge function atualizada
- Enviar o CSV via POST para a edge function

### 3. Validacao

- Consultar o banco para confirmar a contagem de registros inseridos

## Detalhes Tecnicos

Colunas do CSV mapeadas para a tabela `acessorios`:

```text
Descricao   -> nome
Categoria   -> categoria
Quantidade  -> quantidade (vazio = 0)
Valor Custo -> valor_custo (parseCurrency)
Valor Recomendado -> valor_venda (parseCurrency)
imei        -> imei
Loja        -> loja_id (via LOJA_MAP)
Status      -> "Disponivel" (fixo)
```

Novo mapeamento no LOJA_MAP:
```text
"Águas Lindas Shopping" -> "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6"
"Aguas Lindas Shopping" -> "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6"
```

