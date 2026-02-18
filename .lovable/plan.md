
## Fluxo de Tratamento de Pecas de OS Cancelada

### Resumo

Implementar um fluxo completo para que, quando uma OS com solicitacoes de pecas ativas for cancelada, o gestor possa decidir entre devolver a peca ao fornecedor ou rete-la para o estoque proprio, com total rastreabilidade.

---

### 1. Novos Status na Interface `SolicitacaoPeca`

**Arquivo: `src/utils/solicitacaoPecasApi.ts`**

- Adicionar dois novos status ao tipo union: `'Devolvida ao Fornecedor'` e `'Retida para Estoque'`.
- Adicionar campo opcional `osCancelada?: boolean` para marcar solicitacoes cuja OS foi cancelada.
- Adicionar campo opcional `motivoTratamento?: string` para armazenar o motivo da decisao do gestor.
- Adicionar campo opcional `tratadaPor?: string` para registrar quem tomou a decisao.
- Criar funcao `tratarPecaOSCancelada(id, decisao, motivo, responsavel)` que:
  - Valida se a solicitacao pertence a uma OS cancelada.
  - Se decisao = "devolver": altera status para "Devolvida ao Fornecedor", cancela fluxo financeiro pendente, registra na timeline da OS.
  - Se decisao = "reter": altera status para "Retida para Estoque", mantem fluxo de pagamento ativo, registra na timeline da OS.
- Criar funcao `marcarSolicitacoesOSCancelada(osId)` para ser chamada quando uma OS e cancelada, marcando todas as solicitacoes ativas (Pendente, Aprovada, Enviada) com `osCancelada = true`.

---

### 2. Integracao com Cancelamento de OS

**Arquivo: `src/utils/assistenciaApi.ts`**

- Localizar o ponto onde uma OS pode ter seu status alterado para "Cancelada".
- Apos a alteracao, chamar `marcarSolicitacoesOSCancelada(osId)` para sinalizar todas as solicitacoes ativas daquela OS.

---

### 3. Alerta Visual na Listagem (Aba Solicitacoes de Pecas)

**Arquivo: `src/pages/OSSolicitacoesPecas.tsx`**

- Na tabela de solicitacoes (linha ~482), verificar se a solicitacao tem `osCancelada === true` e status ainda nao tratado (diferente de "Devolvida ao Fornecedor" e "Retida para Estoque"):
  - Destacar a linha com fundo vermelho claro.
  - Adicionar badge/icone `AlertTriangle` com texto "OS Cancelada - Acao Necessaria" ao lado do status.

---

### 4. Botao "Tratar Peca de OS Cancelada"

**Arquivo: `src/pages/OSSolicitacoesPecas.tsx`**

- Na coluna de acoes da tabela, quando `osCancelada === true` e status nao e "Devolvida ao Fornecedor" nem "Retida para Estoque":
  - Exibir botao "Tratar Peca" (icone AlertTriangle, cor laranja/warning).
- Na area de detalhamento (modal de detalhes, linha ~924), tambem exibir o botao "Tratar Peca de OS Cancelada" quando aplicavel.

---

### 5. Modal "Tratar Peca de OS Cancelada"

**Arquivo: `src/pages/OSSolicitacoesPecas.tsx`**

Novo modal com:

- **Cabecalho**: Titulo "Tratar Peca de OS Cancelada" + info da peca e OS.
- **Campo obrigatorio**: "Motivo da Decisao" (Textarea, minimo 10 caracteres).
- **Botao A (Vermelho)**: "Devolver ao Fornecedor"
  - Desabilitado se `valorPeca > 0` e a solicitacao ja teve pagamento concluido (status 'Recebida' ou nota associada com status 'Concluido'). Tooltip: "Peca ja paga, nao pode ser devolvida. Opte por reter para estoque."
  - Acao: chama `tratarPecaOSCancelada(id, 'devolver', motivo, nomeGestor)`.
- **Botao B (Verde)**: "Reter para Estoque Proprio"
  - Acao: chama `tratarPecaOSCancelada(id, 'reter', motivo, nomeGestor)`.
  - Se a peca ja foi recebida fisicamente, registra entrada no estoque de assistencia via `addPeca` com origem "Retencao de OS Cancelada #[osId]".

---

### 6. Novos Badges de Status

**Arquivo: `src/pages/OSSolicitacoesPecas.tsx`**

- Adicionar ao `getStatusBadge`:
  - `'Devolvida ao Fornecedor'` -> Badge roxo/cinza.
  - `'Retida para Estoque'` -> Badge verde-escuro.
- Adicionar esses status ao filtro de status (SelectContent).

---

### 7. Persistencia e Rastreabilidade

- Os registros de solicitacao NUNCA sao removidos, apenas mudam de status.
- Timeline da OS e atualizada via `updateOrdemServico` com descricao completa (acao, responsavel, motivo).
- O campo `motivoTratamento` e `tratadaPor` ficam salvos na solicitacao para consulta futura no modal de detalhes.

---

### Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/utils/solicitacaoPecasApi.ts` | Novos status, campos `osCancelada`, `motivoTratamento`, `tratadaPor`. Funcoes `tratarPecaOSCancelada` e `marcarSolicitacoesOSCancelada`. |
| `src/pages/OSSolicitacoesPecas.tsx` | Alerta visual na tabela, botao "Tratar Peca", modal de decisao, novos badges, filtro de status expandido. |
| `src/utils/assistenciaApi.ts` | Hook de cancelamento de OS para marcar solicitacoes. |

---

### Secao Tecnica: Estrutura da Funcao Principal

```text
tratarPecaOSCancelada(id, decisao, motivo, responsavel):
  1. Busca solicitacao por ID
  2. Valida osCancelada === true
  3. Se decisao === 'devolver':
     a. Verifica se peca nao foi paga (nota concluida)
     b. Altera status -> 'Devolvida ao Fornecedor'
     c. Registra timeline na OS
  4. Se decisao === 'reter':
     a. Altera status -> 'Retida para Estoque'
     b. Se peca ja recebida -> addPeca ao estoque assistencia
     c. Registra timeline na OS
  5. Salva motivoTratamento e tratadaPor
```
