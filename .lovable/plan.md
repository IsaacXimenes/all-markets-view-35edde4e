

## Plano: Padronizacao da Conferencia Diaria em Quadros por Loja + Agenda Eletronica

### 1. Reestruturar a Conferencia Diaria para "Quadros por Loja"

**Arquivo:** `src/pages/GestaoAdministrativa.tsx`

**Mudanca atual:** A conferencia diaria exibe uma unica tabela com todas as lojas misturadas, incluindo uma coluna "Loja".

**Nova estrutura:** Agrupar as conferencias por loja e renderizar um Card dedicado para cada loja (mesmo modelo visual do `GestaoAdmAtividades.tsx`), onde:
- Cada Card tera o titulo "Conferencia Diaria - [Nome da Loja]"
- A coluna "Loja" sera removida da tabela interna (pois ja esta no titulo)
- Cada quadro mantera as demais colunas: Data, Status, Vendas (Bruto), metodos de pagamento, checkboxes de conferencia e Acoes
- Sera adicionado um botao de Agenda Eletronica no cabecalho de cada quadro de loja

### 2. Criar API de Agenda Eletronica para Gestao Administrativa

**Novo arquivo:** `src/utils/agendaGestaoApi.ts`

Criar funcoes de CRUD para anotacoes vinculadas a uma chave generica (lojaId + contexto), seguindo o mesmo modelo do `fiadoApi.ts`:
- Interface `AnotacaoGestao` com campos: id, chaveContexto (ex: `conferencia_LOJ001` ou `atividade_ATT001_LOJ001`), dataHora, usuario, observacao, importante
- `getAnotacoesGestao(chaveContexto)` - listar anotacoes
- `registrarAnotacaoGestao(chaveContexto, usuario, observacao, importante)` - criar anotacao
- `temAnotacaoImportante(chaveContexto)` - verificar alerta
- Persistencia via localStorage

### 3. Adicionar Agenda Eletronica na Conferencia Diaria

**Arquivo:** `src/pages/GestaoAdministrativa.tsx`

- Adicionar botao com icone `CalendarDays` no cabecalho de cada quadro de loja
- Ao clicar, abrir modal identico ao "Agenda Eletronica Standalone" do `FinanceiroFiado.tsx`
- O modal exibe historico de anotacoes e permite registrar novas (Data/Hora automatico, Usuario logado, Observacao, checkbox Importante)
- Chave de contexto: `conferencia_{lojaId}`

### 4. Adicionar Agenda Eletronica no modulo de Atividades dos Gestores

**Arquivo:** `src/pages/GestaoAdmAtividades.tsx`

- Adicionar botao com icone `CalendarDays` no cabecalho de cada quadro de loja (ao lado dos indicadores de executadas/pontuacao)
- Mesmo modal de agenda eletronica reutilizado
- Chave de contexto: `atividades_{lojaId}`

---

### Detalhes Tecnicos

**Agrupamento por loja (Conferencia Diaria):**
```text
conferenciasFiltradas
  -> agrupar por lojaId (Map<lojaId, ConferenciaDiaria[]>)
  -> renderizar um Card por loja
  -> dentro de cada Card, tabela com as conferencias daquela loja (sem coluna Loja)
```

**Modelo de dados da Agenda:**
```text
AnotacaoGestao {
  id: string
  chaveContexto: string  // "conferencia_LOJ001" ou "atividades_LOJ001"
  dataHora: string       // ISO
  usuario: string        // nome do usuario logado
  observacao: string
  importante: boolean
}
```

**Modais reutilizados:** O modal de Agenda Eletronica e o modal de Nova Anotacao seguem exatamente o mesmo layout do `FinanceiroFiado.tsx` (linhas 660-751), com campos Data/Hora (automatico, read-only), Usuario (automatico, read-only), Observacao (textarea), e checkbox "Marcar como Importante".

**Arquivos impactados:**
1. `src/utils/agendaGestaoApi.ts` (novo) - API de anotacoes
2. `src/pages/GestaoAdministrativa.tsx` - Reestruturar para quadros por loja + agenda
3. `src/pages/GestaoAdmAtividades.tsx` - Adicionar botao de agenda por loja

