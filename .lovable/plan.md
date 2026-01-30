
# Plano: Responsividade Completa para Mobile Preview

## Diagnóstico

Ao clicar em "Show mobile preview" (funcionalidade do Lovable que simula tela de ~390px), o sistema não está responsivo porque:

1. **Sidebar fixa ocupa espaço fixo** - A Sidebar tem `w-64` (256px) ou `w-16` (64px) e é `fixed`, mas o conteúdo principal usa `ml-64` (margin-left) que não é removido em telas pequenas
2. **Breakpoints baseados em viewport** - Os grids usam `sm:`, `md:`, `lg:` que são baseados no viewport, não no espaço disponível
3. **Não há comportamento mobile** - A sidebar deveria virar um Drawer (menu deslizante) em mobile, liberando 100% da largura para o conteúdo
4. **Tabelas não cabem** - As tabelas têm colunas demais para 390px e o scroll horizontal não aparece corretamente

---

## Solução

### 1. Sidebar Mobile (Sheet/Drawer)
Em telas menores que `md` (768px), a sidebar não deve ser fixa na tela. Deve:
- **Esconder por padrão** em mobile
- **Aparecer como Drawer** (slide-in da esquerda) ao clicar no botão hambúrguer
- **Fechar automaticamente** ao navegar

### 2. PageLayout/Dashboard Responsivo
- Em mobile: `ml-0` (sem margem) pois a sidebar está escondida
- Em desktop: manter `ml-64` ou `ml-16` conforme estado atual

### 3. Navbar com Botão Hambúrguer
- Adicionar botão hambúrguer (Menu icon) visível apenas em mobile
- Ao clicar, abre a sidebar como Sheet/Drawer

### 4. Cards e Filtros
- Usar `grid-cols-1` em mobile (uma coluna)
- Manter `auto-fit minmax()` para adaptar ao espaço disponível

### 5. Tabelas
- Garantir scroll horizontal visível
- Usar `min-w-[...]` para forçar overflow

---

## Implementação

### Arquivo 1: `src/components/layout/Sidebar.tsx`
**Mudanças:**
- Adicionar prop `isMobile` e `isOpen` para controle
- Em desktop: manter comportamento atual (fixed sidebar)
- Em mobile: renderizar dentro de um `Sheet` (drawer)

```text
// Nova lógica:
if (isMobile) {
  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetContent side="left" className="p-0 w-64">
        {/* Conteúdo da sidebar */}
      </SheetContent>
    </Sheet>
  );
}

// Desktop: sidebar normal
return (
  <aside className="...fixed...">
    ...
  </aside>
);
```

### Arquivo 2: `src/components/layout/PageLayout.tsx`
**Mudanças:**
- Usar `useIsMobile()` para detectar mobile
- Em mobile: `ml-0` (sem margem, sidebar é drawer)
- Em desktop: `ml-64` ou `ml-16`
- Passar props para Sidebar controlar Sheet

```tsx
const isMobile = useIsMobile();
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

// Em mobile, margem é 0
// Em desktop, margem depende do estado collapsed
const mainMargin = isMobile ? "ml-0" : (isSidebarCollapsed ? "ml-16" : "ml-64");
```

### Arquivo 3: `src/components/layout/Dashboard.tsx`
**Mudanças:**
- Mesma lógica do PageLayout (usar useIsMobile)
- Em mobile: `ml-0`
- Passar estado para Navbar e Sidebar

### Arquivo 4: `src/components/layout/Navbar.tsx`
**Mudanças:**
- Adicionar botão hambúrguer (Menu icon) visível em mobile
- Prop `onMenuClick` para abrir sidebar drawer
- Esconder ou ajustar GlobalSearch em mobile

```tsx
// Nova estrutura:
<header>
  <div className="flex items-center gap-2">
    {/* Botão hambúrguer - só em mobile */}
    {isMobile && (
      <Button variant="ghost" size="icon" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
    )}
    <GlobalSearch />
  </div>
  ...
</header>
```

### Arquivo 5: `src/pages/FinanceiroConferencia.tsx`
**Mudanças adicionais:**
- Garantir que grids de cards usem `grid-cols-1` como base
- Exemplo: `grid grid-cols-1 sm:grid-cols-2 md:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]`
- Filtros: em mobile, usar accordion ou empilhar verticalmente
- Tabela: já tem `min-w-[1100px]` e ScrollArea, verificar se funciona

### Arquivo 6: `src/hooks/useSidebarState.ts`
**Mudanças:**
- Em mobile, sempre retornar `isCollapsed = true` ou ignorar o estado
- Adicionar detecção automática de resize

---

## Arquivos a Modificar

| Arquivo | Mudança Principal |
|---------|-------------------|
| `src/components/layout/Sidebar.tsx` | Renderizar como Sheet em mobile |
| `src/components/layout/PageLayout.tsx` | `ml-0` em mobile, controlar estado do drawer |
| `src/components/layout/Dashboard.tsx` | Mesma lógica do PageLayout |
| `src/components/layout/Navbar.tsx` | Botão hambúrguer para abrir sidebar |
| `src/pages/FinanceiroConferencia.tsx` | Garantir grids responsivos |
| `src/hooks/useSidebarState.ts` | Considerar mobile no estado |

---

## Fluxo de Uso em Mobile

1. Usuário abre o app em mobile → Sidebar está **escondida**
2. Conteúdo ocupa **100% da largura**
3. Navbar tem botão **hambúrguer** (≡)
4. Ao clicar no hambúrguer → Sidebar abre como **Drawer** da esquerda
5. Ao clicar em um item do menu → Sidebar **fecha automaticamente** e navega
6. Cards ficam em **1 coluna**
7. Tabelas têm **scroll horizontal** visível

---

## Resultado Esperado

### Antes (problema atual):
- Sidebar fixa ocupa ~256px
- Conteúdo fica espremido em ~134px (390 - 256)
- Cards cortam, tabela não cabe

### Depois (responsivo):
- Sidebar vira drawer (oculta por padrão)
- Conteúdo ocupa 100% (~390px)
- Cards em 1 coluna, legíveis
- Tabela com scroll horizontal claro
- Botão hambúrguer para abrir menu

---

## Validação

1. Clicar em "Show mobile preview" no Lovable
2. Sidebar deve estar **oculta**
3. Ver botão **hambúrguer** no topo
4. Cards em **1 coluna**
5. Tabela com **scroll horizontal**
6. Clicar no hambúrguer → Sidebar abre como drawer
7. Navegar para outra aba → Sidebar fecha
