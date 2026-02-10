

# Corrigir card de Prejuizo no quadro de pagamentos

## Problema
Ao adicionar um produto na Nova Venda, o card "Prejuizo" no resumo de pagamentos exibe imediatamente o valor de custo do aparelho como prejuizo, mesmo sem nenhum valor de venda definido. Isso ocorre porque `lucroProjetado = total - valorCustoTotal` resulta em negativo quando `total === 0`.

Prejuizo so deve ser sinalizado quando a venda ja possui um valor total maior que zero e esse valor e inferior ao custo.

## Alteracao

### Arquivo: `src/pages/VendasNova.tsx`

Alterar a linha 441:

De:
```
const isPrejuizo = lucroProjetado < 0;
```

Para:
```
const isPrejuizo = total > 0 && lucroProjetado < 0;
```

Isso corrige:
- O card mostra "Lucro: R$ 0,00" enquanto nenhum valor de venda estiver configurado
- A badge "PREJUIZO" no header do card so aparece quando ha venda com valor definido abaixo do custo
- A borda vermelha do card so e aplicada em caso de prejuizo real
- A margem e os estilos de cores destrutivas so aparecem quando ha prejuizo real

Nenhuma outra alteracao necessaria -- todos os locais que referenciam `isPrejuizo` serao automaticamente corrigidos.

