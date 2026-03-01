

# Plano: Importar Acessorios do Excel para o Banco de Dados

## Resumo

Importar os ~2.117 acessorios do arquivo `Estoque_Acessorios_Consolidado.xlsx` para a tabela `acessorios` no Supabase, adicionando a nova coluna `imei` conforme solicitado.

## Analise do Arquivo

- **Total de linhas**: ~2.117 itens
- **Colunas**: Origem (loja), Modelo + Descricao, Categoria, Quantidade em estoque, Valor Custo, Valor Recomendado, IMEI
- **Lojas presentes**: Estoque - SIA, Estoque - Shopping Sul, Estoque - Shopping JK, Estoque - Aguas Lindas, Estoque - Online
- **Categorias**: Capas, Peliculas, Carregadores, Audio, Acessorios Apple, Acessorios - Geral, Acessorios
- **IMEI**: Maioria vazia, mas presente em itens individuais (chips, fontes originais, JBLs)
- **Quantidade vazia**: Sera tratada como 0

## Etapa 1 - Migracao do Banco de Dados

Adicionar a coluna `imei` na tabela `acessorios`:

```sql
ALTER TABLE public.acessorios ADD COLUMN imei VARCHAR(100);
```

## Etapa 2 - Edge Function `import-acessorios`

Criar uma Edge Function seguindo o mesmo padrao das funcoes `import-produtos-estoque` e `import-produtos-pendentes`.

### Mapeamento de Dados

| Campo Excel | Transformacao | Campo DB |
|---|---|---|
| Origem "Estoque - SIA" | Mapear para UUID da loja | `loja_id` |
| Modelo + Descricao | Direto, trim | `nome` |
| Categoria | Direto | `categoria` |
| Quantidade em estoque | Parse int, vazio = 0 | `quantidade` |
| Valor Custo "R$ 3.70" | Parse numerico | `valor_custo` |
| Valor Recomendado "R$ 35.00" | Parse numerico | `valor_venda` |
| IMEI | Trim, vazio = null | `imei` |
| - | "Disponivel" | `status` |

### Mapeamento de Lojas

```text
"Estoque - SIA"           -> fe27bdab-b6de-433c-8718-3f1690f2315d
"Estoque - Shopping Sul"  -> 949afa0c-6324-4a4e-ab6e-f7071fcfc3c0
"Estoque - Shopping JK"   -> f071311a-5532-4874-bb9c-5a2e550300c8
"Estoque - Águas Lindas"  -> 9c33d643-52dd-4134-8c91-2e01ddc05937  (ou "Aguas Lindas")
"Estoque - Online"        -> df3995f6-1da1-4661-a68f-20fb548a9468  (loja Online)
```

### Logica da Edge Function

- Recebe o CSV como texto via POST
- Faz split por linhas, pula header
- Split por ";" (ponto e virgula)
- Aplica transformacoes de valor monetario (R$) e quantidade
- Insere em batches de 50 na tabela `acessorios`
- Retorna relatorio com totais e erros

## Etapa 3 - Atualizar Codigo Frontend

### 3.1 Interface e mapeamento (`src/utils/acessoriosApi.ts`)

- Adicionar campo `imei` na interface `Acessorio`
- Atualizar `mapFromDB` e `mapToDB` para incluir `imei`

### 3.2 Tabela de exibicao (`src/pages/EstoqueAcessorios.tsx`)

- Adicionar coluna IMEI na tabela (visivel apenas quando preenchido)

### 3.3 Config TOML

- Adicionar entrada `[functions.import-acessorios]` com `verify_jwt = false`

## Etapa 4 - Execucao

- Copiar o XLSX para `public/data/`
- Converter para CSV (separador ;)
- Deploy da edge function
- Chamar a edge function com o conteudo CSV
- Validar: `SELECT count(*) FROM acessorios` deve retornar ~2.117

## Observacoes

- A coluna `marca` existente no banco sera mantida como null (o arquivo nao tem essa informacao separada)
- Itens com quantidade vazia serao importados com quantidade 0
- A loja "Estoque - Online" sera mapeada para o UUID da loja "Online" existente

