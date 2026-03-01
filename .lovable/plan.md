
# Plano: Padronizar ID legivel nas movimentacoes de estoque

## Problema Atual

A funcao `addMovimentacao` em `estoqueApi.ts` (linha 569) usa o UUID retornado pelo Supabase como ID da movimentacao:
```
const newMov: Movimentacao = { ...mov, id: data.id, status: 'Pendente' };
```
Isso resulta em IDs como `a1b2c3d4-e5f6-...`, inconsistente com os demais modulos que usam IDs legiveis:
- Movimentacao Matriz: `MM-20260301-0001`
- Movimentacao Acessorios: `MOV-ACESS-1709312345`
- Movimentacao Pecas: `MOV-PEC-0001`

## Solucao

Adicionar um campo `codigoLegivel` a interface `Movimentacao` e gerar um ID padronizado no formato `MOV-XXXX` (sequencial), mantendo o UUID do banco como `id` interno.

## Alteracoes

### 1. `src/utils/estoqueApi.ts`

**Interface Movimentacao (linha 151):** Adicionar campo `codigoLegivel: string`

**Contador e gerador (proximo da linha 555):** Criar variavel `movIdCounter` e funcao `generateMovId()` que retorna `MOV-XXXX` sequencial (padStart 4 digitos), similar ao padrao existente em `generateMovMatrizId`.

**Funcao addMovimentacao (linha 559-575):** Apos o insert no banco, gerar o codigo legivel:
```
const codigoLegivel = generateMovId();
const newMov: Movimentacao = { ...mov, id: data.id, codigoLegivel, status: 'Pendente' };
```

**Funcao getMovimentacoes (linha 557):** Garantir que movimentacoes carregadas do cache tambem tenham `codigoLegivel` preenchido.

### 2. `src/pages/EstoqueMovimentacoes.tsx`

**Toast de sucesso (linha 295):** Trocar `novaMovimentacao.id` por `novaMovimentacao.codigoLegivel`:
```
description: `Movimentacao ${novaMovimentacao.codigoLegivel} registrada com sucesso.`
```

**Tabela de listagem:** Onde o `id` e exibido na interface, usar `codigoLegivel` em vez do UUID.

### 3. Demais chamadores (`vendasApi.ts`, `garantiasApi.ts`)

Estes arquivos chamam `addMovimentacao` mas nao exibem o ID ao usuario — apenas passam dados. Nao precisam de alteracao, o campo `codigoLegivel` sera adicionado automaticamente ao retorno.

## Detalhes Tecnicos

- O UUID do Supabase continua como `id` principal para queries no banco
- O `codigoLegivel` e apenas para exibicao no frontend
- Contador inicia em 1 e incrementa sequencialmente
- Formato: `MOV-0001`, `MOV-0002`, etc.
- Nenhuma alteracao no banco de dados e necessaria
