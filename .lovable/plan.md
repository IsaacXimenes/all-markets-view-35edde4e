

# Adicionar coluna "Loja" nas Taxas de Entrega + IDs padronizados

## Resumo

Duas alteracoes no modulo de Taxas de Entrega:
1. Adicionar coluna `loja_id` para vincular cada taxa a uma loja (dados existentes serao vinculados a "Online")
2. Substituir o UUID longo por um ID sequencial legivel no formato `TAXA-0001`

---

## Acoes

### 1. Migration: adicionar coluna `loja_id` e `codigo` na tabela `taxas_entrega`

- Adicionar coluna `loja_id` (uuid, nullable, referenciando `lojas.id`)
- Adicionar coluna `codigo` (varchar, para o ID curto tipo `TAXA-0001`)
- Atualizar registros existentes: setar `loja_id` para o ID da loja "Online" (`df3995f6-1da1-4661-a68f-20fb548a9468`)
- Gerar codigos sequenciais para os registros existentes

### 2. Atualizar API (`src/utils/taxasEntregaApi.ts`)

- Adicionar `loja_id` e `codigo` na interface `TaxaEntrega`
- Atualizar `mapRow` para incluir os novos campos
- Atualizar `addTaxaEntrega` para receber `loja_id` e gerar `codigo` automaticamente (proximo sequencial)
- Atualizar `SEED_TAXAS` para incluir `loja_id` da loja Online
- Adicionar funcao auxiliar para gerar proximo codigo (`TAXA-XXXX`)

### 3. Atualizar pagina (`src/pages/CadastrosTaxasEntrega.tsx`)

**Tabela:**
- Substituir coluna "ID" (UUID) por coluna "Codigo" exibindo `TAXA-0001`
- Adicionar coluna "Loja" entre "Codigo" e "Local", mostrando o nome da loja
- Ajustar `colSpan` da linha vazia

**Filtros:**
- Adicionar filtro por loja (Select com lojas disponiveis)

**Formulario (Dialog):**
- Adicionar campo Select de "Loja" no formulario de criacao/edicao
- Preencher com lojas ativas do tipo "Loja" (vendas)
- Tornar obrigatorio

**Exportacao CSV:**
- Incluir coluna "Codigo" e "Loja" no export

---

## Detalhes tecnicos

### Arquivos a criar/editar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx_add_loja_codigo_taxas_entrega.sql` | Criar migration |
| `src/utils/taxasEntregaApi.ts` | Editar: interface, mapRow, funcoes CRUD |
| `src/pages/CadastrosTaxasEntrega.tsx` | Editar: tabela, filtros, formulario |

### Formato do codigo

Seguindo o padrao do `idManager.ts` que usa `PROD-0001`, as taxas usarao `TAXA-0001`. O proximo codigo sera calculado buscando o maior existente no banco.

### Loja padrao

Todos os registros existentes serao vinculados a loja "Online" (ID: `df3995f6-1da1-4661-a68f-20fb548a9468`) conforme informado.

