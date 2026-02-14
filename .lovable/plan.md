
## Observacao Obrigatoria no Parecer Estoque + Recusa pelo Tecnico na Aba Servicos

### Resumo

Tres mudancas principais:
1. Tornar o campo "Observacao" obrigatorio no Parecer Estoque quando encaminhar para assistencia
2. Garantir que a observacao apareca no quadro de descricao detalhada quando o tecnico clicar no olho (detalhes da OS)
3. Adicionar opcao de "Recusar" na aba de Servicos com campo de motivo obrigatorio, atualizando o registro na aba Nova Assistencia com indicacao visual

---

### 1. Observacao obrigatoria no Parecer Estoque

**Arquivo:** `src/pages/EstoqueProdutoPendenteDetalhes.tsx`

- Na funcao `handleAbrirConfirmacao`, adicionar validacao: quando o status for "Encaminhado para conferencia da Assistencia", exigir que `parecerObservacoes` esteja preenchido
- Exibir toast de erro "Preencha a Observacao com as tratativas que o tecnico deve realizar"
- Adicionar indicacao visual de campo obrigatorio (asterisco e borda vermelha quando vazio)

### 2. Observacao visivel nos detalhes da OS (tecnico)

**Arquivo:** `src/pages/OSAssistenciaDetalhes.tsx`

- No quadro de descricao/detalhes da OS, verificar se o campo `observacaoOrigem` ja esta sendo exibido
- Se nao estiver, adicionar um card/alerta destacado (estilo amber, igual ao do modal de finalizacao no OSOficina) mostrando "Observacao do Estoque" com o conteudo de `os.observacaoOrigem`
- Este card deve aparecer de forma proeminente para que o tecnico saiba exatamente quais tratativas deve conferir

### 3. Opcao de Recusar na aba Servicos

**Arquivo:** `src/utils/assistenciaApi.ts`

- Adicionar campos opcionais na interface `OrdemServico`:
  - `recusadaTecnico?: boolean`
  - `motivoRecusaTecnico?: string`
- Adicionar `'Recusada pelo Técnico'` ao union type de `status`

**Arquivo:** `src/pages/OSOficina.tsx`

- Adicionar botao "Recusar" (vermelho) nas acoes da tabela, visivel apenas quando a OS tem `origemOS === 'Estoque'` ou `origemOS === 'Garantia'` (encaminhada da Analise de Tratativas) e status "Em servico" ou "Aguardando Analise"
- Ao clicar em "Recusar", abrir um modal com:
  - Campo "Motivo da Recusa" (Textarea, obrigatorio)
  - Botoes Cancelar e Confirmar Recusa
- Ao confirmar:
  - Atualizar a OS com `status: 'Recusada pelo Técnico'`, `proximaAtuacao: 'Atendente'`, `recusadaTecnico: true`, `motivoRecusaTecnico: motivo`
  - Registrar na timeline
  - Manter o registro visivel na tela (mesma logica das finalizadas)
  - A OS vai para a aba Nova Assistencia

**Arquivo:** `src/pages/OSAssistencia.tsx`

- Na renderizacao da tabela (`TableRow`), adicionar classe condicional: se `os.recusadaTecnico === true`, aplicar `bg-red-500/15` no fundo da linha
- Ao lado do badge de status, exibir badge "Recusada" (destructive) com Tooltip mostrando o motivo, usando o mesmo padrao visual da Nota de Entrada rejeitada (XCircle + Badge + Tooltip)
- Adicionar "Recusada pelo Tecnico" como opcao no filtro de Status

---

### Detalhes Tecnicos

**Interface `OrdemServico` (assistenciaApi.ts):**
- Adicionar ao union type de status: `'Recusada pelo Técnico'`
- Adicionar campos: `recusadaTecnico?: boolean`, `motivoRecusaTecnico?: string`

**OSOficina.tsx - Novo modal de recusa:**
- Estados: `recusarModal`, `osParaRecusar`, `motivoRecusa`
- Funcao `handleConfirmarRecusa`: valida motivo, atualiza OS, adiciona ao `osFinalizadas`, recarrega

**OSAssistencia.tsx - Indicacao visual:**
- `TableRow className`: adicionar condicao `os.recusadaTecnico ? 'bg-red-500/15' : ''`
- Na celula de Status: badge "Recusada" com tooltip do motivo (mesmo padrao de `TabelaNotasPendencias.tsx`)

**EstoqueProdutoPendenteDetalhes.tsx - Validacao:**
- Condicional no `handleAbrirConfirmacao`: se status === 'Encaminhado para conferencia da Assistencia' e `!parecerObservacoes.trim()`, bloquear com toast
