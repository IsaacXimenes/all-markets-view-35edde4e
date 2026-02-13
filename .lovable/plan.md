
# Plano - Reestruturacao do Modulo de Assistencia em 3 Etapas com "Proxima Atuacao"

## Resumo

Reestruturar o modulo de Assistencia (OS) para seguir um fluxo guiado por 3 etapas com o campo `proximaAtuacao` controlando a progressao: Registro (Entrada) -> Atuacao (Tecnico) -> Finalizacao (Vendedor e Financeiro). Inclui captura de fotos, campos de Valor de Custo/Venda, filtros rapidos de atuacao, remocao de mensagens e correcoes de consistencia.

---

## Etapa 1: Registro (Entrada)

### 1.1 Novo campo `proximaAtuacao` na interface `OrdemServico`

Adicionar ao `assistenciaApi.ts`:
- `proximaAtuacao?: 'Técnico: Avaliar/Executar' | 'Vendedor: Registrar Pagamento' | 'Financeiro: Conferir Lançamento' | 'Concluído'`
- `valorCustoTecnico?: number` (valor de custo registrado pelo tecnico)
- `valorVendaTecnico?: number` (valor de venda/cobrado do cliente registrado pelo tecnico)
- `fotosEntrada?: string[]` (URLs/base64 das fotos capturadas na entrada)

### 1.2 Renomear "Avulso" para "Balcao"

Em `assistenciaApi.ts`:
- Alterar o tipo `origemOS` de `'Avulso'` para `'Balcão'`
- Atualizar os mocks existentes que usam `'Avulso'`

Em `OSAssistenciaNova.tsx`:
- Na linha ~675, trocar `'Avulso' as const` por `'Balcão' as const`

Em `OSAssistencia.tsx`:
- Na funcao `getOrigemBadge` (linhas 148-162), trocar referencia de `'Avulso'` para `'Balcão'`

### 1.3 Componente de Camera para fotos do aparelho

Em `OSAssistenciaNova.tsx`:
- Adicionar estado `fotosEntrada: string[]`
- Criar secao "Fotos do Estado Fisico" dentro do Card "Aparelho" (abaixo dos campos de IMEI)
- Botao "Tirar Foto" que abre a camera do dispositivo via `<input type="file" accept="image/*" capture="environment" />`
- Quantidade de fotos livre - exibir miniaturas com opcao de remover
- As fotos sao armazenadas como base64 temporario (mock, nao em DB) e salvas no objeto da OS
- Exibir fotos na Timeline da OS nos Detalhes

### 1.4 Gatilho ao Salvar

Em `OSAssistenciaNova.tsx` na funcao `handleRegistrarOS`:
- Ao criar a OS, definir `proximaAtuacao: 'Técnico: Avaliar/Executar'`
- Incluir `fotosEntrada` no objeto da OS

---

## Etapa 2: Atuacao (Tecnico)

### 2.1 Campos de Valor de Custo e Valor de Venda

Em `OSAssistenciaDetalhes.tsx`:
- Adicionar campos editaveis `valorCustoTecnico` e `valorVendaTecnico` no card de Pecas/Servicos ou em card dedicado "Avaliacao Tecnica"
- Estes campos sao informativos (guardados para consulta) e devem ser preenchidos pelo tecnico antes de concluir

### 2.2 Gestao de Pecas com Status Automaticos

Em `solicitacaoPecasApi.ts` > funcao `aprovarSolicitacao`:
- Alterar o status da OS de `'Em Análise'` para `'Aguardando Recebimento'` (novo status)

Em `OSAssistenciaNova.tsx` e `OSAssistenciaDetalhes.tsx`:
- Ao usar "Solicitar Pecas", status da OS muda para `'Aguardando Peça'` (ja existe)
- Ao registrar recebimento de peca dentro da OS, status retorna para `'Em Execução'` (renomear `'Em serviço'` para `'Em Execução'`)
- Todas as mudancas geram registros automaticos na Timeline

Adicionar `'Aguardando Recebimento'` e `'Em Execução'` ao tipo de status em `assistenciaApi.ts`

### 2.3 Gatilho de Conclusao

Em `OSAssistenciaDetalhes.tsx`:
- Botao "Concluir Servico" visivel quando status = `'Em Execução'`
- Ao clicar, `proximaAtuacao` muda para `'Vendedor: Registrar Pagamento'`
- Status da OS muda para `'Aguardando Pagamento'` (novo status)
- Registra na Timeline

---

## Etapa 3: Finalizacao (Vendedor e Financeiro)

### 3.1 Acao do Vendedor

