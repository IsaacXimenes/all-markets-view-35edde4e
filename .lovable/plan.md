

## Ajustes no Fluxo: "Finalizar Servico" e Persistencia Historica

### Resumo das Mudancas

Tres ajustes principais para alinhar o fluxo operacional:
1. Renomear "Finalizar OS" para "Finalizar Servico" na aba de Servicos
2. Usar o status "Servico concluido" na aba de Servicos, e "Aguardando Pagamento" na aba Nova Assistencia
3. Garantir que todos os registros permanecem visiveis em todas as abas, apenas alternando status

### Fluxo Atualizado

```text
Tecnico finaliza servico (aba Servicos)
    Status: "Servico concluido" | Atuacao: "Atendente"
    -> Registro permanece visivel na aba Servicos com badge "Servico Concluido"
    -> Registro aparece na aba Nova Assistencia com botao "Registrar Pagamento"
         |
Atendente registra pagamento (aba Nova Assistencia)
    Status: "Pendente de Pagamento" | Atuacao: "Gestor (Conferencia)"
    -> Registro vai para aba Conferencia Gestor da Assistencia
         |
Gestor confere (aba Conferencia Gestor)
    Status: "Aguardando Financeiro" | Atuacao: "Financeiro"
    -> Registro vai para Conferencia de Contas no Financeiro
         |
Financeiro finaliza
    Status: "Liquidado" | Atuacao: "-"
    -> Historico em todas as abas
```

---

### Detalhes das Alteracoes

#### 1. OSOficina.tsx - Renomear e ajustar status

**Textos a alterar:**
- Titulo do modal: "Finalizar OS {id}" -> "Finalizar Servico - {id}"
- Botao de acao na tabela: "Finalizar" -> "Finalizar Servico"
- Botao do modal footer: "Finalizar OS" -> "Finalizar Servico"
- Toast de sucesso: mensagem atualizada

**Status ao finalizar:**
- Alterar de `status: 'Aguardando Pagamento'` para `status: 'Servico concluido'`
- Manter `proximaAtuacao: 'Atendente'`
- Timeline: "Servico finalizado pelo tecnico" em vez de "OS finalizada"

**Badge na aba Servicos:**
- Adicionar badge "Servico Concluido" (verde) no `getStatusBadge` para status `'Servico concluido'`
- Registro continua visivel na lista do tecnico (ja funciona via `osFinalizadas`)

#### 2. OSAssistencia.tsx - Ajustar exibicao e botao de pagamento

**Condicao do botao "Registrar Pagamento":**
- Alterar de `os.status === 'Aguardando Pagamento'` para `os.status === 'Servico concluido'`
- Manter condicao `os.proximaAtuacao === 'Atendente'`

**Badge de status:**
- Quando `status === 'Servico concluido'` e `proximaAtuacao === 'Atendente'`, exibir badge "Aguardando Pagamento" (amber) na aba Nova Assistencia, pois e o que o atendente precisa ver

**Filtro de status:**
- Adicionar "Servico concluido" nas opcoes de filtro
- Adicionar "Pendente de Pagamento", "Aguardando Financeiro", "Liquidado" para acompanhamento historico completo

#### 3. OSAssistenciaDetalhes.tsx - Ajustar condicao do PagamentoQuadro

- A condicao de exibicao do quadro de pagamento deve verificar `status === 'Servico concluido'` em vez de `'Aguardando Pagamento'`
- Apos registrar pagamento, atualizar para `status: 'Pendente de Pagamento'`, `proximaAtuacao: 'Gestor (Conferencia)'`

#### 4. Persistencia historica em todas as abas

**OSOficina.tsx (Servicos):**
- O filtro `osTecnico` ja inclui `osFinalizadas` para manter registros da sessao
- Adicionar tambem OS com status finais ('Servico concluido', 'Pendente de Pagamento', 'Aguardando Financeiro', 'Liquidado') que pertencam ao tecnico logado, para que o historico persista entre sessoes

**OSAssistencia.tsx (Nova Assistencia):**
- Ja mostra todas as OS sem filtro de atuacao, apenas filtros do usuario
- Registros em qualquer status ja aparecem - sem alteracao necessaria

**OSConferenciaGestor.tsx (Conferencia Gestor):**
- Ja busca OS com status 'Pendente de Pagamento' para conferencia e mostra historico de conferidos/liquidados

---

### Arquivos a Editar

1. **src/pages/OSOficina.tsx**
   - Renomear textos: "Finalizar" -> "Finalizar Servico"
   - Alterar status de `'Aguardando Pagamento'` para `'Servico concluido'` no handleFinalizar
   - Adicionar badge verde "Servico Concluido" no getStatusBadge
   - Expandir filtro osTecnico para incluir historico do tecnico

2. **src/pages/OSAssistencia.tsx**
   - Alterar condicao do botao de pagamento para `status === 'Servico concluido'`
   - Ajustar badge para mostrar "Aguardando Pagamento" quando servico concluido + atuacao Atendente
   - Adicionar novos status ao filtro

3. **src/pages/OSAssistenciaDetalhes.tsx**
   - Ajustar condicao do PagamentoQuadro para `status === 'Servico concluido'`
   - Apos pagamento registrado: status -> 'Pendente de Pagamento', atuacao -> 'Gestor (Conferencia)'

