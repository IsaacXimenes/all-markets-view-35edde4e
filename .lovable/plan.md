
# Gerar Nota de Garantia em PDF

## Resumo

Implementar a geracao automatica de um PDF "Nota de Garantia" baseado no modelo fornecido (Thiago Imports - Feira dos Importados), acessivel a partir de um botao "Gerar Nota de Garantia" na tela de detalhes da venda (`VendaDetalhes.tsx`).

## Biblioteca

Sera utilizada a biblioteca **jsPDF** para geracao client-side do PDF, sem necessidade de backend. E leve, amplamente usada e suporta texto, tabelas e imagens.

## Estrutura do PDF (baseado no modelo)

O PDF segue o layout do modelo fornecido com as seguintes secoes:

1. **Cabecalho**: Logo Thiago Imports, "NOTA DE GARANTIA", numero, data, identificacao
2. **Emitente** (fixo): Thiago Imports, Feira dos Importados, Bloco D, Loja 433/434, Brasilia, CEP 71208-900, CNPJ 46.197.533/0001-06
3. **Destinatario**: Nome, CPF, Endereco, Bairro, Cidade, UF, CEP, Telefone, Email (do cliente da venda)
4. **Forma de Pagamento**: Tabela com descricao e valor de cada pagamento
5. **Frete**: Indica se tem entrega e endereco
6. **Dados dos Produtos**: Tabela com QTD, Descricao (produto + IMEI), Tipo (categoria), Valor
7. **Dados Adicionais**: Observacoes da venda
8. **Informacoes Complementares** (fixo): Texto de garantia de 1 ano
9. **Rodape**: Data e hora da impressao

## Detalhes Tecnicos

### 1. Instalar dependencia

- Adicionar `jspdf` ao projeto

### 2. Criar utilitario: `src/utils/gerarNotaGarantiaPdf.ts`

Funcao `gerarNotaGarantiaPdf(venda: Venda)` que:

- Recebe o objeto `Venda` completo
- Busca dados do cliente via `getClientes()` usando `venda.clienteId` para obter endereco, bairro, cidade, estado, CEP
- Monta o PDF com jsPDF usando coordenadas manuais para reproduzir o layout do modelo
- Dados do emitente sao fixos (Thiago Imports)
- Abre o PDF em nova aba via `window.open(pdf.output('bloburl'))`

Mapeamento dos campos:

| Campo na Nota | Origem no Sistema |
|---|---|
| No | `venda.numero` |
| DATA | `venda.dataHora` formatado |
| IDENTIFICACAO | `venda.id` |
| DATA DA EMISSAO | `venda.dataHora` |
| DATA DA SAIDA | `venda.dataHora` |
| NOME/RAZAO SOCIAL | `venda.clienteNome` |
| CNPJ/CPF | `venda.clienteCpf` |
| ENDERECO | `cliente.endereco + cliente.numero` |
| BAIRRO | `cliente.bairro` |
| MUNICIPIO | `cliente.cidade` ou `venda.clienteCidade` |
| UF | `cliente.estado` |
| CEP | `cliente.cep` |
| TELEFONE | `venda.clienteTelefone` |
| EMAIL | `venda.clienteEmail` |
| Forma Pagamento | `venda.pagamentos[].meioPagamento` e `valor` |
| Frete | baseado em `venda.tipoRetirada` e `venda.taxaEntrega` |
| Produtos QTD | `item.quantidade` |
| Produtos DESCRICAO | `item.produto + IMEI` |
| Produtos TIPO | `item.categoria` |
| Produtos VALOR | `item.valorVenda` |
| TOTAL | `venda.total` |
| DADOS ADICIONAIS | `venda.observacoes` |
| DATA HORA IMPRESSAO | `new Date()` formatado |

### 3. Alterar: `src/pages/VendaDetalhes.tsx`

- Importar `gerarNotaGarantiaPdf`
- Adicionar botao "Gerar Nota de Garantia" ao lado do botao "Imprimir Recibo" (visivel apenas fora do modo conferencia)
- O botao chama `gerarNotaGarantiaPdf(venda)` ao clicar

### 4. Layout do PDF

O PDF sera gerado em formato A4 retrato com:
- Bordas e linhas para separar secoes (como no modelo)
- Texto em caixa alta para cabecalhos de secao
- Tabela de produtos com colunas QTD, DESCRICAO, TIPO, VALOR
- Tabela de pagamentos com colunas DESCRICAO, VALOR
- Acessorios incluidos na lista de produtos com tipo "Acessorio"
- Texto fixo de garantia no rodape
