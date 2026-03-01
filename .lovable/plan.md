

# Padronizar IDs da Aba de Maquinas

## Contexto

As abas de Cadastros usam IDs padronizados:
- Acessorios: `AC-001`, `AC-002`, ...
- Aparelhos: `AP-001`, `AP-002`, ...
- Maquinas: atualmente exibem UUIDs do Supabase (ex: `cf32174c-fe89-4b05-...`)

## Solucao

Adicionar uma coluna `codigo` na tabela `maquinas_cartao` do Supabase para armazenar o ID visual padronizado no formato `MQ-001`, e exibir esse codigo na interface em vez do UUID.

## Alteracoes

### 1. Migration SQL

- Adicionar coluna `codigo VARCHAR` na tabela `maquinas_cartao`
- Popular as 18 maquinas existentes com `MQ-001` ate `MQ-018` (ordenadas por nome)

### 2. Arquivo: `src/utils/cadastrosApi.ts`

- Adicionar campo `codigo` na interface `MaquinaCartao`
- Atualizar `mapRowToMaquinaCartao` para incluir `codigo`
- Na funcao `addMaquinaCartao`, gerar o proximo codigo incremental (consultar o maior existente e incrementar)

### 3. Arquivo: `src/pages/CadastrosMaquinas.tsx`

- Exibir `maquina.codigo` em vez de `maquina.id` na coluna ID da tabela
- Exibir `maquina.codigo` no export CSV

## Detalhes Tecnicos

| Item | Valor |
|---|---|
| Formato do ID | MQ-001 (prefixo MQ, 3 digitos) |
| Registros existentes | MQ-001 a MQ-018 |
| Proximo ID | MQ-019 (auto-incremento no insert) |
| Coluna Supabase | `codigo VARCHAR` |
| UUID permanece | Sim, como chave primaria interna |

