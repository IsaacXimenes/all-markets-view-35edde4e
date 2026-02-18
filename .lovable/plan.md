

## Tratamento de Solicitacao de Peca Cancelada

### Objetivo
Quando uma solicitacao de peca individual tiver status `"Cancelada"`, exibir as mesmas opcoes de tratamento que ja existem para pecas de OS cancelada: "Devolver ao Fornecedor" ou "Reter para Estoque Proprio", com motivo obrigatorio e registro na timeline.

---

### Alteracoes

#### 1. `src/pages/OSSolicitacoesPecas.tsx`

Atualmente, a condicao para mostrar o destaque vermelho, o badge de alerta e o botao de tratamento e:
```
sol.osCancelada && sol.status !== 'Devolvida ao Fornecedor' && sol.status !== 'Retida para Estoque'
```

Expandir essa condicao para tambem incluir solicitacoes com `status === 'Cancelada'`:
```
(sol.osCancelada || sol.status === 'Cancelada') && sol.status !== 'Devolvida ao Fornecedor' && sol.status !== 'Retida para Estoque'
```

Locais afetados (4 pontos):
- **Linha ~440**: Destaque vermelho na linha da tabela
- **Linha ~479**: Badge "OS Cancelada" (ajustar texto para distinguir: se `sol.status === 'Cancelada'` mostrar "Solicitacao Cancelada", senao "OS Cancelada")
- **Linha ~524**: Botao de acao (icone de alerta laranja) - ajustar title para "Tratar Peca Cancelada"
- **Linha ~963**: Botao no modal de detalhes

Ajustar o titulo do modal (linha ~990) para ser dinamico:
- Se `sol.osCancelada`: "Tratar Peca de OS Cancelada"
- Se `sol.status === 'Cancelada'`: "Tratar Peca de Solicitacao Cancelada"

#### 2. `src/utils/solicitacaoPecasApi.ts`

A funcao `tratarPecaOSCancelada` atualmente verifica `if (!sol.osCancelada) return null`. Remover ou flexibilizar essa restricao para tambem aceitar solicitacoes com `status === 'Cancelada'`:

```typescript
if (!sol.osCancelada && sol.status !== 'Cancelada') return null;
```

Isso permite que a mesma funcao trate ambos os cenarios (OS cancelada e solicitacao cancelada individualmente).

---

### Resumo de Impacto

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/OSSolicitacoesPecas.tsx` | Expandir 4 condicoes para incluir `status === 'Cancelada'`, ajustar textos do badge e modal |
| `src/utils/solicitacaoPecasApi.ts` | Flexibilizar guarda da funcao `tratarPecaOSCancelada` |

