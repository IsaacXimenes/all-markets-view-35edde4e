

## Alteracoes na Central de Despesas

### 1. Renomear status "Agendado" para "A vencer"

Substituir em todos os locais onde o status `'Agendado'` aparece:

**`src/utils/financeApi.ts`**:
- Interface `Despesa`: tipo do status muda de `'Agendado' | 'Vencido' | 'Pago'` para `'À vencer' | 'Vencido' | 'Pago'`
- Todos os dados mockados que tem `status: 'Agendado'` passam para `status: 'À vencer'`
- Funcao `atualizarStatusVencidos`: verificar `d.status === 'À vencer'`
- Funcao `provisionarProximoPeriodo`: nova despesa com `status: 'À vencer'`

**`src/pages/FinanceiroCentralDespesas.tsx`**:
- Filtro de status: trocar `<SelectItem value="Agendado">Agendado</SelectItem>` por `<SelectItem value="À vencer">À vencer</SelectItem>`
- No `handleLancar`: `status: 'À vencer'`
- No dashboard `totalPrevisto`: filtrar por `'À vencer'` em vez de `'Agendado'`

### 2. Dados mockados com mes base FEV-2026

Reescrever todos os dados mockados de despesas para usar datas a partir de FEV-2026:

- **FEV-2026**: ~10 despesas (mix de Pago, A vencer e Vencido)
- **MAR-2026**: ~6 despesas (A vencer, futuras)
- **ABR-2026**: ~4 despesas (A vencer, futuras)

Os IDs passam de `DES-2025-XXXX` para `DES-2026-XXXX`. As datas de vencimento, competencias e datas de pagamento (quando Pago) serao ajustadas para o periodo correto.

### Detalhes tecnicos

Arquivos impactados:

| Arquivo | Alteracao |
|---|---|
| `src/utils/financeApi.ts` | Interface Despesa (tipo status), dados mockados (datas FEV-2026+), funcoes `atualizarStatusVencidos` e `provisionarProximoPeriodo` |
| `src/pages/FinanceiroCentralDespesas.tsx` | Filtro de status, handleLancar, dashboard -- trocar "Agendado" por "A vencer" |

