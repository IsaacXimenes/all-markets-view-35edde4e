
# Plano: Implementação de Melhorias nos Módulos de Assistência, Garantia e Estoque

## Visão Geral
Este plano implementa 4 melhorias solicitadas:
1. Campo "Vendedor" com Autocomplete no módulo de Assistência (Nova OS)
2. Campo "Loja" sincronizado com Cadastros no módulo de Garantia (Nova Manual)
3. Modal "Buscar Cliente" padronizado entre Garantia e Vendas
4. Status "Empréstimo - Assistência" no Estoque com bloqueio de venda

---

## 1. Campo Vendedor no Módulo de Assistência

**Arquivo:** `src/pages/OSAssistenciaNova.tsx`

### Alterações:
- Adicionar novo campo "Vendedor" no quadro "Informações da OS"
- Utilizar o componente `AutocompleteColaborador` já existente
- Filtrar por vendedores usando `filtrarPorTipo="vendedoresEGestores"`
- Armazenar o `vendedorId` no state e incluir ao criar a OS

### Estrutura proposta:
```text
Quadro "Informações da OS"
├── Loja (já existe)
├── Técnico (já existe)  
├── Vendedor (NOVO) ← AutocompleteColaborador
├── Setor (já existe)
└── Status (já existe)
```

---

## 2. Campo Loja Sincronizado no Módulo de Garantia

**Arquivo:** `src/pages/GarantiasNovaManual.tsx`

### Problema Atual:
- Usa `getLojas()` de `cadastrosApi` que retorna todas as lojas (incluindo Estoque, Assistência, etc.)
- Não filtra apenas lojas ativas do tipo "Loja"

### Solução:
- Substituir `getLojas()` por `useCadastroStore().obterLojasTipoLoja()`
- Substituir o `<Select>` estático pelo `<AutocompleteLoja>` com `apenasLojasTipoLoja={true}`

---

## 3. Modal Buscar Cliente Padronizado

**Arquivo:** `src/pages/GarantiasNovaManual.tsx`

### Problema Atual:
O modal de cliente em `GarantiasNovaManual` tem estrutura simplificada diferente do modal de `VendasNova.tsx`.

### Solução - Replicar estrutura do VendasNova:

| Característica | VendasNova (referência) | GarantiasNovaManual (ajustar) |
|----------------|-------------------------|-------------------------------|
| Tamanho Modal | `max-w-4xl` | Aplicar `max-w-4xl` |
| Colunas Tabela | CPF, Nome, Tipo Pessoa, Tipo Cliente, Status, Telefone, Ações | Adicionar mesmas colunas |
| Busca | Input com placeholder "Buscar por nome ou CPF..." | Manter padrão |
| Botão Novo Cliente | Presente com ícone `Plus` | Manter padrão |
| Validação Bloqueio | Verifica `status === 'Inativo'` e bloqueia seleção | Adicionar validação |

### Campos da Tabela (padronizados):
1. CPF/CNPJ
2. Nome
3. Tipo Pessoa (PF/PJ com badge colorido)
4. Tipo Cliente (VIP/Normal/Novo)
5. Status (Ativo/Bloqueado)
6. Telefone
7. Ações (Selecionar ou texto "Bloqueado")

---

## 4. Status "Empréstimo - Assistência" no Estoque

### 4.1 Alterações na Interface de Produto

**Arquivo:** `src/utils/estoqueApi.ts`

Adicionar novo campo na interface `Produto`:
```typescript
interface Produto {
  // ... campos existentes ...
  statusEmprestimo?: 'Empréstimo - Assistência' | null;
  emprestimoGarantiaId?: string; // ID da garantia vinculada
  emprestimoClienteId?: string;   // ID do cliente com o aparelho
  emprestimoClienteNome?: string; // Nome do cliente
  emprestimoOsId?: string;        // ID da OS vinculada (se houver)
}
```

### 4.2 Alterações na Tratativa de Empréstimo

**Arquivo:** `src/pages/GarantiasNovaManual.tsx`

Quando tratativa = "Assistência + Empréstimo":
- Atualizar produto com `statusEmprestimo: 'Empréstimo - Assistência'`
- Armazenar `emprestimoGarantiaId`, `emprestimoClienteId`, `emprestimoClienteNome`
- NÃO alterar `origemEntrada` (manter origem original)

### 4.3 Visualização no Estoque

**Arquivo:** `src/pages/Estoque.tsx` (aba Aparelhos)

Adicionar identificação visual:
- Badge/Tag `Empréstimo - Assistência` na linha do produto (similar a "Em movimentação")
- Cor de fundo diferenciada (ex: `bg-purple-500/10`)
- Tooltip com informações: Cliente, Garantia ID, Data

### 4.4 Bloqueio de Venda

**Arquivo:** `src/pages/VendasNova.tsx`

Na filtragem de produtos disponíveis:
```typescript
const produtosFiltrados = produtosEstoque.filter(p => {
  if (p.quantidade <= 0) return false;
  if (p.bloqueadoEmVendaId) return false;
  if (p.statusMovimentacao) return false;
  if (p.statusEmprestimo) return false; // NOVO: Bloquear empréstimos
  // ...
});
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Tipo | Alterações |
|---------|------|------------|
| `src/utils/estoqueApi.ts` | API | Adicionar campos de empréstimo na interface `Produto` |
| `src/pages/OSAssistenciaNova.tsx` | UI | Adicionar campo Vendedor com AutocompleteColaborador |
| `src/pages/GarantiasNovaManual.tsx` | UI | Sincronizar campo Loja + Padronizar modal cliente + Status empréstimo |
| `src/pages/Estoque.tsx` | UI | Exibir badge e identificação visual de empréstimo |
| `src/pages/VendasNova.tsx` | Lógica | Bloquear produtos com statusEmprestimo |

---

## Fluxo do Empréstimo (Diagrama)

```text
1. Garantia > Nova Manual
   └── Tratativa: "Assistência + Empréstimo"
       └── Selecionar aparelho Seminovo

2. Sistema atualiza Produto:
   ├── statusEmprestimo = 'Empréstimo - Assistência'
   ├── emprestimoGarantiaId = GAR-XXXX
   ├── emprestimoClienteId = CLI-XXX
   └── emprestimoClienteNome = "Nome Cliente"

3. No Estoque > Aparelhos:
   └── Linha do produto exibe:
       ├── Badge roxo "Empréstimo - Assistência"
       └── Tooltip: "Cliente: Nome | Garantia: GAR-XXXX"

4. Em Vendas > Nova Venda:
   └── Produto NÃO aparece na lista (bloqueado)

5. Ao registrar devolução:
   └── Limpar statusEmprestimo e campos relacionados
```

---

## Detalhes Técnicos

### Campo Vendedor (OSAssistenciaNova)
- Posição: Logo após o campo "Técnico"
- Componente: `<AutocompleteColaborador filtrarPorTipo="vendedoresEGestores" />`
- State: `vendedorId` (string)
- Persistência: Incluir no objeto `addOrdemServico()`

### Modal Cliente (GarantiasNovaManual)
- Dimensão: `max-w-4xl`
- Altura máxima tabela: `max-h-[400px] overflow-auto`
- Validação: Impedir seleção de clientes com `status === 'Inativo'`
- Formatação CPF/CNPJ: Usar função `formatCpfCnpj` existente

### Identificação Visual Empréstimo
- Cor badge: `bg-purple-500/10 text-purple-600 border-purple-500/30`
- Posição: Na coluna de Status ou como nova coluna "Situação"
- Ícone sugerido: `ArrowRightLeft` ou `Handshake`
