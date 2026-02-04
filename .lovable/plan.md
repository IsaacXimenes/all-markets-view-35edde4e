
# Plano de Ajustes e Novas Funcionalidades - Modulo Estoque

## Resumo das Alteracoes

Este plano abrange 8 areas de ajustes e melhorias no sistema, focando em sincronizacao de estoque minimo, formato de SLA, ajustes de interface, buffer de anexos, fluxo de notas de entrada, movimentacoes matriz e retirada de pecas.

---

## 1. Sincronizacao de Estoque Minimo para Aparelhos

### Situacao Atual
- O cadastro de acessorios em `CadastrosAcessorios.tsx` possui o campo `limiteMinimo`
- Aparelhos no estoque nao possuem integracao com este campo de limite

### Solucao
- Criar integracao entre o cadastro de acessorios e a listagem de produtos no estoque
- Adicionar verificacao de quantidade minima nos produtos de estoque
- Disparar alerta visual quando estoque atingir limite configurado

### Arquivos a Modificar
- `src/pages/EstoqueProdutos.tsx` - Adicionar verificacao de limite e badge de alerta
- `src/pages/CadastrosAcessorios.tsx` - Exportar funcao para buscar limite por modelo/produto

### Implementacao Detalhada

```text
1. Criar funcao getLimiteMinimo(produto: string) em CadastrosAcessorios.tsx
2. No EstoqueProdutos.tsx, verificar se quantidade do produto esta abaixo do limite
3. Exibir badge vermelho "Estoque Baixo" quando quantidade <= limiteMinimo
4. Adicionar card no dashboard de stats com contador de produtos abaixo do minimo
```

---

## 2. Formato de SLA: "X dias e Y horas"

### Situacao Atual
- Funcao `calcularSLA` em `osApi.ts` retorna apenas dias:
```text
return { dias, cor };
```

### Solucao
- Modificar funcao para retornar dias E horas
- Atualizar exibicao em Aparelhos Pendentes

### Arquivos a Modificar
- `src/utils/osApi.ts` - Modificar funcao `calcularSLA`
- `src/pages/EstoqueProdutosPendentes.tsx` - Atualizar `getSLABadge`

### Implementacao Detalhada

```text
Alterar calcularSLA (linha 286-300 de osApi.ts):

export const calcularSLA = (dataEntrada: string): { 
  dias: number; 
  horas: number; 
  texto: string; 
  cor: 'normal' | 'amarelo' | 'vermelho' 
} => {
  const hoje = new Date();
  const entrada = new Date(dataEntrada);
  const diffTime = Math.abs(hoje.getTime() - entrada.getTime());
  
  const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  let cor: 'normal' | 'amarelo' | 'vermelho' = 'normal';
  if (dias >= 5) cor = 'vermelho';
  else if (dias >= 3) cor = 'amarelo';
  
  const texto = dias > 0 
    ? `${dias} dia${dias > 1 ? 's' : ''} e ${horas}h`
    : `${horas}h`;
  
  return { dias, horas, texto, cor };
};

Atualizar getSLABadge em EstoqueProdutosPendentes.tsx:
- Usar sla.texto ao inves de sla.dias
```

---

## 3. Notas de Entrada - Aumentar Largura de Colunas

### Situacao Atual
- Colunas "Categoria" e "Custo Unitario" estao estreitas na tabela de cadastro de produtos

### Solucao
- Aumentar largura minima das colunas com classes CSS

### Arquivo a Modificar
- `src/pages/EstoqueNotaCadastrarProdutos.tsx`

### Implementacao Detalhada

```text
Linha 408-414: Alterar TableHead das colunas

<TableHead className="min-w-[120px]">Categoria</TableHead>
<TableHead className="min-w-[130px]">Custo Unit. *</TableHead>
```

---

## 4. Buffer de Anexos para Notas

### Situacao Atual
- Nao existe funcionalidade de anexar arquivos temporarios nas notas de entrada

### Solucao
- Implementar buffer de anexos no formulario de lancamento de notas
- Arquivos selecionados ficam em memoria ate confirmacao final
- Usar FileReader API para preview e armazenar em base64 temporariamente

### Arquivos a Criar/Modificar
- `src/pages/EstoqueNotaCadastrar.tsx` - Adicionar secao de anexos
- `src/components/estoque/BufferAnexos.tsx` - Novo componente para gerenciar anexos

