

## Movimentacao de Pecas com Fluxo Completo (igual Estoque)

### Resumo

Alinhar a aba "Movimentacao de Pecas" (OS) com o mesmo fluxo do modulo de Estoque: ao registrar uma movimentacao, a peca fica marcada como "Em movimentacao" (bloqueada para uso), e so apos confirmacao de recebimento (com responsavel auto-preenchido) a peca muda fisicamente de loja.

---

### 1. Atualizar interface `Peca` (`src/utils/pecasApi.ts`)

Adicionar campos para controle de movimentacao:
- `statusMovimentacao?: 'Em movimentação' | null` - bloqueia a peca enquanto em transito
- `movimentacaoPecaId?: string` - referencia a movimentacao ativa

### 2. Atualizar interface `MovimentacaoPeca` na pagina (`src/pages/OSMovimentacaoPecas.tsx`)

Expandir a interface local `MovimentacaoPeca` com:
- `dataRecebimento?: string`
- `responsavelRecebimento?: string`

### 3. Logica de registro - marcar peca "Em movimentacao"

Ao registrar nova movimentacao (`handleRegistrar`):
- Buscar a peca via `getPecaById` e atualizar `statusMovimentacao = 'Em movimentação'` e `movimentacaoPecaId`
- Decrementar quantidade na loja de origem (ou apenas bloquear, mantendo quantidade)
- Filtrar pecas disponiveis para excluir as que estao `Em movimentação`

### 4. Confirmacao de recebimento com dialog (igual Estoque)

Substituir o `handleConfirmarRecebimento` simples por:
- Um `AlertDialog` com responsavel auto-preenchido (usuario logado, disabled)
- Ao confirmar:
  - Atualizar `peca.lojaId` para o destino da movimentacao
  - Limpar `peca.statusMovimentacao = null` e `peca.movimentacaoPecaId = undefined`
  - Registrar `dataRecebimento` e `responsavelRecebimento` na movimentacao

### 5. Modal de detalhes com timeline (igual Estoque)

Adicionar botao "Olhinho" (Eye) em cada linha da tabela para abrir modal de timeline com:
- Etapa 1: Envio registrado (origem, data, responsavel)
- Etapa 2: Recebimento (destino, data recebimento, responsavel recebimento ou "Pendente")
- Motivo da movimentacao

### 6. Edicao de movimentacoes pendentes

Adicionar botao "Editar" (Edit) nas movimentacoes com status Pendente:
- Modal para alterar destino e motivo
- Nao permitir edicao apos confirmacao

### 7. Filtro de pecas disponiveis

Atualizar o filtro de pecas no modal de busca para excluir pecas com `statusMovimentacao === 'Em movimentação'`, garantindo que nao sejam selecionadas para nova movimentacao ou uso em OS enquanto em transito.

---

### Detalhes Tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/utils/pecasApi.ts` | Adicionar `statusMovimentacao` e `movimentacaoPecaId` na interface `Peca`. Atualizar filtro em `getPecas` ou criar `getPecasDisponiveis`. |
| `src/pages/OSMovimentacaoPecas.tsx` | AlertDialog de confirmacao com responsavel auto-preenchido, modal de timeline (Eye), botao de edicao, marcacao "Em movimentacao" no registro, atualizacao de `lojaId` na confirmacao |

Nenhum arquivo novo sera criado. O fluxo replica fielmente o comportamento de `EstoqueMovimentacoes.tsx` adaptado para pecas (que usam quantidade ao inves de IMEI unico).

