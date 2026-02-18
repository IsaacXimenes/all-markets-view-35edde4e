

## Incorporar Custo de Reparo ao Custo do Produto na Aprovacao

### Problema Atual

Quando o Gestor de Estoque aprova um produto apos reparo, a funcao `migrarParaEstoque` (em `src/utils/osApi.ts`, linha 435) usa **apenas** o `valorCustoOriginal`, ignorando o custo de assistencia acumulado. Ou seja, um aparelho que custou R$ 3.100 e teve R$ 400 de reparo continua com custo de R$ 3.100 no estoque, quando deveria ser R$ 3.500.

### Correcao Proposta

**Arquivo: `src/utils/osApi.ts`**

1. **Calcular custo composto**: Somar `custoAssistencia` ao `valorCustoOriginal` para definir o novo `valorCusto` do produto migrado
2. **Atualizar `valorVendaSugerido`**: Basear no custo composto (nao mais no original)
3. **Registrar na timeline**: Adicionar entrada detalhando a composicao do custo (aquisicao + reparo = total)
4. **Incluir no `historicoCusto`**: Adicionar registro do investimento em reparo

### Detalhes Tecnicos

**`src/utils/osApi.ts` - funcao `migrarParaEstoque` (linhas 424-455)**

Alteracoes:

```text
ANTES:
  valorCusto: produto.valorCustoOriginal,              // linha 435
  valorVendaSugerido: produto.valorCustoOriginal * 1.8, // linha 436

DEPOIS:
  const custoReparo = produto.custoAssistencia || 0;
  const custoComposto = produto.valorCustoOriginal + custoReparo;

  valorCusto: custoComposto,
  valorVendaSugerido: custoComposto * 1.8,
```

Adicionar ao `historicoCusto` (quando houver custo de reparo):

```typescript
historicoCusto: [
  { data: ..., fornecedor: produto.origemEntrada, valor: produto.valorCustoOriginal },
  // Se houve reparo, adicionar entrada separada:
  ...(custoReparo > 0 ? [{
    data: new Date().toISOString().split('T')[0],
    fornecedor: 'Assistência Técnica',
    valor: custoReparo
  }] : [])
],
```

Adicionar entrada na timeline (quando houver custo de reparo):

```typescript
// Timeline entry mostrando composicao do custo
{
  id: `TL-CUSTO-${Date.now()}`,
  tipo: 'parecer_estoque',
  data: new Date().toISOString(),
  titulo: 'Custo Composto Atualizado',
  descricao: `Aquisição: R$ ${valorCustoOriginal} + Reparo: R$ ${custoReparo} = Custo Final: R$ ${custoComposto}`,
  responsavel
}
```

Tambem preservar `custoAssistencia` no produto migrado para o campo existente em `estoqueApi.ts`.

### Resultado Esperado

- Aparelho com custo original R$ 3.100 + reparo R$ 400 = custo final R$ 3.500 no estoque
- Timeline mostra a composicao do custo
- Historico de custo registra ambas as entradas (aquisicao e reparo)
- Valor de venda sugerido calculado sobre o custo composto

