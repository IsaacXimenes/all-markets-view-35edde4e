

# Autocomplete de Modelo, Encaminhamento Individual para Assistencia, e Correcao de Rota

## Resumo

Tres alteracoes na tela de Cadastro de Produtos da Nota de Entrada:
1. Substituir o Select estatico de Modelo por Autocomplete pesquisavel
2. Adicionar botao individual por produto para encaminhar para assistencia (com modal de motivo), habilitado apenas quando o IMEI esta preenchido
3. Corrigir o fluxo de encaminhamento: ao enviar para assistencia a partir da nota de entrada, os aparelhos devem ir para "Analise de Tratativas" (nao diretamente para Servicos/OS)

---

## 1. Autocomplete no Campo Modelo

**Arquivo:** `src/pages/EstoqueNotaCadastrarProdutos.tsx`

**Problema:** O campo Modelo (linhas 456-473) usa um `<Select>` estatico. Conforme a regra global, deve ser um Autocomplete pesquisavel consumindo dados de Cadastros > Aparelhos.

**Alteracao:** Substituir o `<Select>` por um componente inline usando `<Popover>` + `<Command>` (padrao cmdk ja utilizado no projeto). O autocomplete filtra `produtosCadastro` (para Aparelhos) ou `acessoriosCadastro` (para Acessorios) por texto digitado. A largura do campo sera mantida em `w-44`.

---

## 2. Botao de Encaminhar para Assistencia por Produto

**Arquivo:** `src/pages/EstoqueNotaCadastrarProdutos.tsx`

**Problema:** Atualmente so existe o botao "Salvar Produtos". O usuario precisa de um botao por linha para marcar individualmente um aparelho para encaminhamento a assistencia.

**Alteracao:**

### 2a. Botao na coluna de acoes
Na coluna de acoes da tabela (linha 558-568), ao lado do botao de remover, adicionar um botao com icone `Wrench` (chave inglesa). O botao so fica habilitado quando:
- `tipoProduto === 'Aparelho'`
- `imei` esta preenchido (campo nao vazio)
- O produto ainda nao foi marcado para assistencia

### 2b. Modal de motivo
Ao clicar no botao, abre um `<Dialog>` com:
- Informacoes do aparelho (Marca, Modelo, IMEI) em modo leitura
- Campo `<Textarea>` obrigatorio para informar o motivo do encaminhamento
- Data/hora e responsavel preenchidos automaticamente
- Checkbox de confirmacao
- Botoes "Cancelar" e "Confirmar Encaminhamento"

### 2c. Estado de marcacao
Criar estado `produtosMarcadosAssistencia` (array de objetos com indice do produto + motivo). Produtos marcados exibem um `<Badge>` "Assistencia" na linha e o botao Wrench fica desabilitado. O usuario pode desmarcar clicando novamente.

### 2d. Fluxo no salvar
Ao clicar "Salvar Produtos", apos o cadastro normal (`cadastrarProdutosNota`), os produtos marcados para assistencia sao encaminhados individualmente para a "Analise de Tratativas" usando `encaminharParaAnaliseGarantia` da `garantiasApi.ts`, passando:
- `origemId`: ID do produto na nota
- `origem`: `'Estoque'`
- `descricao`: `"[Marca] [Modelo] - IMEI: [imei]"`
- `observacao`: motivo informado no modal

---

## 3. Correcao do Fluxo de Encaminhamento (Nota de Entrada)

**Arquivo:** `src/utils/loteRevisaoApi.ts`

**Problema:** A funcao `encaminharLoteParaAssistencia` (linha 129-176) cria OS diretamente com `addOrdemServico`, fazendo os aparelhos irem para a aba "Servicos" em vez de passar pela "Analise de Tratativas".

**Alteracao:** Substituir a chamada `addOrdemServico` por `encaminharParaAnaliseGarantia` para cada item do lote. Assim, os aparelhos encaminhados via Nota de Entrada (tela de Conferencia) tambem passam pela "Analise de Tratativas" antes de virar OS.

Detalhes:
- Importar `encaminharParaAnaliseGarantia` de `garantiasApi.ts`
- Para cada item do lote, chamar `encaminharParaAnaliseGarantia(item.id, 'Estoque', descricao, motivoAssistencia)`
- Remover a criacao direta de OS (`addOrdemServico`)
- Manter o status do lote como `'Encaminhado'`
- Atualizar o retorno (sem `osIds`, pois as OS serao criadas depois na Analise de Tratativas)

---

## Detalhes Tecnicos

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/pages/EstoqueNotaCadastrarProdutos.tsx` | Autocomplete Modelo + botao encaminhar assistencia por linha + modal motivo |
| `src/utils/loteRevisaoApi.ts` | Corrigir fluxo: usar `encaminharParaAnaliseGarantia` em vez de `addOrdemServico` |

### Novas importacoes em EstoqueNotaCadastrarProdutos.tsx
- `Wrench` de lucide-react
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` de ui/dialog
- `Textarea` de ui/textarea
- `Checkbox` de ui/checkbox
- `Popover, PopoverContent, PopoverTrigger` de ui/popover
- `Command, CommandInput, CommandList, CommandItem, CommandEmpty` de ui/command
- `encaminharParaAnaliseGarantia` de garantiasApi
- `useAuthStore` de store/authStore
- `format` de date-fns

### Sem novas dependencias npm

Todas as funcoes e componentes ja existem no projeto.

---

## Sequencia de Implementacao

1. `src/utils/loteRevisaoApi.ts` - Corrigir fluxo de encaminhamento
2. `src/pages/EstoqueNotaCadastrarProdutos.tsx` - Autocomplete Modelo + botao assistencia + modal

