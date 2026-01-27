

# Plano: Transformar Busca Global em Lista Suspensa (Dropdown)

## Problema Atual

A busca atual usa um **Dialog centralizado** (modal no meio da tela), que:
- Bloqueia a visao do conteudo
- Tem uma selecao visual confusa
- Nao se comporta como uma busca tradicional

## Solucao: Popover com Lista Suspensa

Vamos trocar a implementacao de `CommandDialog` para um **Popover** que abre diretamente abaixo do campo de busca, como um dropdown/autocomplete tradicional.

```text
ANTES (Modal centralizado):
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    ┌──────────────────────┐                   │
│                    │  🔍 Buscar...        │                   │
│                    ├──────────────────────┤                   │
│                    │  Navegacao           │                   │
│                    │  Acoes Rapidas       │                   │
│                    └──────────────────────┘                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘

DEPOIS (Dropdown abaixo do campo):
┌────────────────────────────────────────────────────────────────┐
│  [🔍 Buscar no sistema...           ⌘K]                        │
│  ┌──────────────────────────────────────┐                      │
│  │  NAVEGACAO                           │                      │
│  │  🏠 Painel                           │                      │
│  │  👥 Recursos Humanos                 │                      │
│  │  💰 Financeiro                       │                      │
│  ├──────────────────────────────────────┤                      │
│  │  ACOES RAPIDAS                       │                      │
│  │  ➕ Nova Venda                       │                      │
│  │  ➕ Nova OS                          │                      │
│  └──────────────────────────────────────┘                      │
└────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/layout/GlobalSearch.tsx` | Modificar | Trocar CommandDialog por Popover + Command |

---

## Mudancas Tecnicas

### 1. Trocar Dialog por Popover

```typescript
// ANTES
import { CommandDialog, ... } from '@/components/ui/command';

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput />
  <CommandList>...</CommandList>
</CommandDialog>

// DEPOIS
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, ... } from '@/components/ui/command';

<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button>🔍 Buscar no sistema...</Button>
  </PopoverTrigger>
  <PopoverContent className="w-[400px] p-0" align="start">
    <Command>
      <CommandInput />
      <CommandList>...</CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

### 2. Estilizacao do Dropdown

- Largura fixa de 400px (ou igual ao trigger)
- Alinhamento `align="start"` para ficar alinhado a esquerda
- Padding zero (`p-0`) para o Command ocupar todo o espaco
- Borda e sombra sutis
- Altura maxima com scroll

### 3. Campo de Busca Integrado

- Input fica dentro do Popover
- Placeholder: "Buscar modulos, acoes, lojas..."
- Auto-focus ao abrir

### 4. Comportamento

- Abre ao clicar no botao de busca
- Abre ao pressionar Cmd+K / Ctrl+K
- Fecha ao selecionar um item
- Fecha ao clicar fora
- Fecha ao pressionar Escape

---

## Estrutura Visual do Dropdown

```text
┌─────────────────────────────────────────────────────┐
│  🔍 Buscar modulos, acoes, lojas...                 │
├─────────────────────────────────────────────────────┤
│  NAVEGACAO                                          │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🏠  Painel                                   │   │
│  │ 👥  Recursos Humanos                         │   │
│  │ 💰  Financeiro                               │   │
│  │ 📦  Estoque                                  │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  ACOES RAPIDAS                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ ➕  Nova Venda                               │   │
│  │     Iniciar uma nova venda                   │   │
│  │ ➕  Nova OS                                  │   │
│  │     Abrir ordem de servico                   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Vantagens da Lista Suspensa

1. **Contexto Visual** - Usuario continua vendo a pagina atual
2. **Posicao Natural** - Dropdown aparece onde o usuario esta olhando
3. **Comportamento Familiar** - Igual a buscas de outros sistemas (Google, VS Code)
4. **Menos Intrusivo** - Nao bloqueia toda a tela
5. **Selecao Clara** - Hover e selecao bem definidos visualmente

---

## Detalhes de Implementacao

### Estilos do PopoverContent
- `w-[400px]` - Largura fixa
- `p-0` - Sem padding para Command ocupar tudo
- `border border-border` - Borda visivel
- `shadow-lg` - Sombra para destaque
- `bg-popover` - Fundo solido (nao transparente)

### Estilos dos Itens
- Hover: `bg-accent/80` - Destaque suave
- Selecionado: `bg-accent` - Destaque forte
- Padding adequado para nao cortar texto
- Gap entre icone e texto

### Responsividade
- Em telas pequenas: dropdown ocupa largura do trigger
- Em telas grandes: largura fixa de 400px

