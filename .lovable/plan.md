

## Mover Cards de Custo por Origem para as Abas Principais

### O que muda

Os cards de custo por origem (Balcao, Garantia, Estoque, Consignados) serao removidos dos formularios individuais de Nova OS e Edicao de OS, e adicionados nas abas principais:

1. **Aba "Nova Assistencia"** (`src/pages/OSAssistencia.tsx`)
2. **Aba "Solicitacoes de Pecas"** (`src/pages/OSSolicitacoesPecas.tsx`)

### Detalhes Tecnicos

**Arquivo: `src/pages/OSAssistencia.tsx`**
- Importar `CustoPorOrigemCards` e `getOrdensServico`
- Inserir o componente logo acima da tabela de OS, alimentado por todas as OS filtradas (`ordensFiltradas`)
- Os cards refletem dinamicamente os filtros aplicados (data, tecnico, status, loja)

**Arquivo: `src/pages/OSSolicitacoesPecas.tsx`**
- Importar `CustoPorOrigemCards` e `getOrdensServico`
- Buscar todas as OS que possuem solicitacoes de pecas visíveis
- Inserir o componente acima da tabela de solicitacoes, alimentado pelas OS vinculadas as solicitacoes filtradas

**Arquivo: `src/pages/OSAssistenciaNova.tsx`**
- Remover o `CustoPorOrigemCards` do formulario de criacao (linhas ~1206-1230)

**Arquivo: `src/pages/OSAssistenciaEditar.tsx`**
- Remover o `CustoPorOrigemCards` do formulario de edicao (linhas ~734-740)

### Arquivos Afetados

- `src/pages/OSAssistencia.tsx` (adicionar cards)
- `src/pages/OSSolicitacoesPecas.tsx` (adicionar cards)
- `src/pages/OSAssistenciaNova.tsx` (remover cards)
- `src/pages/OSAssistenciaEditar.tsx` (remover cards)

