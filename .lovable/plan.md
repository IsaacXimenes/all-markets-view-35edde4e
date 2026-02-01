
# Plano Completo: Correção de Todas as Pendências de IDs no Sistema

## Diagnóstico Completo

Após análise extensiva do sistema, foram identificadas **4 categorias de pendências**:

---

## 1. CORREÇÃO IMEDIATA: Tela Nova Venda > Produtos Pendentes

### Problema Identificado
No modal de seleção de produtos em `src/pages/VendasNova.tsx`, a aba "Produtos Pendentes" exibe a coluna "Loja" com IDs antigos porque os dados mockados em `src/utils/osApi.ts` usam nomes literais como "Loja Centro", "Loja Shopping" que não existem no `useCadastroStore`.

### Arquivos Afetados
| Arquivo | Problema |
|---------|----------|
| `src/utils/osApi.ts` | Dados mockados com `loja: 'Loja Centro'`, `loja: 'Loja Shopping'`, etc. |

### Solução
Atualizar os dados mockados para usar UUIDs reais:

| Nome Antigo | UUID Real | Nome no Store |
|-------------|-----------|---------------|
| Loja Centro | `db894e7d` | Loja - JK Shopping |
| Loja Shopping | `3ac7e00c` | Loja - Matriz |
| Loja Norte | `5b9446d5` | Loja - Shopping Sul |
| Loja Sul | `0d06e7db` | Loja - Águas Lindas Shopping |

---

## 2. APIs COM IDs ANTIGOS (feedbackApi, motoboyApi, osApi)

### feedbackApi.ts
**Problema:** Dados mockados usam `COL-001`, `COL-002`, etc.

**Dados a Corrigir:**
| ID Antigo | UUID Real | Nome |
|-----------|-----------|------|
| COL-001 | `b467c728` | Anna Beatriz Borges |
| COL-002 | `7c1231ea` | Fernanda Gabrielle Ribeiro |
| COL-003 | `6dcbc817` | Caua Victor Costa dos Santos |
| COL-004 | `143ac0c2` | Antonio Sousa Silva Filho |
| COL-005 | `428d37c2` | Bruno Alves Peres |

### motoboyApi.ts
**Problema:** Dados mockados usam `COL-018`, `COL-019`.

**Solução:** Buscar colaboradores com cargo "Motoboy" no JSON mockado e usar seus UUIDs.

### osApi.ts (tratativas dentro de garantiasApi.ts)
**Problema:** `usuarioId: 'COL-001'` nos dados de tratativas.

---

## 3. CONSTANTE CRÍTICA: calculoComissaoVenda.ts

### Problema
Linha 20: `export const LOJA_ONLINE_ID = 'LOJA-ONLINE';`

Este ID **NÃO EXISTE** no `useCadastroStore`. O ID correto é `fcc78c1a`.

### Solução
```typescript
// ANTES:
export const LOJA_ONLINE_ID = 'LOJA-ONLINE';

// DEPOIS:
export const LOJA_ONLINE_ID = 'fcc78c1a'; // Loja - Online
```

Também migrar de `getLojaById` (cadastrosApi) para `useCadastroStore`:
```typescript
// ANTES:
import { getLojaById } from './cadastrosApi';

// DEPOIS:
// Como é um módulo utilitário, precisa receber a função como parâmetro
// ou usar uma abordagem diferente
```

---

## 4. MOCKS DE USUÁRIO LOGADO (8 páginas)

### Problema
8 páginas usam mock de `usuarioLogado` com IDs antigos.

### Arquivos Afetados
| Arquivo | ID Usado | Deve Ser |
|---------|----------|----------|
| `feedbackApi.ts` | `COL-002` | `7c1231ea` (Fernanda) |
| `FinanceiroConferencia.tsx` | Verificar | UUID real |
| `Vendas.tsx` | Verificar | UUID real |
| `RHAdiantamentos.tsx` | Verificar | UUID real |
| E outros 4 arquivos... | | |

