
# Plano: Implementação dos Fluxos de Notas de Compra (Urgência e Entrada Normal)

## Visão Geral

Este plano implementa dois fluxos críticos de gestão de notas de compra que integram os módulos de **Estoque**, **Financeiro** e **Vendas**:

1. **Fluxo de Urgência**: Registro rápido com foto obrigatória, validação progressiva e rastreamento de vendedor
2. **Fluxo Normal**: Cadastro completo com validação progressiva de aparelhos e detecção de discrepâncias

---

## Fase 1: Estruturas de Dados

### 1.1 Estender Interface NotaCompra (`src/utils/estoqueApi.ts`)

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CAMPOS NOVOS NA NOTA                         │
├─────────────────────────────────────────────────────────────────┤
│ valorConferido: number      // Soma dos valores já validados   │
│ valorPendente: number       // valorTotal - valorConferido     │
│ statusPagamento: string     // Aguardando | Pago | Parcial     │
│ statusConferencia: string   // Em Conferência | Completa | Disc│
│ dataConferenciaCompleta: string // Quando atingiu 100%         │
│ dataVencimento: string      // Prazo para pagamento            │
│ responsavelEstoque: string  // Quem validou                    │
│ vendedorRegistro: string    // Quem registrou (urgências)      │
│ discrepancia: boolean       // Se há diferença de valores      │
│ motivoDiscrepancia: string  // Descrição da discrepância       │
│ acaoRecomendada: string     // Cobrar Fornecedor | Estoque     │
│ fotoComprovante: string     // URL da foto (urgências)         │
│ timeline: TimelineEntry[]   // Histórico de eventos            │
└─────────────────────────────────────────────────────────────────┘
```

**Campos novos nos produtos da nota:**
```text
┌─────────────────────────────────────────────────────────────────┐
│                 CAMPOS NOVOS NOS PRODUTOS                       │
├─────────────────────────────────────────────────────────────────┤
│ id: string                  // ID único do produto na nota     │
│ statusConferencia: string   // Pendente | Conferido            │
│ dataConferencia: string     // Data da validação               │
│ responsavelConferencia: str // Quem validou                    │
└─────────────────────────────────────────────────────────────────┘
```

**Campos novos no pagamento:**
```text
┌─────────────────────────────────────────────────────────────────┐
│                CAMPOS NOVOS NO PAGAMENTO                        │
├─────────────────────────────────────────────────────────────────┤
│ comprovante: string         // URL do comprovante              │
│ contaPagamento: string      // ID da conta financeira          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Criar Interface PendenciaFinanceira (`src/utils/financeApi.ts`)

```typescript
interface PendenciaFinanceira {
  id: string;                   // PEND-NC-XXXXX
  notaId: string;               // Referência à nota
  fornecedor: string;
  // Valores
  valorTotal: number;
  valorConferido: number;
  valorPendente: number;
  // Status
  statusPagamento: 'Aguardando Conferência' | 'Pago' | 'Parcial';
  statusConferencia: 'Em Conferência' | 'Conferência Completa' | 'Discrepância Detectada';
  // Aparelhos
  aparelhosTotal: number;
  aparelhosConferidos: number;
  percentualConferencia: number;
  // Datas
  dataCriacao: string;
  dataVencimento: string;
  dataConferenciaCompleta?: string;
  dataPagamento?: string;
  // SLA
  slaAlerta: boolean;
  diasDecorridos: number;
  // Discrepâncias
  discrepancia?: boolean;
  motivoDiscrepancia?: string;
  acaoRecomendada?: 'Cobrar Fornecedor' | 'Cobrar Estoque';
  // Timeline
  timeline: TimelineEntry[];
}
```

### 1.3 Estender Interface TimelineEntry (`src/utils/estoqueApi.ts`)

Adicionar novos tipos de evento:
```typescript
tipo: 'entrada' | 'validacao' | 'pagamento' | 'discrepancia' | 
      'alerta_sla' | 'parecer_estoque' | 'parecer_assistencia' | 
      'despesa' | 'liberacao';
```

Adicionar campos opcionais:
```typescript
aparelhoId?: string;    // Para validações de aparelhos específicos
comprovante?: string;   // URL de comprovante
```

---

## Fase 2: Funções de API

### 2.1 Novas Funções em `estoqueApi.ts`

