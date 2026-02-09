

# Plano: Otimizacao do Fluxo de Recebimento e SLA na Base de Trocas

## Resumo

Ajustar a aba "Pendencias - Base de Trocas" para: (1) garantir migracao automatica e status "Finalizado" ao confirmar recebimento, (2) exibir SLA em faixas categoricas (0-24h, 24-48h, etc.), (3) adicionar filtro de SLA, e (4) congelar o SLA para itens finalizados mostrando o tempo total decorrido.

## Arquivos a Modificar

### 1. `src/utils/baseTrocasPendentesApi.ts`

**Interface `TradeInPendente`:**
- Adicionar campo `slaCongelado?: string` para armazenar o texto do SLA no momento da finalizacao
- Adicionar campo `slaFaixaCongelada?: string` para armazenar a faixa (ex: "48-72 horas")

**Funcao `calcularSLA`:**
- Adicionar campo `faixa` no retorno da `SLAInfo`: `'0-24 horas' | '24-48 horas' | '48-72 horas' | '72+ horas'`
- Logica: calcular horas totais e categorizar na faixa correspondente
- Ajustar `nivel`: 0-24h = normal, 24-48h = normal, 48-72h = atencao, 72+ = critico

**Funcao `registrarRecebimento`:**
- Antes de alterar o status, calcular o SLA atual e salvar `slaCongelado` e `slaFaixaCongelada` no registro
- Manter o status como `'Recebido'` (ja existente)

### 2. `src/pages/EstoquePendenciasBaseTrocas.tsx`

**Filtro de SLA:**
- Adicionar um `Select` com opcoes: "Todas", "0-24 horas", "24-48 horas", "48-72 horas", "72+ horas"
- Novo estado `filtroSLA` com valor padrao vazio
- Aplicar filtro no `useMemo` de `tradeInsFiltrados` comparando a faixa calculada (para aguardando) ou a faixa congelada (para finalizados)

**Coluna "SLA Devolucao":**
- Para status "Aguardando Devolucao": exibir a faixa categorizada (ex: "48-72 horas") com o badge animado atual e cores por faixa
- Para status "Recebido/Finalizado": exibir o SLA congelado (ex: "2 dias e 5 horas") com badge verde estatico e indicacao visual de que esta congelado (icone de cadeado ou check)

**Toast de confirmacao:**
- Remover a mensagem fallback "Aparelho aguardando migracao para Produtos Pendentes"
- Manter apenas a mensagem de sucesso com o ID do produto migrado
- Se a migracao falhar, exibir toast de erro e nao mudar status

**Status na tabela:**
- Manter o texto "Finalizado" (ja implementado via badge verde)

## Detalhes Tecnicos

### Faixas de SLA

```text
horasTotal = (Date.now() - dataVenda) / (1000 * 60 * 60)

0-24 horas   -> horasTotal < 24   -> nivel: normal  -> cor: verde
24-48 horas  -> horasTotal < 48   -> nivel: normal  -> cor: verde
48-72 horas  -> horasTotal < 72   -> nivel: atencao -> cor: amarelo
72+ horas    -> horasTotal >= 72  -> nivel: critico -> cor: vermelho
```

### Congelamento do SLA

Ao chamar `registrarRecebimento`, antes de mudar o status:
1. Calcular `calcularSLA(tradeIn.dataVenda)` naquele instante
2. Salvar `slaCongelado = sla.texto` (ex: "3 dias e 14 horas")
3. Salvar `slaFaixaCongelada = sla.faixa` (ex: "72+ horas")
4. Esses valores ficam fixos e sao exibidos na tabela para itens finalizados

### Filtro de SLA no `useMemo`

Para cada trade-in, determinar a faixa:
- Se `status === 'Recebido'`: usar `slaFaixaCongelada`
- Se `status === 'Aguardando Devolucao'`: calcular `calcularSLA(dataVenda).faixa` em tempo real

Comparar com o valor do filtro selecionado.

### Fluxo de Confirmacao Revisado

```text
1. Usuario clica "Registrar Recebimento" (fotos obrigatorias)
   |
   v
2. registrarRecebimento():
   - Calcula SLA e congela nos campos
   - Muda status para 'Recebido'
   |
   v
3. migrarParaProdutosPendentes():
   - Cria produto em Aparelhos Pendentes
   - Se sucesso: toast verde com ID do produto
   - Se falha: toast de erro (recebimento ja foi registrado)
   |
   v
4. Redireciona para /estoque/produtos-pendentes
```
