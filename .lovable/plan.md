
# Plano - Maquina de Estados da Assistencia e Correcoes de Persistencia

## Resumo

Implementar a maquina de estados correta com transicoes rigidas via `proximaAtuacao`, corrigir persistencia de solicitacoes de pecas na edicao, remover quadro de pagamentos da tela do tecnico, e adicionar novos status (`Em Aberto`, `Pagamento Concluído`, `Aguardando Conferência`, `Finalizado`).

---

## 1. Maquina de Estados - Tabela de Transicoes

A tabela de transicoes estrita que sera implementada:

| Evento | Status da OS | Proxima Atuacao |
|--------|-------------|-----------------|
| Registro da OS | Em Aberto | Tecnico: Avaliar/Executar |
| Tecnico solicita peca | Aguardando Peca | Gestor: Aprovar Peca |
| Financeiro paga a peca | Pagamento Concluido | Logistica: Enviar Peca |
| Peca recebida na loja | Peca Recebida | Tecnico: Avaliar/Executar |
| Tecnico clica em Concluir | Servico Concluido | Vendedor: Registrar Pagamento |
| Vendedor registra pagamento | Aguardando Conferencia | Financeiro: Conferir Lancamento |
| Financeiro valida lancamento | Finalizado | - |

### 1.1 Alteracoes na interface `OrdemServico` (assistenciaApi.ts)

- Adicionar novos status ao tipo union: `'Em Aberto'`, `'Pagamento Concluído'`, `'Aguardando Conferência'`, `'Finalizado'`
- Adicionar novas opcoes de `proximaAtuacao`: `'Gestor: Aprovar Peça'`, `'Logística: Enviar Peça'`
- Atualizar mocks existentes para usar os novos nomes de status conforme a tabela

### 1.2 Correcao critica: Tecnico Concluir -> Vendedor

Em `OSAssistenciaDetalhes.tsx`, a funcao `handleConcluirServico` ja seta corretamente `proximaAtuacao: 'Vendedor: Registrar Pagamento'` (linha 219). Porem, na tela de edicao (`OSAssistenciaEditar.tsx`), ao alterar o status manualmente para "Servico concluido", o `proximaAtuacao` NAO e atualizado automaticamente.

**Correcao em `OSAssistenciaEditar.tsx` (handleSave, ~linha 295):**
- Adicionar logica: se o novo status for `'Serviço concluído'`, forcar `proximaAtuacao = 'Vendedor: Registrar Pagamento'`

### 1.3 Novas transicoes automaticas

**Em `solicitacaoPecasApi.ts`:**
- `aprovarSolicitacao`: Ja atualiza OS para `'Aguardando Recebimento'`. Alterar para manter o fluxo: status permanece `'Aguardando Peça'`, `proximaAtuacao = 'Gestor: Aprovar Peça'` ate o pagamento do financeiro
- Criar funcao `registrarPagamentoPeca`: Muda status para `'Pagamento Concluído'`, `proximaAtuacao = 'Logística: Enviar Peça'`
- Na funcao de recebimento (quando peca chega na loja): Status `'Peça Recebida'`, `proximaAtuacao = 'Técnico: Avaliar/Executar'`

### 1.4 Status de Registro

**Em `OSAssistenciaNova.tsx`:**
- Alterar o status inicial de `'Em serviço'` para `'Em Aberto'`
- Confirmar que `proximaAtuacao` e setado para `'Técnico: Avaliar/Executar'`

### 1.5 Finalizacao

**Em `OSAssistenciaDetalhes.tsx`:**
- `handleSalvarPagamentoVendedor`: Alterar status de `'Aguardando Pagamento'` para `'Aguardando Conferência'`
- `handleValidarFinanceiro`: Alterar status final de `'Concluído'` para `'Finalizado'`

---

## 2. Persistencia de Solicitacoes de Pecas

### 2.1 Problema

Na tela de edicao (`OSAssistenciaEditar.tsx`), as solicitacoes de pecas ja sao carregadas via `getSolicitacoesByOS(id)` no useEffect (linha 131). Porem, ao salvar a OS via `handleSave`, a funcao `updateOrdemServico` sobrescreve a timeline sem incluir os eventos de solicitacao, causando perda de historico.

### 2.2 Correcoes em `OSAssistenciaEditar.tsx`

- **Fetch completo no carregamento**: Ja implementado (linha 131). Garantir que a lista e recarregada apos adicionar nova solicitacao (ja feito, linha 768).
- **Protecao na funcao handleSave**: Ao salvar, recarregar solicitacoes para garantir sincronismo: `setSolicitacoesOS(getSolicitacoesByOS(id!))` apos o save.
- **Timeline imutavel**: Nunca sobrescrever entradas existentes na timeline. No `handleSave`, usar spread do array original da OS recarregada (nao do state local que pode estar desatualizado).

### 2.3 Timeline automatica para movimentacao de pecas

Cada transicao gera log na timeline:
- Solicitada: "Peca X solicitada pelo tecnico Y"
- Aprovada: "Solicitacao aprovada pelo gestor"
- Paga: "Pagamento da peca registrado pelo financeiro"
- Recebida: "Peca recebida na loja Z"

Estes logs ja sao gerados parcialmente em `solicitacaoPecasApi.ts`. Garantir que TODOS os estados geram timeline.

---