| Função | Descrição |
|--------|-----------|
| `criarNotaComPendencia(nota)` | Cria nota e automaticamente cria pendência no Financeiro |
| `validarAparelhoNota(notaId, aparelhoId, dados)` | Valida um aparelho e atualiza valorConferido |
| `verificarConferencia(notaId)` | Verifica se 100% dos aparelhos foram validados |
| `atualizarStatusPagamento(notaId, status)` | Atualiza status de pagamento da nota |
| `gerarIdProdutoNota()` | Gera ID único para produto dentro da nota |
| `calcularSLANota(dataEntrada)` | Calcula dias e cor do SLA |

### 2.2 Novas Funções em `financeApi.ts`

| Função | Descrição |
|--------|-----------|
| `criarPendenciaFinanceira(nota)` | Cria registro de pendência no Financeiro |
| `atualizarPendencia(notaId, dados)` | Atualiza pendência quando Estoque valida |
| `finalizarPagamento(notaId, pagamento)` | Finaliza pagamento com comprovante |
| `gerarAlertaSLA(notaId)` | Gera alerta se > 3 dias sem progresso |
| `getPendencias()` | Retorna todas as pendências |
| `getPendenciaPorNota(notaId)` | Retorna pendência específica |
| `verificarSLAPendencias()` | Verifica SLA de todas as pendências |

---

## Fase 3: Nova Página - Pendências Financeiras

### 3.1 Criar `FinanceiroNotasPendencias.tsx`

**Rota:** `/financeiro/notas-pendencias`

**Layout:**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  FINANCEIRO > NOTAS - PENDÊNCIAS                                           │
├───────────────┬───────────────┬───────────────┬─────────────────────────────┤
│ Total Pend.   │ Valor Pend.   │ Valor Conf.   │ Alertas SLA                 │
│ [12]          │ [R$ 85.000]   │ [R$ 45.000]   │ [3 críticos]                │
├───────────────┴───────────────┴───────────────┴─────────────────────────────┤
│  FILTROS                                                                    │
│  [Data Início] [Data Fim] [Fornecedor ▼] [Status Pgto ▼] [Status Conf ▼]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Nº Nota │ Fornec. │ Valor │ Conferido │ % Conf │ Pgto │ Conf │ SLA │ Ações │
│  NC-0008 │ iStore  │ 19.2k │ ████░░ 8k │  42%   │ Agrd │ EmCf │ ⚠️3 │ 👁️    │
│  NC-0007 │ FastCel │ 5.0k  │ █████ 5k  │ 100%   │ Agrd │ Cmpl │ ✅2 │ 💳    │
│  URG-023 │ TechSup │ 3.2k  │ ██░░░ 1k  │  31%   │ Pago │ EmCf │ 🔴5 │ 👁️    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- 4 Cards de resumo dinâmicos
- Filtros avançados
- Tabela com barra de progresso visual
- Badges de status coloridos
- Indicadores de SLA (verde, amarelo, vermelho)
- Botões de ação contextuais

### 3.2 Componente ModalDetalhePendencia

```text
┌─────────────────────────────────────────────────────────────────┐
│  📋 DETALHES - NOTA NC-2025-0008                               │
├─────────────────────────────────────────────────────────────────┤
│  INFORMAÇÕES GERAIS                                             │
│  ┌──────────────┬──────────────┬──────────────┐                │
│  │ Fornecedor   │ Data Entrada │ Dias Decorr. │                │
│  │ iStore       │ 25/01/2026   │ 3 dias       │                │
│  └──────────────┴──────────────┴──────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│  VALORES                                                        │
│  ┌────────────────────────────────────────────┐                │
│  │ Total: R$ 19.200,00                        │                │
│  │ Conferido: R$ 8.000,00 (42%)              │                │
│  │ Pendente: R$ 11.200,00                    │                │
│  │ ████████░░░░░░░░░░░░ 42%                   │                │
│  └────────────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│  APARELHOS (2/3 conferidos)                                     │
│  ┌──────────────┬────────────┬─────────┬─────────────┐         │
│  │ IMEI         │ Modelo     │ Valor   │ Status      │         │
│  │ 352...012    │ iPhone 15  │ R$ 7.2k │ ✅ Conferido │         │
│  │ 352...013    │ iPhone 15  │ R$ 7.2k │ ⏳ Pendente │         │
│  │ 352...014    │ iPhone 14  │ R$ 4.8k │ ✅ Conferido │         │
│  └──────────────┴────────────┴─────────┴─────────────┘         │
├─────────────────────────────────────────────────────────────────┤
│  TIMELINE                                                        │
│  ● 26/01 14:30 - Aparelho 352...012 validado (Ana Costa)        │
│  ● 26/01 10:15 - Aparelho 352...014 validado (Pedro Lima)       │
│  ● 25/01 09:00 - Nota recebida no Financeiro                    │
├─────────────────────────────────────────────────────────────────┤
│                              [Fechar] [Finalizar Pagamento]     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Componente ModalFinalizarPagamento

```text
┌─────────────────────────────────────────────────────────────────┐
│  💳 FINALIZAR PAGAMENTO - NC-2025-0008                          │
├─────────────────────────────────────────────────────────────────┤
│  Valor Total: R$ 19.200,00                                      │
│  Status Conferência: 100% Conferido ✅                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Conta de Pagamento *                                           │
│  [Bradesco Thiago Imports ▼]                                    │
│                                                                 │
│  Forma de Pagamento *                                           │
│  [Pix ▼]                                                        │
│                                                                 │
│  Parcelas (se aplicável)                                        │
│  [1 ▼]                                                          │
│                                                                 │
│  Data de Vencimento                                             │
│  [📅 30/01/2026]                                                │
│                                                                 │
│  Comprovante *                                                  │
│  ┌───────────────────────────────────────┐                     │
│  │ 📎 Arraste ou clique para upload      │                     │
│  │    PDF, JPG ou PNG (máx 5MB)          │                     │
│  └───────────────────────────────────────┘                     │
│                                                                 │
│  Observações                                                    │
│  ┌───────────────────────────────────────┐                     │
│  │                                       │                     │
│  └───────────────────────────────────────┘                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                              [Cancelar] [Confirmar Pagamento]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 4: Modificações em Páginas Existentes

