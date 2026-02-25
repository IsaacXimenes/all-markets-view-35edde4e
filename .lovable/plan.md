

## Plano: Incluir Garantia Estendida na Nota de Garantia (PDF)

### Alteracao

Adicionar uma linha de Garantia Estendida na tabela de "DADOS DOS PRODUTOS / SERVICOS" do PDF, logo apos os acessorios e antes da linha de total.

### Arquivo afetado

`src/utils/gerarNotaGarantiaPdf.ts`

### Implementacao

No trecho entre os acessorios (linha 387) e o total de produtos (linha 389), inserir um bloco condicional:

```
if (venda.garantiaExtendida && venda.garantiaExtendida.valor > 0) {
  const descGarantia = `Plano de Garantia Estendido - ${venda.garantiaExtendida.planoNome} (${venda.garantiaExtendida.meses} meses)`;
  drawBox(prodColQtd, y, prodColQtdW, rowH);
  drawBox(prodColDesc, y, prodColDescW, rowH);
  drawBox(prodColTipo, y, prodColTipoW, rowH);
  drawBox(prodColValor, y, prodColValorW, rowH);
  doc.text('1', prodColQtd + 2, y + 5);
  doc.text(descGarantia.substring(0, 70), prodColDesc + 2, y + 5);
  doc.text('Garantia', prodColTipo + 2, y + 5);
  doc.text(formatCurrency(venda.garantiaExtendida.valor), prodColValor + 2, y + 5);
  y += rowH;
}
```

A linha segue exatamente o mesmo padrao visual das linhas de acessorios (mesmas colunas, fontes, bordas e alinhamentos). O total ja usa `venda.total` que inclui a garantia, portanto nao precisa de ajuste adicional.

### Estrutura visual no PDF

| QTD | DESCRICAO DO PRODUTO / ACESSORIO | TIPO | VALOR |
|-----|----------------------------------|------|-------|
| 1 | iPhone 16 Pro Max - IMEI: 123... | Aparelho | R$ 8.999,00 |
| 1 | Capa Silicone | Acessorio | R$ 79,90 |
| 1 | Plano de Garantia Estendido - Gold (12 meses) | Garantia | R$ 399,90 |
| | TOTAL | | R$ 9.478,80 |

