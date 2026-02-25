

## Plano: Toggle Contas Financeiras + Evidencias OS + PIX no Financeiro

### 1. Toggle Habilitar/Desabilitar Contas Financeiras (2.1)

**1.1 Modelo de Dados** - `src/utils/cadastrosApi.ts`
- Adicionar campos a interface `ContaFinanceira`:
  - `habilitada: boolean` (default `true`)
  - `historicoAlteracoes?: { dataHora: string; usuario: string; statusAnterior: string; novoStatus: string; observacao?: string }[]`
- Inicializar todas as 25 contas existentes com `habilitada: true` e `historicoAlteracoes: []`
- Criar funcao `toggleContaFinanceira(id, usuario, observacao?)` que alterna o campo `habilitada` e registra no historico
- Criar funcao `getContasFinanceirasHabilitadas()` que retorna somente contas com `habilitada !== false`

**1.2 Interface** - `src/pages/CadastrosContasFinanceiras.tsx`
- Importar `Switch` de `@/components/ui/switch` e icone `History` de lucide-react
- Adicionar coluna "Habilitada" na tabela com Switch interativo (verde quando ativo, cinza quando inativo)
- Ao clicar no Switch: abrir Dialog pedindo observacao opcional, usar `useAuthStore` para obter usuario, chamar `toggleContaFinanceira`
- Contas desabilitadas: linha com `opacity-50` para diferenciacao visual
- Adicionar botao "Historico" (icone History) na coluna de acoes que abre Dialog com timeline de alteracoes

**1.3 Impacto nos selects de outros modulos**
- Trocar `getContasFinanceiras()` por `getContasFinanceirasHabilitadas()` nos campos de selecao dos seguintes arquivos:
  - `VendasNova.tsx`, `VendasFinalizarDigital.tsx`, `VendasAcessorios.tsx`
  - `FinanceiroConferencia.tsx`, `FinanceiroConferenciaNotas.tsx`
  - `FinanceiroPagamentosDowngrade.tsx`
  - `FinanceiroNotasAssistencia.tsx`
  - `PagamentoQuadro.tsx`
  - `CadastrosMaquinas.tsx`
  - `VendasEditarGestor.tsx`
  - Demais telas com selects de contas
- Telas de consulta/visualizacao (VendaResumoCompleto, etc.) mantem `getContasFinanceiras()` para exibir nomes mesmo de contas desabilitadas

---

### 2. Documentacao de Evidencias na Finalizacao de OS (2.2)

**2.1 Modelo de Dados** - `src/utils/assistenciaApi.ts`
- Adicionar campo opcional a interface `OrdemServico`:
  - `evidencias?: { nome: string; tipo: string; dataAnexo: string; usuario: string }[]`

**2.2 Modal de Finalizacao** - `src/pages/OSAssistenciaDetalhes.tsx`
- No modal "Confirmar Finalizacao do Servico" (linhas 1799-1860):
  - Adicionar estado `evidenciasServico` com `useState<AnexoTemporario[]>([])`
  - Inserir componente `BufferAnexos` (ja existente) com label "Anexar Evidencias do Servico (opcional)", limite 5 arquivos, 10MB cada
  - No `handleConfirmarFinalizacao`: salvar evidencias na OS via `updateOrdemServico` e registrar na timeline ("Evidencia anexada: [nome]" para cada arquivo)

**2.3 Edicao de OS** - `src/pages/OSAssistenciaEditar.tsx`
- No card "Concluir Servico" (linhas 1036-1048): adicionar `BufferAnexos` antes do botao
- Ao salvar com status "Servico concluido", persistir evidencias na OS

**2.4 Visualizacao** - `src/pages/OSAssistenciaDetalhes.tsx`
- Na secao de detalhes, adicionar card "Evidencias do Servico" quando `os.evidencias?.length > 0`, listando nome, data e usuario de cada arquivo

---

### 3. Automacao PIX da Nota de Entrada no Financeiro (2.3)

**3.1 Exibicao no Financeiro** - `src/pages/FinanceiroNotasPendencias.tsx`
- Entre o `NotaDetalhesContent` e o quadro "Pagamento" (linha ~344), adicionar Card condicional:
  - Visivel quando `notaSelecionada.formaPagamento === 'Pix'` e houver dados PIX (`pixBanco`, `pixRecebedor` ou `pixChave`)
  - Estilo: borda azul (`border-blue-500/30`), background `bg-blue-500/5`, icone `Landmark`
  - Exibe campos somente leitura: Banco, Recebedor, Chave PIX e Observacao em grid 2x2
  - Titulo: "Instrucoes de Pagamento PIX"
  - Subtitulo: "Dados transferidos automaticamente da Nota de Entrada"

**3.2 Modal de Pagamento** - `src/components/estoque/ModalFinalizarPagamento.tsx`
- Receber prop opcional `dadosPix?: { banco: string; recebedor: string; chave: string; observacao?: string }`
- Se presente, exibir banner informativo no topo do modal com os dados PIX pre-preenchidos

---

### Resumo de arquivos a modificar

1. `src/utils/cadastrosApi.ts` - interface + toggleContaFinanceira + getContasFinanceirasHabilitadas
2. `src/pages/CadastrosContasFinanceiras.tsx` - Switch toggle + historico
3. ~15 arquivos de selects - trocar para getContasFinanceirasHabilitadas
4. `src/utils/assistenciaApi.ts` - campo evidencias na interface
5. `src/pages/OSAssistenciaDetalhes.tsx` - BufferAnexos no modal + card de visualizacao
6. `src/pages/OSAssistenciaEditar.tsx` - BufferAnexos no card de conclusao
7. `src/pages/FinanceiroNotasPendencias.tsx` - Card PIX pre-preenchido
8. `src/components/estoque/ModalFinalizarPagamento.tsx` - banner PIX

