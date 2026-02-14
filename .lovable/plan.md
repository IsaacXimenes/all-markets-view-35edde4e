

## Correcoes no Fluxo de Assistencia - 4 Problemas

### Problemas Identificados

1. **Status "Peca Recebida" ao solicitar peca (deveria ser "Aguardando Peca")**
   - Em `OSOficina.tsx`, o `getStatusBadge` (linha 230) trata `proximaAtuacao === 'Tecnico (Recebimento)'` OU `status === 'Peca Recebida'` como "Peca Recebida".
   - Quando o status muda para `'Solicitacao de Peca'`, nao existe badge especifico para esse status, e dependendo da atuacao pode cair no badge errado.
   - **Correcao:** Adicionar badge "Aguardando Peca" (amarelo) para status `'Solicitacao de Peca'` ANTES da condicao de "Peca Recebida" no `getStatusBadge`.

2. **"Confirmar Recebimento" limpa o quadro de Solicitacoes de Pecas**
   - Em `handleConfirmarRecebimento` (linha 94-107), o status muda para `'Em servico'` e chama `recarregar()`. As solicitacoes sao armazenadas separadamente no `solicitacaoPecasApi` (array em memoria), portanto nao devem ser afetadas.
   - O problema pode estar no `handleSaveChanges` em `OSAssistenciaDetalhes.tsx` (linha 119) que salva `pecas: editPecas` - se o usuario editar a OS e salvar, o array `editPecas` pode estar vazio e sobrescreve as pecas da OS.
   - **Correcao:** Verificar que ao salvar alteracoes em OSAssistenciaDetalhes, os dados de pecas/servicos nao sejam apagados. Tambem garantir que ao confirmar recebimento, a timeline registre a peca associada.

3. **Status apos pagamento: deve ser "Conferencia do Gestor" / "Gestor"**
   - Atualmente, apos registrar pagamento em `OSAssistenciaDetalhes.tsx` linha 266-277, salva `status: 'Pendente de Pagamento'` e `proximaAtuacao: 'Gestor (Conferencia)'`.
   - O usuario quer que o status visivel na aba Nova Assistencia seja **"Conferencia do Gestor"** e a prox atuacao seja **"Gestor"**.
   - **Correcao:** Alterar o status para `'Conferencia do Gestor'` e proximaAtuacao para `'Gestor'`. Ajustar os badges e filtros correspondentes em OSAssistencia.tsx, OSConferenciaGestor.tsx e FinanceiroConferencia.tsx para usar o novo status.

4. **Observacao do gestor nao aparece no Financeiro**
   - `OSConferenciaGestor.tsx` salva com chave `observacao_gestor_os_${osId}` (linha 233)
   - `FinanceiroConferencia.tsx` le com chave `observacao_gestor_${venda.id}` (linha 501) - **sem o `_os_`**
   - **Correcao:** Alinhar as chaves. No `FinanceiroConferencia.tsx`, ao carregar observacao para registros de OS (ID comeca com "OS-"), usar a chave `observacao_gestor_os_${id}`.

---

### Detalhes Tecnicos

#### 1. OSOficina.tsx - Badge "Aguardando Peca"

No `getStatusBadge` (linha 222), adicionar ANTES da linha 230:
```
if (status === 'Solicitacao de Peca') {
  return <Badge className="bg-yellow-500 hover:bg-yellow-600">Aguardando Peca</Badge>;
}
```

Tambem ajustar a condicao da linha 230 para separar "Peca Recebida" de "Solicitacao de Peca".

Ajustar o stat `aguardandoPeca` (linha 73) para incluir `status === 'Solicitacao de Peca'`.

#### 2. OSAssistenciaDetalhes.tsx - Preservar pecas ao salvar

No `handleSaveChanges` (linha 109), garantir que se `editPecas` estiver vazio mas a OS ja tinha pecas, manter as pecas originais.

#### 3. Status "Conferencia do Gestor" / "Gestor"

**OSAssistenciaDetalhes.tsx** (linha 266-277): Alterar:
- `status: 'Pendente de Pagamento'` -> `status: 'Conferencia do Gestor'`
- `proximaAtuacao: 'Gestor (Conferencia)'` -> `proximaAtuacao: 'Gestor'`

**OSConferenciaGestor.tsx** (linha 70-73): Atualizar filtro:
- `os.status === 'Pendente de Pagamento' && os.proximaAtuacao === 'Gestor (Conferencia)'`
  -> `os.status === 'Conferencia do Gestor' && os.proximaAtuacao === 'Gestor'`

**OSConferenciaGestor.tsx** (linha 258-261 - handleRecusar): Ao recusar:
- Manter `status: 'Servico concluido'` (voltar para o atendente registrar pagamento novamente)
- `proximaAtuacao: 'Atendente'`

**OSAssistencia.tsx**: Ajustar badges e filtros para incluir `'Conferencia do Gestor'`.

**FinanceiroConferencia.tsx**: Ajustar o mapeamento de OS para usar novo status na filtragem.

**statusColors.ts**: Adicionar cor para `'Conferencia do Gestor'`.

#### 4. FinanceiroConferencia.tsx - Chave da observacao

Na funcao `handleSelecionarVenda` (linha 500-506), trocar:
```
const storedObsGestor = localStorage.getItem(`observacao_gestor_${venda.id}`);
```
Para:
```
const isOS = venda.id.startsWith('OS-');
const obsKey = isOS ? `observacao_gestor_os_${venda.id}` : `observacao_gestor_${venda.id}`;
const storedObsGestor = localStorage.getItem(obsKey);
```

---

### Arquivos a Editar

1. **src/pages/OSOficina.tsx** - Badge "Aguardando Peca", stat counter
2. **src/pages/OSAssistenciaDetalhes.tsx** - Status "Conferencia do Gestor" / "Gestor", preservar pecas
3. **src/pages/OSAssistencia.tsx** - Badge e filtro para novo status
4. **src/pages/OSConferenciaGestor.tsx** - Filtro e recusa para novo status
5. **src/pages/FinanceiroConferencia.tsx** - Chave localStorage da observacao do gestor, filtro OS
6. **src/utils/statusColors.ts** - Cor para "Conferencia do Gestor"