Em `OSAssistenciaDetalhes.tsx`:
- Quando `proximaAtuacao === 'Vendedor: Registrar Pagamento'`, exibir secao de pagamento habilitada
- **Trava de Seguranca**: Bloquear registro de pagamento se `valorCustoTecnico` ou `valorVendaTecnico` nao foram preenchidos. Exibir alerta informando que o tecnico precisa preencher esses campos primeiro
- **Quadro de Pagamentos**: Usar `PagamentoQuadro` com restricoes:
  - Metodos permitidos: Dinheiro, Pix, Cartao (filtrar no componente ou via prop)
  - Maquinas de Cartao: filtrar para exibir apenas as vinculadas a Loja da OS (prop `lojaVendaId` ja existe no PagamentoQuadro)
- Ao salvar pagamento, `proximaAtuacao` muda para `'Financeiro: Conferir Lançamento'`

### 3.2 Acao do Financeiro

Em `OSAssistenciaDetalhes.tsx` ou em tela dedicada:
- Quando `proximaAtuacao === 'Financeiro: Conferir Lançamento'`, exibir botao "Validar Lancamento"
- Apos validacao, status final = `'Concluído'`, `proximaAtuacao = 'Concluído'`
- Registra na Timeline

---

## Interface e Usabilidade

### 4.1 Filtros Rapidos de Atuacao

Em `OSAssistencia.tsx`:
- Adicionar botoes de filtro rapido acima da tabela (abaixo dos stats cards):
  - "Minhas Atuacoes" - filtra por `proximaAtuacao` cruzado com perfil logado (tecnico, vendedor ou financeiro)
  - "Aguardando Pagamento" - filtra por `proximaAtuacao === 'Vendedor: Registrar Pagamento'`
  - "Pendentes Financeiro" - filtra por `proximaAtuacao === 'Financeiro: Conferir Lançamento'`
- Adicionar coluna "Proxima Atuacao" na tabela com badge colorido

### 4.2 Timeline com Fotos

Em `OSAssistenciaDetalhes.tsx`:
- Na secao de Timeline, exibir miniaturas das fotos de entrada (`fotosEntrada`) como item especial da timeline (tipo `'foto'`)

### 4.3 Campo Loja - apenas tipo Assistencia

- Ja implementado em `OSAssistenciaNova.tsx` (usa `apenasLojasTipoLoja` no AutocompleteLoja) e em `OSAssistenciaDetalhes.tsx` (usa `filtrarPorTipo="Assistência"`)
- Verificar e garantir consistencia

---

## Regras de Negocio Adicionais

### 5.1 Remover mensagens de origem do aparelho

Em `OSAssistenciaNova.tsx` (linhas 937-946):
- Remover o bloco condicional que exibe:
  - "O aparelho foi adquirido na Thiago Imports..."
  - "O aparelho foi adquirido externamente..."

### 5.2 Solicitar Pecas identico na criacao e edicao

- O quadro "Solicitar Pecas" ja existe em ambos `OSAssistenciaNova.tsx` (linhas 1279-1409) e `OSAssistenciaDetalhes.tsx` (linhas 589-697)
- Verificar e garantir que ambos usam o mesmo layout e funcionalidades (campos, validacoes, tabela)

### 5.3 Persistencia de dados do cliente da Analise de Tratativas

Em `OSAssistenciaNova.tsx` (linhas 258-287):
- No bloco de pre-preenchimento da Analise de Tratativas, garantir que `clienteId` e persistido corretamente
- Para origem "Estoque", buscar dados do cliente associado ao produto pendente e preencher `clienteId`

---

## Secao Tecnica

| Arquivo | Alteracoes |
|---------|-----------|
| `src/utils/assistenciaApi.ts` | Adicionar campos `proximaAtuacao`, `valorCustoTecnico`, `valorVendaTecnico`, `fotosEntrada` na interface. Renomear `'Avulso'` para `'Balcão'`. Adicionar novos status: `'Aguardando Recebimento'`, `'Em Execução'`, `'Aguardando Pagamento'` |
| `src/pages/OSAssistenciaNova.tsx` | Componente de camera para fotos. Remover mensagens de origem. Setar `proximaAtuacao` ao salvar. Renomear `'Avulso'` para `'Balcão'`. Garantir persistencia de `clienteId` da Analise |
| `src/pages/OSAssistencia.tsx` | Filtros rapidos (Minhas Atuacoes, Aguardando Pagamento, Pendentes Financeiro). Coluna "Proxima Atuacao" na tabela. Renomear badge `'Avulso'` para `'Balcão'`. Novos badges de status |
| `src/pages/OSAssistenciaDetalhes.tsx` | Campos Valor de Custo/Venda. Botao "Concluir Servico". Secao de pagamento com trava. Validacao financeira. Fotos na Timeline. Novos badges de status |
| `src/utils/solicitacaoPecasApi.ts` | Alterar `aprovarSolicitacao` para setar OS status para `'Aguardando Recebimento'` |
