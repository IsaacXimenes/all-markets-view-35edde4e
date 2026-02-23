

# Botao Cancelar e Confirmacao Dupla no Quadro de Solicitacoes de Pecas

## Resumo

Adicionar um botao "Cancelar" para limpar os campos do formulario de solicitacao e garantir que o botao "Adicionar Solicitacao" utilize confirmacao dupla em todas as telas.

## Situacao Atual

| Tela | Confirmacao Dupla | Botao Cancelar |
|------|-------------------|----------------|
| OSAssistenciaNova | Sim | Nao |
| OSAssistenciaEditar | Sim | Nao |
| OSAssistenciaDetalhes | **Nao** | Nao |

## Alteracoes

### 1. OSAssistenciaDetalhes.tsx - Adicionar confirmacao dupla + botao cancelar

- Criar estados para o modal de confirmacao dupla (`modalConfirmarSolDetalhes`, `checkConfirmarSolDetalhes`)
- O botao "Adicionar Solicitacao" passa a abrir o modal de confirmacao em vez de adicionar diretamente
- No modal: exibir resumo (peca, quantidade, justificativa), checkbox de confirmacao obrigatorio, botao "Confirmar e Adicionar" (desabilitado ate marcar checkbox) e botao "Cancelar"
- Adicionar botao "Cancelar" (variante ghost/outline) ao lado do botao "Adicionar Solicitacao" que limpa os campos (peca, quantidade, justificativa)

### 2. OSAssistenciaNova.tsx - Adicionar botao cancelar

- Adicionar botao "Cancelar" ao lado do botao "Adicionar Solicitacao" que limpa todos os campos do formulario (peca, quantidade, prioridade, modelo compativel, justificativa)

### 3. OSAssistenciaEditar.tsx - Adicionar botao cancelar

- Adicionar botao "Cancelar" ao lado do botao "Adicionar Solicitacao" que limpa os campos do formulario (peca, quantidade, justificativa)

## Detalhes Tecnicos

### OSAssistenciaDetalhes.tsx (mudanca principal)

1. Adicionar estados:
   - `const [modalConfirmarSolDetalhes, setModalConfirmarSolDetalhes] = useState(false)`
   - `const [checkConfirmarSolDetalhes, setCheckConfirmarSolDetalhes] = useState(false)`

2. Botao "Adicionar Solicitacao" (linha ~1067): trocar o onClick direto por abertura do modal com validacao previa dos campos

3. Adicionar botao "Cancelar" antes do "Adicionar Solicitacao" que executa:
   - `setNovaSolPeca('')`
   - `setNovaSolQtd(1)`
   - `setNovaSolJustificativa('')`

4. Criar modal Dialog de confirmacao dupla (no final do componente), seguindo o mesmo padrao de OSAssistenciaEditar.tsx:
   - Resumo dos dados preenchidos
   - Checkbox obrigatorio
   - Botao "Confirmar e Adicionar" (disabled ate marcar checkbox)
   - Logica de adicao movida para dentro do modal

### OSAssistenciaNova.tsx

- Linha ~1537: adicionar botao "Cancelar" antes do botao "Adicionar Solicitacao" que reseta `novaSolicitacao` para os valores iniciais

### OSAssistenciaEditar.tsx

- Adicionar botao "Cancelar" antes do botao "Adicionar Solicitacao" que reseta `novaSolPeca`, `novaSolQtd`, `novaSolJustificativa`

