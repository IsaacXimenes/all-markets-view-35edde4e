

## Remoção de Lotes e Implementação de Ações em Massa

### Resumo

Remover toda a infraestrutura de "Lotes" (criação, agrupamento, envio) e substituir por um sistema direto de "Encaminhar Selecionados" com checkboxes, onde cada registro é processado individualmente e chega ao financeiro sem agrupamento.

---

### 1. Arquivos a EXCLUIR

| Arquivo | Motivo |
|---------|--------|
| `src/utils/lotesPagamentoApi.ts` | API de lotes de pagamento (entidade inteira) |
| `src/pages/FinanceiroLotesPagamento.tsx` | Página "Lotes de Pagamento" no Financeiro |
| `src/pages/FinanceiroExecucaoLotes.tsx` | Página "Execução de Lotes" no Financeiro |
| `src/pages/AssistenciaLotesPagamento.tsx` | Página "Lotes de Pagamento" na Assistência |

---

### 2. Remover Rotas e Imports em `src/App.tsx`

- Remover imports de `FinanceiroLotesPagamento`, `FinanceiroExecucaoLotes`, `AssistenciaLotesPagamento`
- Remover as 3 rotas: `/financeiro/lotes-pagamento`, `/financeiro/execucao-lotes`, `/assistencia/lotes-pagamento`

---

### 3. Limpar Referências de Navegação

**`src/pages/OSAssistencia.tsx`** (linha ~514):
- Remover o botão que navega para `/assistencia/lotes-pagamento`

**`src/components/layout/FinanceiroLayout.tsx`**:
- As abas de "Lotes de Pagamento" e "Execução de Lotes" ja NAO existem neste layout (confirmado na leitura). Nenhuma alteração necessária aqui.

---

### 4. Refatorar `src/pages/OSSolicitacoesPecas.tsx` - Substituir Lotes por Encaminhar em Massa

Esta é a maior alteração. O fluxo atual usa checkboxes para selecionar solicitações aprovadas e criar um lote. O novo fluxo:

**Remover:**
- Import de `criarLote`, `enviarLote`, `getLotes`, `editarLote`, `getLoteById`, `LotePecas`, `LoteTimeline`
- Estado `lotes`, `loteSelecionado`, `verLoteOpen`, `editarLoteOpen`, `editLoteValorTotal`
- Aba "Lotes" inteira (`TabsTrigger value="lotes"` e `TabsContent value="lotes"`)
- Card de stats "Lotes"
- Funções `handleCriarLote`, `handleEnviarLote`, `handleEditarLote`, `handleSalvarEdicaoLote`, `handleVerLote`
- Modais de ver/editar lote

**Adicionar:**
- Botão "Encaminhar Selecionados (N)" que substitui "Criar Lote (N)"
- Ao clicar, percorre cada solicitação selecionada e chama uma nova função `encaminharParaFinanceiro` que:
  - Atualiza status para `'Pagamento - Financeiro'`
  - Cria uma nota individual no financeiro
  - Registra na timeline da OS: "Registro encaminhado para conferência financeira por [Usuário] via ação em massa"
- Os checkboxes permanecem apenas para solicitações com status `'Aprovada'` (sem filtro por `loteId`)

---

### 5. Refatorar `src/utils/solicitacaoPecasApi.ts` - Remover Lotes, Adicionar Encaminhar Individual

**Remover:**
- Interface `LotePecas`, `LoteTimeline`
- Array `lotes` e `loteCounter`
- Funções: `criarLote`, `editarLote`, `getLoteById` (da solicitacaoPecasApi), `enviarLote`, `getLotes`
- Campo `loteId` da interface `SolicitacaoPeca` (e referências nos dados mockados)
- Lógica de `finalizarNotaAssistencia` que referencia lotes

**Adicionar:**
- Função `encaminharParaFinanceiro(solicitacaoIds: string[], usuarioNome: string)`:
  - Para cada ID, atualiza status para `'Pagamento - Financeiro'`
  - Cria nota individual de assistência para cada solicitação
  - Registra timeline na OS: "Registro encaminhado para conferência financeira por [usuarioNome] via ação em massa"
  - Retorna array de notas criadas

**Adaptar:**
- `finalizarNotaAssistencia` para funcionar sem referência a lotes - processar diretamente a solicitação vinculada à nota

---

### 6. Conferência Individual no Financeiro

A página `src/pages/FinanceiroNotasAssistencia.tsx` já lista notas individualmente. Com a remoção dos lotes, cada nota terá exatamente 1 solicitação, garantindo conferência individual. Nenhuma alteração estrutural necessária nesta página, apenas confirmar que os dados fluem corretamente.

---

### Resumo de Impacto

| Arquivo | Ação |
|---------|------|
| `src/utils/lotesPagamentoApi.ts` | EXCLUIR |
| `src/pages/FinanceiroLotesPagamento.tsx` | EXCLUIR |
| `src/pages/FinanceiroExecucaoLotes.tsx` | EXCLUIR |
| `src/pages/AssistenciaLotesPagamento.tsx` | EXCLUIR |
| `src/App.tsx` | Remover 3 imports e 3 rotas |
| `src/pages/OSAssistencia.tsx` | Remover botão de navegação para lotes |
| `src/pages/OSSolicitacoesPecas.tsx` | Refatorar: remover aba Lotes, trocar "Criar Lote" por "Encaminhar Selecionados" |
| `src/utils/solicitacaoPecasApi.ts` | Remover entidade Lote, adicionar `encaminharParaFinanceiro`, adaptar `finalizarNotaAssistencia` |

