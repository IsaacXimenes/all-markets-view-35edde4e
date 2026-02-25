

## Plano: Corrigir nome do motoboy e adicionar taxa de entrega na tabela de produtos

### Alteracoes no arquivo `src/utils/gerarNotaGarantiaPdf.ts`

### 1. Importar `getColaboradorById`

Adicionar `getColaboradorById` ao import existente de `cadastrosApi` (linha 3).

### 2. Corrigir nome do motoboy na secao FRETE / ENTREGA

Na linha 333, substituir `venda.motoboyId || '-'` por uma busca do nome do colaborador:

```typescript
const motoboyNome = venda.motoboyId
  ? (getColaboradorById(venda.motoboyId)?.nome || venda.motoboyId)
  : '-';
```

A secao FRETE / ENTREGA permanece como esta (com TAXA DE ENTREGA e MOTOBOY / OBSERVACOES), apenas corrigindo o valor exibido para o nome real.

### 3. Adicionar taxa de entrega na tabela de produtos

Apos o bloco de Base de Troca (linha 428) e antes do Total (linha 430), inserir:

```typescript
// Taxa de Entrega (como item)
if (venda.taxaEntrega && venda.taxaEntrega > 0) {
  drawBox(prodColQtd, y, prodColQtdW, rowH);
  drawBox(prodColDesc, y, prodColDescW, rowH);
  drawBox(prodColTipo, y, prodColTipoW, rowH);
  drawBox(prodColValor, y, prodColValorW, rowH);
  doc.text('1', prodColQtd + 2, y + 5);
  doc.text('Taxa de Entrega', prodColDesc + 2, y + 5);
  doc.text('Entrega', prodColTipo + 2, y + 5);
  doc.text(formatCurrency(venda.taxaEntrega), prodColValor + 2, y + 5);
  y += rowH;
}
```

### Resultado visual

**Secao FRETE / ENTREGA** (mantida, com nome corrigido):

| SIM | NAO | TIPO DE RETIRADA | ENDERECO / LOCAL |
|-----|-----|------------------|------------------|
| X   |     | Entrega          | Rua tal...       |
| TAXA DE ENTREGA: R$ 15,00 | MOTOBOY / OBSERVACOES: Joao Vitor |

**Tabela DADOS DOS PRODUTOS / SERVICOS** (taxa tambem aparece aqui):

| QTD | DESCRICAO | TIPO | VALOR |
|-----|-----------|------|-------|
| 1 | iPhone 16 Pro Max - IMEI: 123... | Aparelho | R$ 8.999,00 |
| 1 | Capa Silicone | Acessorio | R$ 79,90 |
| 1 | Plano de Garantia Estendido - Gold (12 meses) | Garantia | R$ 399,90 |
| 1 | Aparelho de Troca - iPhone X... | Base de Troca | - R$ 400,00 |
| 1 | Taxa de Entrega | Entrega | R$ 15,00 |
| | TOTAL | | R$ 9.093,80 |

