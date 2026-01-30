
# Plano: Containers Responsivos Reutilizáveis

## Diagnóstico do Problema

### Por que o Painel funciona e o Estoque não:

1. **Dashboard (Painel)**:
   - Usa breakpoints explícitos: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`
   - Em viewport < 640px: **sempre 1 coluna** (sem depender do tamanho do container)
   - O conteúdo nunca ultrapassa o container

2. **EstoqueProdutos**:
   - Usa `auto-fit + minmax(240px, 1fr)`
   - Se o container tiver 390px, tenta encaixar 1 item de 240px
   - **Problema**: se o container real for menor que 240px (por causa de padding/margin), o conteúdo **vaza para fora**
   - O Grid CSS não consegue reduzir abaixo do `minmax` definido

### Conclusão:
O `auto-fit + minmax` é bom quando o container sempre tem pelo menos o tamanho mínimo. Mas no Mobile Preview ou quando há sidebar/padding, o espaço real pode ser menor e causa o "corte".

---

## Solução: Containers Responsivos Reutilizáveis

Vamos criar 3 componentes de container que garantem responsividade em qualquer situação:

### 1. `ResponsiveCardGrid` - Para cards de estatísticas
- Em telas pequenas: **1 coluna** (empilhados)
- Em telas médias: **2 colunas**
- Em telas grandes: **flexível até N colunas**
- Usa breakpoints explícitos (não depende do container)

### 2. `ResponsiveFilterGrid` - Para filtros
- Em telas pequenas: **1 coluna** (filtros empilhados)
- Em telas médias: **2-3 colunas**
- Em telas grandes: **auto-fit** flexível
- Botões sempre ocupam largura total em mobile

### 3. `ResponsiveTableContainer` - Para tabelas
- Scroll horizontal **sempre visível**
- Barra de scroll com contraste alto
- Container com largura limitada ao espaço disponível

---

## Arquivos a Criar

### `src/components/ui/ResponsiveContainers.tsx`

```tsx
// ResponsiveCardGrid - Para cards de estatísticas
// Props: cols (máximo de colunas em desktop)
// Breakpoints: 1 col → 2 cols → 3 cols → N cols

// ResponsiveFilterGrid - Para área de filtros
// Props: minWidth (largura mínima de cada filtro)
// Breakpoints: 1 col → 2 cols → 3 cols → auto-fit

// ResponsiveTableContainer - Para tabelas com scroll
// Garante scroll horizontal sempre visível
// Não depende do componente Table interno
```

---

## Implementação Detalhada

### ResponsiveCardGrid
```text
Classes:
- grid gap-3
- grid-cols-1 (mobile - sempre 1 coluna)
- sm:grid-cols-2 (tablet - 2 colunas)
- lg:grid-cols-3 (desktop médio - 3 colunas)
- xl:grid-cols-4 (desktop grande - 4 colunas)
```

### ResponsiveFilterGrid
```text
Classes:
- grid gap-3
- grid-cols-1 (mobile - sempre 1 coluna, filtros empilhados)
- sm:grid-cols-2 (tablet - 2 colunas)
- lg:grid-cols-3 (desktop - 3 colunas)
- xl:grid-cols-4 (desktop grande - 4 colunas)
```

### ResponsiveTableContainer
```text
Estrutura:
<div className="w-full overflow-hidden rounded-lg border">
  <div className="overflow-x-auto scrollbar-visible">
    {children} // a tabela vai aqui
  </div>
</div>

CSS adicional em index.css:
.scrollbar-visible::-webkit-scrollbar {
  height: 12px;
}
.scrollbar-visible::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}
.scrollbar-visible::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.5);
  border-radius: 6px;
}
```

---

## Aplicação no EstoqueProdutos

### Antes:
```tsx
<div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
  {/* Cards */}
</div>
```

### Depois:
```tsx
<ResponsiveCardGrid cols={4}>
  {/* Cards */}
</ResponsiveCardGrid>
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/ui/ResponsiveContainers.tsx` | **Criar** - 3 componentes de container |
| `src/index.css` | **Modificar** - Adicionar estilos de scrollbar visível |
| `src/pages/EstoqueProdutos.tsx` | **Modificar** - Usar os novos containers |

---

## Resultado Esperado

### Mobile (390px):
- **4 cards**: 1 por linha, empilhados verticalmente
- **Filtros**: 1 por linha, todos visíveis
- **Tabela**: scroll horizontal com barra visível

### Tablet (768px):
- **4 cards**: 2 por linha
- **Filtros**: 2 por linha
- **Tabela**: scroll se necessário

### Desktop (1280px+):
- **4 cards**: 4 por linha
- **Filtros**: 4 por linha
- **Tabela**: visível sem scroll ou com scroll conforme largura

---

## Vantagem dos Containers Reutilizáveis

1. **Consistência**: Todas as páginas terão o mesmo comportamento responsivo
2. **Manutenção**: Ajustes em um lugar afetam todo o sistema
3. **Previsibilidade**: Breakpoints explícitos sempre funcionam (não dependem de container query)
4. **Aplicação fácil**: Basta trocar o wrapper nas páginas existentes

---

## Próximos Passos após Aprovação

1. Criar `ResponsiveContainers.tsx` com os 3 componentes
2. Adicionar CSS de scrollbar em `index.css`
3. Atualizar `EstoqueProdutos.tsx` para usar os novos containers
4. Testar no Mobile Preview
5. Se funcionar, aplicar em todas as outras páginas do sistema
