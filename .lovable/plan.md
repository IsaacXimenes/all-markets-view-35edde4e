
## Plano: Toggle Contas Financeiras + Evidencias OS + PIX Automatico no Financeiro

### 1. Toggle Habilitar/Desabilitar Contas Financeiras com Historico (2.1)

**Arquivo:** `src/utils/cadastrosApi.ts`
- Adicionar campo `habilitada: boolean` (default `true`) a interface `ContaFinanceira`
- Adicionar campo `historicoAlteracoes?: { dataHora: string; usuario: string; statusAnterior: string; novoStatus: string; observacao?: string }[]` a interface `ContaFinanceira`
- Inicializar todas as contas existentes com `habilitada: true` e `historicoAlteracoes: []`
- Criar funcao `toggleContaFinanceira(id: string, usuario: string, observacao?: string)` que alterna `habilitada`, registra no historico e retorna a conta atualizada
- Criar funcao `getContasFinanceirasHabilitadas()` que retorna apenas contas com `habilitada === true` (para uso nos selects de outros modulos)

**Arquivo:** `src/pages/CadastrosContasFinanceiras.tsx`
- Importar componente `Switch` de `@/components/ui/switch`
- Substituir a coluna "Status" (Ativo/Inativo) por coluna "Habilitada" com um Switch interativo
- Ao clicar no Switch, abrir modal pedindo observacao opcional, registrar usuario logado via `useAuthStore`, chamar `toggleContaFinanceira`
- Contas desabilitadas: linha com `opacity-50` e texto cinza claro
- Adicionar botao "Historico" (icone History) na coluna de acoes que abre Dialog com timeline de alteracoes da conta
- Manter coluna "Status" original (Ativo/Inativo) separada, pois sao conceitos diferentes

**Impacto nos outros modulos (selects de conta):**
- Em todos os arquivos que usam `getContasFinanceiras()` para popular selects (27 arquivos encontrados), trocar para `getContasFinanceirasHabilitadas()` nos campos de selecao. Os principais sao:
  - `src/pages/CadastrosMaquinas.tsx` (linha 60)
  - `src/pages/VendasEditarGestor.tsx` (linha 57)
  - `src/pages/FinanceiroConferencia.tsx` (linha 126)
  - `src/components/vendas/PagamentoQuadro.tsx`
  - `src/pages/FinanceiroContas.tsx`
  - Outros modulos que montam selects de conta financeira
- Em telas de consulta/visualizacao (VendaResumoCompleto, etc.), manter `getContasFinanceiras()` para exibir o nome mesmo de contas desabilitadas

---

### 2. Upload de Evidencias na Finalizacao de Servico da OS (2.2)

**Arquivo:** `src/pages/OSAssistenciaDetalhes.tsx`
- No modal "Confirmar Finalizacao do Servico" (linhas 1799-1860), adicionar campo `BufferAnexos` (componente ja existente em `src/components/estoque/BufferAnexos.tsx`) com label "Anexar Evidencias do Servico (opcional)"
- Limite: 5 arquivos, 10MB cada
- Estado: `const [evidenciasServico, setEvidenciasServico] = useState<AnexoTemporario[]>([])`
- No `handleConfirmarFinalizacao`, salvar as evidencias na OS via `updateOrdemServico` (novo campo `evidencias?: { nome: string; tipo: string; dataAnexo: string; usuario: string }[]`)
- Registrar na timeline: "Evidencia anexada: [nome do arquivo]" para cada arquivo

**Arquivo:** `src/pages/OSAssistenciaEditar.tsx`
- No card "Concluir Servico" (linhas 1036-1048), adicionar campo similar de `BufferAnexos` antes do botao "Concluir Servico"
- Ao salvar com status "Servico concluido", persistir evidencias na OS

**Arquivo:** `src/utils/assistenciaApi.ts`
- Adicionar campo `evidencias?: { nome: string; tipo: string; url?: string; dataAnexo: string; usuario: string }[]` a interface `OrdemServico`

**Arquivo:** `src/pages/OSAssistenciaDetalhes.tsx` (visualizacao)
- Na secao de detalhes da OS, adicionar card "Evidencias do Servico" que lista os arquivos anexados com nome, data e usuario, quando houver evidencias

---

### 3. Informacoes PIX Automaticas da Nota de Entrada no Financeiro (2.3)

**Situacao atual:** A Nota de Entrada ja persiste `pixBanco`, `pixRecebedor`, `pixChave` na interface `NotaEntrada` (notaEntradaFluxoApi.ts). Porem, a tela `FinanceiroNotasPendencias.tsx` nao exibe esses dados.