### 4.1 Modificar EstoqueNotasCompra.tsx

**Adicionar colunas:**
- `Valor Conferido` - com barra de progresso
- `Status Conferência` - badge colorido
- `Status Pagamento` - badge colorido

**Adicionar filtros:**
- Status Conferência (Select)
- Status Pagamento (Select)

**Adicionar ação:**
- Botão "Ver Progresso" - abre modal com barra de progresso e timeline

**Atualizar modal de urgência:**
- Adicionar campo de foto obrigatória
- Adicionar campo de vendedor responsável

### 4.2 Modificar EstoqueProdutosPendentes.tsx

**Adicionar coluna:**
- `Nota de Origem` - mostra "Urgência" ou "NC-XXXXX"

**Adicionar filtro:**
- Tipo de Nota (Urgência, Entrada Normal)

**Visual:**
- Aparelhos de urgência com tag laranja diferenciada

### 4.3 Modificar FinanceiroLayout.tsx

**Adicionar nova aba:**
```typescript
{ name: 'Notas - Pendências', href: '/financeiro/notas-pendencias', icon: Clock }
```

---

## Fase 5: Sistema de Notificações

### 5.1 Novas Notificações (`notificationsApi.ts`)

| Evento | Para | Mensagem |
|--------|------|----------|
| Nota Criada | Financeiro | "Nova nota [NC-XXXXX] de [Fornecedor] aguardando conferência" |
| Aparelho Validado | Financeiro | "[X]/[Y] aparelhos validados ([%]%)" |
| 100% Conferido | Financeiro | "Nota [NC-XXXXX] pronta para pagamento" |
| SLA Alerta | Financeiro | "Nota [NC-XXXXX] com SLA crítico ([X] dias)" |
| Pagamento Confirmado | Estoque | "Nota [NC-XXXXX] paga com sucesso" |
| Discrepância Detectada | Financeiro + Gestor | "Discrepância de R$ [X] detectada na nota [NC-XXXXX]" |

---

## Fase 6: Regras de Negócio

### 6.1 Validação de Foto (Urgências)

```typescript
// Validações
- Formatos aceitos: JPG, PNG, WebP
- Tamanho máximo: 5MB
- Obrigatória para notas de urgência
- Armazenamento: localStorage (base64) ou URL simulada
```

### 6.2 Validação Progressiva

```typescript
// Ao validar aparelho
1. Marcar produto.statusConferencia = 'Conferido'
2. Adicionar valor ao nota.valorConferido
3. Recalcular nota.valorPendente
4. Verificar se atingiu 100%
5. Atualizar pendência no Financeiro
6. Registrar na timeline
7. Notificar Financeiro
```

### 6.3 Detecção de Discrepâncias

