
# Plano: Reestruturacao do Fluxo Fiado (Credito Flexivel)

## Visao Geral

Transformar o modelo de Fiado de "parcelas fixas com vencimento" para "credito flexivel com amortizacoes variaveis". A venda registra apenas o valor total e numero de vezes acordado; o financeiro recebe uma visao consolidada por divida com pagamentos livres.

---

## 1. Reestruturar a API (`src/utils/fiadoApi.ts`)

### Novas Interfaces

Substituir o modelo baseado em `ParcelaFiado` por dois novos tipos:

- **DividaFiado**: Registro consolidado da divida (vendaId, clienteId, clienteNome, lojaId, lojaNome, valorFinal, qtdVezes, tipoRecorrencia, inicioCompetencia, situacao: 'Em Aberto' | 'Quitado', dataCriacao)
- **PagamentoFiado**: Registro individual de amortizacao (id, dividaId, valor, dataPagamento, responsavel, comprovanteBase64?, comprovanteNome?)

### Novas Funcoes

- `getDividasFiado()`: Retorna todas as dividas
- `getPagamentosDivida(dividaId)`: Retorna historico de pagamentos de uma divida
- `registrarPagamentoFiado(dividaId, valor, responsavel, comprovante?)`: Registra pagamento, recalcula totais, quita automaticamente se valor pago >= valor final
- `criarDividaFiado(vendaId, clienteId, clienteNome, lojaId, lojaNome, valorFinal, qtdVezes, tipoRecorrencia)`: Cria registro de divida
- `getEstatisticasFiadoV2()`: Novas estatisticas (total em aberto, total quitado, valor pendente, valor recebido)

### Mock Data

Converter os dados existentes (4 vendas com parcelas) para o novo formato de dividas + pagamentos pre-existentes.

---

## 2. Simplificar Fiado no PagamentoQuadro (`src/components/vendas/PagamentoQuadro.tsx`)

### Remover

- Campo "Dia do Mes" (fiadoDataBase) para recorrencia Mensal
- Campo "Intervalo de Dias" para recorrencia Semanal
- Calculo automatico de valor por parcela (ex: "3x de R$ 500,00")

### Manter

- Valor Final (campo de valor ja existente)
- Tipo de Recorrencia (Mensal/Semanal) - apenas informativo
- Numero de Parcelas (qtd vezes acordada)

### Resultado

O bloco de campos Fiado (linhas 658-760) sera simplificado para apenas: Tipo de Recorrencia + Numero de Parcelas. O alerta amarelo sera atualizado para dizer "A divida sera enviada para Conferencia - Fiado no Financeiro".

---

## 3. Reescrever a Tela Financeiro Fiado (`src/pages/FinanceiroFiado.tsx`)

### Layout Consolidado (estilo RH Vales)

**Cards de Resumo** (topo):
- Total Em Aberto (quantidade + valor)
- Total Quitado (quantidade + valor)
- Total a Receber (soma saldo devedor)

**Filtros**: Cliente, Loja, Situacao (Em Aberto / Quitado / Todos)

**Tabela Principal** - colunas:
| Cliente | Valor Final | Valor Pago | Saldo Devedor | Progresso | Qtd. Vezes | Inicio Competencia | Situacao | Acoes |

- Progresso: componente `<Progress>` visual com percentual
- Situacao: Badge (Em Aberto = amarelo, Quitado = verde)
- Acoes: Botao olho (ver detalhes) + Botao cifrao (registrar pagamento, so se Em Aberto)

### Modal "Registrar Novo Pagamento"

- Data/Hora: auto-preenchido, read-only
- Responsavel: auto-preenchido com usuario logado (authStore)
- Valor de Pagamento: campo numerico livre (mascara monetaria)
- Anexo (Comprovante): componente `FileUploadComprovante` existente (Base64 temporario)
- Botao Confirmar: registra pagamento, recalcula saldo, quita automaticamente se necessario

### Quadro de Historico de Pagamentos

Ao clicar no olho de uma divida, exibe abaixo da tabela (ou em modal) o historico:
| Data do Pagamento | Valor Pago | Responsavel | Anexo |

---

## 4. Ajuste nos Dados Mock de Vendas (`src/utils/vendasApi.ts`)

Nenhuma alteracao necessaria na interface `Pagamento` -- os campos `fiadoNumeroParcelas` e `fiadoTipoRecorrencia` ja existem e serao mantidos para referencia. A criacao da divida no financeiro sera feita via mock data pre-existente na nova API.

---

## Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/utils/fiadoApi.ts` | Reescrever: novas interfaces (DividaFiado, PagamentoFiado), novas funcoes, mock data convertido |
| `src/components/vendas/PagamentoQuadro.tsx` | Simplificar bloco Fiado (remover dia vencimento, calculo parcela) |
| `src/pages/FinanceiroFiado.tsx` | Reescrever: tabela consolidada por divida, modal pagamento flexivel, historico |
