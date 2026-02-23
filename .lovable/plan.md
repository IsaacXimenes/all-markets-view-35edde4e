

# Correcoes: Valores Recomendados Trade-In, Conferencia de Lancamento e Comprovantes

## 4 problemas identificados

### 1. Botao "Usar" nos Valores Recomendados nao preenche o modelo

**Problema:** O callback `onUsarValor` recebe `(valor, modelo)` mas nas 3 paginas que usam (VendasNova, VendasEditar, VendasFinalizarDigital), apenas o `valor` e utilizado - o `modelo` e ignorado. Alem disso, a condicao tambem deveria ser preenchida automaticamente.

**Solucao:**
- Atualizar a interface `onUsarValor` no componente `ValoresRecomendadosTroca` para incluir a condicao: `onUsarValor?: (valor: number, modelo: string, condicao: 'Novo' | 'Semi-novo') => void`
- Atualizar o `onClick` para passar tambem `item.condicao`
- Nas 3 paginas (VendasNova, VendasEditar, VendasFinalizarDigital), atualizar o callback para preencher `modelo`, `valorCompraUsado` e `condicao` no `novoTradeIn`

**Arquivos:** `src/components/vendas/ValoresRecomendadosTroca.tsx`, `src/pages/VendasNova.tsx`, `src/pages/VendasEditar.tsx`, `src/pages/VendasFinalizarDigital.tsx`

### 2. Reposicionar tabela de Valores Recomendados acima do campo Modelo

**Problema:** A tabela de valores recomendados aparece no final do modal de trade-in, abaixo de todos os campos. Deveria aparecer primeiro, acima do campo de modelo, para que o usuario selecione o valor antes de preencher os campos.

**Solucao:**
- Mover o bloco `<ValoresRecomendadosTroca>` para antes do campo "Modelo" dentro do modal de trade-in
- Aplicar nas 3 paginas: VendasNova, VendasEditar e VendasFinalizarDigital

**Arquivos:** `src/pages/VendasNova.tsx`, `src/pages/VendasEditar.tsx`, `src/pages/VendasFinalizarDigital.tsx`

### 3. Conferencia de Lancamento: Ao clicar "Conferir", abrir tela de detalhamento em vez de modal

**Problema:** Ao clicar "Conferir" na conferencia de lancamento, abre um modal (`Dialog`) com o resumo. O usuario quer que abra a mesma tela de detalhamento (pagina completa) com a opcao de confirmar o lancamento.

**Solucao:**
- Alterar o botao "Conferir" na `VendasConferenciaLancamento` para navegar para uma rota de detalhamento, por exemplo `/vendas/${venda.id}`, passando state com `{ modoConferencia: true }`
- Na pagina `VendaDetalhes` (que ja existe), detectar o state `modoConferencia` e exibir botoes de "Confirmar Conferencia" e "Cancelar"
- Remover o modal de aprovacao (`modalAprovar`) da conferencia de lancamento

**Arquivos:** `src/pages/VendasConferenciaLancamento.tsx`, `src/pages/VendaDetalhes.tsx`

### 4. Comprovantes de pagamento visiveis nas 3 etapas de conferencia

**Problema:** Na tabela de Conferencia de Lancamento e Conferencia do Gestor, os comprovantes de pagamento registrados na venda nao sao exibidos com miniatura clicavel para expandir. Na Conferencia Financeira, aparece apenas um badge "Contem Anexo" sem miniatura.

**Solucao:**
- **Conferencia de Lancamento** (`VendasConferenciaLancamento.tsx`): Adicionar coluna "Comprovante" na tabela com `ComprovantePreview` (miniatura clicavel que expande a imagem ao clicar). Usar o componente `ComprovantePreview` ja existente.
- **Conferencia do Gestor** (`VendasConferenciaGestor.tsx`): Ja tem `ComprovantePreview` no `VendaResumoCompleto` dentro do painel lateral. Adicionar coluna na tabela principal tambem com miniatura.
- **Conferencia Financeira** (`FinanceiroConferencia.tsx`): Substituir o badge "Contem Anexo" pelo componente `ComprovantePreview` com miniatura, mantendo a funcionalidade de clique para expandir.

**Arquivos:** `src/pages/VendasConferenciaLancamento.tsx`, `src/pages/VendasConferenciaGestor.tsx`, `src/pages/FinanceiroConferencia.tsx`

## Resumo dos arquivos a modificar

| Arquivo | Alteracoes |
|---------|-----------|
| `src/components/vendas/ValoresRecomendadosTroca.tsx` | Passar `condicao` no callback |
| `src/pages/VendasNova.tsx` | Preencher modelo+condicao no "Usar", mover tabela para cima |
| `src/pages/VendasEditar.tsx` | Preencher modelo+condicao no "Usar", mover tabela para cima |
| `src/pages/VendasFinalizarDigital.tsx` | Preencher modelo+condicao no "Usar", mover tabela para cima |
| `src/pages/VendasConferenciaLancamento.tsx` | Navegar para detalhes em vez de modal, adicionar coluna comprovante |
| `src/pages/VendaDetalhes.tsx` | Suportar modo conferencia com botoes de aprovacao |
| `src/pages/VendasConferenciaGestor.tsx` | Adicionar coluna comprovante na tabela |
| `src/pages/FinanceiroConferencia.tsx` | Substituir badge por miniatura clicavel |

