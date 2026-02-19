

## Plano de Ajustes: Interface, Mascaras, Ordenacao e Sincronizacao

### 1. Padronizacao Monetaria (BRL) nos Campos de Valor da Aba de Servicos

**Arquivos:** `src/pages/OSAssistenciaEditar.tsx`, `src/pages/OSAssistenciaNova.tsx`

Atualmente, o campo "Valor (R$)" nas pecas/servicos usa `formatCurrencyInput` local com `<Input>` simples (linhas 714-721 do Editar e equivalente no Nova). O componente `InputComMascara` com `mascara="moeda"` ja existe e e usado em outros pontos do sistema.

**Alteracao:** Substituir o `<Input>` do campo "Valor (R$)" pelo `<InputComMascara mascara="moeda">` em ambas as paginas. Ajustar o handler para salvar o valor numerico (rawValue) e exibir o formato BRL em tempo real. Remover a funcao local `formatCurrencyInput` quando nao for mais usada em outros pontos.

---

### 2. Sincronizacao de Status: Estoque -> Assistencia

**Arquivo:** `src/pages/EstoqueProdutoPendenteDetalhes.tsx`

Quando o Gestor de Estoque aprova o aparelho (status `'Aparelho Aprovado - Retornar ao Estoque'`, linha 181), o sistema ja chama `salvarParecerEstoque` mas NAO atualiza o status da OS vinculada na Assistencia.

**Alteracao:** Apos a aprovacao (linha 181-192), buscar a OS vinculada (`osVinculada`) e atualizar seu status para `'Serviço Validado'` (ou status final adequado), adicionando entrada na timeline. Isso espelha o que ja e feito no fluxo de retrabalho (linhas 195-217) mas para o cenario positivo.

Detalhes tecnicos:
```
if (osVinculada) {
  const os = getOrdensServico().find(o => o.id === osVinculada.id);
  if (os) {
    os.status = 'Concluído';
    os.proximaAtuacao = '';
    os.timeline.push({
      data: new Date().toISOString(),
      tipo: 'status',
      descricao: `Aparelho validado pelo Estoque. Servico concluido.`,
      responsavel: parecerResponsavel
    });
  }
}
```

---

### 3. Campo "Valor Recomendado" no Desmonte

**Arquivos:** `src/pages/AssistRetiradaPecasDetalhes.tsx`, `src/utils/retiradaPecasApi.ts`

Atualmente, o formulario de adicionar peca no desmonte tem campos: Marca, Nome, Valor da Peca, Quantidade. O campo "Valor Recomendado" nao existe.

Na `pecasApi.ts`, a interface `Peca` ja possui `valorRecomendado`. No `finalizarDesmonte`, o valor recomendado e calculado automaticamente como `valorCustoPeca * 1.5` (linha 423).

**Alteracoes:**
- **Interface `PecaRetiradaItem`:** Adicionar campo opcional `valorRecomendado?: number`
- **Modal "Adicionar Peca":** Adicionar campo `<InputComMascara mascara="moeda">` para "Valor Recomendado" no formulario
- **Tabela de pecas:** Adicionar coluna "Valor Recomendado" apos "Valor Unitario"
- **`finalizarDesmonte`:** Usar o `valorRecomendado` informado pelo usuario (se preenchido) em vez do markup automatico de 50%
- **State `novaPeca`:** Adicionar `valorRecomendado: ''`

---

### 4. Atalho de Confirmar Recebimento na Tabela de Servicos

**Arquivo:** `src/pages/OSOficina.tsx`

A funcao `handleConfirmarRecebimento` ja existe (linhas 107-121). Porem, o botao so aparece dentro do bloco de acoes quando `atuacao === 'Tecnico (Recebimento)'` etc.

**Alteracao:** Na funcao `getAcoes`, para OSs com status `'Aguardando Peca'` ou `'Solicitacao de Peca'`, adicionar um botao/icone de "Confirmar Recebimento" (icone `Package` ou `CheckCircle`) diretamente na linha da tabela, ao lado das acoes existentes. Condicao: status `'Pagamento Concluido'` ou `atuacao === 'Tecnico (Recebimento)'`.

