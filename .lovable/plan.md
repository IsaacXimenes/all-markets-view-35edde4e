

# Plano: Animacao de Login Simples + Regra de Origem Estoque SIA

## Parte 1: Animacao de Login - Fade Simples

Substituir toda a animacao biometrica (celular 3D, Face ID scan, expansao) por um fade out suave do card de login seguido de redirecionamento direto ao dashboard. Duracao total: ~0.8s.

### Arquivos alterados

**`src/components/login/BiometricTransition.tsx`**
- Remover toda a logica de fases (centering, scanning, expanding) e o componente Phone3D
- Substituir por um overlay branco simples que faz fade in e depois redireciona
- Timeline simplificada: fadeOut (300ms) -> complete (500ms) -> navigate

**`src/components/login/LoginCard.tsx`**
- Manter o fade out do card (`!showContent && 'opacity-0 scale-75'`)
- Continuar acionando `BiometricTransition` mas agora ele sera apenas um overlay de fade rapido

### Resultado
- O card de login faz fade out suave
- Um overlay branco aparece brevemente (~0.5s)
- O usuario e redirecionado ao dashboard
- Sem celular, sem Face ID, sem animacao complexa

---

## Parte 2: Regra de Origem Fixa - Estoque SIA

Todos os aparelhos cadastrados via Nota de Entrada devem ter como loja de origem fixa o "Estoque - SIA" (ID: `dcc6547f`), independente do tipo de pagamento (Pos, Parcial ou Antecipado).

### Pontos de intervencao

**1. `src/pages/FinanceiroConferenciaNotas.tsx`**
- Remover o campo `Select` de "Loja de Destino dos Produtos" do modal de pagamento
- Substituir por um campo read-only exibindo "Estoque - SIA" fixo
- Forcar `lojaDestino = ESTOQUE_SIA_LOJA_ID` automaticamente ao abrir o modal (importar a constante de `estoqueApi`)
- Remover a validacao `!lojaDestino` do botao (ja que sera automatico)
- Manter o localStorage salvando o valor para rastreabilidade

**2. `src/utils/notaEntradaFluxoApi.ts`**
- A funcao `migrarProdutosConferidosPorCategoria` ja usa `ESTOQUE_SIA_LOJA_ID` como default -- nenhuma alteracao necessaria aqui
- Garantir que quando chamada do fluxo "100% Antecipado" (conferencia no Estoque que finaliza direto), tambem use SIA

**3. `src/pages/EstoqueNotasUrgenciaPendentes.tsx`**
- Verificar e forcar `lojaDestino` para `ESTOQUE_SIA_LOJA_ID` na migracao de produtos de notas de urgencia

**4. `src/utils/osApi.ts` (deferimento de semi-novos)**
- A funcao `migrarProdutoPendente` usa `produto.loja` para definir a loja do produto no estoque final
- Como os produtos pendentes ja terao `loja = ESTOQUE_SIA_LOJA_ID` desde a entrada, o deferimento preservara automaticamente a loja SIA
- Nenhuma alteracao necessaria aqui

### Fluxo revisado

```text
Nota de Entrada (qualquer tipo de pagamento)
    |
    v
Aparelhos NOVOS --> migrarAparelhoNovoParaEstoque(loja: SIA) --> Estoque > Produtos (loja SIA)
    |
Aparelhos SEMI-NOVOS --> migrarProdutosNotaParaPendentes(loja: SIA) --> Estoque > Aparelhos Pendentes (loja SIA)
    |
    v  (apos deferimento)
    addProdutoMigrado(loja: SIA preservada) --> Estoque > Produtos (loja SIA)
```

### Resumo de arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/login/BiometricTransition.tsx` | Simplificar para fade simples (~0.8s), remover Phone3D e fases complexas |
| `src/components/login/LoginCard.tsx` | Ajustes menores de timing (se necessario) |
| `src/pages/FinanceiroConferenciaNotas.tsx` | Remover Select de loja destino, fixar ESTOQUE_SIA_LOJA_ID automaticamente |
| `src/pages/EstoqueNotasUrgenciaPendentes.tsx` | Forcar loja destino para SIA nas migracoes de urgencia |
