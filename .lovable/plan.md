
## Plano: Modal Full Screen de Pagamento de Remuneracao Motoboy

### Objetivo
Substituir o botao "Pagar" simples por um fluxo completo de pagamento em tela cheia, com auditoria de entregas, selecao de conta bancaria, upload de comprovante obrigatorio e lancamento automatico no extrato financeiro.

---

### 1. Atualizar `src/utils/motoboyApi.ts`

**1.1 Expandir interface `RemuneracaoMotoboy`:**
- Adicionar campos opcionais: `contaId?: string`, `contaNome?: string`, `comprovante?: string`, `comprovanteNome?: string`, `pagoPor?: string`, `observacoesPagamento?: string`.

**1.2 Atualizar `registrarPagamentoRemuneracao`:**
- Nova assinatura: `registrarPagamentoRemuneracao(id, dados: { contaId, contaNome, comprovante, comprovanteNome, pagoPor, observacoes })`.
- Persistir todos os campos no registro da remuneracao.
- Chamar `addDespesa` de `financeApi.ts` para gerar lancamento automatico no extrato:
  - `tipo: 'Variavel'`
  - `categoria: 'Frete/Logistica'`
  - `descricao: 'Pagamento Remuneracao Motoboy - [Nome] - Periodo [Inicio] a [Fim]'`
  - `valor: valorTotal`
  - `conta: contaNome`
  - `status: 'Pago'`
  - `dataPagamento: hoje`
  - `pagoPor: usuarioNome`
  - `comprovante: comprovanteNome`
- Retornar `true` em caso de sucesso.

---

### 2. Atualizar `src/pages/RHMotoboyRemuneracao.tsx`

**2.1 Novo estado para modal de pagamento:**
- `modalPagamentoOpen` (boolean)
- `remuneracaoPagamento` (RemuneracaoMotoboy | null)
- `detalhesPagamento` (DetalheEntregaRemuneracao[])
- `contaSelecionada` (string) - ID da conta
- `comprovante` / `comprovanteNome` / `comprovantePreview` (strings para FileUploadComprovante)
- `observacoesPagamento` (string)

**2.2 Botao "Pagar" abre modal full screen:**
- Substituir chamada direta a `handlePagar(rem.id)` por `handleAbrirPagamento(rem)`.
- Ao abrir: carregar detalhes de entrega via `getDetalheEntregasRemuneracao` e popular o modal.

**2.3 Layout do modal (Dialog max-w-6xl):**

Cabecalho:
- Nome do Motoboy, Competencia e Periodo (dd/MM a dd/MM)

Secao 1 - Tabela de Auditoria:
- Colunas: ID da Venda, Data, Cliente/Descricao, Localizacao, Valor da Entrega
- Rodape com totalizador de quantidade e valor

Secao 2 - Resumo de Valores:
- Card destacado com "Total de Entregas" (quantidade), "Valor Liquido a Pagar" (formatCurrency)

Secao 3 - Quadro de Baixa Financeira:
- Select "Conta de Saida" (obrigatorio): usando `getContasFinanceirasHabilitadas()` de `cadastrosApi.ts`
- FileUploadComprovante "Comprovante de Pagamento" (obrigatorio)
- Textarea "Observacoes" (opcional)
- Botao "Confirmar Pagamento": desabilitado ate que conta E comprovante estejam preenchidos

**2.4 Ao confirmar pagamento:**
- Chamar `registrarPagamentoRemuneracao` com todos os dados
- Fechar modal, atualizar lista, exibir toast de sucesso
- O lancamento no extrato financeiro e feito automaticamente pela API

---

### Resumo de Arquivos

| Arquivo | Alteracoes |
|---------|-----------|
| `src/utils/motoboyApi.ts` | Expandir interface, atualizar `registrarPagamentoRemuneracao` com integracao financeira |
| `src/pages/RHMotoboyRemuneracao.tsx` | Modal full screen de pagamento com auditoria, conta, comprovante e observacoes |

### Detalhes Tecnicos

- O select de contas usa `getContasFinanceirasHabilitadas()` (somente contas ativas), seguindo o padrao arquitetural do projeto.
- O componente `FileUploadComprovante` ja existente e reutilizado (drag-and-drop, camera, PDF/imagem).
- A despesa gerada no extrato usa `lojaId` da loja Matriz como padrao (despesa administrativa central).
- O botao "Confirmar Pagamento" valida: `contaSelecionada !== '' && comprovante !== ''`.