Atualmente o botao "Confirmar Recebimento" ja aparece nesse cenario (linhas 457-460). O pedido e garantir que ele tambem apareca de forma visivel quando o status for especificamente `'Aguardando Peca'` e houver solicitacoes com pagamento concluido. Vou revisar a logica de exibicao para garantir cobertura.

---

### 5. Coluna "Valor" no Quadro de Solicitacoes de Pecas

**Arquivo:** `src/pages/OSSolicitacoesPecas.tsx`

A tabela ja possui a coluna "Valor" (linha 425) e exibe `sol.valorPeca ? formatCurrency(sol.valorPeca) : '-'` (linhas 466-468). Ou seja, essa coluna ja existe e e preenchida quando o gestor aprova a solicitacao e informa o valor.

**Verificacao:** A coluna ja esta implementada. Vou confirmar que o valor e salvo corretamente na funcao `aprovarSolicitacao` e que aparece para o tecnico na aba de solicitacoes. Se houver inconsistencia, corrijo.

---

### 6. Ordenacao por Recencia na Conferencia do Gestor

**Arquivo:** `src/pages/OSConferenciaGestor.tsx`

Atualmente (linhas 96-106), a ordenacao prioriza status (`Conferencia do Gestor` > `Aguardando Financeiro` > `Liquidado`) e depois por data decrescente DENTRO de cada grupo.

**Alteracao:** Conforme a memory constraint `assistencia-table-sorting`, a ordenacao padrao deve ser por Data decrescente de forma absoluta. Remover a ordenacao por status e manter apenas:
```
resultado.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
```

---

### 7. Correcao de Origem na Devolucao de Peca Paga

**Arquivo:** `src/pages/OSOficina.tsx`

Quando uma peca paga e marcada como "Nao Utilizada" (Cenario B, linhas 307-361), a funcao `addPeca` e chamada com `origem: 'Solicitacao'` (linha 321).

**Alteracao:** Mudar o campo `origem` para `'Solicitacao Cancelada'` para distinguir pecas que vieram de solicitacoes canceladas/nao utilizadas vs solicitacoes normais. Isso garante rastreabilidade na aba Estoque - Assistencia.

Tambem herdar o historico da solicitacao original adicionando uma descricao mais completa na movimentacao:
```
addMovimentacaoPeca({
  pecaId: novaPeca.id,
  tipo: 'Entrada',
  quantidade: solicitacaoSelecionada.quantidade,
  data: new Date().toISOString(),
  osId: osParaGerenciarPeca.id,
  descricao: `Peca de solicitacao cancelada ${solicitacaoSelecionada.id} (OS ${osParaGerenciarPeca.id}) - Fornecedor: ${solicitacaoSelecionada.fornecedorId || 'N/A'} - Motivo: ${justificativaNaoUso}`
});
```

---

### Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/OSAssistenciaEditar.tsx` | Substituir Input de valor por InputComMascara moeda |
| `src/pages/OSAssistenciaNova.tsx` | Substituir Input de valor por InputComMascara moeda |
| `src/pages/EstoqueProdutoPendenteDetalhes.tsx` | Sincronizar status da OS ao aprovar aparelho |
| `src/pages/AssistRetiradaPecasDetalhes.tsx` | Adicionar campo Valor Recomendado no modal de peca |
| `src/utils/retiradaPecasApi.ts` | Adicionar valorRecomendado na interface e usar no finalizarDesmonte |
| `src/pages/OSOficina.tsx` | Corrigir origem para 'Solicitacao Cancelada'; revisar botao recebimento |
| `src/pages/OSConferenciaGestor.tsx` | Ordenacao por data decrescente absoluta |
| `src/pages/OSSolicitacoesPecas.tsx` | Verificar/confirmar coluna Valor (ja existente) |

