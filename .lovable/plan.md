

# Plano: Otimizacao do Fluxo de Notas de Entrada - Produtos no Lancamento e Pagamento Parcial Flexivel

## Visao Geral

Tres grandes mudancas no fluxo de Notas de Entrada:

1. **Desbloquear o quadro de produtos no lancamento** com campos condicionais baseados no tipo de pagamento
2. **Pagamento parcial flexivel** no modulo Financeiro (usuario define o valor a pagar)
3. **Funcionalidade "Explodir Itens"** para gerar unidades individuais a partir de um item consolidado

---

## 1. Desbloquear Quadro de Produtos no Lancamento

### Arquivo: `src/pages/EstoqueNotaCadastrar.tsx`

**O que muda:**
- Remover o overlay de "Produtos bloqueados" (linhas 218-276)
- Adicionar um quadro de produtos funcional com logica condicional:
  - **Pagamento Antecipado ou Parcial**: campos habilitados apenas Tipo Produto, Marca, Modelo, Qtd, Custo Unitario. Campos IMEI, Cor, Categoria ficam ocultos/desabilitados
  - **Pagamento Pos**: todos os campos habilitados (fluxo completo atual)
- Adicionar estado `produtos` (array de `ProdutoLinha`) e funcoes de adicionar/remover/atualizar
- No `handleSalvar`, passar os produtos junto com a criacao da nota
- Atualizar o alerta informativo para refletir o novo comportamento

### Arquivo: `src/utils/notaEntradaFluxoApi.ts`

**O que muda:**
- Atualizar `criarNotaEntrada` para aceitar produtos opcionais no lancamento
- Quando produtos sao passados, ja registra-los na nota (qtdCadastrada, valorTotal calculado)
- Manter a logica de atuacao inicial intacta

---

## 2. Pagamento Parcial Flexivel no Financeiro

### Arquivo: `src/components/estoque/ModalFinalizarPagamento.tsx`

**O que muda:**
- Adicionar campo editavel de "Valor do Pagamento" quando a nota for do tipo `Pagamento Parcial`
- Exibir informacoes claras: Valor Total da Nota, Valor Ja Pago, Saldo Devedor
- Validacao: valor inserido nao pode exceder o saldo devedor
- Pre-preencher com o saldo devedor mas permitir edicao
- Adicionar a interface `PendenciaPagamentoData` o campo `tipoPagamento`

### Arquivo: `src/pages/FinanceiroNotasPendencias.tsx`

**O que muda:**
- Passar `tipoPagamento` e `valorPago` para o modal de pagamento
- Ajustar `handleFinalizarPagamento` para usar o valor informado pelo usuario (ao inves de sempre `valorPendente`)

### Arquivo: `src/utils/notaEntradaFluxoApi.ts`

**O que muda na funcao `registrarPagamento`:**
- Para tipo `Pagamento Parcial`, aceitar pagamentos de qualquer valor (nao apenas o total pendente)
- Nao transicionar para `Finalizada` se ainda houver saldo devedor apos o pagamento
- Registrar corretamente como `parcial` quando o valor pago nao quita o saldo

---

## 3. Funcionalidade "Explodir Itens"

### Arquivo: `src/pages/EstoqueNotaCadastrar.tsx`

**O que muda:**
- Adicionar botao "Gerar Unidades" ao lado de itens com Qtd > 1
- Ao clicar:
  1. Remove o item consolidado
  2. Gera N linhas individuais (Qtd = 1 cada) com Tipo Produto, Marca, Modelo e Custo Unitario pre-preenchidos
  3. Campos IMEI, Cor, Categoria ficam vazios para preenchimento posterior
- Flag `explodido: boolean` na interface `ProdutoLinha` para diferenciar itens consolidados de individuais
- Botao visivel apenas quando Qtd > 1

### Arquivo: `src/pages/EstoqueNotaCadastrarProdutos.tsx`

**O que muda:**
- Mesma funcionalidade de "Explodir Itens" disponivel tambem nesta tela (cadastro posterior)
- Util para notas que chegaram sem produtos e estao sendo cadastradas via Notas Pendencias

---

## 4. Resumo de Alteracoes por Arquivo

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/pages/EstoqueNotaCadastrar.tsx` | Modificar | Desbloquear quadro de produtos + campos condicionais + explodir itens |
| `src/pages/EstoqueNotaCadastrarProdutos.tsx` | Modificar | Adicionar funcionalidade de explodir itens |
| `src/components/estoque/ModalFinalizarPagamento.tsx` | Modificar | Campo editavel de valor para pagamento parcial |
| `src/pages/FinanceiroNotasPendencias.tsx` | Modificar | Passar tipoPagamento ao modal + ajustar handler |
| `src/utils/notaEntradaFluxoApi.ts` | Modificar | Aceitar produtos no lancamento + pagamento parcial flexivel |

---

## 5. Detalhes Tecnicos

### Interface ProdutoLinha atualizada (EstoqueNotaCadastrar)

```typescript
interface ProdutoLinha {
  tipoProduto: 'Aparelho' | 'Acessorio';
  marca: string;
  modelo: string;
  imei: string;        // oculto/desabilitado para Antecipado/Parcial
  cor: string;         // oculto/desabilitado para Antecipado/Parcial
  categoria: string;   // oculto/desabilitado para Antecipado/Parcial
  quantidade: number;
  custoUnitario: number;
  custoTotal: number;
  explodido?: boolean; // true se gerado pela explosao
}
```

### PendenciaPagamentoData atualizada

```typescript
export interface PendenciaPagamentoData {
  // ... campos existentes
  tipoPagamento?: string;  // NOVO
  valorPago?: number;      // NOVO
}
```

### DadosPagamento atualizado

```typescript
export interface DadosPagamento {
  // ... campos existentes
  valorPagamento?: number; // NOVO - valor editado pelo usuario
}
```

### Logica de campos condicionais

```typescript
const camposSimplificados = tipoPagamento === 'Pagamento 100% Antecipado' 
                         || tipoPagamento === 'Pagamento Parcial';

// Na tabela de produtos:
// Se camposSimplificados = true:
//   - Mostrar: Tipo Produto, Marca, Modelo, Qtd, Custo Unit, Custo Total
//   - Ocultar: IMEI, Cor, Categoria
// Se camposSimplificados = false:
//   - Mostrar todos os campos
```

### Logica de explosao de itens

```typescript
const explodirItem = (index: number) => {
  const item = produtos[index];
  if (item.quantidade <= 1) return;
  
  const novasLinhas = Array.from({ length: item.quantidade }, () => ({
    ...item,
    quantidade: 1,
    custoTotal: item.custoUnitario,
    imei: '',
    cor: '',
    categoria: '',
    explodido: true
  }));
  
  const novosProdutos = [
    ...produtos.slice(0, index),
    ...novasLinhas,
    ...produtos.slice(index + 1)
  ];
  setProdutos(novosProdutos);
};
```

---

## 6. Validacoes

- Campos obrigatorios no lancamento simplificado: Tipo Produto, Marca, Modelo, Qtd, Custo Unitario
- Campos obrigatorios no lancamento completo (Pos): todos os campos incluindo IMEI, Cor, Categoria
- Valor do pagamento parcial: deve ser > 0 e <= saldo devedor
- Explosao: soma das quantidades individuais deve igualar a quantidade original
- Tolerancia financeira de R$ 0,01 nas comparacoes de saldo

