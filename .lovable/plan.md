

## Corrigir Exibicao de Comprovantes na Conferencia Financeira para Assistencia

### Problema

1. Na tabela de Conferencia de Contas, quando a OS e de Assistencia, a coluna "Comprovante" mostra o nome do arquivo ao inves de exibir o badge "Contem Anexo" (como faz para vendas).
2. No painel lateral de detalhes, ao clicar na acao, nao aparece a miniatura do comprovante clicavel para expandir.

### Solucao

**Arquivo: `src/pages/FinanceiroConferencia.tsx`**

**Correcao 1 - Coluna da tabela (linhas 1213-1218):**
Remover a condicao que diferencia Assistencia de Venda. Ambos devem mostrar o badge "Contem Anexo" quando ha comprovante.

De:
```text
{linha.comprovante ? (
  linha.tipoOrigem === 'Assistência' ? (
    <ComprovantePreview ... />
  ) : (
    <Badge ...>Contém Anexo</Badge>
  )
) : ( <ComprovanteBadgeSemAnexo /> )}
```

Para:
```text
{linha.comprovante ? (
  <Badge ...>Contém Anexo</Badge>
) : ( <ComprovanteBadgeSemAnexo /> )}
```

**Correcao 2 - Painel lateral de detalhes (apos linha ~1316, dentro da secao de pagamentos):**
Adicionar uma secao que exibe os comprovantes de cada pagamento como miniaturas clicaveis usando o componente `ComprovantePreview` com `size="md"`. Isso permite ao financeiro ver e expandir o comprovante ao clicar.

A secao sera adicionada entre os "Itens da Venda" e a "Validacao de Pagamentos", exibindo:
- Titulo "Comprovantes de Pagamento"
- Para cada pagamento que tenha comprovante: miniatura clicavel (ComprovantePreview size="md") com o metodo de pagamento e valor
- Se nenhum comprovante existir: mensagem "Nenhum comprovante anexado"

