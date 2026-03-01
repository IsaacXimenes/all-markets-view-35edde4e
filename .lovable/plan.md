

# Corrigir exibicao de Cargo: mostrar nome em vez do ID

## Problema

O banco de dados armazena o cargo como ID (ex: "CARGO-004", "CARGO-010"), mas a interface exibe esse ID diretamente em vez do nome legivel (ex: "Vendedor", "Socio Administrador").

Isso afeta:
- A coluna "Cargo" na tabela de colaboradores
- Os filtros por cargo
- Os badges de cargo
- Os contadores por tipo de cargo (tecnicos, motoboys)
- O componente `AutocompleteColaborador` e qualquer outro que use `col.cargo`

## Causa raiz

O mapper `mapSupabaseColaborador` no `cadastroStore.ts` (linha 97) simplesmente copia o valor bruto do banco (`row.cargo`), que e um ID como "CARGO-004". Todo o codigo downstream (filtros, badges, display) espera um nome legivel como "Vendedor".

## Solucao

Resolver o ID do cargo para o nome no momento do mapeamento, dentro de `mapSupabaseColaborador`. Isso garante que **todos** os consumidores recebam o nome correto sem precisar de alteracoes individuais.

### Arquivo: `src/store/cadastroStore.ts`

1. Importar `getCargoNome` de `@/utils/cadastrosApi`
2. Na funcao `mapSupabaseColaborador` (linha 97), alterar:
   - De: `cargo: row.cargo || ''`
   - Para: `cargo: getCargoNome(row.cargo || '')`

Isso faz com que o cargo ja chegue resolvido (ex: "Vendedor" em vez de "CARGO-004") em todo o sistema.

### Arquivo: `src/store/cadastroStore.ts` (mapper inverso)

3. Na funcao `mapColaboradorToSupabase` (linha 116), manter o cargo como esta. Quando o usuario salva, o formulario de edicao ja envia o nome do cargo (via Select com `cargo.funcao`), nao o ID. Nenhuma mudanca necessaria aqui.

## Impacto

- **1 arquivo editado** (`src/store/cadastroStore.ts`)
- **1 linha alterada** (+ 1 import)
- Corrige automaticamente todas as telas que consomem dados do store: Colaboradores, Autocomplete, LojaRH, filtros, badges, contadores

