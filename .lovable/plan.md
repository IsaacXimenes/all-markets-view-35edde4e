

## Filtrar Contas de Assistencia por Loja Especifica

### Problema

Atualmente, quando `apenasContasAssistencia` esta ativo, o filtro ignora o `lojaVendaId` e mostra TODAS as contas de assistencia de todas as lojas. O correto e mostrar apenas as contas da loja de assistencia onde a OS esta sendo feita.

### Solucao

Combinar os dois filtros: verificar que a conta pertence a loja (`lojaVinculada === lojaVendaId`) E que o nome contem "Assistencia".

**Exemplo pratico:**
- OS na "Assistencia - Shopping JK" (lojaId = `94dbe2b1`)
- Dropdown mostrara apenas:
  - CTA-012: Bradesco Assistencia (lojaVinculada: `94dbe2b1`)
  - CTA-022: Dinheiro - Assistencia JK Shopping (lojaVinculada: `94dbe2b1`)

### Detalhes Tecnicos

**Arquivo: `src/components/vendas/PagamentoQuadro.tsx` (linhas 849-854)**

Alterar a logica do filtro de:
```text
if (apenasContasAssistencia) {
  return nome inclui "assistencia"   // mostra TODAS as contas de assistencia
}
return lojaVinculada === lojaVendaId
```

Para:
```text
if (apenasContasAssistencia) {
  return lojaVinculada === lojaVendaId 
    AND (nome inclui "assistencia" OR nome inclui "assistência")
}
return lojaVinculada === lojaVendaId
```

Isso combina ambos os criterios: pertencer a loja correta E ser conta de assistencia.

