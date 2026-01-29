
# Plano: Reformulação Completa do Fluxo de Notas de Entrada de Produtos

## Resumo Executivo

Este plano reformula o sistema de Notas de Entrada para seguir rigorosamente um novo fluxo baseado em **STATUS + TIPO DE PAGAMENTO** como regras mestras. O layout visual existente sera mantido, mas a logica de comportamento dos campos, transicoes de status e integracao entre modulos sera completamente reestruturada.

---

## 1. Novos Status da Nota (Arquivo: estoqueApi.ts)

Substituir os status atuais (`Pendente | Concluido`) por uma maquina de estados completa:

| Status | Descricao | Proximo Status Possivel |
|--------|-----------|-------------------------|
| `Criada` | Nota recem cadastrada | Aguardando Pagamento Inicial, Aguardando Conferencia |
| `Aguardando Pagamento Inicial` | Nota esperando pagamento (Antecipado/Parcial) | Pagamento Parcial Realizado, Pagamento Concluido |
| `Pagamento Parcial Realizado` | Primeiro pagamento feito (Parcial) | Aguardando Conferencia |
| `Pagamento Concluido` | 100% pago (antes de conferir) | Aguardando Conferencia |
| `Aguardando Conferencia` | Produtos a conferir | Conferencia Parcial |
| `Conferencia Parcial` | Parte dos aparelhos conferida | Conferencia Concluida, Com Divergencia |
| `Conferencia Concluida` | 100% conferido | Aguardando Pagamento Final, Finalizada |
| `Aguardando Pagamento Final` | Conferencia ok, falta pagar (Parcial/Pos) | Finalizada |
| `Com Divergencia` | Discrepancia detectada | Aguardando Pagamento Final (apos resolucao) |
| `Finalizada` | Nota encerrada (somente leitura) | - |

---

## 2. Interface NotaCompra Atualizada

```typescript
export interface NotaCompra {
  id: string;
  numeroNota: string;
  data: string;
  fornecedor: string;
  
  // Novo sistema de status
  status: 'Criada' | 'Aguardando Pagamento Inicial' | 'Pagamento Parcial Realizado' | 
          'Pagamento Concluido' | 'Aguardando Conferencia' | 'Conferencia Parcial' |
          'Conferencia Concluida' | 'Aguardando Pagamento Final' | 'Com Divergencia' | 'Finalizada';
  
  // Tipo de pagamento (imutavel apos primeiro pagamento)
  tipoPagamento: 'Antecipado' | 'Parcial' | 'Pos';
  tipoPagamentoBloqueado: boolean;
  
  // Quantidades
  qtdInformada: number;           // Quantidade de aparelhos informada na nota
  qtdCadastrada: number;          // Quantidade de produtos cadastrados
  qtdConferida: number;           // Quantidade de produtos conferidos
  
  // Valores
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  valorConferido: number;
  
  // Produtos
  produtos: ProdutoNota[];
  
  // Timeline imutavel
  timeline: TimelineEntry[];
  
  // Alertas
  alertas: AlertaNota[];
}

export interface ProdutoNota {
  id: string;
  tipoProduto: 'Aparelho' | 'Acessorio';
  marca: string;
  modelo: string;
  imei?: string;              // Preenchido apenas apos recebimento
  cor?: string;               // Preenchido apenas apos recebimento
  categoria?: string;         // Preenchido apenas apos recebimento
  quantidade: number;
  custoUnitario: number;
  custoTotal: number;
  
  // Status do produto
  statusRecebimento: 'Pendente' | 'Recebido';
  statusConferencia: 'Pendente' | 'Conferido';
  dataRecebimento?: string;
  dataConferencia?: string;
  responsavelConferencia?: string;
}

export interface TimelineEntry {
  id: string;
  dataHora: string;
  usuario: string;
  perfil: 'Estoque' | 'Financeiro' | 'Sistema';
  acao: string;
  statusAnterior: string;
  statusNovo: string;
  impactoFinanceiro?: number;
}

export interface AlertaNota {
  id: string;
  tipo: 'divergencia_valor' | 'conferencia_parcial_longa' | 'qtd_excedida' | 
        'imei_ausente' | 'status_critico';
  mensagem: string;
  dataGeracao: string;
  visto: boolean;
}
```

---

## 3. Arquivos a Modificar

### 3.1 estoqueApi.ts
- Atualizar interface `NotaCompra` com novos campos
- Criar funcoes de transicao de status validadas
- Implementar regras de bloqueio de campos por status
- Adicionar funcao `registrarTimelineEntry()` imutavel
- Criar funcoes de alerta automatico

