

# Plano: Limpeza de Mocks e Padronizacao Final - CONCLUIDO

## Status: 100% Executado

Todas as acoes foram implementadas com sucesso:

1. **Mock morto removido**: `inicializarNotasEntradaMock` + `criarNotaEntradaComDataHora` (~143 linhas) deletados de `notaEntradaFluxoApi.ts`
2. **Erros padronizados em 7 APIs**: Todas as funcoes de mutacao agora propagam erros via `throw error`
   - `consignacaoApi.ts`: `syncLoteToDb`, `syncItemToDb`
   - `acessoriosApi.ts`: `updateAcessorioQuantidade`, `subtrairEstoqueAcessorio`, `adicionarEstoqueAcessorio`
   - `retiradaPecasApi.ts`: `saveRetirada`
   - `garantiasApi.ts`: `aprovarAnaliseGarantia`, `recusarAnaliseGarantia`, `encaminharParaAnaliseGarantia`
   - `metasApi.ts`: `updateMeta`, `deleteMeta`
   - `estoqueApi.ts`: `updateProduto`

## Excecoes Documentadas (aceitas por design)
- **OS Fallback**: `fluxoVendasApi.ts` usa localStorage para IDs `OS-*`
- **Dashboard Mock**: `storesApi.ts` usa dados ficticios para Performance/Index
- **Init caches**: Erros em init (leitura) usam `console.error` sem throw - aceitavel

