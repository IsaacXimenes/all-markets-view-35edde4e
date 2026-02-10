

# Plano: Atividades dos Gestores, Indicadores com Abas, e Logs Centralizados

## Resumo

Este plano cobre 3 grandes entregas:
1. Novo modulo de **Checklist Diario de Atividades** para gestores, com pontuacao e logs
2. Reestruturacao da aba **Indicadores** com sub-abas (Stories, Google, Atividades)
3. Nova aba **Logs de Auditoria** centralizada no modulo de Cadastros

---

## 1. Cadastro de Atividades (Modulo Cadastros)

### Nova aba "Atividades" no CadastrosLayout
- Adicionar aba "Atividades" na navbar de Cadastros (apos "Config. WhatsApp")
- Icone: `ListChecks`

### Nova pagina `CadastrosAtividades.tsx`
- Tabela CRUD com colunas: Nome da Atividade, Tipo Horario (Fixo/Aberto), Horario Previsto (se fixo), Pontuacao Base (padrao 1), Lojas Atribuidas (multi-select ou "Todas"), Status (Ativa/Inativa)
- Modal de criacao/edicao com campos validados
- Dados armazenados via `atividadesGestoresApi.ts` (localStorage)

### Nova API `src/utils/atividadesGestoresApi.ts`
- Interfaces: `AtividadeCadastro`, `ExecucaoAtividade`, `LogAtividade`
- CRUD de atividades cadastradas
- Funcoes de execucao diaria (checklist)
- Logica de pontuacao:
  - Horario Fixo: 1 ponto se dentro do horario, 0.5 se atrasado
  - Horario Aberto: 1 ponto ao marcar (registra hora atual)
- Logs de auditoria imutaveis por atividade
- Dados mockados iniciais (ex: "Abertura de Caixa 09:00", "Verificacao de Estoque - Aberto", "Fechamento de Caixa 18:00")

---

## 2. Checklist Diario de Atividades (Gestao Administrativa)

### Nova aba no `GestaoAdministrativaLayout`
- Adicionar aba "Atividades Gestores" com icone `ListChecks` apos "Indicadores Stories"
- Rota: `/gestao-administrativa/atividades`

### Nova pagina `GestaoAdmAtividades.tsx`
- Filtros: Data (padrao hoje), Loja (Autocomplete)
- Tabela com colunas:
  - Atividade (descricao)
  - Horario Previsto (fixo ou "Aberto")
  - Horario Executado (preenchido ao marcar checkbox)
  - Executado (checkbox)
  - Pontuacao (calculada automaticamente)
- Card resumo: Total de pontos / Pontuacao maxima, Percentual de execucao
- Acesso restrito a gestores (`eh_gestor`)

---

## 3. Reestruturacao do Indicadores (Sub-abas)

### Renomear "Indicadores Stories" para "Indicadores"
- Atualizar `GestaoAdministrativaLayout` - aba "Indicadores Stories" vira "Indicadores"
- Rota permanece `/gestao-administrativa/stories/indicadores` (ou nova rota `/gestao-administrativa/indicadores`)

### Pagina `GestaoAdmIndicadores.tsx` (container com sub-abas)
- Usar componente `Tabs` do shadcn para 3 sub-abas internas:
  - **Stories**: Conteudo atual do `GestaoAdmStoriesIndicadores` movido para ca
  - **Google**: Placeholder com mensagem "Em breve"
  - **Atividades**: Dashboard de performance dos gestores

### Sub-aba Atividades (Dashboard)
- Filtros: Loja, Periodo (Diario/Semanal/Mensal)
- Ranking de Gestores: tabela com pontuacao total acumulada
- Percentual de Execucao por Loja: barras de progresso
- Grafico de Pontuacao Media: `BarChart` do Recharts comparando lojas/gestores

---

## 4. Logs de Auditoria Centralizados

### Nova aba no `CadastrosLayout`
- Adicionar aba "Logs de Auditoria" com icone `History`
- Rota: `/cadastros/logs-auditoria`

### Nova pagina `CadastrosLogsAuditoria.tsx`
- Consolida logs de: Conferencia de Caixa, Atividades dos Gestores, Stories, Movimentacoes de Estoque
- Filtros: Modulo (select), Usuario (Autocomplete Colaborador), Data Inicio/Fim, Tipo de Acao
- Tabela com colunas: Data/Hora, Modulo, Usuario, Acao, Detalhes
- Puxar dados das APIs existentes (`gestaoAdministrativaApi.getLogsAuditoria`, `atividadesGestoresApi.getLogs`, etc.)

---

## 5. Rotas e Integracao

### Novos arquivos a criar
- `src/utils/atividadesGestoresApi.ts` - API + dados mockados
- `src/pages/CadastrosAtividades.tsx` - CRUD de atividades
- `src/pages/GestaoAdmAtividades.tsx` - Checklist diario
- `src/pages/GestaoAdmIndicadores.tsx` - Container com sub-abas (Stories/Google/Atividades)
- `src/pages/CadastrosLogsAuditoria.tsx` - Logs centralizados

### Arquivos a editar
- `src/App.tsx` - Novas rotas
- `src/components/layout/GestaoAdministrativaLayout.tsx` - Novas abas
- `src/components/layout/CadastrosLayout.tsx` - Novas abas
- `src/store/authStore.ts` - Limpar dados de atividades no logout

---

## Detalhes Tecnicos

### Estrutura de dados (atividadesGestoresApi)

```text
AtividadeCadastro {
  id: string
  nome: string
  tipoHorario: 'fixo' | 'aberto'
  horarioPrevisto?: string (HH:mm)
  pontuacaoBase: number (default 1)
  lojasAtribuidas: string[] | 'todas'
  ativa: boolean
}

ExecucaoAtividade {
  id: string
  atividadeId: string
  data: string (YYYY-MM-DD)
  lojaId: string
  gestorId: string
  gestorNome: string
  executado: boolean
  horarioExecutado?: string (ISO)
  pontuacao: number
  status: 'pendente' | 'executado' | 'executado_com_atraso'
}

LogAtividade {
  id: string
  atividadeId: string
  data: string
  gestorId: string
  gestorNome: string
  acao: 'marcou' | 'desmarcou'
  pontuacao: number
  dataHora: string (ISO)
  detalhes: string
}
```

### Logica de pontuacao
- Horario fixo marcado no horario: `pontuacaoBase` (1 ponto)
- Horario fixo marcado apos horario: `pontuacaoBase * 0.5` (0.5 pontos)
- Horario aberto: `pontuacaoBase` ao marcar (registra timestamp)
- Desmarcacao: pontuacao volta a 0, log registrado

### Persistencia
- localStorage com chaves: `atividades_cadastro`, `atividades_execucao_YYYY-MM-DD`, `atividades_logs`