### Implementacao Detalhada

```text
Novo componente BufferAnexos.tsx:

interface AnexoTemporario {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUrl: string; // Base64
}

- Input type="file" com accept para PDFs, imagens, etc
- Preview dos arquivos selecionados
- Botao para remover arquivo individual
- Lista de arquivos pendentes
- Ao salvar nota, anexos sao persistidos no objeto da nota
```

---

## 5. Fluxo de Notas: Semi-novo vs Novo

### Situacao Atual
- Todos os aparelhos da nota vao para o mesmo destino independente da categoria

### Solucao
- Ao finalizar conferencia, verificar categoria de cada produto:
  - **Seminovo**: Encaminhar para Aparelhos Pendentes
  - **Novo**: Enviar diretamente para Estoque Disponivel

### Arquivos a Modificar
- `src/utils/notaEntradaFluxoApi.ts` - Ajustar funcao de finalizacao
- `src/pages/EstoqueNotaConferencia.tsx` - Aplicar logica condicional

### Implementacao Detalhada

```text
Na funcao de finalizarConferencia:

produtos.forEach(produto => {
  if (produto.categoria === 'Seminovo') {
    // Migrar para Aparelhos Pendentes (osApi)
    migrarParaProdutosPendentes(produto);
  } else {
    // Migrar direto para Estoque Disponivel (estoqueApi)
    addProdutoMigrado({...produto, statusNota: 'Concluido'});
  }
});
```

---

## 6. Movimentacoes Matriz - Refinamentos

### 6.1 Responsavel Automatico

**Situacao Atual**
- Campo "Responsavel pelo Lancamento" requer selecao manual

**Solucao**
- Preencher automaticamente com usuario logado do authStore

**Arquivo a Modificar**
- `src/pages/EstoqueNovaMovimentacaoMatriz.tsx`

```text
import { useAuthStore } from '@/store/authStore';

const { user } = useAuthStore();

useEffect(() => {
  if (user?.colaborador) {
    setResponsavelLancamento(user.colaborador.id);
  }
}, [user]);
```

### 6.2 Detalhamento em Tela Cheia

**Situacao Atual**
- Modal de detalhes usa Dialog com tamanho limitado

**Solucao**
- Substituir Dialog por pagina full screen dedicada

**Arquivos a Modificar**
- `src/pages/EstoqueMovimentacoesMatriz.tsx` - Redirecionar para pagina de detalhes
- `src/pages/EstoqueMovimentacaoMatrizDetalhes.tsx` - Nova pagina full screen

### 6.3 Layout de 3 Quadros para Conferencia de Retorno

**Solucao**
Criar layout com 3 secoes na pagina de detalhes:

```text
+------------------------+------------------------+------------------------+
|   Relacao Original     | Conferidos (Retornaram)| Pendentes de Retorno   |
+------------------------+------------------------+------------------------+
| Lista todos aparelhos  | Aparelhos devolvidos   | Aparelhos ainda na     |
| enviados originalmente | com data/hora/resp.    | loja destino           |
|                        |                        | [Registrar Devolucao]  |
+------------------------+------------------------+------------------------+
```

**Funcionalidades:**
- Botao "Registrar Devolucao" no quadro Pendentes
- Modal com campo IMEI (manual ou scanner)
- Ao validar IMEI, move para quadro "Conferidos"
- Botao "Desfazer Conferencia" nos conferidos para reverter

---

## 7. Ajustes Gerais em Movimentacoes

### 7.1 Movimentacoes Aparelhos

**Arquivos a Modificar**
- `src/pages/EstoqueMovimentacoes.tsx`

**Ajustes:**

```text
1. Lojas de Origem/Destino - Usar apenas lojas cadastradas
   - Linha 291-300: AutocompleteLoja ja implementado
   - Verificar se apenasLojasTipoLoja esta ativado

2. Ordem de Colunas - Alterar para: Modelo > IMEI > ID
   - Linha 470-490: Reordenar TableHead e TableCell

3. Filtro por IMEI - Adicionar campo de filtro
   - Adicionar estado imeiFilter
   - Adicionar Input de busca na area de filtros
   - Aplicar filtro no useMemo de movimentacoesFiltradas

4. Modal de Selecao de Produto - Corrigir redimensionamento
   - Linha 530-620: Dialog do modal de busca
   - Adicionar max-h-[80vh] overflow-hidden no DialogContent
   - Usar fixed height no ScrollArea interno
```