### 3.2 EstoqueNotaCadastrar.tsx (Tela Full-Page)
- Adicionar campo `Quantidade de Aparelhos Informada` (opcional)
- Tornar produtos opcionais (nota pode ser criada vazia)
- Remover campos IMEI e Cor do cadastro inicial
- Manter Categoria visivel mas desabilitada
- Status inicial: `Criada`
- Redirecionar para `Notas Pendentes` apos salvar

### 3.3 EstoqueNotasPendencias.tsx (Aba Reformulada)
- Adicionar colunas: Tipo Pagamento, Qtd Informada/Cadastrada/Conferida
- Acoes por linha: Cadastrar Produtos, Continuar Cadastro, Realizar Conferencia
- Cada acao abre tela full-page (sem modal)
- Filtros por status completo

### 3.4 EstoqueNotaDetalhes.tsx (Tela Full-Page Unificada)
- Unificar cadastro de produtos, conferencia e visualizacao
- Campos habilitados/desabilitados conforme status + recebimento
- Exibir timeline imutavel sempre visivel
- Secao de alertas em destaque
- Bloqueio total quando `Finalizada`

### 3.5 FinanceiroNotasPendencias.tsx
- Filtrar notas por status de pagamento
- Mostrar Valor Nota, Valor Pago, Valor Pendente
- Bloquear pagamento Pos antes de conferencia concluida
- Bloquear pagamento final sem 100% conferencia

### 3.6 pendenciasFinanceiraApi.ts
- Adaptar interface para novos status
- Validar regras de pagamento por tipo

---

## 4. Novas Paginas Full-Page a Criar

### 4.1 EstoqueNotaCadastrarProdutos.tsx
- Rota: `/estoque/nota/:id/cadastrar-produtos`
- Quadro de produtos identico ao cadastro inicial
- Campos: Tipo Produto, Marca, Modelo, Qtd, Custo Unitario, Custo Total
- Campos bloqueados: IMEI, Cor, Categoria
- Validacao: nao permitir Qtd Cadastrada > Qtd Informada
- Ao salvar: atualizar nota e redirecionar para pendencias

### 4.2 EstoqueNotaConferencia.tsx
- Rota: `/estoque/nota/:id/conferencia`
- Lista de produtos para conferir individualmente
- Campos habilitados ao conferir: IMEI, Cor, Categoria
- IMEI obrigatorio para Aparelho, validacao de unicidade
- Ao conferir cada produto: atualizar status, timeline, valores
- Barra de progresso: Qtd Conferida / Qtd Cadastrada

---

## 5. Fluxos por Tipo de Pagamento

### 5.1 Antecipado (100% antes)
```
Criada 
  -> Aguardando Pagamento Inicial (vai p/ Financeiro)
    -> Pagamento Concluido (Financeiro paga 100%)
      -> Aguardando Conferencia (volta p/ Estoque)
        -> Conferencia Parcial -> Conferencia Concluida
          -> Finalizada
```

### 5.2 Parcial
```
Criada 
  -> Aguardando Pagamento Inicial (vai p/ Financeiro)
    -> Pagamento Parcial Realizado (Financeiro paga X%)
      -> Aguardando Conferencia (Estoque pode conferir em paralelo)
        -> Conferencia Parcial -> Conferencia Concluida
          -> Aguardando Pagamento Final (Financeiro paga restante)
            -> Finalizada
```

### 5.3 Pos (100% apos conferencia)
```
Criada 
  -> Aguardando Conferencia (fica no Estoque)
    -> Conferencia Parcial -> Conferencia Concluida
      -> Aguardando Pagamento Final (vai p/ Financeiro)
        -> Finalizada (apos pagamento 100%)
```

---

## 6. Regras de Campos por Status

| Campo | Antes Recebimento | Apos Recebimento | Nota Finalizada |
|-------|-------------------|------------------|-----------------|
| Tipo Produto | Editavel | Bloqueado | Bloqueado |
| Marca | Editavel | Bloqueado | Bloqueado |
| Modelo | Editavel | Bloqueado | Bloqueado |
| IMEI | Desabilitado | Obrigatorio (Aparelho) | Bloqueado |
| Cor | Desabilitado | Obrigatorio | Bloqueado |
| Categoria | Desabilitado | Obrigatorio | Bloqueado |
| Quantidade | Editavel | Bloqueado | Bloqueado |
| Custo Unitario | Editavel | Bloqueado | Bloqueado |
| Custo Total | Calculado | Calculado | Calculado |

---

## 7. Sistema de Alertas Automaticos

Criar funcao `verificarAlertasNota(nota)` que retorna alertas:

| Condicao | Tipo Alerta | Mensagem |
|----------|-------------|----------|
| Valor Pago != Valor Conferido | `divergencia_valor` | "Divergencia: pago R$ X, conferido R$ Y" |
| Conferencia Parcial > 5 dias | `conferencia_parcial_longa` | "Nota parada ha X dias em conferencia parcial" |
| Qtd Cadastrada > Qtd Informada | `qtd_excedida` | "Quantidade de produtos excede o informado" |
| Aparelho recebido sem IMEI | `imei_ausente` | "Aparelho X aguardando IMEI" |
| Status critico > 3 dias | `status_critico` | "Nota parada em status critico" |

Quando divergencia detectada: Status -> `Com Divergencia`

---

## 8. Timeline Imutavel

Toda acao registra entrada na timeline:

```typescript
const registrarTimeline = (
  nota: NotaCompra,
  usuario: string,
  perfil: 'Estoque' | 'Financeiro' | 'Sistema',
  acao: string,
  statusNovo: string,
  impactoFinanceiro?: number
) => {
  const entry: TimelineEntry = {
    id: `TL-${nota.id}-${String(nota.timeline.length + 1).padStart(4, '0')}`,
    dataHora: new Date().toISOString(),
    usuario,
    perfil,
    acao,
    statusAnterior: nota.status,
    statusNovo,
    impactoFinanceiro
  };
  nota.timeline.push(entry);
  // Timeline nunca pode ser editada ou removida
};
```

---

## 9. Regras de Finalizacao

Nota so pode ser `Finalizada` quando:
- `qtdConferida === qtdInformada`
- `valorPago === valorTotal`
- `valorConferido === valorTotal` (tolerancia 0,01%)
- Sem alertas de divergencia ativos

Apos Finalizada:
- Todos os campos somente leitura
- Nenhuma acao operacional permitida
- Apenas visualizacao e exportacao

---

## 10. Rotas Necessarias

```typescript
// Novas rotas em App.tsx
<Route path="/estoque/nota/:id/cadastrar-produtos" element={<EstoqueNotaCadastrarProdutos />} />
<Route path="/estoque/nota/:id/conferencia" element={<EstoqueNotaConferencia />} />
```

---

## 11. Ordem de Implementacao

1. **estoqueApi.ts** - Atualizar interfaces e funcoes base
2. **timelineApi.ts** - Criar funcao de registro imutavel
3. **EstoqueNotaCadastrar.tsx** - Adaptar cadastro inicial
4. **EstoqueNotasPendencias.tsx** - Reformular aba com novas colunas
5. **EstoqueNotaCadastrarProdutos.tsx** - Criar nova pagina
6. **EstoqueNotaConferencia.tsx** - Criar nova pagina
7. **EstoqueNotaDetalhes.tsx** - Unificar visualizacao
8. **FinanceiroNotasPendencias.tsx** - Adaptar para novos status
9. **pendenciasFinanceiraApi.ts** - Atualizar regras de pagamento

---

## 12. Resumo Visual do Fluxo

```text
                           +-----------------+
                           |     CRIADA      |
                           +--------+--------+
                                    |
             +----------------------+----------------------+
             |                      |                      |
             v                      v                      v
    [Tipo: Antecipado]     [Tipo: Parcial]         [Tipo: Pos]
             |                      |                      |
             v                      v                      |
    +--------+--------+    +--------+--------+             |
    | AGUARD. PAG.    |    | AGUARD. PAG.    |             |
    | INICIAL         |    | INICIAL         |             |
    +--------+--------+    +--------+--------+             |
             |                      |                      |
             v                      v                      |
    +--------+--------+    +--------+--------+             |
    | PAGAMENTO       |    | PAG. PARCIAL    |             |
    | CONCLUIDO       |    | REALIZADO       |             |
    +--------+--------+    +--------+--------+             |
             |                      |                      |
             +-----------+----------+----------------------+
                         |
                         v
               +--------+--------+
               | AGUARD.         |
               | CONFERENCIA     |
               +--------+--------+
                         |
                         v
               +--------+--------+
               | CONFERENCIA     |<----+
               | PARCIAL         |     |
               +--------+--------+     | (produtos
                         |             |  pendentes)
                         v             |
               +--------+--------+-----+
               | CONFERENCIA     |
               | CONCLUIDA       |
               +--------+--------+
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
    [Antecipado]   [Parcial]        [Pos]
    (ja pago)      (pagar rest)     (pagar 100%)
          |              |              |
          |              v              v
          |     +--------+--------+--------+
          |     | AGUARD. PAG.             |
          |     | FINAL                    |
          |     +--------+-----------------+
          |              |
          +--------------+
                         |
                         v
               +--------+--------+
               |   FINALIZADA    |
               +-----------------+
```