## 3. Refinamento da Interface

### 3.1 Remover Quadro de Pagamentos da Edicao do Tecnico

**Em `OSAssistenciaEditar.tsx` (linhas 607-689):**
- Remover completamente o card "Pagamentos" com os campos de meio de pagamento, valor e parcelas
- A tela do tecnico deve conter apenas: Dados do Atendimento, Aparelho, Pecas/Servicos, Solicitacoes de Pecas, Avaliacao Tecnica (Valor Custo/Venda) e Timeline

**Em `OSAssistenciaDetalhes.tsx` (linhas 886-918):**
- Quando `proximaAtuacao === 'Técnico: Avaliar/Executar'`, ocultar completamente a secao de pagamentos (nao exibir nem em modo leitura)

### 3.2 Adicionar campos Valor de Custo e Valor de Venda na Edicao

**Em `OSAssistenciaEditar.tsx`:**
- Adicionar card "Avaliacao Tecnica" com campos `valorCustoTecnico` e `valorVendaTecnico` (similar ao que ja existe em `OSAssistenciaDetalhes.tsx`)
- Incluir botao "Concluir Servico" que valida os valores e faz a transicao de estado
- Salvar estes valores via `updateOrdemServico`

### 3.3 Campo Loja - Filtro Assistencia

**Em `OSAssistenciaEditar.tsx` (linha 400-405):**
- O `AutocompleteLoja` ja usa `apenasLojasTipoLoja={true}`, mas esta funcao pode nao filtrar por "Assistencia". Verificar e alterar para `filtrarPorTipo="Assistência"` (mesmo padrao do Detalhes, linha 1018)

### 3.4 Camera na tela de edicao

**Em `OSAssistenciaEditar.tsx`:**
- Adicionar o mesmo componente de camera que existe em `OSAssistenciaNova.tsx` para documentar progresso durante a atuacao tecnica
- As novas fotos devem ser adicionadas a timeline como eventos tipo `'foto'`

---

## 4. Regras de Pagamento (Etapa Vendedor)

### 4.1 Trava de Seguranca

Ja implementado em `OSAssistenciaDetalhes.tsx` (linhas 833-854). A validacao verifica `!os.valorCustoTecnico && !os.valorVendaTecnico`. Corrigir para usar `||` em vez de `&&` (ambos devem estar preenchidos, nao apenas um):
```
if (!os.valorCustoTecnico || !os.valorVendaTecnico)
```

### 4.2 Metodos de Pagamento

O `PagamentoQuadro` ja e usado com `lojaVendaId={os.lojaId}`. Verificar que internamente filtra maquinas pela loja. Adicionar prop para restringir metodos a Dinheiro, Pix e Cartao (se ainda nao implementado).

---

## 5. Atualizacao de Badges e Status em Telas de Listagem

### 5.1 `OSAssistencia.tsx`

- Adicionar badges para novos status: `'Em Aberto'`, `'Pagamento Concluído'`, `'Aguardando Conferência'`, `'Finalizado'`
- Adicionar badges para novas atuacoes: `'Gestor: Aprovar Peça'`, `'Logística: Enviar Peça'`
- Atualizar filtros de status no select para incluir os novos status
- Atualizar filtros rapidos de atuacao para incluir "Gestor" e "Logistica" se necessario

### 5.2 `OSAssistenciaDetalhes.tsx` e `OSAssistenciaEditar.tsx`

- Atualizar `getStatusBadge` para cobrir todos os novos status
- Atualizar select de Status na edicao para incluir os novos status
- Atualizar select de Status na barra lateral de detalhes

---

## Secao Tecnica

| Arquivo | Alteracoes |
|---------|-----------|
| `src/utils/assistenciaApi.ts` | Novos status no type union: `'Em Aberto'`, `'Pagamento Concluído'`, `'Aguardando Conferência'`, `'Finalizado'`. Novas atuacoes: `'Gestor: Aprovar Peça'`, `'Logística: Enviar Peça'`. Atualizar mocks |
| `src/pages/OSAssistenciaNova.tsx` | Status inicial = `'Em Aberto'` em vez de `'Em serviço'` |
| `src/pages/OSAssistenciaEditar.tsx` | Remover card Pagamentos. Adicionar card Avaliacao Tecnica (Custo/Venda + botao Concluir). Adicionar camera. Corrigir AutocompleteLoja para `filtrarPorTipo="Assistência"`. Forcar proximaAtuacao ao mudar status para concluido. Proteger timeline ao salvar |
| `src/pages/OSAssistenciaDetalhes.tsx` | Ocultar pagamentos quando atuacao = Tecnico. Corrigir trava `&&` para `\|\|`. Status `'Aguardando Conferência'` no pagamento vendedor. Status `'Finalizado'` na validacao financeiro. Novos badges |
| `src/pages/OSAssistencia.tsx` | Novos badges de status e atuacao. Filtros atualizados |
| `src/utils/solicitacaoPecasApi.ts` | Ajustar proximaAtuacao para `'Gestor: Aprovar Peça'` na solicitacao. Criar funcao registrarPagamentoPeca. Timeline automatica em todas as transicoes |
| `src/pages/OSHistoricoAssistencia.tsx` | Novos badges de status |
| `src/pages/OSAnaliseGarantia.tsx` | Status inicial `'Em Aberto'` ao criar OS |
