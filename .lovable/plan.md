
# Plano: Tela de Login Minimalista com Celular 3D e Animacao Biometrica

## Visao Geral

Criar uma tela de login moderna para "Thiago Imports" que protege todo o sistema. Se nao autenticado, o usuario e redirecionado para `/login`. Apos autenticacao bem-sucedida, uma animacao de "desbloqueio biometrico" transiciona para o sistema.

---

## Arquitetura da Solucao

```text
src/
  store/
    authStore.ts                 # Store Zustand para autenticacao
  pages/
    Login.tsx                    # Pagina principal de login
  components/
    auth/
      ProtectedRoute.tsx         # Wrapper que protege rotas
    login/
      LoginCard.tsx              # Container dividido (esquerda/direita)
      Phone3D.tsx                # Smartphone 3D em CSS puro
      LoginForm.tsx              # Formulario com validacao
      BiometricTransition.tsx    # Overlay de animacao pos-login
```

---

## Fase 1: Infraestrutura de Autenticacao

### 1.1 Store de Autenticacao (Zustand)

**Arquivo:** `src/store/authStore.ts`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| isAuthenticated | boolean | Usuario esta logado |
| isAnimating | boolean | Animacao de transicao em andamento |
| user | object / null | Dados do usuario logado |
| login() | function | Valida credenciais e inicia animacao |
| logout() | function | Desloga e redireciona para /login |
| setAnimating() | function | Controla estado da animacao |

Persistencia: LocalStorage para manter sessao entre recarregamentos.

**Credenciais de Teste:**
- Usuario: `123`
- Senha: `123`

### 1.2 Componente ProtectedRoute

**Arquivo:** `src/components/auth/ProtectedRoute.tsx`

- Verifica se `isAuthenticated === true`
- Se nao: redireciona para `/login` via `<Navigate to="/login" />`
- Se sim: renderiza os filhos (children)

### 1.3 Atualizacao do App.tsx

- Adicionar rota `/login` (publica, sem protecao)
- Envolver TODAS as outras rotas com `<ProtectedRoute>`
- Estrutura:

```text
<Routes>
  <Route path="/login" element={<Login />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<Index />} />
    <Route path="/performance" element={<Performance />} />
    ... (todas as 80+ rotas existentes)
  </Route>
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## Fase 2: Tela de Login

### 2.1 Layout Visual

```text
+----------------------------------------------------------+
|                      FUNDO BRANCO                        |
|   +------------------------+  +------------------------+ |
|   |                        |  |                        | |
|   |   [Logo Thiago]        |  |   Welcome back         | |
|   |    THIAGO IMPORTS      |  |   Login your account   | |
|   |                        |  |                        | |
|   |   [   Smartphone 3D  ] |  |   ________________     | |
|   |        (flutuando)     |  |   Username             | |
|   |                        |  |   ________________     | |
|   |   "Sua plataforma de   |  |   Password             | |
|   |    gestao..."          |  |                        | |
|   |                        |  |   [ Login Button ]     | |
|   |                        |  |                        | |
|   |                        |  |   Forgot Password?     | |
|   +------------------------+  +------------------------+ |
|                                                          |
+----------------------------------------------------------+
```

### 2.2 Componente Phone3D (CSS Puro)

Smartphone realista criado apenas com CSS:
- Corpo do celular com gradiente metal/vidro
- Dynamic Island (notch superior)
- Tela com gradiente escuro
- Efeitos de reflexo e sombra 3D
- Animacao `float` (ja existe no tailwind.config.ts)

### 2.3 Componente LoginForm

- Campos: Username e Password (estilo linha inferior)
- Validacao com Zod (ja instalado)
- Botao gradiente preto (#333 -> #000)
- Link "Forgot Password?"

### 2.4 Paleta de Cores

| Elemento | Cor |
|----------|-----|
| Fundo geral | #FFFFFF |
| Card container | #FFFFFF com sombra sutil |
| Textos principais | #000000 |
| Textos secundarios | #666666 |
| Linhas de input | #E0E0E0 |
| Botao login | Gradiente #333333 -> #000000 |

---

## Fase 3: Animacao Biometrica Pos-Login

### 3.1 Sequencia de Animacao

```text
[Clique no Login] (credenciais validas)
       |
       v
