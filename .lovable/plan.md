

# Plano: Draft na Consignacao + Correcao Conta Destino

## Problema 1: Contas de Destino nao aparecem no PagamentoQuadro

O filtro na linha 890 do `PagamentoQuadro.tsx` restringe as contas a `c.lojaVinculada === lojaVendaId`. Isso causa dois problemas:
- Contas "gerais" (loja_vinculada = `geral-dinheiro` ou `geral-assistencia`) nunca aparecem em vendas normais
- Quando `lojaVendaId` e passado mas nao coincide com nenhuma conta, a lista fica vazia

**Solucao:** Ajustar o filtro para tambem incluir contas com `lojaVinculada` do tipo "geral-dinheiro" em todos os contextos (exceto quando `apenasContasAssistencia` esta ativo). Isso garante que a conta "Dinheiro" (CTA-020) sempre apareca.

### Arquivo: `src/components/vendas/PagamentoQuadro.tsx`
- Alterar o filtro (linhas 886-891) para incluir contas "gerais" (geral-dinheiro) alem das contas da loja selecionada
- Manter o filtro `geral-assistencia` apenas quando `apenasContasAssistencia = true`

## Problema 2: Adicionar Draft (rascunho) na aba de Consignacao

Reutilizar o hook `useDraftVenda` existente para salvar automaticamente o rascunho do formulario de novo lote de consignacao.

### Arquivo: `src/pages/OSConsignacao.tsx`
- Importar `useDraftVenda`
- Instanciar com chave `draft-consignacao-novo-lote`
- Salvar rascunho automaticamente quando o usuario alterar fornecedor ou itens (via `useEffect` com debounce simples usando `useRef`)
- Ao entrar na tela "novo", verificar se existe rascunho e exibir um dialog perguntando se deseja restaurar
- Limpar rascunho ao criar o lote com sucesso
- Adicionar botao visual indicando que existe rascunho salvo (igual ao padrao de VendasNova)

### Detalhes do Draft
- Dados salvos: `novoFornecedor` e `novoItens` (descricao, modelo, quantidade, valorCusto, lojaDestinoId)
- Expiracao: 20 minutos (padrao do hook)
- Modal de restauracao aparece ao clicar em "Novo Lote" se houver rascunho

## Resumo de Arquivos

| Arquivo | Alteracao |
|---------|----------|
| `src/components/vendas/PagamentoQuadro.tsx` | Corrigir filtro de contas para incluir contas gerais |
| `src/pages/OSConsignacao.tsx` | Adicionar funcionalidade de draft ao cadastrar novo lote |

