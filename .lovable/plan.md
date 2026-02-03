

# Plano: Reestruturação da Aba Movimentação Matriz

## Resumo Executivo

Este plano transforma a aba "Movimentação Matriz" de um layout de tela cheia (formulário sempre visível) para o padrão de tabela com registros históricos, seguindo o modelo da aba "Movimentações" regular. Além disso, corrige a regra de prazo de devolução: o limite passa a ser às **22:00 (dez da noite)** do mesmo dia, não mais "22 horas após o lançamento".

---

## Mudanças Principais

### 1. Layout em Formato de Tabela (Padrão do Sistema)

**Antes:** Tela cheia com formulário de lançamento sempre visível + cards de movimentações abaixo.

**Depois:** 
- Barra de filtros no topo (Origem, Destino, Status)
- Botão "Nova Movimentação" que abre modal de registro
- Tabela com histórico de todas as movimentações
- Colunas: ID, Data/Hora, Responsável, Qtd Aparelhos, Status, Timer, Ações

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [Filtro Status ▼]  [Limpar]              [+ Nova Movimentação] [CSV]   │
├─────────────────────────────────────────────────────────────────────────┤
│  ID    │ Data/Hora Lançamento │ Resp. │ Aparelhos │ Status  │ Timer │ ⚙ │
├────────┼──────────────────────┼───────┼───────────┼─────────┼───────┼───┤
│ MM-001 │ 03/02/2026 20:00     │ João  │ 3 itens   │ Aguard. │ 02:00 │ 👁│
│ MM-002 │ 03/02/2026 14:00     │ Maria │ 5 itens   │ Concl.  │   --  │ 👁│
│ MM-003 │ 02/02/2026 18:00     │ Pedro │ 2 itens   │ Atrasad │ Expi. │ 👁│
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Correção da Regra do Timer

**Antes:** Prazo = Data/Hora do lançamento + 22 horas

**Depois:** Prazo = Às 22:00 (dez da noite) do **mesmo dia** do lançamento

**Exemplo prático:**
- Lançamento às 20:00 → Prazo às 22:00 → Timer mostra **02:00:00** restantes
- Lançamento às 14:00 → Prazo às 22:00 → Timer mostra **08:00:00** restantes
- Lançamento às 10:00 → Prazo às 22:00 → Timer mostra **12:00:00** restantes

### 3. Modal "Nova Movimentação"

O formulário atual será movido para um modal/dialog, mantendo:
- Origem fixa: **Estoque - SIA** (não editável)
- Destino fixo: **Loja - Matriz** (não editável)
- Seleção de responsável
- Botão para buscar aparelhos (abre modal de seleção)
- Lista de aparelhos selecionados
- Botão "Registrar Lançamento"

---

## Detalhes Técnicos

### Arquivo: `src/pages/EstoqueMovimentacoesMatriz.tsx`

1. **Remover os cards de cabeçalho e formulário** que ocupam tela cheia
2. **Adicionar barra de filtros** no topo (similar a EstoqueMovimentacoes.tsx)
3. **Implementar tabela responsiva** com ResponsiveTableContainer
4. **Criar Dialog para "Nova Movimentação"** com o formulário atual
5. **Manter modal de conferência** existente (já funciona corretamente)

### Arquivo: `src/utils/estoqueApi.ts`

1. **Alterar função `criarMovimentacaoMatriz`:**
   - Ao invés de somar 22 horas, calcular o horário às 22:00 do mesmo dia
   - Se o lançamento for após 22:00, o prazo é 22:00 do dia seguinte

```typescript
// ANTES (errado):
const limite = new Date(agora.getTime() + 22 * 60 * 60 * 1000);

// DEPOIS (correto):
const limite = new Date(agora);
limite.setHours(22, 0, 0, 0); // Define para 22:00 do mesmo dia
// Se já passou das 22h, usa 22h do dia seguinte
if (agora.getHours() >= 22) {
  limite.setDate(limite.getDate() + 1);
}
```

### Componente TimerRegressivo

Permanece o mesmo - já funciona corretamente calculando a diferença entre "agora" e "dataLimite". Apenas a `dataLimite` será gerada com a nova regra.

---

## Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| ID | Código da movimentação (MM-XXXXXX) |
| Data/Hora | Momento do lançamento |
| Responsável | Quem registrou |
| Aparelhos | Quantidade de itens (ex: "3 itens") |
| Status | Badge colorido (Aguardando/Concluída/Atrasado) |
| Timer | Tempo restante até 22:00 (ou "Expirado") |
| Ações | Botões Visualizar e Conferir |

---

## Cores de Linha na Tabela

Seguindo o padrão do sistema:
- **Amarelo (bg-yellow-500/10):** Status "Aguardando Retorno"
- **Verde (bg-green-500/10):** Status "Concluída"
- **Vermelho (bg-red-500/10):** Status "Retorno Atrasado"

---

## Fluxo de Uso

1. Usuário acessa a aba "Movimentações - Matriz"
2. Visualiza tabela com todas as movimentações existentes
3. Clica em "+ Nova Movimentação"
4. Modal abre com origem/destino fixos já preenchidos
5. Seleciona responsável
6. Clica em "Buscar Aparelho no Estoque" → Modal de seleção
7. Seleciona os aparelhos desejados
8. Clica em "Registrar Lançamento"
9. Modal fecha, tabela atualiza com nova linha
10. Timer mostra tempo até 22:00 da noite

