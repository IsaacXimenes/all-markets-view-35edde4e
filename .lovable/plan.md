

## Plano: Incluir Base de Troca (Trade-In) na Nota de Garantia (PDF)

### Alteracao

Adicionar uma linha por cada aparelho de troca (`venda.tradeIns`) na tabela "DADOS DOS PRODUTOS / SERVICOS" do PDF, apos a Garantia Estendida e antes do Total. O valor sera exibido como negativo (abatimento).

### Arquivo afetado

`src/utils/gerarNotaGarantiaPdf.ts`

### Implementacao

Inserir entre o bloco de Garantia Estendida (linha 401) e o Total de produtos (linha 403):

```typescript
// Base de Troca (Trade-In)
if (venda.tradeIns && venda.tradeIns.length > 0) {
  venda.tradeIns.forEach(tradeIn => {
    const descTradeIn = `Aparelho de Troca - ${tradeIn.modelo}${tradeIn.descricao ? ' (' + tradeIn.descricao + ')' : ''} - IMEI: ${tradeIn.imei}`;
    drawBox(prodColQtd, y, prodColQtdW, rowH);
    drawBox(prodColDesc, y, prodColDescW, rowH);
    drawBox(prodColTipo, y, prodColTipoW, rowH);
    drawBox(prodColValor, y, prodColValorW, rowH);
    doc.text('1', prodColQtd + 2, y + 5);
    doc.text(descTradeIn.substring(0, 70), prodColDesc + 2, y + 5);
    doc.text('Base de Troca', prodColTipo + 2, y + 5);
    doc.text('- ' + formatCurrency(tradeIn.valorCompraUsado), prodColValor + 2, y + 5);
    y += rowH;
  });
}
```

### Campos utilizados do `ItemTradeIn`

- `modelo` -- nome do aparelho (ex: "iPhone X")
- `descricao` -- capacidade/detalhes (ex: "256 GB")
- `imei` -- numero IMEI
- `valorCompraUsado` -- valor do abatimento, exibido com prefixo "- "

### Estrutura visual no PDF

| QTD | DESCRICAO | TIPO | VALOR |
|-----|-----------|------|-------|
| 1 | iPhone 16 Pro Max - IMEI: 123... | Aparelho | R$ 8.999,00 |
| 1 | Capa Silicone | Acessorio | R$ 79,90 |
| 1 | Plano de Garantia Estendido - Gold (12 meses) | Garantia | R$ 399,90 |
| 1 | Aparelho de Troca - iPhone X (256 GB) - IMEI: 358... | Base de Troca | - R$ 400,00 |
| | TOTAL | | R$ 9.078,80 |

O total (`venda.total`) ja subtrai o trade-in, portanto nao precisa de ajuste no calculo.