[1] Formulario e textos fazem fade-out (0.3s)
       |
       v
[2] Celular move para o centro da tela e aumenta (0.5s)
       |
       v
[3] Animacao Face ID na tela do celular (1.2s)
    - Linha de scan vertical percorre a tela
    - Circulo pulsante no centro
       |
       v
[4] Tela do celular expande para preencher a viewport (0.8s)
       |
       v
[5] Dashboard aparece com fade-in suave (0.5s)
       |
       v
[Navegacao para / completa]
```

Duracao total: ~3.3 segundos

### 3.2 Componente BiometricTransition

- Overlay fixo que cobre toda a tela
- Controla as etapas via estados React
- Ao finalizar: chama navigate('/') e remove overlay

### 3.3 Novos Keyframes (tailwind.config.ts)

| Keyframe | Descricao |
|----------|-----------|
| scan-line | Linha vertical que desce pela tela do celular |
| face-id-pulse | Circulo que pulsa no centro |
| phone-center | Celular move para o centro e escala |
| screen-expand | Tela expande para preencher viewport |
| glow | Brilho suave antes da expansao |

---

## Fase 4: Responsividade

| Tamanho | Comportamento |
|---------|---------------|
| Desktop (>1024px) | Layout lado a lado 50/50 |
| Tablet (768-1024px) | Layout lado a lado 40/60 |
| Mobile (<768px) | Layout empilhado (celular acima, form abaixo) |

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/store/authStore.ts` | Store Zustand com persistencia |
| `src/pages/Login.tsx` | Pagina principal de login |
| `src/components/auth/ProtectedRoute.tsx` | Protetor de rotas |
| `src/components/login/LoginCard.tsx` | Container dividido |
| `src/components/login/Phone3D.tsx` | Smartphone 3D CSS |
| `src/components/login/LoginForm.tsx` | Formulario validado |
| `src/components/login/BiometricTransition.tsx` | Animacao pos-login |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Adicionar rota /login e proteger demais rotas |
| `tailwind.config.ts` | Adicionar keyframes da animacao biometrica |

---

## Fluxo de Usuario

```text
[Usuario acessa qualquer rota do sistema]
              |
              v
[ProtectedRoute verifica isAuthenticated]
              |
        +-----+-----+
        |           |
       Nao         Sim
        |           |
        v           v
[Redireciona    [Renderiza
 para /login]    pagina]
        |
        v
[Exibe tela de login]
        |
        v
[Usuario digita: 123 / 123]
        |
        v
[Clica em Login]
        |
        v
[Credenciais corretas?]
    |       |
   Sim     Nao
    |       |
    v       v
[Inicia    [Mostra erro:
 animacao]  "Credenciais invalidas"]
    |
    v
[Animacao biometrica (3s)]
    |
    v
[Navega para / - Dashboard]
```

---

## Recursos Existentes Utilizados

- Logo: `src/assets/thiago-imports-logo.png`
- Zustand: ja instalado para stores
- Zod: ja instalado para validacao
- Animacao float: ja existe no tailwind.config.ts
- React Router: ja configurado no projeto

---

## Credenciais de Acesso

| Campo | Valor |
|-------|-------|
| Usuario | `123` |
| Senha | `123` |

Quando backend real for implementado, basta substituir a funcao `login()` no authStore para validar contra o servidor.

---

## Consideracoes Tecnicas

1. **Performance:** Celular 3D criado com CSS transforms, sem bibliotecas 3D pesadas
2. **Persistencia:** LocalStorage mantem sessao entre recarregamentos
3. **Seguranca:** Validacao de inputs com Zod previne injecao
4. **Acessibilidade:** Contraste adequado (preto/branco), labels nos inputs
5. **UX:** Animacao total de ~3s para transicao fluida mas nao excessiva
