

## Correções e Melhorias na Aba de Serviços (Oficina) e Fluxo de Finalização

### Problemas Identificados

1. **Botao "Solicitar Peca" nas acoes da tabela**: O botao aparece diretamente na coluna de acoes da tabela, ocupando espaco. Deve ser movido para dentro do modal/quadro de detalhes do servico, nao na listagem.

2. **Observacao do Estoque nao aparece para o tecnico**: Quando um produto e encaminhado do Estoque para a Assistencia com observacoes no parecer, essas observacoes nao sao repassadas para a OS criada na Analise de Tratativas. O tecnico nao sabe o que precisa fazer.

3. **Quadro de Pagamento visivel na aba de Servicos**: O tecnico so deve preencher a "Avaliacao Tecnica" (resumo, custo, venda). O quadro de pagamento deve ficar bloqueado enquanto estiver na atuacao do tecnico.

4. **Campos de Valor de Custo e Valor de Venda sem mascara R$**: Os inputs usam `type="number"` sem mascara monetaria brasileira. Devem usar o componente `InputComMascara` com mascara "moeda".

5. **Registro some da tela ao finalizar**: Ao clicar "Finalizar" na aba Servicos, o `recarregar()` faz o registro desaparecer pois muda o status/atuacao. O registro deve permanecer visivel com o status atualizado.

6. **Fluxo pos-finalizacao incorreto**: Ao finalizar na aba Servicos, a OS deve ir para status "Aguardando Pagamento" com proximaAtuacao "Atendente", aparecendo na aba Nova Assistencia onde o atendente registra o pagamento.

---

### Plano de Implementacao

#### 1. Remover botao "Solicitar Peca" das acoes da tabela

**Arquivo:** `src/pages/OSOficina.tsx`

- Na funcao `getAcoes()`, remover o botao "Solicitar Peca" do bloco `status === 'Em servico'`
- Manter apenas o botao "Finalizar" nas acoes
- Mover a funcionalidade de solicitar peca para um botao dentro do modal de finalizacao ou como acao secundaria acessivel via detalhes (botao Eye)

#### 2. Passar observacoes do Estoque para a OS

**Arquivo:** `src/utils/assistenciaApi.ts`
- Adicionar campo opcional `observacaoOrigem?: string` na interface `OrdemServico`

**Arquivo:** `src/utils/garantiasApi.ts`
- Adicionar campo `observacao?: string` na interface `RegistroAnaliseGarantia`
- Na funcao `encaminharParaAnaliseGarantia`, aceitar e persistir o parametro de observacao

**Arquivo:** `src/utils/osApi.ts`
- Em `salvarParecerEstoque`, passar as `observacoes` do parecer para `encaminharParaAnaliseGarantia`

**Arquivo:** `src/pages/OSAnaliseGarantia.tsx`
- Ao criar a OS via `addOrdemServico`, incluir o campo `observacaoOrigem` com a observacao do registro
- Exibir a observacao na tabela e no modal de detalhes

**Arquivo:** `src/pages/OSOficina.tsx`
- Exibir a `observacaoOrigem` (quando existir) em um card de alerta visivel ao tecnico, tanto na tabela quanto no modal de finalizacao

#### 3. Bloquear quadro de Pagamento na aba Servicos

**Arquivo:** `src/pages/OSOficina.tsx`

- No modal de finalizacao, garantir que NAO ha campos de pagamento. O modal atual ja mostra apenas "Resumo da Conclusao", "Valor de Custo" e "Valor de Venda" -- confirmar que nao ha quadro de pagamento e que o layout esta correto.
- Se houver referencia ao PagamentoQuadro neste arquivo, remover/bloquear.

#### 4. Aplicar mascara R$ nos campos de Valor de Custo e Valor de Venda

**Arquivo:** `src/pages/OSOficina.tsx`

- Substituir `<Input type="number">` por `<InputComMascara mascara="moeda">` nos campos:
  - "Valor de Custo (R$)" 
  - "Valor de Venda (R$)"
- Ajustar os handlers para usar `onChange(formatted, rawValue)` do `InputComMascara`
- Importar `InputComMascara` de `@/components/ui/InputComMascara`

#### 5. Manter registro visivel apos finalizar

**Arquivo:** `src/pages/OSOficina.tsx`

- Ajustar o filtro `osTecnico` para incluir tambem OS com status "Aguardando Pagamento" que acabaram de ser finalizadas pelo tecnico (ou usar um estado local para manter a OS visivel temporariamente)
- Alternativa mais simples: ao finalizar, nao chamar `recarregar()` imediatamente, e sim atualizar o estado local para refletir o novo status na linha da tabela, mantendo-a visivel com o badge atualizado

#### 6. Corrigir fluxo de finalizacao: status e atuacao

**Arquivo:** `src/pages/OSOficina.tsx`

- Na funcao `handleFinalizar`, alterar:
  - `status`: de `'Finalizado'` para `'Aguardando Pagamento'`
  - `proximaAtuacao`: de `'Gestor/Vendedor'` para `'Atendente'`
- Isso faz a OS aparecer na aba "Nova Assistencia" com o filtro de "Aguardando Pagamento"

**Arquivo:** `src/pages/OSAssistencia.tsx`

- Verificar que o filtro de atuacao "Aguardando Pagamento" funciona corretamente para o novo valor `'Atendente'`
- Adicionar `'Atendente'` ao tipo `proximaAtuacao` na interface `OrdemServico` se necessario
- Garantir que o quadro de pagamento (PagamentoQuadro) esta disponivel quando status = "Aguardando Pagamento"

---

### Detalhes Tecnicos

**Interface `OrdemServico` (assistenciaApi.ts):**
- Adicionar `'Atendente'` ao union type de `proximaAtuacao`
- Adicionar `observacaoOrigem?: string`

**Interface `RegistroAnaliseGarantia` (garantiasApi.ts):**
- Adicionar `observacao?: string`

**Funcao `encaminharParaAnaliseGarantia` (garantiasApi.ts):**
- Adicionar 4o parametro opcional `observacao?: string`

**Funcao `salvarParecerEstoque` (osApi.ts):**
- Passar `observacoes` como 4o argumento para `encaminharParaAnaliseGarantia`

**Componente `OSOficina` (OSOficina.tsx):**
- Importar `InputComMascara`
- Trocar estados `valorCusto`/`valorVenda` de `number` para `string` (formatado) + manter raw value
- Remover botao "Solicitar Peca" da funcao `getAcoes`
- Exibir card com observacao de origem quando disponivel
- Alterar `handleFinalizar` para novo status/atuacao
- Manter registro na tela apos finalizar (atualizar estado local em vez de recarregar)

