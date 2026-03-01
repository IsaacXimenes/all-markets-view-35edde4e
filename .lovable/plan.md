

# Plano: Importar mais produtos pendentes

## Resumo

Importar 42 novos aparelhos do CSV `produtos-pendentes-2026-03-01-2.csv` para a tabela `produtos_pendentes_os`, todos da loja "Aguas Lindas Shopping".

## Analise do Arquivo

- **Total de linhas com dados**: 42 aparelhos
- **Loja**: Todas as linhas sao da loja "Aguas Lindas Shopping"
- **Modelos**: iPhone 12 Pro 256GB, iPhone 14 128GB, iPhone 14 Pro Max 256GB, iPhone 15 Pro Max 256GB, iPhone 14 Plus 128GB, entre outros
- **Valores**: R$ 1.900 a R$ 4.065
- **Origem**: Fornecedor (todos)
- **Status**: Pendente Estoque (todos)

## Problema Identificado

O `LOJA_MAP` da edge function `import-produtos-pendentes` nao reconhece a variante "Aguas Lindas Shopping" (com encoding UTF-8 para o "A" acentuado). O CSV usa esse nome, que sera rejeitado com erro "Loja desconhecida".

## Etapas

### 1. Atualizar a Edge Function

Adicionar as variantes do nome da loja no `LOJA_MAP` em `supabase/functions/import-produtos-pendentes/index.ts`:

```text
"Águas Lindas Shopping"  -> b2c6ac94-f08b-4c2e-955f-8a91d658d7d6
"Aguas Lindas Shopping"  -> b2c6ac94-f08b-4c2e-955f-8a91d658d7d6
```

Tambem adicionar uma normalizacao para remover caracteres com encoding quebrado (o `\ufffd` que aparece no CSV) e mapear para "Aguas Lindas Shopping".

### 2. Deploy e Execucao

- Fazer deploy da edge function atualizada
- Copiar o CSV para `public/data/`
- Enviar o conteudo do CSV para a edge function via POST
- Validar que os 42 registros foram inseridos com sucesso

### 3. Validacao

Consultar o banco para confirmar a contagem de registros inseridos.

## Detalhes Tecnicos

- A edge function ja trata corretamente: parsing de moeda (R$), extracao de marca/modelo (Apple/iPhone), linhas vazias (IMEI vazio = skip), e insercao em batches de 50
- O unico ajuste necessario e o mapeamento de loja

