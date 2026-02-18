

## Redesign Completo da Tela de Login - "Portal Tecnologico"

### Visao Geral
Redesenhar toda a experiencia de login seguindo o mockup fornecido: card flutuante com lado esquerdo branco (logo + ilustracao) e lado direito preto (formulario), sobre um fundo de circuitos tecnologicos. Incluir animacao de sucesso "portal tecnologico" com Framer Motion.

### Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| `src/assets/login_screen_v2_thiago_imports.png` | Copiar imagem uploadada como background |
| `src/components/login/LoginCard.tsx` | Redesign completo do layout |
| `src/components/login/LoginForm.tsx` | Novo estilo dark com inputs e botao amarelo |
| `src/components/login/BiometricTransition.tsx` | Substituir por animacao "portal tecnologico" |
| `src/components/login/Phone3D.tsx` | Remover (substituido pela ilustracao do mockup) |

---

### 1. Background e Layout (LoginCard.tsx)

- Usar a imagem `login_screen_v2_thiago_imports.png` como background full-screen (`bg-cover bg-center`)
- Card centralizado com `rounded-3xl` e `shadow-2xl`
- Dividido em duas metades:
  - **Esquerda**: fundo `#FFFFFF`, contendo o logo oficial da Thiago Imports (`thiago-imports-logo.png`) e uma ilustracao de dispositivos tecnologicos (SVG inline ou imagem)
  - **Direita**: fundo `#111111`, contendo o formulario de login
- No mobile: mostrar apenas o lado direito (formulario) com fundo `#111111`

### 2. Formulario de Login (LoginForm.tsx)

- Fundo geral do painel: `#111111`
- Titulo "Bem-vindo" em branco, subtitulo em `#7F7F7F`
- Inputs com:
  - Fundo `#212121`
  - Texto branco
  - Placeholder em `#7F7F7F`
  - Borda transparente que brilha em `#F7BB05` no foco (`focus:border-[#F7BB05] focus:ring-[#F7BB05]/30`)
- Botao "Entrar":
  - Fundo `#F7BB05`, texto `#111111` em negrito
  - Hover com efeito glow: `hover:shadow-[0_0_20px_rgba(247,187,5,0.4)]`
- Link "Esqueceu a senha?" em `#7F7F7F`

### 3. Animacao de Sucesso - "Portal Tecnologico" (BiometricTransition.tsx)

Sequencia usando Framer Motion (`AnimatePresence` + `motion.div`):

1. **Pulse dourado no background** (0-300ms): o fundo de circuitos pulsa com `brightness(1.5)` e um overlay `#F7BB05` com opacidade animada
2. **Expansao do card** (200-800ms): o card escala de `scale(1)` para `scale(1.5)` enquanto `opacity` vai para 0
3. **Blur de transicao** (600-1200ms): `backdrop-blur` diminui gradualmente enquanto o Dashboard aparece por baixo
4. **Redirect** ao final da animacao (~1000ms)

No mobile: simplificar para fade-out suave (300ms) sem escala, mantendo performance.

### 4. Responsividade

- **Desktop/Tablet (>=768px)**: Card com dois paineis lado a lado
- **Mobile (<768px)**: Apenas painel direito (formulario) em tela cheia com fundo `#111111`, sem ilustracao
- Fonte Inter em todos os elementos

---

### Secao Tecnica

```text
Arquivos e mudancas:

1. Copiar imagem:
   - lov-copy user-uploads://login_screen_v2_thiago_imports.png -> src/assets/login_screen_v2_thiago_imports.png

2. LoginCard.tsx:
   - Remover import do login-background.jpg
   - Importar login_screen_v2_thiago_imports.png como bg
   - Remover componente Phone3D
   - Layout: flex row com lado esquerdo (bg-white, logo, ilustracao) e lado direito (bg-[#111111], LoginForm)
   - Adicionar estado de animacao com Framer Motion (AnimatePresence)
   - No sucesso: animar card com scale + opacity via motion.div
   - Animar background com brightness pulse

3. LoginForm.tsx:
   - Fundo transparente (herdado do painel #111111)
   - Inputs: bg-[#212121] text-white border-transparent focus:border-[#F7BB05]
   - Botao: bg-[#F7BB05] text-[#111111] font-bold hover:shadow-glow
   - Titulo: text-white
   - Subtitulo: text-[#7F7F7F]

4. BiometricTransition.tsx:
   - Usar Framer Motion para overlay animado
   - Fase 1: overlay #F7BB05/20 com opacity 0->0.3->0 (pulse)
   - Fase 2: backdrop-blur decrescente
   - Timer de 1000ms antes do navigate
   - Mobile: simples fade branco de 400ms

5. Phone3D.tsx:
   - Nao sera mais usado no login (manter arquivo por compatibilidade)
```
