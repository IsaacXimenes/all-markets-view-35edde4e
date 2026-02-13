

# Plano - Fluxo Fiado: Gestor envia para Conferencia Fiado (nao Financeiro)

## Resumo

O fluxo atual de vendas Fiado segue: Lancamento -> Gestor -> Financeiro -> Finalizado. O correto e: **Lancamento -> Gestor -> Conferencia Fiado -> Finalizado**. A venda deve aparecer na aba "Conferencias - Fiado" apos aprovacao do Gestor, onde sera finalizada (criando a divida automaticamente) sem passar pela Conferencia Financeira.

## Alteracoes

### 1. Novo status no fluxo (`src/utils/fluxoVendasApi.ts`)

- Adicionar `'Conferência Fiado'` ao tipo `StatusVenda`
- Na funcao `aprovarGestor`: detectar se a venda tem pagamento Fiado (`venda.pagamentos.some(p => p.isFiado)`). Se sim, definir `statusFluxo: 'Conferência Fiado'` em vez de `'Conferência Financeiro'`
- Criar nova funcao `finalizarVendaFiado(vendaId, usuarioId, usuarioNome)` que:
  - Valida status `'Conferência Fiado'`
  - Muda status para `'Finalizado'`
  - Chama `criarDividaFiado` do `fiadoApi.ts` para registrar a divida automaticamente (usando dados da venda: clienteId, clienteNome, lojaId, lojaNome, valor, parcelas, recorrencia)
  - Migra trade-ins se houver
  - Registra timeline
- Adicionar cor de badge para `'Conferência Fiado'` (ex: roxo, consistente com o badge Fiado em VendaDetalhes)

### 2. Aprovacao do Gestor (`src/pages/VendasConferenciaGestor.tsx`)

- No handler `handleAprovarGestor`, apos o check de Downgrade, adicionar check de Fiado:
  - Se a venda tem pagamento Fiado: chamar `aprovarGestor` (que internamente ja vai setar o status correto) e exibir toast "Enviada para Conferencia - Fiado"
  - Caso contrario: fluxo normal para Conferencia Financeiro

### 3. Tela Conferencia Fiado (`src/pages/FinanceiroFiado.tsx`)

- Importar `useFluxoVendas` e as funcoes de fluxo necessarias
- Adicionar nova aba/secao "Pendentes de Conferencia" que lista vendas com `statusFluxo === 'Conferência Fiado'`
- Para cada venda pendente, exibir botao "Finalizar / Aprovar" que:
  - Chama `finalizarVendaFiado`
  - Cria a divida no sistema de Fiado automaticamente
  - Recarrega a lista de dividas
- Manter o funcionamento atual das dividas ja criadas (pagamentos, agenda, etc.)

### 4. Hook useFluxoVendas (`src/hooks/useFluxoVendas.ts`)

- Adicionar `conferenciaFiado` ao objeto `contadores`

## Secao Tecnica

| Arquivo | Alteracoes |
|---------|-----------|
| `src/utils/fluxoVendasApi.ts` | Adicionar `'Conferência Fiado'` ao StatusVenda; modificar `aprovarGestor` para detectar Fiado; criar `finalizarVendaFiado`; adicionar cor badge roxo |
| `src/pages/VendasConferenciaGestor.tsx` | Ajustar toast na aprovacao de venda Fiado |
| `src/pages/FinanceiroFiado.tsx` | Adicionar secao de vendas pendentes de conferencia Fiado com botao de finalizacao |
| `src/hooks/useFluxoVendas.ts` | Adicionar contador `conferenciaFiado` |
| `src/utils/fiadoApi.ts` | Sem alteracoes (ja tem `criarDividaFiado` pronto) |

