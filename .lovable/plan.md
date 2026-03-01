

# Plano: Padronizar nomes e IDs nas 3 abas de estoque

## Resumo dos Problemas

### 1. Aparelhos (tabela `produtos`) - 629 registros
- **Modelos em CAIXA ALTA**: "IPHONE 15 128GB", "GALAXY A06 128GB 4RAM", "REDMI NOTE 14S 256GB 8RAM"
- Devem ficar com apenas a primeira letra maiuscula por palavra, respeitando siglas: "iPhone 15 128GB", "Galaxy A06 128GB 4RAM"
- Typos nos modelos: "IPHOINE 11 128GB", "IPHONE 11- 64GB", "IPHONE 12 PRO-128GB"
- **IDs**: Todos ja possuem `codigo` (PROD-0001 a PROD-0629) - OK

### 2. Aparelhos Pendentes (tabela `produtos_pendentes_os`) - 165 registros
- **42 registros sem codigo**: Precisam receber PROD-0630 em diante (sequencial apos o maior codigo existente = PROD-0629)
- Modelos ja estao em formato aceitavel ("iPhone 14 128GB") - importacao recente fez Title Case
- Cores em branco em varios registros

### 3. Acessorios (tabela `acessorios`) - 2.464 registros
- **Nomes em CAIXA ALTA**: "CASE 17 PRO MAX", "CABO APPLE TYPEC", "ADAPTADOR OTG"
- Devem ficar Title Case: "Case 17 Pro Max", "Cabo Apple Typec", "Adaptador Otg"
- **Sem coluna `codigo`**: Precisa criar coluna e popular com AC-0001 em diante (auto-incremento)
- Typos e duplicatas nos nomes: "CASE  17" (espaco duplo), "CASE 11PRO" (falta espaco), "BASTÃÕ SELFIE PEINING" (acentuacao errada)

## Plano de Execucao

### Etapa 1: Migration - Adicionar coluna `codigo` na tabela `acessorios`
```sql
ALTER TABLE acessorios ADD COLUMN IF NOT EXISTS codigo TEXT;
```

### Etapa 2: Migration de dados - Padronizar nomes e gerar IDs

**2a. Produtos - Padronizar modelos para Title Case**
- Converter modelos UPPERCASE para formato legivel
- Regras especiais: "iPhone" (nao "Iphone"), "iPad", "AirPods", siglas como "GB", "RAM", "5G", "PRO", "MAX" mantidas
- Corrigir typos: "IPHOINE" -> "iPhone", hifens errados "IPHONE 11- 64GB" -> "iPhone 11 64GB"

**2b. Produtos Pendentes - Atribuir codigos faltantes**
- Gerar PROD-0630 a PROD-0671 para os 42 registros sem codigo (ordenados por created_at)

**2c. Acessorios - Padronizar nomes e gerar codigos**
- Converter nomes para Title Case
- Corrigir espacos duplos e caracteres especiais
- Gerar AC-0001 a AC-2464 (ordenados por created_at)

### Etapa 3: Atualizar codigo frontend

**`src/utils/acessoriosApi.ts`**
- Adicionar campo `codigo` na interface `Acessorio`
- Atualizar `mapFromDB` e `mapToDB` para incluir o campo `codigo`

**`src/pages/EstoqueAcessorios.tsx`**
- Exibir `codigo` (AC-XXXX) na coluna ID ao inves do UUID

**`src/utils/estoqueApi.ts`**
- Nenhuma alteracao de mapeamento necessaria (modelo ja e mapeado como string)

**`src/utils/osApi.ts`**
- Nenhuma alteracao (codigo ja e mapeado)

### Etapa 4: Atualizar Edge Functions de importacao
- `import-produtos-estoque`: Aplicar Title Case nos modelos antes de inserir
- `import-produtos-pendentes`: Gerar `codigo` sequencial ao inserir (consultar MAX do banco)
- `import-acessorios`: Aplicar Title Case nos nomes e gerar `codigo` sequencial

## Regras de Normalizacao de Nomes

```text
Palavras especiais (manter como estao):
- iPhone, iPad, AirPods, MacBook (Apple products)
- GB, TB, RAM, 5G, 4G, LTE (siglas tecnicas)
- PRO, MAX, PLUS, MINI, SE, XR, XS (variantes de produto)
- USB-C, OTG, HDMI, NFC (siglas de tecnologia)
- JBL, PS5, PS4 (marcas/siglas conhecidas)

Demais palavras: primeira letra maiuscula, restante minuscula
```

## Arquivos Modificados
1. `supabase/migrations/` - Nova migration (schema + dados)
2. `src/utils/acessoriosApi.ts` - Interface e mapeamento do campo `codigo`
3. `src/pages/EstoqueAcessorios.tsx` - Exibir `codigo` na coluna ID
4. `supabase/functions/import-produtos-estoque/index.ts` - Title Case nos modelos
5. `supabase/functions/import-produtos-pendentes/index.ts` - Gerar codigo sequencial
6. `supabase/functions/import-acessorios/index.ts` - Title Case e codigo sequencial

