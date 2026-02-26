

## Plano de Ajustes - Vendas, Financeiro e Cadastros

### 1. Vendas: Modal de Troca - Validacao de IMEI com Anexo Obrigatorio

**Arquivo:** `src/pages/VendasNova.tsx`

**1.1 Anexo obrigatorio ao validar IMEI:**
- Ao marcar o checkbox "IMEI Validado" (linha ~3228), abrir condicionalmente um campo de upload para a tela de consulta policial.
- Adicionar estado `anexoConsultaIMEI` (base64 + nome) no modal de trade-in.
- Exibir icone de cadeado (Lock do lucide-react) ao lado do label "IMEI Validado".
- Texto descritivo: "Campo proprio para anexar a tela de consulta da Policia - TELA de Consulta do IMEI".
- O campo de upload segue o padrao `FileUploadComprovante` ja usado no projeto.
- Bloquear o botao "Adicionar" se `imeiValidado === true` e nao houver anexo.

**1.2 Alerta de prazo para "Aparelho com o cliente":**
- Na secao existente de "Com o Cliente" (linha ~3081), adicionar um alerta visual (banner amarelo/laranja):
  - Texto: "OBS.: A partir de 24 horas ira comecar a contar o vale, ate retorno do aparelho."
- Posicionar logo abaixo do alerta existente sobre Termo de Responsabilidade.

### 2. Vendas: Regra de Comissao

**Arquivo:** `src/utils/calculoComissaoVenda.ts` (ja esta correto - 6% Online, 10% demais)

**Arquivo:** `src/utils/comissoesApi.ts`
- A funcao `calcularComissaoVenda` nesta API usa percentual individual do colaborador (randomizado 5-15%). Precisa ser ajustada para respeitar a regra fixa: 10% para lojas fisicas, 6% para Online.
- Alterar `calcularComissaoVenda` para receber `lojaVendaId` e usar a logica de `calculoComissaoVenda.ts` (verificando se eh loja online via `LOJA_ONLINE_ID`).
- Remover a geracao aleatoria de percentuais na inicializacao.

### 3. Nota de Garantia (PDF)

**Arquivo:** `src/utils/gerarNotaGarantiaPdf.ts`

**3.1 Motoboy padronizado:**
- Na funcao `getNomeMotoboy`, substituir a resolucao do nome individual por um texto fixo: `"Motoboy Thiago Imports"`.
- Basta alterar o retorno da funcao para sempre retornar esse texto quando houver motoboyId.

**3.2 Tipo "Apple" substituido por "Aparelho":**
- Na linha ~396, o campo `item.categoria` ja tem fallback `'Aparelho'`. Basta forcar o valor para `'Aparelho'` ignorando `item.categoria` quando este for `'Apple'`.
- Logica: `(item.categoria === 'Apple' ? 'Aparelho' : item.categoria) || 'Aparelho'`.

### 4. Historico de Vendas: Auditoria de Margem (Trade-In)

**Arquivo:** `src/pages/Vendas.tsx`

- Adicionar coluna "Status Compra" na tabela de vendas (apos "Base de Troca"), visivel apenas quando a venda tem trade-in.
- Para cada venda com trade-in:
  - Buscar o valor recomendado via `getValorRecomendado(trade.modelo)` da API `valoresRecomendadosTrocaApi`.
  - Comparar `trade.valorCompraUsado` vs `valorSugerido`.
  - Se Valor Pago > Recomendado: icone de exclamacao vermelho (AlertTriangle) + tooltip com a diferenca.
  - Se Valor Pago <= Recomendado: icone check verde (Check).
- Importar `getValorRecomendado` de `valoresRecomendadosTrocaApi`.

### 5. Financeiro: Conferencia do Gestor

**Arquivo:** `src/pages/VendasConferenciaGestorDetalhes.tsx`

**5.1 Renomear "Trade-In" para "Troca de Nota":**
- Linha 141: titulo do card "Trade-In" para "Troca de Nota".
- Linha 190: label "Trade-In:" no resumo financeiro para "Troca de Nota:".

**5.2 Observacao fantasma:**
- Linha 230: adicionar verificacao de conteudo real antes de exibir:
  - `{evento.observacao && evento.observacao.trim() && (...)}`.

### 6. Financeiro: Extrato por Conta - Coluna de Log (Data/Hora)

**Arquivo:** `src/pages/FinanceiroExtratoContas.tsx`

- Na tabela de movimentacoes do modal de detalhes (linha ~736):
  - Adicionar coluna "Log (Data/Hora)" que exibe o timestamp completo (data + hora + minuto + segundo) da movimentacao.
  - O campo `mov.data` ja contem o ISO string. Formatar: `new Date(mov.data).toLocaleString('pt-BR')`.
  - A coluna "Data" existente mostra apenas a data (dd/MM/yyyy), a nova coluna "Log" mostra o horario exato.

### 7. Cadastros: Colaboradores - Toggle de Status (Habilitar/Desabilitar)

**Arquivo:** `src/pages/CadastrosColaboradores.tsx`

- Na coluna "Status" da tabela (linha ~494), substituir o Badge estatico por um componente Switch interativo.
- Ao alternar o toggle:
  - Chamar `atualizarColaborador(col.id, { ativo: !col.ativo })`.
  - Exibir toast de confirmacao.
  - Colaboradores desabilitados ficam com opacidade reduzida na tabela (mesma logica das Contas Bancarias).
- Colaboradores inativos permanecem visiveis na listagem mas sao automaticamente ocultos dos campos de selecao de vendedor/motoboy em todos os modulos (ja implementado via `obterVendedores()` e `obterMotoboys()` que filtram por `ativo`).

---

### Resumo dos arquivos a modificar

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/VendasNova.tsx` | Anexo IMEI + alerta 24h |
| `src/utils/comissoesApi.ts` | Regra fixa 10%/6% |
| `src/utils/gerarNotaGarantiaPdf.ts` | "Motoboy Thiago Imports" + tipo "Aparelho" |
| `src/pages/Vendas.tsx` | Coluna auditoria margem trade-in |
| `src/pages/VendasConferenciaGestorDetalhes.tsx` | "Troca de Nota" + observacao fantasma |
| `src/pages/FinanceiroExtratoContas.tsx` | Coluna log data/hora |
| `src/pages/CadastrosColaboradores.tsx` | Toggle status colaborador |

