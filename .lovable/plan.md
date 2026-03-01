

# Plano: Importar aparelhos do CSV para o estoque

## Resumo

Importar 132 aparelhos do arquivo `produtos-estoque_1-2.csv` para a tabela `produtos`, todos da loja "Aguas Lindas Shopping".

## Analise do Arquivo

- **Total de linhas com dados**: 132 aparelhos (linhas 2-132, restante sao linhas vazias)
- **Loja**: Todas da "Aguas Lindas Shopping" (com encoding quebrado no CSV)
- **Marcas**: Apple, Xiaomi, Samsung
- **Modelos**: iPhone 11 a iPhone 17 Pro Max, Poco C85, Redmi A5/Note 14S, Galaxy A06/A16/A36
- **Valores**: R$ 300 a R$ 8.500
- **Tipos**: Novo e Seminovo

## Problema Identificado

O `LOJA_MAP` da edge function `import-produtos-estoque` nao reconhece "Aguas Lindas Shopping" (apenas "Aguas Lindas" sem "Shopping"). Alem disso, o CSV tem caractere de encoding quebrado no nome da loja que precisa ser normalizado.

## Etapas

### 1. Atualizar a Edge Function `import-produtos-estoque`

- Adicionar ao `LOJA_MAP`:
  - "Aguas Lindas Shopping" -> `b2c6ac94-...`
  - "Aguas Lindas Shopping" -> `b2c6ac94-...`
- Adicionar funcao `normalizeLojaName()` para remover caracteres de encoding quebrado (como ja feito nas outras edge functions)
- Filtrar linhas vazias (marca e modelo vazios ja sao filtrados)

### 2. Deploy e Execucao

- Copiar o CSV para `public/data/`
- Deploy da edge function atualizada
- Enviar o CSV via POST para a edge function
- A funcao usa `upsert` com `onConflict: "imei"` e `ignoreDuplicates: true`, entao duplicatas serao ignoradas automaticamente

### 3. Validacao

- Consultar o banco para confirmar a contagem de registros inseridos

## Detalhes Tecnicos

Novo mapeamento no LOJA_MAP:
```text
"Aguas Lindas Shopping" -> "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6"
"Aguas Lindas Shopping" -> "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6"
```

A edge function ja trata corretamente: parsing de moeda (R$), saude de bateria (%), tipo (Novo/Seminovo), modelo (cleanModel), e insercao em batches de 50 com upsert.

