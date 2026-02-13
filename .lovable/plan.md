
# Plano - Ajustes no Modulo Financeiro (4 problemas)

## Problema 1: Remover abas "Lotes de Pagamento" e "Execucao de Lotes"

Remover as duas entradas do array `tabs` em `src/components/layout/FinanceiroLayout.tsx` (linhas 16-17) e os imports de icones nao utilizados (`Package`, `CreditCard`).

**Arquivo:** `src/components/layout/FinanceiroLayout.tsx`

---

## Problema 2: Conferencia do Fiado navegando para a aba errada

A aba "Conferencias - Fiado" tem `href: '/financeiro/fiado'` que esta correto. A rota em `App.tsx` tambem esta correta. O problema esta na logica de ativacao do `CarouselTabsNavigation.tsx` (linha 71):

```
const isActive = location.pathname === tab.href || 
  (tab.href !== tabs[0]?.href && location.pathname.startsWith(tab.href + '/'));
```

Quando o usuario esta em `/financeiro/fiado`, a aba "Conferencia de Contas" (`/financeiro/conferencia`) nao deveria estar ativa pois usa comparacao `===` (e a tab do fiado). Porem, ao navegar diretamente pela URL, a tab correta e destacada. O problema reportado pode ser que algum link/botao em outra parte do sistema que deveria levar para o Fiado esta apontando para `/financeiro/conferencia`.

Apos investigacao, a navegacao via tabs esta funcionando corretamente. Nao ha links em outras paginas apontando incorretamente. Vou garantir que nao haja conflito verificando que a logica de `isActive` funcione sem ambiguidade e que a rota esteja corretamente configurada. Se necessario, posso ajustar a ordem dos tabs ou a logica de `startsWith` para evitar falsos positivos.

**Verificacao adicional necessaria durante implementacao** - testar o comportamento real clicando na aba.

---

## Problema 3: Pagamento Downgrade sumindo o registro apos conclusao

O pagamento e processado por `finalizarVendaDowngrade` que muda o status para `'Finalizado'`. Na pagina `FinanceiroPagamentosDowngrade.tsx`, a aba "Historico" filtra vendas finalizadas (linha 42-46):

```typescript
vendas.filter(v => 
  v.statusFluxo === 'Finalizado' && 
  ((v as any).tipoOperacao === 'Downgrade' || (v as any).saldoDevolver)
)
```

O problema e que apos a finalizacao, a venda tem `statusFluxo: 'Finalizado'` mas o filtro adicional falha porque:
- `tipoOperacao` pode nao estar definido como `'Downgrade'` no fluxo
- `saldoDevolver` pode ser `0` (falsy) se nao foi persistido

Alem disso, o `useFluxoVendas` com `incluirHistorico: true` adiciona vendas finalizadas de TODOS os tipos, mas o filtro local da pagina deveria capturar apenas as downgrade.

**Correcao em `src/utils/fluxoVendasApi.ts`:** Na funcao `finalizarVendaDowngrade`, adicionar `tipoOperacao: 'Downgrade'` e preservar `saldoDevolver` no objeto salvo, e tambem salvar `contaOrigemDowngrade: contaOrigem` para que a coluna "Conta Utilizada" funcione.

**Correcao em `src/pages/FinanceiroPagamentosDowngrade.tsx`:** Ajustar o filtro de `vendasFinalizadas` para verificar tambem `(v as any).pagamentoDowngrade` como indicador de que a venda passou pelo fluxo de downgrade.

---

## Problema 4: Pagamento Downgrade nao aparece no Extrato por Conta

A funcao `finalizarVendaDowngrade` em `fluxoVendasApi.ts` nao registra nenhuma saida financeira. O Extrato le dados de `getDespesas()` do `financeApi.ts`.

**Correcao em `src/utils/fluxoVendasApi.ts`:** Na funcao `finalizarVendaDowngrade`, apos finalizar a venda, chamar `addDespesa` do `financeApi.ts` para registrar a saida financeira com:
- tipo: 'Variavel'
- descricao: "Pagamento PIX Downgrade - Venda [ID]"
- valor: saldoDevolver
- conta: contaOrigem (ID da conta informada)
- categoria: "Downgrade"
- status: "Pago"
- data/dataVencimento/dataPagamento: data atual
- lojaId: loja da venda
- competencia: mes/ano atual

---

## Secao Tecnica

| Arquivo | Alteracoes |
|---------|-----------|
| `src/components/layout/FinanceiroLayout.tsx` | Remover 2 tabs (Lotes de Pagamento e Execucao de Lotes) e imports de icones nao usados |
| `src/utils/fluxoVendasApi.ts` | Em `finalizarVendaDowngrade`: (1) salvar `tipoOperacao: 'Downgrade'`, `contaOrigemDowngrade`, preservar `saldoDevolver`; (2) chamar `addDespesa` para registrar saida financeira |
| `src/pages/FinanceiroPagamentosDowngrade.tsx` | Ajustar filtro de `vendasFinalizadas` para usar `pagamentoDowngrade` como indicador |
