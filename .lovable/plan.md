

## Restyling da Sidebar - Visual Premium Thiago Imports

### Resumo

Transformar a sidebar atual em um visual premium e tecnologico, com fundo preto (#111111), padrao de circuitos sutil usando a imagem existente (`login_screen_v2_thiago_imports.png`), e esquema de cores amarelo (#F7BB05) para itens ativos.

---

### 1. Fundo com Padrao de Circuitos

**Arquivo: `src/components/layout/Sidebar.tsx`**

- No `<aside>` (desktop) e no `<SheetContent>` (mobile), aplicar:
  - `background-color: #111111` (substituir `bg-sidebar`).
  - Adicionar um pseudo-elemento `::before` via uma div overlay posicionada absolutamente com:
    - A imagem `login_screen_v2_thiago_imports.png` como background.
    - `background-size: cover`, `background-position: center`.
    - `opacity: 0.08` (bem sutil para nao atrapalhar leitura).
    - `pointer-events: none` para nao bloquear cliques.

---

### 2. Estilizacao dos Itens de Menu

**Arquivo: `src/components/layout/Sidebar.tsx`**

- **Texto/icone padrao**: Cor branca (`text-white` ou `text-[#E0E0E0]`).
- **Item ativo**:
  - Remover o `bg-primary` atual azul.
  - Texto e icone em amarelo `text-[#F7BB05]`.
  - Borda esquerda de 4px amarela (`border-l-4 border-[#F7BB05]`).
  - Fundo sutil: `bg-[#F7BB05]/10`.
  - Remover o `animate-pulse` do icone ativo (substituir por brilho estatico).
- **Hover (nao ativo)**:
  - `hover:bg-[#212121]` ou `hover:bg-[#F7BB05]/10`.
  - Texto permanece branco.
- **Indicador lateral**: Substituir a barra branca atual por `border-l-4 border-[#F7BB05]` no proprio link, removendo a div absoluta.

---

### 3. Cabecalho e Rodape

**Arquivo: `src/components/layout/Sidebar.tsx`**

- Titulo "Navegacao": cor branca `text-white`.
- Borda inferior do cabecalho: `border-[#222222]` (sutil no fundo preto).
- Botao de toggle (chevron): `text-white hover:text-[#F7BB05]`.
- Rodape "Status da Loja": fundo `bg-[#1a1a1a]`, texto `text-[#E0E0E0]`.

---

### 4. Variaveis CSS (opcional)

**Arquivo: `src/index.css`**

- Atualizar as variaveis `--sidebar-*` para refletir a nova paleta:
  - `--sidebar-background`: manter ou ajustar para `#111111`.
  - `--sidebar-accent`: ajustar para `#212121`.
  - As cores amarelas serao aplicadas diretamente via classes Tailwind nos itens ativos, sem criar nova variavel.

---

### Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/layout/Sidebar.tsx` | Fundo #111111, overlay de circuitos com opacidade 0.08, itens ativos amarelo #F7BB05 com border-left, hover escuro, remover animate-pulse |
| `src/index.css` | Ajustar variaveis --sidebar-background e --sidebar-accent para a nova paleta |

