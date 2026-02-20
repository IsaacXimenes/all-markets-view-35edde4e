

## Remover Status "Reservada" do Estoque de Assistencia

### Resumo

Eliminar o status "Reservada" do sistema de pecas, mantendo apenas os 3 status validos: **Disponivel**, **Utilizada** e **Devolvida**. Ajustar todos os arquivos que referenciam esse status.

---

### Alteracoes

**1. `src/utils/pecasApi.ts`**
- Linha 28: Remover `'Reservada'` do union type, ficando `status: 'Disponivel' | 'Utilizada' | 'Devolvida'`
- Linhas 108 e 176: Trocar `status: 'Reservada'` dos mocks (PEC-0006 e PEC-0012) para `'Disponivel'`
- Linhas 335-338: Remover a funcao `reservarPeca` (ou alterar para no-op)
- Linhas 342-346: Remover a funcao `liberarReservaPeca` (ou alterar para no-op)

**2. `src/utils/consignacaoApi.ts`**
- Linha 207: No `iniciarAcertoContas`, trocar `updatePeca(item.pecaId, { status: 'Reservada' })` para `updatePeca(item.pecaId, { status: 'Utilizada' })` -- ao iniciar o acerto, as pecas consignadas disponiveis passam direto para "Utilizada" (congeladas para uso)

**3. `src/pages/OSPecas.tsx`**
- Linhas 92-93: Remover o `case 'Reservada'` do switch de badges

**4. `src/utils/statusColors.ts`**
- Linha 108: Remover a entrada `'Reservada': 'yellow'`

### Sequencia

1. `pecasApi.ts` - tipo + mocks + funcoes
2. `consignacaoApi.ts` - acerto de contas
3. `OSPecas.tsx` - badge
4. `statusColors.ts` - cor