---

## 5. USO LEGADO DE cadastrosApi

### Arquivos que ainda importam de cadastrosApi
- `src/utils/calculoComissaoVenda.ts` - `getLojaById`
- `src/pages/GarantiaExtendidaDetalhes.tsx`
- `src/pages/GarantiasNovaManual.tsx`
- `src/pages/GarantiasExtendida.tsx`
- `src/pages/GarantiasEmAndamento.tsx`
- E outros...

---

## Arquivos a Modificar

### Prioridade CRÍTICA (Afeta funcionalidade)
| Arquivo | Alteração |
|---------|-----------|
| `src/utils/osApi.ts` | Corrigir dados mockados de ProdutoPendente (loja) |
| `src/utils/calculoComissaoVenda.ts` | Corrigir LOJA_ONLINE_ID para `fcc78c1a` |

### Prioridade ALTA (IDs antigos visíveis)
| Arquivo | Alteração |
|---------|-----------|
| `src/utils/feedbackApi.ts` | Corrigir colaboradorId e gestorId nos dados mockados |
| `src/utils/motoboyApi.ts` | Corrigir motoboyId nos dados mockados |
| `src/utils/garantiasApi.ts` | Corrigir usuarioId nas tratativas |

### Prioridade MÉDIA (Mocks de usuário)
| Arquivo | Alteração |
|---------|-----------|
| `src/utils/feedbackApi.ts` | Corrigir `getUsuarioLogado()` |
| Verificar outras páginas | Corrigir mocks de usuário logado |

---

## Mapeamento Completo de IDs

### Lojas (UUIDs do JSON)
| UUID | Nome | Tipo |
|------|------|------|
| `db894e7d` | Loja - JK Shopping | Loja |
| `3ac7e00c` | Loja - Matriz | Loja |
| `fcc78c1a` | Loja - Online | Loja |
| `5b9446d5` | Loja - Shopping Sul | Loja |
| `0d06e7db` | Loja - Águas Lindas Shopping | Loja |
| `3cfbf69f` | Assistência - SIA | Assistência |
| `94dbe2b1` | Assistência - Shopping JK | Assistência |
| `ba1802b9` | Assistência - Shopping Sul | Assistência |
| `be961085` | Assistência - Águas Lindas | Assistência |

### Colaboradores (primeiros do JSON)
| UUID | Nome | Cargo |
|------|------|-------|
| `b467c728` | Anna Beatriz Borges | Gestor(a) |
| `143ac0c2` | Antonio Sousa Silva Filho | Vendedor(a) |
| `428d37c2` | Bruno Alves Peres | Vendedor(a) |
| `6dcbc817` | Caua Victor Costa dos Santos | Vendedor(a) |
| `4bfe3508` | Elida Franca de Souza | Técnico(a) |
| `b106080f` | Erick Guthemberg Ferreira da Silva | Vendedor(a) |
| `1b9137c8` | Evelyn Cordeiro de Oliveira | Vendedor(a) |
| `7c1231ea` | Fernanda Gabrielle Ribeiro | Financeiro |

---

## Ordem de Implementação

1. **osApi.ts** - Corrigir lojas nos Produtos Pendentes (resolve problema Nova Venda)
2. **calculoComissaoVenda.ts** - Corrigir LOJA_ONLINE_ID
3. **feedbackApi.ts** - Corrigir IDs de colaboradores e usuário logado
4. **motoboyApi.ts** - Corrigir IDs de motoboys
5. **garantiasApi.ts** - Corrigir IDs de usuários nas tratativas

---

## Benefícios da Correção

1. **Consistência Total** - Todas as referências usam UUIDs reais do `useCadastroStore`
2. **Eliminação de Erros** - Nomes exibidos corretamente em todas as tabelas
3. **Cálculo de Comissão** - Loja Online identificada corretamente para aplicar 6%
4. **Manutenibilidade** - Sistema pronto para integração futura com backend real