### 7.2 Movimentacoes Acessorios

**Arquivo a Modificar**
- `src/pages/EstoqueMovimentacoesAcessorios.tsx`

**Ajustes:**

```text
Ordem de Colunas - Alterar para: Acessorio > ID (demais seguem)
Nota: Acessorios nao possuem IMEI, entao ordem sera: Acessorio > ID > Data > Qtd...

Linha 424-435: Reordenar TableHead
```

---

## 8. Retirada de Pecas - Icone Tesoura em Pendentes

### Situacao Atual
- Botao de retirada de pecas existe apenas em Estoque > Produtos

### Solucao
- Adicionar mesmo botao na aba Aparelhos Pendentes

### Arquivo a Modificar
- `src/pages/EstoqueProdutosPendentes.tsx`

### Implementacao Detalhada

```text
1. Importar componente ModalRetiradaPecas
2. Adicionar estado para controle do modal
3. Adicionar coluna "Acoes" na tabela com icone tesoura
4. Verificar elegibilidade com verificarDisponibilidadeRetirada()
5. Ao clicar, abrir modal de retirada de pecas

Adicionar nas imports:
import { ModalRetiradaPecas } from '@/components/estoque/ModalRetiradaPecas';
import { verificarDisponibilidadeRetirada } from '@/utils/retiradaPecasApi';
import { Scissors } from 'lucide-react';

Adicionar estados:
const [showRetiradaModal, setShowRetiradaModal] = useState(false);
const [produtoRetirada, setProdutoRetirada] = useState<ProdutoPendente | null>(null);

Adicionar botao na tabela (coluna Acoes):
<Button 
  variant="ghost" 
  size="sm"
  onClick={() => {
    setProdutoRetirada(produto);
    setShowRetiradaModal(true);
  }}
  title="Retirada de Pecas"
>
  <Scissors className="h-4 w-4" />
</Button>
```

---

## Sequencia de Implementacao

| Ordem | Item | Complexidade | Arquivos |
|-------|------|--------------|----------|
| 1 | SLA formato "X dias e Y horas" | Baixa | osApi.ts, EstoqueProdutosPendentes.tsx |
| 2 | Largura colunas Notas | Baixa | EstoqueNotaCadastrarProdutos.tsx |
| 3 | Responsavel automatico Matriz | Baixa | EstoqueNovaMovimentacaoMatriz.tsx |
| 4 | Ordem colunas Movimentacoes | Baixa | EstoqueMovimentacoes.tsx, EstoqueMovimentacoesAcessorios.tsx |
| 5 | Filtro IMEI Movimentacoes | Baixa | EstoqueMovimentacoes.tsx |
| 6 | Corrigir modal selecao produto | Media | EstoqueMovimentacoes.tsx |
| 7 | Botao Retirada Pecas Pendentes | Media | EstoqueProdutosPendentes.tsx |
| 8 | Sincronizacao estoque minimo | Media | EstoqueProdutos.tsx, CadastrosAcessorios.tsx |
| 9 | Fluxo Semi-novo vs Novo | Media | notaEntradaFluxoApi.ts, EstoqueNotaConferencia.tsx |
| 10 | Buffer de Anexos | Alta | EstoqueNotaCadastrar.tsx, novo componente |
| 11 | Detalhes Matriz tela cheia + 3 quadros | Alta | Nova pagina + EstoqueMovimentacoesMatriz.tsx |

---

## Resultado Esperado

Apos implementacao:
- Alertas visuais quando estoque de aparelhos atingir limite minimo
- SLA exibido no formato "X dias e Y horas" para maior clareza
- Colunas de Categoria e Custo Unitario com largura adequada
- Possibilidade de anexar documentos temporarios as notas
- Aparelhos novos vao direto para estoque, seminovos para pendentes
- Responsavel das movimentacoes matriz preenchido automaticamente
- Detalhamento de movimentacoes matriz em tela cheia com 3 quadros
- Interface de conferencia de retorno intuitiva com fluxo de devolucao
- Tabela de movimentacoes com ordem de colunas corrigida e filtro IMEI
- Modal de selecao de produto com tamanho adequado
- Botao de retirada de pecas disponivel tambem em Aparelhos Pendentes
