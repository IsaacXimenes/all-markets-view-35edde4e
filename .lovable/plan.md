
# Plano: Adicionar Responsividade à Tabela de Pendências - Base de Trocas

## Objetivo
Aplicar os mesmos padrões de responsividade e redimensionamento das outras telas de Estoque à aba "Pendências - Base de Trocas".

---

## Estado Atual

**EstoquePendenciasBaseTrocas.tsx (atual):**
- Cards de estatísticas: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Filtros: Div simples com `flex-col sm:flex-row`
- Tabela: Envolvida diretamente em `ScrollArea`

**EstoqueProdutosPendentes.tsx (referência):**
- Cards: `ResponsiveCardGrid` com Container Queries
- Filtros: `ResponsiveFilterGrid` 
- Tabela: `ResponsiveTableContainer` (wrapper com scroll horizontal sempre visível)

---

## Alterações Necessárias

### 1. Importar Componentes Responsivos

```typescript
import { ResponsiveCardGrid, ResponsiveFilterGrid, ResponsiveTableContainer } from '@/components/ui/ResponsiveContainers';
```

### 2. Cards de Estatísticas

**De:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
```

**Para:**
```tsx
<ResponsiveCardGrid cols={4} className="mb-6">
```

### 3. Área de Filtros

**De:**
```tsx
<Card className="mb-6">
  <CardContent className="p-4">
    <div className="flex flex-col sm:flex-row gap-4">
```

**Para:**
```tsx
<Card className="mb-6">
  <CardContent className="p-4">
    <ResponsiveFilterGrid cols={4}>
```

### 4. Container da Tabela

**De:**
```tsx
<Card>
  <CardContent className="p-0">
    <ScrollArea className="h-[600px]">
      <Table>
```

**Para:**
```tsx
<Card>
  <CardContent className="p-0">
    <ResponsiveTableContainer>
      <Table>
```

---

## Arquivo a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/EstoquePendenciasBaseTrocas.tsx` | Importar e aplicar `ResponsiveCardGrid`, `ResponsiveFilterGrid`, `ResponsiveTableContainer` |

---

## Benefícios

1. **Consistência visual** com as outras telas do módulo de Estoque
2. **Container Queries** garantem responsividade correta no Mobile Preview
3. **Scroll horizontal** sempre visível para facilitar navegação em dispositivos touch
4. **Manutenção simplificada** usando componentes padronizados do sistema
