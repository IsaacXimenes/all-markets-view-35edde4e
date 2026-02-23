
# Ajustes e Melhorias no Modulo de Assistencia Tecnica

## Escopo

12 melhorias organizadas em 3 categorias: Usabilidade, Consignacao e Fluxo de OS.

---

## 1. Melhorias de Usabilidade e Interface

### 1.1 Botao "Limpar" em Todas as Abas
Algumas abas ja possuem o botao (OSConferenciaGestor, OSOficina, OSHistoricoAssistencia, OSSolicitacoesPecas, OSProdutosAnalise, OSMovimentacaoPecas, OSAnaliseGarantia). Falta adicionar em:
- **OSAssistencia.tsx** (aba principal de listagem) - nao tem botao de limpar filtros
- **OSConsignacao.tsx** (lista de lotes) - tem filtros mas sem botao limpar
- **OSAssistenciaNova.tsx** - nao aplicavel (formulario, nao listagem)

**Acao**: Adicionar botao "Limpar Filtros" com icone X em `OSAssistencia.tsx` e `OSConsignacao.tsx`, resetando todos os filtros.

### 1.2 Renomear "Dossie" para "Detalhamento"
Arquivos afetados:
- `OSConsignacao.tsx`: tipo `ViewMode` (`'dossie'` -> `'detalhamento'`), titulo "Dossie do Lote" -> "Detalhamento do Lote", tooltips nos botoes
- `pecasApi.ts`: comentario (linha 308) - cosmetico

**Acao**: Substituir todas as ocorrencias de "Dossie"/"dossie" por "Detalhamento"/"detalhamento" em `OSConsignacao.tsx`.

### 1.3 Botoes de Detalhamento e Edicao com Funcionalidades Distintas
Atualmente em `OSConsignacao.tsx` (linhas 911-917), o botao Eye e o botao Pencil executam a mesma funcao `handleVerDossie`. O Pencil so aparece quando `lote.status === 'Aberto'`.

**Acao**:
- Botao Eye (Detalhamento): abre a visualizacao em modo **somente leitura** (ocultar botoes de acao: pagamento parcial, finalizar lote, devolver)
- Botao Pencil (Edicao): abre a visualizacao completa com acoes de edicao habilitadas
- Adicionar prop `readOnly` ao estado do dossie/detalhamento
- Qualquer alteracao no modo de edicao registra log na timeline via `consignacaoApi`

---

## 2. Gestao de Consignacao

### 2.1 Registro de Pagamento na Timeline do Consignado
Atualmente `gerarPagamentoParcial` em `consignacaoApi.ts` ja registra na timeline do lote, mas nao inclui detalhes do pagamento (forma, comprovante).

**Acao**:
- Enriquecer o registro da timeline em `consignacaoApi.ts` para incluir forma de pagamento, conta, chave pix na descricao
- Na aba "Historico de Pagamentos" em `OSConsignacao.tsx`, adicionar exibicao da forma de pagamento e dados do recebedor ao lado de cada pagamento

### 2.2 Confirmacao em Duas Etapas para Devolucao de Consignado
Atualmente `handleConfirmarDevolucao` executa diretamente sem confirmacao (linha 256-261).

**Acao**: Envolver o botao de devolucao em um `AlertDialog` com duas etapas:
1. Primeiro clique abre o AlertDialog com descricao do item e aviso de irreversibilidade
2. Segundo clique (AlertDialogAction) confirma a devolucao
- Registrar responsavel e timestamp na confirmacao

### 2.3 Filtros no Navbar do Inventario na Consignacao
Atualmente a aba "Inventario" dentro do Detalhamento exibe todos os itens sem filtros.

**Acao**: Adicionar barra de filtros acima da tabela de inventario dentro da TabsContent "inventario":
- Filtro por status (Disponivel, Consumido, Devolvido, Em Pagamento, Pago)
- Filtro por loja
- Campo de busca por descricao/modelo
- Botao Limpar Filtros

---

## 3. Fluxo de Ordem de Servico (OS)

### 3.1 Correcao da Data de Registro (D+1)
Em `OSAssistenciaNova.tsx` (linha 104): `const [dataHora] = useState(new Date().toISOString())`. Isto usa UTC, que no Brasil (UTC-3) pode resultar em data futura apos 21h.

**Acao**: Ajustar para usar data local:
```text
// Em vez de new Date().toISOString(), usar formato que preserve timezone local
const agora = new Date();
const dataHoraLocal = format(agora, "yyyy-MM-dd'T'HH:mm:ss");
```
Aplicar a mesma correcao em `confirmData` (linha 242).

### 3.2 Lixeira para Excluir Solicitacao de Peca na Edicao
Em `OSAssistenciaEditar.tsx`, a tabela de solicitacoes salvas (linhas 1069-1127) nao tem botao de excluir. Apenas as solicitacoes locais nao salvas (linhas 1129-1146) tem lixeira.

