

# Plano: Corrigir logica do Resumo e botao Salvar em Nova Venda

## Problemas identificados

### 1. Card de Acessorios ausente no Resumo
O card "Produtos" no Resumo exibe o valor combinado de aparelhos + acessorios (`valorProdutos = subtotal + totalAcessorios`). Nao existe um card separado para acessorios, dificultando a visualizacao do que compoe o total.

### 2. Botao Salvar nao habilitando
A validacao `canSubmit` exige `valorPendente <= 0`, porem:
- **Tolerancia de centavo nao aplicada**: `valorPendente = total - totalPagamentos` sem tolerancia de 0.01, o que pode bloquear por arredondamento de ponto flutuante (ex: valorPendente = 0.0000001)
- A validacao do alerta de campos faltando (linha 2447) usa `valorPendente > 0` sem tolerancia tambem

### 3. Analise das somas
- `subtotal` = soma dos `valorVenda` dos itens (aparelhos)
- `totalAcessorios` = soma dos `valorTotal` dos acessorios
- `valorProdutos` = `subtotal + totalAcessorios` (correto, mas exibido junto)
- `total` = `subtotal + totalAcessorios - totalTradeIn + taxaEntrega + valorGarantiaExtendida` (formula correta)
- `valorCustoTotal` = custo dos itens + custo dos acessorios (correto)
- `lucroProjetado` = `total - valorCustoTotal` (correto)

As formulas estao corretas. O problema real e a falta de tolerancia no `valorPendente`.

---

## Alteracoes

### Arquivo: `src/pages/VendasNova.tsx`

#### 1. Adicionar card separado de Acessorios no Resumo
Na secao do Resumo (linha ~2296), separar o card "Produtos" em dois:
- **Aparelhos**: exibindo `subtotal` (soma dos itens/aparelhos)
- **Acessorios**: exibindo `totalAcessorios` (soma dos acessorios) - exibido somente quando `totalAcessorios > 0`

O card "Total da Venda" continua usando o `total` completo.

#### 2. Aplicar tolerancia de 0.01 no canSubmit
Alterar a condicao de `valorPendente <= 0` para `valorPendente <= 0.01` em:
- `canSubmit` (linha 793)
- Alerta de campos faltando (linha 2447): `valorPendente > 0.01`

#### 3. Aplicar mesma tolerancia no valorPendente exibido
Quando `Math.abs(valorPendente) <= 0.01`, tratar como zero para exibicao, evitando mostrar "R$ 0,01" pendente.

---

## Resumo visual do card corrigido

```text
Antes:
[Produtos: R$ X.XXX] [Trade-in] [Entrega] [Total]

Depois:
[Aparelhos: R$ X.XXX] [Acessorios: R$ XXX] [Trade-in] [Entrega] [Total]
```

## Arquivos a editar
- `src/pages/VendasNova.tsx` - card de acessorios no resumo + tolerancia no canSubmit

