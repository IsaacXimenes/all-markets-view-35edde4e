

## Implementacao dos 2 Planos: Correcoes UI/Auditoria + Historico de Devolucao

### Resumo

Aplicar todas as correcoes de interface, nomenclatura e auditoria (Plano 1), junto com a alteracao para manter pecas devolvidas no historico em vez de deleta-las (Plano 2).

---

### Alteracao 1: Fix bug pecas sumindo (`src/utils/pecasApi.ts`)

**Linha 192-193**: Substituir guard `pecas.length > 0` por flag booleana:

```typescript
// ANTES
export const initializePecasWithLojaIds = (lojaIds: string[]): void => {
  if (pecas.length > 0) return;

// DEPOIS
let pecasBaseInitialized = false;

export const initializePecasWithLojaIds = (lojaIds: string[]): void => {
  if (pecasBaseInitialized) return;
  pecasBaseInitialized = true;
```

Adicionar `pecasBaseInitialized = true;` logo antes do `pecas = pecasBase.map(...)` (apos a nova linha do guard). O restante do corpo da funcao permanece igual, mas agora as pecas base (mock) sao adicionadas ao array `pecas` junto com quaisquer pecas consignadas ja presentes via `addPeca`, usando spread: `pecas = [...pecas, ...pecasBase.map(...)]` em vez de `pecas = pecasBase.map(...)`.

---

### Alteracao 2: Imports e devolucao sem delete (`src/utils/consignacaoApi.ts`)

**Linha 2**: Adicionar `updatePeca` ao import:
```typescript
import { addPeca, getPecaById, darBaixaPeca, deletePeca, updatePeca } from './pecasApi';
```

**Linha 202-207** (`iniciarAcertoContas`): Ao mudar itens para 'Em Acerto', tambem marcar pecas no estoque como 'Reservada':
```typescript
lote.itens.forEach(item => {
  if (item.status === 'Disponivel') {
    item.status = 'Em Acerto';
    if (item.pecaId) {
      updatePeca(item.pecaId, { status: 'Reservada' });
    }
  }
});
```

**Linha 241-244** (`confirmarDevolucaoItem`): Substituir `deletePeca` por `updatePeca` para manter historico:
```typescript
// ANTES
if (item.pecaId) {
  deletePeca(item.pecaId);
}

// DEPOIS
if (item.pecaId) {
  updatePeca(item.pecaId, { status: 'Utilizada', quantidade: 0 });
}
```

---

### Alteracao 3: Padronizar nomenclatura (`src/pages/OSPecas.tsx`)

**Linha 267**: Renomear filtro de "Consignacao" para "Consignado":
```typescript
<SelectItem value="Consignacao">Consignado</SelectItem>
```

**Linhas 313-318**: Remover badge [CONSIGNADO] da coluna Descricao (manter apenas na coluna Origem):
```typescript
<TableCell className="font-medium">
  {peca.descricao}
</TableCell>
```

---

### Alteracao 4: Quadro "Pecas Usadas" com Loja, Valor de Custo e Total (`src/pages/OSConsignacao.tsx`)

**Linhas 496-536** (view de Acerto): Refatorar o quadro de itens consumidos:

- Renomear CardTitle de "Itens Consumidos" para "Pecas Usadas"
- Renomear header "Valor" para "Valor de Custo"
- Adicionar coluna "Loja" entre "Valor de Custo" e "OS"
- Garantir que `item.tecnicoConsumo` seja exibido (nao "Sistema")
- Adicionar `TableFooter` com linha de totalizacao somando todos os valores de custo

```typescript
<CardTitle className="text-base">Pecas Usadas</CardTitle>
// Headers: Peca | Qtd Consumida | Valor de Custo | Loja | OS | Tecnico | Data
// Footer: Total | - | R$ X.XXX,XX | - | - | - | -
```

---

### Alteracao 5: Quadro "Sobras para Devolucao" com auditoria (`src/pages/OSConsignacao.tsx`)

**Linhas 538-558** (view de Acerto): Substituir layout simples por Table com auditoria:

- Adicionar estado local: `const [confirmacoesDevolucao, setConfirmacoesDevolucao] = useState<Record<string, { usuario: string; dataHora: string }>>({});`
- Colunas: Peca | Loja | Qtd | Valor de Custo | Confirmacao
- Checkbox por item: ao marcar, registra `{ usuario: user.colaborador.nome, dataHora: new Date().toLocaleString('pt-BR') }`
- Exibir usuario e data/hora abaixo do checkbox quando confirmado

---

### Alteracao 6: Toast de devolucao atualizado (`src/pages/OSConsignacao.tsx`)

**Linha 188**: Atualizar mensagem do toast de devolucao:
```typescript
// ANTES
toast({ title: 'Devolvido', description: 'Item devolvido e removido do estoque' });

// DEPOIS
toast({ title: 'Devolvido', description: 'Item devolvido. Registro mantido no historico do estoque.' });
```

---

### Sequencia de Implementacao

1. `pecasApi.ts` - Flag de inicializacao + merge de arrays
2. `consignacaoApi.ts` - Import updatePeca, acerto marca Reservada, devolucao usa updatePeca
3. `OSPecas.tsx` - Remover badge duplicado, renomear filtro
4. `OSConsignacao.tsx` - Quadros refatorados com auditoria, toast atualizado

