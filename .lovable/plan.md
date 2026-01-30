
# Plano: Layout Verdadeiramente Responsivo (Container-Based)

## Diagnóstico do Problema Real

### Por que os breakpoints não funcionam no Mobile Preview:

```text
┌─────────────────────────────────────────────┐
│  Seu Monitor (viewport 1920px)              │
│  ┌───────────────────────────────────────┐  │
│  │  Lovable Interface                    │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  Mobile Preview (iframe ~400px) │  │  │
│  │  │                                 │  │  │
│  │  │  Tailwind vê: viewport=1920px   │  │  │
│  │  │  Aplica: lg:grid-cols-4 ❌      │  │  │
│  │  │                                 │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

O Tailwind usa **media queries de viewport**, não do container. Por isso `sm:`, `lg:`, `xl:` **ignoram** o tamanho real do container no Mobile Preview.

### Solução: CSS Container Queries

CSS Container Queries permitem que elementos respondam ao tamanho do **container pai**, não do viewport:

```text
┌─────────────────────────────────────────────┐
│  Container pai (400px)                      │
│  Container Query: @container (max-width:400px) │
│  Resultado: 1 coluna ✅                     │
└─────────────────────────────────────────────┘
```

---

## Mudanças Planejadas

### 1. Atualizar `ResponsiveContainers.tsx` com Container Queries

Vou reescrever os 3 componentes para usar container queries nativas do CSS (suportadas em todos os navegadores modernos desde 2023):

**ResponsiveCardGrid:**
- Container pai com `container-type: inline-size`
- Regras CSS com `@container` ao invés de media queries
- Fallback: se container query não suportado, usa 1 coluna

**ResponsiveFilterGrid:**
- Mesmo approach
- Filtros empilham automaticamente quando container < 500px

**ResponsiveTableContainer:**
- Scroll horizontal nativo sempre visível
- Barra com alto contraste

### 2. Adicionar CSS de Container Queries em `index.css`

```css
/* Container Queries para grids responsivos */
.responsive-card-container {
  container-type: inline-size;
}

.responsive-card-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr; /* default: 1 coluna */
}

@container (min-width: 500px) {
  .responsive-card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@container (min-width: 768px) {
  .responsive-card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@container (min-width: 1024px) {
  .responsive-card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 3. Atualizar `EstoqueProdutos.tsx`

- Usar os novos containers atualizados
- Garantir que o wrapper principal não corta conteúdo
- Filtros em layout flexível com wrap

### 4. Corrigir margem direita no `PageLayout.tsx`

O problema de margem cortada vem do padding do container + overflow. Vou:
- Garantir `max-w-full` no container
- Remover qualquer `overflow-hidden` desnecessário nos wrappers

---

## Detalhes Técnicos

### Novo `ResponsiveContainers.tsx`

```tsx
// ResponsiveCardGrid - Usa container queries
export function ResponsiveCardGrid({ children, className, cols = 4 }) {
  return (
    <div className="responsive-card-container w-full">
      <div className={cn(
        "responsive-card-grid", 
        `responsive-card-grid--cols-${cols}`,
        className
      )}>
        {children}
      </div>
    </div>
  )
}

// ResponsiveFilterGrid - Usa container queries  
export function ResponsiveFilterGrid({ children, className }) {
  return (
    <div className="responsive-filter-container w-full">
      <div className={cn("responsive-filter-grid", className)}>
        {children}
      </div>
    </div>
  )
}

// ResponsiveTableContainer - Scroll nativo sempre visível
export function ResponsiveTableContainer({ children, className }) {
  return (
    <div className={cn("w-full overflow-hidden rounded-lg border", className)}>
      <div className="overflow-x-auto scrollbar-visible -webkit-overflow-scrolling-touch">
        {children}
      </div>
    </div>
  )
}
```

### CSS em `index.css`

```css
/* Container Queries - Cards */
.responsive-card-container {
  container-type: inline-size;
  width: 100%;
}

.responsive-card-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@container (min-width: 480px) {
  .responsive-card-grid { grid-template-columns: repeat(2, 1fr); }
}

@container (min-width: 720px) {
  .responsive-card-grid--cols-3,
  .responsive-card-grid--cols-4,
  .responsive-card-grid--cols-5,
  .responsive-card-grid--cols-6 { 
    grid-template-columns: repeat(3, 1fr); 
  }
}

@container (min-width: 960px) {
  .responsive-card-grid--cols-4,
  .responsive-card-grid--cols-5,
  .responsive-card-grid--cols-6 { 
    grid-template-columns: repeat(4, 1fr); 
  }
}

/* Container Queries - Filtros */
.responsive-filter-container {
  container-type: inline-size;
  width: 100%;
}

.responsive-filter-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@container (min-width: 400px) {
  .responsive-filter-grid { grid-template-columns: repeat(2, 1fr); }
}

@container (min-width: 640px) {
  .responsive-filter-grid { grid-template-columns: repeat(3, 1fr); }
}

@container (min-width: 880px) {
  .responsive-filter-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Itens que ocupam linha inteira */
.responsive-filter-grid .col-span-full {
  grid-column: 1 / -1;
}

/* Scrollbar sempre visível para tabelas */
.scrollbar-visible {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
}

.scrollbar-visible::-webkit-scrollbar {
  height: 14px;
  display: block !important;
}

.scrollbar-visible::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 7px;
}

.scrollbar-visible::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.5);
  border-radius: 7px;
  border: 2px solid hsl(var(--muted));
}

.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.7);
}
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/ui/ResponsiveContainers.tsx` | **Reescrever** - Usar container queries |
| `src/index.css` | **Adicionar** - CSS de container queries |
| `src/pages/EstoqueProdutos.tsx` | **Ajustar** - Usar novos containers + corrigir estrutura |

---

## Resultado Esperado

### Mobile Preview (~400px):
- **4 cards**: 1 por linha, empilhados verticalmente ✅
- **Filtros**: 1-2 por linha, todos visíveis ✅
- **Botão Limpar**: Visível, ocupando largura total ✅
- **Tabela**: Scroll horizontal com barra visível ✅
- **Margem direita**: Sem corte ✅

### Tablet (~768px):
- **4 cards**: 2-3 por linha
- **Filtros**: 2-3 por linha
- **Tabela**: Scroll se necessário

### Desktop (~1280px+):
- **4 cards**: 4 por linha
- **Filtros**: 4+ por linha
- **Tabela**: Visível ou scroll conforme largura

---

## Vantagem das Container Queries

1. **Funciona no Mobile Preview**: Responde ao tamanho real do container, não do viewport
2. **Verdadeiramente responsivo**: Ao redimensionar a janela, adapta imediatamente
3. **Independente de pixel específico**: Não depende de breakpoints fixos
4. **Compatibilidade**: Suportado em Chrome 105+, Firefox 110+, Safari 16+ (desde 2023)
5. **Fallback seguro**: Se não suportado, mostra 1 coluna (funcional)

---

## Próximos Passos após Aprovação

1. Reescrever `ResponsiveContainers.tsx` com container queries
2. Adicionar CSS de container queries em `index.css`
3. Atualizar `EstoqueProdutos.tsx` para usar os novos containers
4. Testar no Mobile Preview
5. Se funcionar, documentar e aplicar em todo o sistema
