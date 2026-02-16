

## Correcoes em 4 Modulos

### 1. Parecer Estoque - Campos Automaticos e Read-Only

**Arquivo:** `src/pages/EstoqueProdutoPendenteDetalhes.tsx`

**Problema atual:** O modal de confirmacao dupla (linhas 493-517) tem um Select editavel para "Responsavel" e um Input editavel para "Data". O usuario pode alterar ambos.

**Correcao:**
- Remover o Select de `confirmResponsavel` e substituir por um Input `disabled` pre-preenchido com `usuarioLogado.nome`
- No `handleAbrirConfirmacao`, auto-preencher `setConfirmResponsavel(usuarioLogado.nome)` ao abrir o modal (em vez de string vazia)
- Tornar o campo de Data (`confirmData`) tambem `disabled` com `className="bg-muted"`
- Remover `onChange` do campo de data
- Atualizar `confirmacaoValida` para nao depender de selecao manual (ja estara preenchido)

### 2. Sincronizacao de Recusa - Parecer Assistencia "Recusado"

**Arquivo:** `src/utils/osApi.ts`

**Problema atual:** A interface `ParecerAssistencia` (linha 22) so aceita `'Validado pela assistencia' | 'Aguardando peca' | 'Ajustes realizados'`. Nao tem "Recusado".

**Correcao:** Adicionar `'Recusado - Assistencia'` ao union type de `status` na interface `ParecerAssistencia`.

**Arquivo:** `src/pages/OSAnaliseGarantia.tsx`

**Problema atual:** Na funcao `handleConfirmarRecusa` (linhas 240-252), o status do parecer assistencia esta hardcoded como `'Aguardando peca' as any` com um comentario de placeholder. Isso causa a exibicao incorreta "Aguardando Peca" no Estoque.

**Correcao:** Substituir `'Aguardando peca' as any` por `'Recusado - Assistencia'` (novo valor valido no union type). Remover os comentarios de placeholder e o cast `as any`.

### 3. Lookup de Loja por Tecnico

**Status:** Ja implementado corretamente (linhas 442-450 de `OSAnaliseGarantia.tsx`). O `onValueChange` do Select de tecnico ja chama `obterColaboradorById(val)` e preenche `setLojaSelecionada(colaborador.loja_id)`.

**Verificacao:** Confirmar que `obterColaboradorById` retorna o campo `loja_id` corretamente. O store (linha 223-224) faz `find` por ID, e o tipo `ColaboradorMockado` inclui `loja_id`. Nenhuma alteracao necessaria.

### 4. Regra Visual do Financeiro - Linha Verde so para "Finalizado"

**Arquivo:** `src/pages/FinanceiroConferencia.tsx`

**Problema atual:** A funcao `getRowClassName` (linhas 837-841) aplica verde para `linha.conferido === true` e vermelho para todos os outros. Isso colore de verde linhas "Conferidas" que ainda nao foram "Finalizadas".

**Correcao:** Alterar a logica de `getRowClassName` para:
- Verde (`bg-green-50`) somente quando o `statusFluxo` da venda associada for `'Finalizado'` ou `'Liquidado'`
- Manter sem cor (default) para os demais status
- Remover a coloracao vermelha para "Pendente" (manter neutro)

A funcao ficara:
```
const getRowClassName = (linha: LinhaConferencia) => {
  const status = linha.venda?.statusFluxo;
  if (status === 'Finalizado' || status === 'Liquidado') {
    return 'bg-green-50 dark:bg-green-950/30';
  }
  return '';
};
```

Para linhas de OS (Assistencia), verificar se `linha.osData?.status === 'Liquidado'`.

---

### Resumo de Arquivos

| Arquivo | Alteracao |
|---|---|
| `src/pages/EstoqueProdutoPendenteDetalhes.tsx` | Modal: auto-preencher responsavel/data, tornar read-only |
| `src/utils/osApi.ts` | Adicionar 'Recusado - Assistencia' ao tipo ParecerAssistencia |
| `src/pages/OSAnaliseGarantia.tsx` | Corrigir status de 'Aguardando peca' para 'Recusado - Assistencia' |
| `src/pages/FinanceiroConferencia.tsx` | Linha verde apenas para status Finalizado/Liquidado |
