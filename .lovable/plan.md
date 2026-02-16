

## Correcao: Preservar Quadro de Parecer Estoque apos Recusa da Assistencia

### Diagnostico

O fluxo de recusa na Analise de Tratativas (`OSAnaliseGarantia.tsx`) chama `updateProdutoPendente` passando `statusGeral`, `parecerAssistencia` e `timeline`. O problema tem duas causas:

1. **Timeline duplicada e potencial conflito:** O codigo passa `timeline` explicitamente no `dados` (substituindo o array existente via spread) E ao mesmo tempo `updateProdutoPendente` adiciona automaticamente outra entrada de timeline quando detecta `parecerAssistencia` (linhas 589-600 de `osApi.ts`). Isso causa conflito no merge.

2. **`parecerEstoque` nao preservado explicitamente:** Embora o spread devesse preservar, a combinacao de substituicao de timeline + merge pode causar inconsistencia no objeto resultante. O campo `parecerEstoque` precisa ser explicitamente mantido.

### Correcao

**Arquivo:** `src/pages/OSAnaliseGarantia.tsx` (linhas 248-262)

Simplificar a chamada de `updateProdutoPendente` para:
- **NAO** passar `timeline` explicitamente (deixar `updateProdutoPendente` gerenciar a entrada de timeline via `parecerAssistencia`)
- Adicionar a entrada de timeline da recusa diretamente na timeline do produto ANTES da chamada, ou deixar o `updateProdutoPendente` gerar automaticamente
- Preservar explicitamente `parecerEstoque: produtoPendente.parecerEstoque`

Codigo corrigido:
```typescript
updateProdutoPendente(registroRecusado.origemId, {
  statusGeral: 'Pendente Estoque',
  parecerAssistencia,
  parecerEstoque: produtoPendente?.parecerEstoque, // Preservar explicitamente
});
```

A entrada de timeline sera gerada automaticamente pelo `updateProdutoPendente` (linhas 589-600 de `osApi.ts`) com base no `parecerAssistencia`, eliminando duplicatas e garantindo que o quadro de Parecer Estoque permaneca intacto.

### Arquivos Alterados

| Arquivo | Alteracao |
|---|---|
| `src/pages/OSAnaliseGarantia.tsx` | Remover `timeline` explicito da chamada de recusa; preservar `parecerEstoque` |

