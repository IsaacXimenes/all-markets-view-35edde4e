

# Ajustes no Modal de Pecas e Movimentacao de Pecas

## Resumo

Duas alteracoes: (1) no modal de selecao de pecas da Nova OS e Editar OS, substituir a coluna "Valor Recomendado" por "Origem" e remover o campo "V. Recomendado" exibido apos selecao; (2) no formulario de Nova Movimentacao de Pecas, trocar o campo Destino de lojas tipo "Loja" para lojas tipo "Assistencia".

---

## 1. Modal de Selecao de Peca - Trocar "Valor Recomendado" por "Origem"

**Arquivos:** `src/pages/OSAssistenciaNova.tsx` e `src/pages/OSAssistenciaEditar.tsx`

### 1a. Cabecalho da tabela do modal

Em ambos os arquivos, substituir o `<TableHead>Valor Recomendado</TableHead>` por `<TableHead>Origem</TableHead>`.

### 1b. Linhas da tabela (pecas da minha loja e de outras lojas)

Em ambos os arquivos, substituir `<TableCell>{formatCurrency(p.valorRecomendado)}</TableCell>` por `<TableCell className="text-xs">{p.origem}</TableCell>` nas linhas de pecas da minha loja e de outras lojas.

### 1c. Remover campo "V. Recomendado" apos selecao

Apos selecionar uma peca do estoque, o sistema exibe dois campos lado a lado: "V. Recomendado" e "V. Custo". Remover o campo "V. Recomendado" e manter apenas "V. Custo" ocupando toda a largura (mudar de `grid-cols-2` para coluna unica).

Isso se aplica a ambos os arquivos:
- `OSAssistenciaNova.tsx` (linhas 1363-1377)
- `OSAssistenciaEditar.tsx` (linhas 899-913)

---

## 2. Movimentacao de Pecas - Destino como Assistencia

**Arquivo:** `src/pages/OSMovimentacaoPecas.tsx`

### 2a. Campo Destino no formulario de Nova Movimentacao

Na linha 527-532, o `<AutocompleteLoja>` usa `apenasLojasTipoLoja={true}` que filtra apenas lojas do tipo "Loja". Substituir por `filtrarPorTipo="Assistencia"` para listar apenas unidades de Assistencia.

### 2b. Campo Destino no formulario de Edicao

Na linha 764-767, o mesmo ajuste: substituir `apenasLojasTipoLoja={true}` por `filtrarPorTipo="Assistencia"`.

---

## Detalhes Tecnicos

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/pages/OSAssistenciaNova.tsx` | Tabela modal: coluna "Valor Recomendado" vira "Origem"; campo V. Recomendado removido apos selecao |
| `src/pages/OSAssistenciaEditar.tsx` | Mesmas alteracoes acima |
| `src/pages/OSMovimentacaoPecas.tsx` | Destino: `apenasLojasTipoLoja` substituido por `filtrarPorTipo="Assistencia"` em 2 locais |

### Sem novas dependencias

Todas as props (`filtrarPorTipo`, `origem`) ja existem nos componentes e tipos atuais.
