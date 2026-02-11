

# Plano - Corrigir 6 inconsistencias nos fluxos da Assistencia

## Resumo

Foram identificadas 6 inconsistencias no modulo de Assistencia/OS que causam perda de dados, timeline duplicada e status incorretos. As correcoes abaixo resolvem cada uma delas.

---

## Correcao 1: Timeline de baixa de pecas nao salva

**Arquivo:** `src/pages/OSAssistenciaNova.tsx`

**Problema:** As entradas de timeline para baixa de estoque sao adicionadas ao array `timeline` apos a OS ja ter sido criada via `addOrdemServico`. Como o array ja foi copiado, essas entradas se perdem.

**Solucao:** Apos o loop de baixa de pecas, chamar `updateOrdemServico` para persistir a timeline atualizada na OS recem-criada.

---

## Correcao 2: Campos de origem nao persistidos na OS

**Arquivo:** `src/pages/OSAssistenciaNova.tsx`

**Problema:** O `addOrdemServico` nao inclui os campos `origemOS`, `vendaId`, `garantiaId`, `produtoId`, `modeloAparelho`, `imeiAparelho` e `valorProdutoOrigem`, mesmo quando a OS e criada a partir de uma venda, garantia ou estoque.

**Solucao:** Adicionar esses campos ao objeto passado para `addOrdemServico`, mapeando `origemOS` para o formato correto (Venda/Garantia/Estoque) e incluindo `vendaIdParam`, `garantiaIdParam`, `produtoIdParam`, `modeloAparelho` e `imeiAparelho`.

---

## Correcao 3: Dropdown de status incompleto nos Detalhes da OS

**Arquivo:** `src/pages/OSAssistenciaDetalhes.tsx`

**Problema:** O dropdown de edicao de status so oferece 3 opcoes ("Em servico", "Aguardando Peca", "Servico concluido"), mas a OS pode estar em outros estados como "Solicitacao Enviada", "Em Analise", "Peca Recebida", etc.

**Solucao:** Adicionar todos os status possiveis ao `SelectContent`:
- Em servico
- Aguardando Peca
- Solicitacao Enviada
- Em Analise
- Aguardando Aprovacao do Gestor
- Peca Recebida
- Peca em Estoque / Aguardando Reparo
- Servico concluido

---

## Correcao 4: Badges de status faltando nos Detalhes

**Arquivo:** `src/pages/OSAssistenciaDetalhes.tsx`

**Problema:** A funcao `getStatusBadge` so trata 3 status, mostrando badge generica para os demais.

**Solucao:** Adicionar cases para todos os status com cores adequadas:
- Solicitacao Enviada: laranja
- Em Analise: indigo
- Aguardando Aprovacao do Gestor: amber
- Rejeitado pelo Gestor: vermelho
- Pagamento - Financeiro: roxo
- Pagamento Finalizado: teal
- Aguardando Chegada da Peca: cyan
- Peca em Estoque / Aguardando Reparo: lime

---

## Correcao 5: Timeline duplicada na aprovacao de solicitacao

**Arquivo:** `src/pages/OSSolicitacoesPecas.tsx`

**Problema:** Ao aprovar uma solicitacao, tanto `aprovarSolicitacao()` (na API) quanto o codigo no componente `OSSolicitacoesPecas.tsx` adicionam entradas na timeline da OS, resultando em registros duplicados.

**Solucao:** Remover a adicao de timeline no componente `OSSolicitacoesPecas.tsx` (linhas 215-226), mantendo apenas a que ja ocorre dentro de `aprovarSolicitacao()` na API.

---

## Correcao 6: Cancelamento forca status incorreto

**Arquivo:** `src/utils/solicitacaoPecasApi.ts`

**Problema:** `cancelarSolicitacao` forca o status da OS para "Em servico" sem verificar se existem outras solicitacoes ativas para a mesma OS.

**Solucao:** Antes de alterar o status, verificar se existem outras solicitacoes nao-canceladas/nao-rejeitadas para a mesma OS. Se existirem, manter o status atual. Se nao existirem, reverter para "Em servico".

---

## Arquivos alterados

1. `src/pages/OSAssistenciaNova.tsx` - Correcoes 1 e 2
2. `src/pages/OSAssistenciaDetalhes.tsx` - Correcoes 3 e 4
3. `src/pages/OSSolicitacoesPecas.tsx` - Correcao 5
4. `src/utils/solicitacaoPecasApi.ts` - Correcao 6

