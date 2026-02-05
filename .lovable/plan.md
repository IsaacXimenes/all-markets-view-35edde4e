
# Plano: Correções nas Movimentações de Estoque

## Problemas Identificados

1. **Botão Scanner separado do "Buscar no Estoque"** - Na tela `EstoqueNovaMovimentacaoMatriz.tsx`, o botão "Escanear IMEI" está como botão separado (linha 243-251) em vez de estar dentro do modal de busca
2. **Loja não atualiza na aba Aparelhos** - O filtro em `EstoqueProdutos.tsx` usa `p.loja` (linha 65) em vez de considerar `p.lojaAtualId` que é atualizado pela movimentação matriz
3. **Colunas Origem/Destino com dados antigos** - Na tabela de `EstoqueMovimentacoes.tsx`, a função `getLojaNome` pode não estar resolvendo IDs corretamente se os dados antigos usam nomes em vez de IDs
4. **Scanner no modal de busca de produto** - Falta botão de câmera dentro do modal de busca em `EstoqueMovimentacoes.tsx`

---

## 1. Mover Scanner para Dentro do Modal (EstoqueNovaMovimentacaoMatriz.tsx)

**Antes:** Dois botões separados no header do card
**Depois:** Apenas botão "Buscar no Estoque", com scanner dentro do modal

### Alterações:
- Remover botão "Escanear IMEI" separado (linhas 243-251)
- Adicionar botão de câmera dentro do modal, ao lado do campo de busca
- O scanner ficará integrado no fluxo de busca

### Nova estrutura do modal:
```text
┌─────────────────────────────────────────────────────────────────┐
│ Selecionar Aparelhos - Estoque - SIA                            │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ ┌───────────────┐ │
│ │ 🔍 Buscar por IMEI ou modelo...           │ │ 📷 Escanear   │ │
│ └───────────────────────────────────────────┘ └───────────────┘ │
│                                                                 │
│ [Lista de produtos...]                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Corrigir Filtro de Loja em EstoqueProdutos.tsx

O problema está no filtro que não considera `lojaAtualId`:

**Linha 64-65 atual:**
```typescript
if (lojaFilter !== 'todas' && p.loja !== lojaFilter) return false;
```

**Correção:**
```typescript
// Usar lojaAtualId se existir (produto em movimentação matriz), senão usar loja original
const lojaEfetiva = p.lojaAtualId || p.loja;
if (lojaFilter !== 'todas' && lojaEfetiva !== lojaFilter) return false;
```

Também atualizar a exibição na tabela para mostrar a loja efetiva.

---

## 3. Atualizar Tabela de Movimentações - Aparelhos

Na tabela de `EstoqueMovimentacoes.tsx`, verificar se os dados antigos de `movimentacoes` usam IDs ou nomes, e garantir compatibilidade.

**Verificação na função `getLojaNome` (linhas 111-115):**
```typescript
const getLojaNome = (lojaIdOuNome: string) => {
  const loja = obterLojaById(lojaIdOuNome);
  if (loja) return loja.nome;
  return obterNomeLoja(lojaIdOuNome);
};
```

A função já tem fallback, mas os dados mockados de `movimentacoes` podem estar usando nomes em vez de IDs. Precisamos verificar e corrigir os dados mockados em `estoqueApi.ts`.

---

## 4. Adicionar Scanner no Modal de Busca de Produto (EstoqueMovimentacoes.tsx)

No modal "Buscar Produto no Estoque" (linhas 631-714), adicionar botão de câmera:

**Alterações:**
- Adicionar botão de câmera ao lado do input de busca
- Quando escanear um IMEI, popular o campo de busca automaticamente

### Nova estrutura:
```typescript
<div className="flex gap-2">
  <Input
    placeholder="Buscar por modelo, marca ou IMEI..."
    value={buscaProduto}
    onChange={(e) => setBuscaProduto(e.target.value)}
    className="flex-1"
  />
  <Button 
    variant="outline" 
    size="icon"
    onClick={() => setShowScannerModal(true)}
  >
    <Camera className="h-4 w-4" />
  </Button>
  {/* ... select de loja ... */}
</div>
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EstoqueNovaMovimentacaoMatriz.tsx` | Mover scanner para dentro do modal de busca |
| `src/pages/EstoqueProdutos.tsx` | Usar `lojaAtualId` no filtro e exibição |
| `src/pages/EstoqueMovimentacoes.tsx` | Adicionar scanner no modal de busca de produto |
| `src/utils/estoqueApi.ts` | Verificar dados mockados de movimentações (se usam IDs ou nomes) |

---

## Detalhes Técnicos

### Lógica de Loja Efetiva
```typescript
// Helper para obter a loja onde o produto está fisicamente
const getLojaFisica = (produto: Produto): string => {
  // lojaAtualId é preenchido quando produto foi transferido via Movimentação Matriz
  return produto.lojaAtualId || produto.loja;
};
```

### Integração do Scanner no Modal
O scanner já está funcional no componente `BarcodeScanner`. Apenas precisamos:
1. Adicionar state `showScannerModal` para controlar abertura
2. No callback `onScan`, popular o campo de busca com o IMEI lido
3. O filtro automático mostrará apenas o produto correspondente