**Acao**: Adicionar botao Trash2 para solicitacoes salvas com status `Pendente` ou `Rejeitada`:
- Ao clicar, abrir AlertDialog de confirmacao
- Registrar na timeline da OS: "Solicitacao de peca X excluida por Y"
- Chamar `updateSolicitacaoPeca(sol.id, { status: 'Cancelada' })` (nao deletar, marcar como cancelada para auditoria)

### 3.3 Desabilitar "Confirmar Recebimento" para Peca Recusada
Em `OSAssistenciaEditar.tsx` (linha 1090), o botao "Confirmar Recebimento" aparece para status incluindo `Pendente`, `Aprovada`, `Enviada`, etc.

**Acao**: Excluir `'Rejeitada'` da lista de status que exibem o botao (ja nao esta, mas precisa garantir). Adicionalmente, quando `sol.status === 'Rejeitada'`:
- Alterar o status da OS para 'Em serviço' se estava 'Aguardando Peca'
- Exibir badge "Rejeitada" sem botao de acao

### 3.4 Encaminhamento Agrupado por Nota com Tratativa Individual
A logica atual em `loteRevisaoApi.ts` (funcao `encaminharLoteParaAssistencia`, linhas 129-178) ja cria uma unica OS agrupada com todos os aparelhos na descricao. Porem o tecnico nao tem interface para tratar cada aparelho individualmente dentro dessa OS.

**Acao**:
- Na OS gerada pelo lote de revisao, adicionar campo `itensLoteRevisao` com referencia aos itens do lote
- Em `OSAssistenciaDetalhes.tsx`: quando a OS tem `loteRevisaoId`, renderizar uma grade/acordeao com cada aparelho individual:
  - Modelo, IMEI, motivo (do encaminhamento pelo estoque)
  - Campo de parecer tecnico individual
  - Secao de pecas/custo individual
  - Status individual (Pendente, Em Andamento, Concluido)
- Em `loteRevisaoApi.ts`: a funcao `encaminharLoteParaAssistencia` ja vincula `lote.itens[].osId`, manter isso

### 3.5 Comunicacao da Finalizacao do Servico com o Estoque
A finalizacao em `OSAssistenciaDetalhes.tsx` (linhas 359-367) ja sincroniza com estoque via `atualizarStatusProdutoPendente` para OS de origem "Estoque". Porem:
- Para OS de origem "Balcao" com lote de revisao, nao chama `marcarProdutoRetornoAssistencia`
- A logistica reversa (`finalizarLoteComLogisticaReversa`) existe mas nao e chamada automaticamente

**Acao**:
- Na finalizacao da OS em `OSAssistenciaDetalhes.tsx`, quando a OS tem `loteRevisaoId`:
  - Atualizar o status de cada item do lote de revisao (`atualizarItemRevisao`) com `statusReparo: 'Concluido'` e custos
  - Verificar se todos os itens do lote estao concluidos; se sim, acionar `finalizarLoteComLogisticaReversa` automaticamente
  - Chamar `marcarProdutoRetornoAssistencia(imei)` para cada aparelho consertado
- Garantir que aparelhos de "Balcao" (sem lote de revisao) tambem retornem ao estoque com a tag correta quando aplicavel

---

## Detalhes Tecnicos

### Arquivos a modificar
1. `src/pages/OSAssistencia.tsx` - botao limpar filtros
2. `src/pages/OSConsignacao.tsx` - renomear Dossie, separar Eye/Pencil, confirmacao devolucao 2 etapas, filtros inventario, botao limpar
3. `src/utils/consignacaoApi.ts` - enriquecer timeline de pagamento
4. `src/pages/OSAssistenciaNova.tsx` - correcao data D+1
5. `src/pages/OSAssistenciaEditar.tsx` - lixeira solicitacao, desabilitar confirmar recebimento para rejeitada
6. `src/pages/OSAssistenciaDetalhes.tsx` - grade individual para lotes de revisao, comunicacao estoque na finalizacao
7. `src/utils/loteRevisaoApi.ts` - adicionar campo itensLoteRevisao na OS gerada

### Ordem de implementacao
1. Correcoes simples: renomear Dossie, botao limpar, data D+1 (items 1.1, 1.2, 3.1)
2. Consignacao: timeline pagamento, devolucao 2 etapas, filtros inventario, Eye/Pencil (items 1.3, 2.1, 2.2, 2.3)
3. Solicitacoes: lixeira e desabilitar confirmar recebimento (items 3.2, 3.3)
4. Tratativa individual do lote + comunicacao estoque (items 3.4, 3.5) - mais complexo, depende dos anteriores
