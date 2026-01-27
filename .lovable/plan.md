

# Plano: Adicionar Botoes de Navegacao (Setas) nas Abas dos Modulos

## Visao Geral

Este plano implementa botoes de navegacao com setas para esquerda e direita em todos os menus de abas dos modulos, facilitando a navegacao horizontal sem depender apenas da rolagem com scroll.

---

## Layouts a Modificar

Existem **8 layouts** que precisam ser atualizados:

| Layout | Arquivo | Quantidade de Abas |
|--------|---------|-------------------|
| Cadastros | `src/components/layout/CadastrosLayout.tsx` | 16 abas |
| Estoque | `src/components/layout/EstoqueLayout.tsx` | 9 abas |
| Financeiro | `src/components/layout/FinanceiroLayout.tsx` | 13 abas |
| Vendas | `src/components/layout/VendasLayout.tsx` | 7 abas |
| Garantias | `src/components/layout/GarantiasLayout.tsx` | 5 abas |
| OS | `src/components/layout/OSLayout.tsx` | 7 abas |
| RH | `src/components/layout/RHLayout.tsx` | 6 abas |
| Assistencia | `src/components/layout/AssistenciaLayout.tsx` | 7 abas |

---

## Design Visual

```text
ANTES:
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Lojas] [Clientes] [Colaboradores] [Fornecedores] [Origens...] ...        │
└─────────────────────────────────────────────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────────────────────────────────────────────┐
│ [<] [Lojas] [Clientes] [Colaboradores] [Fornecedores] [Origens...] ... [>] │
└─────────────────────────────────────────────────────────────────────────────┘
     │                                                                    │
     └── Botao Esquerda                                  Botao Direita ──┘
```

**Caracteristicas dos botoes:**
- Icones `ChevronLeft` e `ChevronRight` do lucide-react
- Fundo com hover state sutil
- Desabilitados quando nao ha mais conteudo para rolar
- Posicionados nas extremidades da barra de abas

---

## Componente Reutilizavel: TabsNavigation

Para evitar duplicacao de codigo, vamos criar um componente reutilizavel:

**Novo arquivo:** `src/components/layout/TabsNavigation.tsx`

```typescript
interface Tab {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface TabsNavigationProps {
  tabs: Tab[];
  size?: 'sm' | 'default';
}

export function TabsNavigation({ tabs, size = 'default' }: TabsNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const location = useLocation();

  // Detectar se pode rolar
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Funcoes de scroll
  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center gap-1">
      {/* Botao Esquerda */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0",
          !canScrollLeft && "opacity-30 cursor-not-allowed"
        )}
        onClick={scrollLeft}
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Area de Scroll */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-1 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab) => (...))}
      </div>

      {/* Botao Direita */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0",
          !canScrollRight && "opacity-30 cursor-not-allowed"
        )}
        onClick={scrollRight}
        disabled={!canScrollRight}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

---

## Logica de Navegacao

**Estados controlados:**
- `canScrollLeft` - boolean indicando se ha conteudo a esquerda
- `canScrollRight` - boolean indicando se ha conteudo a direita

**Eventos monitorados:**
- `onScroll` - atualiza os estados ao rolar
- `useEffect` com `ResizeObserver` - recalcula ao redimensionar a tela

**Comportamento:**
- Scroll suave de 200px por clique
- Botoes desabilitados quando nao ha mais conteudo
- Opacidade reduzida para indicar estado desabilitado

---

## Estilo CSS

Adicionar classe utilitaria para esconder a scrollbar nativa:

**Arquivo:** `src/index.css`

```css
/* Esconder scrollbar mas manter funcionalidade */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/layout/TabsNavigation.tsx` | **Criar** | Componente reutilizavel com botoes de navegacao |
| `src/index.css` | Modificar | Adicionar classe `.scrollbar-hide` |
| `src/components/layout/CadastrosLayout.tsx` | Modificar | Usar TabsNavigation |
| `src/components/layout/EstoqueLayout.tsx` | Modificar | Usar TabsNavigation |
| `src/components/layout/FinanceiroLayout.tsx` | Modificar | Usar TabsNavigation |
| `src/components/layout/VendasLayout.tsx` | Modificar | Usar TabsNavigation |
| `src/components/layout/GarantiasLayout.tsx` | Modificar | Usar TabsNavigation |
| `src/components/layout/OSLayout.tsx` | Modificar | Usar TabsNavigation |
| `src/components/layout/RHLayout.tsx` | Modificar | Usar TabsNavigation |
| `src/components/layout/AssistenciaLayout.tsx` | Modificar | Usar TabsNavigation |

---

## Exemplo de Uso nos Layouts

Cada layout sera simplificado para usar o novo componente:

**Antes (CadastrosLayout):**
```typescript
<div className="relative mb-6 border-b border-border">
  <div className="absolute left-0 ...gradient..." />
  <ScrollArea className="w-full whitespace-nowrap" type="always">
    <nav className="flex gap-1 pb-2 px-1">
      {tabs.map((tab) => (...))}
    </nav>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
  <div className="absolute right-0 ...gradient..." />
</div>
```

**Depois (CadastrosLayout):**
```typescript
<div className="mb-6 border-b border-border">
  <TabsNavigation tabs={tabs} size="sm" />
</div>
```

---

## Acessibilidade

- Botoes com `aria-label` descritivo
- Suporte a navegacao por teclado (Tab + Enter)
- Estados visuais claros para habilitado/desabilitado

---

## Responsividade

- Em telas pequenas: botoes ficam mais relevantes
- Em telas grandes: botoes podem ficar ocultos se todo conteudo couber
- Detecta automaticamente via `ResizeObserver`

---

## Resultado Esperado

Apos implementacao:

1. Todos os 8 layouts terao botoes de navegacao
2. Navegacao fluida com scroll suave de 200px por clique
3. Feedback visual claro quando nao ha mais conteudo
4. Codigo centralizado em um componente reutilizavel
5. Manutencao simplificada para futuras alteracoes

