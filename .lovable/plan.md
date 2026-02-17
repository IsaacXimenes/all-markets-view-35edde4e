

## Corrigir Seleção de Peça na Edição + Histórico de Movimentação no Estoque

### Parte 1: Bug na Edição de OS - Peça no Estoque não carrega descrições

**Problema:** No arquivo `OSAssistenciaEditar.tsx` (linhas 530-532), ao selecionar "Peça no estoque", o `updatePeca` é chamado 3 vezes em sequência para campos diferentes (`pecaNoEstoque`, `pecaDeFornecedor`, `servicoTerceirizado`). Cada chamada cria uma cópia do estado atual, então apenas a última atualização prevalece - as anteriores são perdidas. Isso faz com que `pecaNoEstoque` nunca fique `true`.

Na tela de Nova Assistência, isso funciona porque as 3 propriedades são atualizadas em um único objeto batch (linhas 1168-1175).

**Correção:** Arquivo `src/pages/OSAssistenciaEditar.tsx` - Substituir as 3 chamadas `updatePeca` por uma atualização batch idêntica ao padrão da Nova Assistência:

```text
onValueChange={(val) => {
  const newPecas = [...pecas];
  newPecas[index] = {
    ...newPecas[index],
    pecaNoEstoque: val === 'estoque',
    pecaDeFornecedor: val === 'fornecedor',
    servicoTerceirizado: val === 'terceirizado',
  };
  setPecas(newPecas);
}}
```

---

### Parte 2: Histórico de Movimentação de Peças no Estoque

**Arquivo: `src/utils/pecasApi.ts`**

1. Criar interface `MovimentacaoPeca` com campos:
   - `id`, `pecaId`, `tipo` ("Entrada" | "Saída" | "Reserva"), `quantidade`, `data`, `osId?`, `descricao`
2. Criar array `movimentacoesPecas` para armazenar o histórico
3. Criar dados mockados iniciais (entradas iniciais das peças base)
4. Atualizar `darBaixaPeca` para registrar automaticamente uma movimentação de saída com o ID da OS
5. Atualizar `addPeca` para registrar automaticamente uma movimentação de entrada
6. Exportar funções: `getMovimentacoesByPecaId()` e `addMovimentacaoPeca()`

**Arquivo: `src/pages/OSPecas.tsx`**

1. Adicionar botão de ícone (History) na coluna de Ações, ao lado do botão "Visualizar" existente
2. Criar modal "Histórico de Movimentação" que exibe:
   - Quantidade inicial (entrada)
   - Lista de movimentações com: data, tipo (badge colorido), quantidade, OS que usou, descrição
   - Quantidade atual restante (em destaque)
3. O modal mostra a timeline completa da peça: de onde veio, quem usou e quanto resta

**Arquivo: `src/pages/OSAssistenciaNova.tsx`**

1. Atualizar a chamada de `darBaixaPeca` para passar também o ID da OS, registrando qual OS consumiu a peça

---

### Detalhes Técnicos

**Interface MovimentacaoPeca:**
```text
interface MovimentacaoPeca {
  id: string;
  pecaId: string;
  tipo: 'Entrada' | 'Saída' | 'Reserva';
  quantidade: number;
  data: string;
  osId?: string;
  descricao: string;
}
```

**Assinatura atualizada de darBaixaPeca:**
```text
darBaixaPeca(id: string, quantidade?: number, osId?: string)
```

**Modal no OSPecas - informações exibidas:**
- Cabecalho: nome da peça, modelo, loja
- Tabela de movimentações ordenada por data (mais recente primeiro)
- Colunas: Data, Tipo (badge), Qtd, OS/Referência, Descrição
- Rodapé: "Quantidade disponível atual: X unidades"