```typescript
// Ao atingir 100% de conferência
if (Math.abs(valorConferido - valorTotal) > valorTotal * 0.001) {
  // Tolerância de 0,1%
  nota.discrepancia = true;
  nota.statusConferencia = 'Discrepância Detectada';
  
  if (valorConferido < valorTotal) {
    nota.motivoDiscrepancia = 'Valor conferido menor que nota';
    nota.acaoRecomendada = 'Cobrar Fornecedor';
  } else {
    nota.motivoDiscrepancia = 'Valor conferido maior que nota';
    nota.acaoRecomendada = 'Cobrar Estoque';
  }
}
```

### 6.4 SLA e Alertas

```typescript
// Cálculo de SLA
const diasDecorridos = diferençaEmDias(dataCriacao, hoje);

if (diasDecorridos >= 5) {
  slaAlerta = 'crítico'; // Vermelho
} else if (diasDecorridos >= 3) {
  slaAlerta = 'aviso';   // Amarelo
} else {
  slaAlerta = 'normal';  // Verde
}
```

---

## Fase 7: Fluxos Completos

### 7.1 Fluxo de Urgência

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE URGÊNCIA                            │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  VENDEDOR   │────▶│   ESTOQUE   │────▶│ FINANCEIRO  │
│ Lança nota  │     │ Valida prod │     │ Finaliza    │
│ + Foto      │     │ (NEGOCIADO) │     │ Pagamento   │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │
     ▼                    ▼                    ▼
 URG-XXXXX          Prod. Pendentes      Nota Concluída
 Status: Agrd.      Status: Triagem      Rastreio Vendedor
```

### 7.2 Fluxo Normal

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO NORMAL                                 │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ESTOQUE   │────▶│   ESTOQUE   │────▶│ FINANCEIRO  │
│ Cadastra    │     │ Valida      │     │ Recebe      │
│ Nota+Prod.  │     │ Progressivo │     │ Pendência   │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │
     │                    ▼                    ▼
     │              ┌─────────────┐     ┌─────────────┐
     │              │ 100% Conf.  │────▶│  Finaliza   │
     │              │ ou Discrep. │     │  Pagamento  │
     │              └─────────────┘     └─────────────┘
     │                                       │
     ▼                                       ▼
 NC-XXXXX                              Nota Concluída
 Pendência Auto                        Produtos Liberados
```

---

## Fase 8: Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/FinanceiroNotasPendencias.tsx` | Nova página de pendências |
| `src/components/financeiro/ModalDetalhePendencia.tsx` | Modal de detalhes |
| `src/components/financeiro/ModalFinalizarPagamento.tsx` | Modal de pagamento |
| `src/components/estoque/ProgressoConferencia.tsx` | Componente de progresso |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/utils/estoqueApi.ts` | Estender interfaces e adicionar funções |
| `src/utils/financeApi.ts` | Adicionar interface PendenciaFinanceira e funções |
| `src/utils/notificationsApi.ts` | Adicionar novos tipos de notificação |
| `src/pages/EstoqueNotasCompra.tsx` | Adicionar colunas, filtros e modal de urgência com foto |
| `src/pages/EstoqueProdutosPendentes.tsx` | Adicionar coluna e filtro de origem |
| `src/pages/FinanceiroConferenciaNotas.tsx` | Adicionar coluna de progresso |
| `src/components/layout/FinanceiroLayout.tsx` | Adicionar nova aba |
| `src/App.tsx` | Adicionar nova rota |

**Total: 4 novos arquivos + 8 arquivos modificados = 12 arquivos**

---

## Fase 9: Ordem de Implementação

1. **Estruturas de Dados** - Interfaces e tipos
2. **Funções de API** - estoqueApi e financeApi
3. **Sistema de Notificações** - Novos tipos
4. **Modificar EstoqueNotasCompra** - Modal urgência com foto
5. **Modificar EstoqueProdutosPendentes** - Coluna origem
6. **Criar FinanceiroNotasPendencias** - Nova página completa
7. **Criar Modais** - Detalhes e Pagamento
8. **Integrar Rotas** - App.tsx e Layout
9. **Testes** - Validar fluxos completos

---

## Considerações Técnicas

### Persistência
- Dados mockados em memória para prototipagem rápida
- localStorage para estados de UI e timeline
- Preparado para migração futura para Supabase

### Performance
- useMemo para cálculos pesados (totalizadores, filtros)
- Componentes modularizados para lazy loading futuro
- Atualização otimista de UI

### UX
- Feedback visual imediato (toasts, cores)
- Indicadores de progresso claros
- Alertas proativos de SLA
- Confirmação antes de ações destrutivas