**Arquivo:** `src/pages/FinanceiroNotasPendencias.tsx`
- No modo detalhes (`modoDetalhes && notaSelecionada`), entre o `NotaDetalhesContent` e o quadro de Pagamento, adicionar um Card condicional "Instrucoes de Pagamento PIX" quando `notaSelecionada.formaPagamento === 'Pix'`
- O card exibe: Banco, Recebedor, Chave PIX e Observacao -- todos pre-preenchidos e somente leitura, vindos da nota de entrada
- Estilo: borda azul/primary, icone Smartphone ou Landmark, campos em grid 2x2
- Adicionar timeline entry na nota quando o pagamento for registrado: "Pagamento registrado com dados PIX originados da Nota de Entrada"

**Arquivo:** `src/components/estoque/ModalFinalizarPagamento.tsx`
- Receber prop opcional `dadosPix?: { banco: string; recebedor: string; chave: string; observacao?: string }`
- Se `dadosPix` estiver presente, exibir banner informativo no topo do modal: "Dados PIX pre-preenchidos da Nota de Entrada" com os valores
- Propagar esses dados para o pagamento ao confirmar

---

### Resumo de arquivos a modificar

1. `src/utils/cadastrosApi.ts` -- interface ContaFinanceira + toggleContaFinanceira + getContasFinanceirasHabilitadas
2. `src/pages/CadastrosContasFinanceiras.tsx` -- Switch toggle + modal observacao + historico
3. `src/pages/CadastrosMaquinas.tsx` -- trocar getContasFinanceiras por getContasFinanceirasHabilitadas nos selects
4. `src/pages/VendasEditarGestor.tsx` -- idem
5. `src/pages/FinanceiroConferencia.tsx` -- idem
6. `src/utils/assistenciaApi.ts` -- campo evidencias na interface OrdemServico
7. `src/pages/OSAssistenciaDetalhes.tsx` -- BufferAnexos no modal de finalizacao + card de visualizacao de evidencias
8. `src/pages/OSAssistenciaEditar.tsx` -- BufferAnexos no card de conclusao de servico
9. `src/pages/FinanceiroNotasPendencias.tsx` -- Card de instrucoes PIX pre-preenchido
10. `src/components/estoque/ModalFinalizarPagamento.tsx` -- banner dados PIX

### Detalhes tecnicos

**Toggle (item 1):**
```typescript
// cadastrosApi.ts
interface ContaFinanceira {
  // ...campos existentes
  habilitada: boolean;
  historicoAlteracoes?: {
    dataHora: string;
    usuario: string;
    statusAnterior: string;
    novoStatus: string;
    observacao?: string;
  }[];
}

export const getContasFinanceirasHabilitadas = () =>
  contasFinanceiras.filter(c => c.habilitada !== false);

export const toggleContaFinanceira = (id: string, usuario: string, observacao?: string) => {
  const conta = contasFinanceiras.find(c => c.id === id);
  if (!conta) return null;
  const anterior = conta.habilitada ? 'Habilitada' : 'Desabilitada';
  conta.habilitada = !conta.habilitada;
  if (!conta.historicoAlteracoes) conta.historicoAlteracoes = [];
  conta.historicoAlteracoes.push({
    dataHora: new Date().toISOString(),
    usuario,
    statusAnterior: anterior,
    novoStatus: conta.habilitada ? 'Habilitada' : 'Desabilitada',
    observacao
  });
  return conta;
};
```

**PIX no Financeiro (item 3):**
```tsx
// FinanceiroNotasPendencias.tsx - entre NotaDetalhesContent e quadro de Pagamento
{notaSelecionada.formaPagamento === 'Pix' && (notaSelecionada.pixBanco || notaSelecionada.pixRecebedor || notaSelecionada.pixChave) && (
  <Card className="border-blue-500/30 bg-blue-500/5">
    <CardHeader>
      <CardTitle>Instrucoes de Pagamento PIX</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Banco</Label><p>{notaSelecionada.pixBanco}</p></div>
        <div><Label>Recebedor</Label><p>{notaSelecionada.pixRecebedor}</p></div>
        <div><Label>Chave PIX</Label><p>{notaSelecionada.pixChave}</p></div>
        <div><Label>Observacao</Label><p>{notaSelecionada.observacoes || '-'}</p></div>
      </div>
    </CardContent>
  </Card>
)}
```
