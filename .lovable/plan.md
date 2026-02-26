

## Plano: Corrigir Nome do Motoboy, Vendedor, Local de Entrega e Condicionar Pagamento a Conferencia Financeira

### Problemas Identificados

1. **Nome do motoboy aparece como "Motoboy"**: Em `vendasApi.ts` linha 932, `(venda as any).motoboyNome || 'Motoboy'` -- o campo `motoboyNome` nao existe na interface `Venda`, entao cai no fallback `'Motoboy'`.
2. **Vendedor aparece como ID**: Em `motoboyApi.ts` linha 453, `venda.vendedor` e um ID (ex: `6dcbc817`), nao o nome.
3. **Localizacao mostra cidade do cliente**: Em `vendasApi.ts` linha 940, usa `venda.clienteCidade` em vez do campo `localEntregaNome` (que e o "Local de Entrega" selecionado no formulario).
4. **Pagamento deve ser condicionado a conferencia financeira**: A demanda deve ser registrada com status `'Pendente'` e so mudar para `'Concluida'` (habilitando pagamento) apos o financeiro finalizar a venda.

---

### 1. Atualizar `src/utils/vendasApi.ts` - Integracao Motoboy

**Linha 929-948 -- Bloco de integracao motoboy:**

- Buscar nome do motoboy via `getColaboradorById` de `cadastrosApi.ts`
- Buscar nome do local de entrega: o campo `localRetirada` na venda e o ID da loja/local selecionado. O `localEntregaNome` nao e persistido na venda. Solucao: buscar via `getTaxasEntregaAtivas()` pelo local ou usar o campo `localRetirada` que ja contem o nome/referencia do local
- Mudar status da demanda de `'Concluida'` para `'Pendente'` (sera ativado apos conferencia)

```typescript
// Buscar nome real do motoboy
const colaboradorMotoboy = getColaboradorById(venda.motoboyId);
const motoboyNome = colaboradorMotoboy?.nome || 'Motoboy';

// Buscar local de entrega real (localRetirada contém o nome do local selecionado)
const localEntrega = venda.localRetirada || venda.clienteCidade || 'Endereco Cliente';

addDemandaMotoboy({
  ...
  motoboyNome,
  lojaDestino: localEntrega,
  status: 'Pendente', // Muda para 'Concluida' apos conferencia financeira
  ...
});
```

---

### 2. Atualizar `src/utils/motoboyApi.ts` - Funcao para Ativar Demandas

**2.1 Nova funcao `ativarDemandasPorVenda`:**
- Recebe `vendaId: string`
- Busca todas as demandas com esse `vendaId` e status `'Pendente'`
- Altera status para `'Concluida'`
- Chama `atualizarRemuneracaoPeriodo` para cada demanda ativada (para contabilizar na remuneracao)

```typescript
export const ativarDemandasPorVenda = (vendaId: string): void => {
  demandas.forEach(d => {
    if (d.vendaId === vendaId && d.status === 'Pendente') {
      d.status = 'Concluida';
      atualizarRemuneracaoPeriodo(d);
    }
  });
};
```

**2.2 Ajustar `addDemandaMotoboy`:**
- Quando status for `'Pendente'`, NAO chamar `atualizarRemuneracaoPeriodo` (so contabiliza apos conferencia)

**2.3 Corrigir `getDetalheEntregasRemuneracao`:**
- Na linha 453, resolver o nome do vendedor usando `getColaboradorById` em vez de retornar o ID cru
- Usar `d.lojaDestino` como localizacao (que agora tera o local de entrega real)

---

### 3. Atualizar `src/utils/fluxoVendasApi.ts` - Hook na Finalizacao

**Na funcao `finalizarVenda` (linha ~446, apos salvar o fluxo):**
- Importar `ativarDemandasPorVenda` de `motoboyApi.ts`
- Chamar `ativarDemandasPorVenda(vendaId)` apos a finalizacao financeira
- Fazer o mesmo em `finalizarVendaDowngrade` e `finalizarVendaFiado`

---

### 4. Verificar campo `localRetirada` na venda

O campo `localRetirada` na interface `Venda` armazena o valor selecionado no autocomplete "Local de Entrega". Preciso confirmar se ele salva o nome ou o ID. Se salva o nome, usamos diretamente. Se salva ID, resolvemos via lookup.

Pela analise do codigo em VendasNova.tsx, o `localRetirada` e setado com o ID da loja (para "Retirada em Outra Loja") ou o nome da loja de venda. Para entregas, o local de entrega real e `localEntregaNome` que NAO e persistido no objeto da venda.

**Solucao**: Adicionar `localEntregaNome` ao objeto da venda quando `tipoRetirada === 'Entrega'`, e usar esse campo na integracao com motoboy.

---

### Resumo de Arquivos

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/VendasNova.tsx` | Adicionar `localEntregaNome` ao vendaData quando tipoRetirada === 'Entrega' |
| `src/utils/vendasApi.ts` | Resolver nome do motoboy via `getColaboradorById`, usar `localEntregaNome`, status `'Pendente'` |
| `src/utils/motoboyApi.ts` | Nova funcao `ativarDemandasPorVenda`, ajustar `addDemandaMotoboy` para nao contabilizar pendentes, resolver nome vendedor no drill-down |
| `src/utils/fluxoVendasApi.ts` | Chamar `ativarDemandasPorVenda` em `finalizarVenda`, `finalizarVendaDowngrade` e `finalizarVendaFiado` |

### Detalhes Tecnicos

- `getColaboradorById` de `cadastrosApi.ts` e usado para resolver IDs de colaboradores para nomes
- O fluxo completo fica: Venda lancada -> demanda criada como `Pendente` -> financeiro finaliza -> demanda vira `Concluida` -> contabiliza na remuneracao -> habilita pagamento
- A `atualizarRemuneracaoPeriodo` so e chamada quando a demanda tem status `'Concluida'`, garantindo que valores pendentes nao sao contabilizados prematuramente

