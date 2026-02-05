
# Plano de Implementacao Completo - Sistema de Vendas, Estoque e Conferencia

## Resumo Executivo

Este plano aborda a implementacao de melhorias criticas em 3 modulos principais:
1. **Vendas**: Quadro de Trade-In Inteligente, Fiado Flexivel e ajustes de interface
2. **Estoque**: Nova aba "Pendencias - Base de Trocas" e ajustes no fluxo Matriz
3. **Conferencia**: Sincronizacao de logistica e validacoes financeiras

---

## MODULO 1: VENDAS

### 1.1 Quadro de Base de Troca Inteligente

**Arquivo**: `src/pages/VendasNova.tsx` (linhas 2827-2939)
**Arquivo**: `src/utils/vendasApi.ts` (interface ItemTradeIn)

**Alteracoes na Interface ItemTradeIn:**
```
interface ItemTradeIn {
  // campos existentes...
  tipoEntrega: 'Entregue no Ato' | 'Com o Cliente';  // NOVO - obrigatorio
  termoResponsabilidade?: AnexoTemporario;           // NOVO - buffer anexo
  fotosAparelho?: AnexoTemporario[];                 // NOVO - buffer anexos
  dataRegistro?: string;                             // NOVO - para SLA
}
```

**Modificacoes no Modal Trade-In:**
- Adicionar campo Select abaixo do IMEI: "Tipo de Entrega"
  - Opcao 1: "Aparelho entregue no ato da Venda"
  - Opcao 2: "Aparelho com o Cliente"
- Quando "Aparelho com o Cliente" selecionado:
  - Exibir campo de upload "Termo de Responsabilidade" (obrigatorio)
  - Exibir campo de upload "Fotos do Aparelho" (obrigatorio, multiplas)
  - Reutilizar logica do componente BufferAnexos existente
  - Validar que ambos os campos estao preenchidos antes de permitir salvar

**Scanner de Codigo de Barras:**
- Ja existe implementado (linhas 2891-2898 e 2941-2957)
- O componente BarcodeScanner ja esta funcional com linha guia horizontal

### 1.2 Quadro de Pagamento - Fiado Flexivel

**Arquivo**: `src/components/vendas/PagamentoQuadro.tsx`
**Arquivo**: `src/utils/vendasApi.ts` (interface Pagamento - ja possui campos)

A interface Pagamento ja possui os campos necessarios:
- `fiadoTipoRecorrencia: 'Mensal' | 'Semanal'`
- `fiadoDataBase: number` (dia do mes para Mensal)
- `fiadoIntervaloDias: number` (intervalo para Semanal)

**Ajustes na UI do PagamentoQuadro:**
- Ao selecionar "Fiado/Sinal" como meio de pagamento:
  - Exibir Select "Tipo de Recorrencia": Mensal | Semanal
  - Se Mensal: Exibir campo numerico "Dia do Vencimento" (1-31)
  - Se Semanal: Exibir Select "Intervalo" com opcoes: 7, 14, 15, 21 dias
  - Calcular e exibir preview das datas de parcelas

### 1.3 Ajustes de Interface e Logistica

**Arquivo**: `src/pages/VendasNova.tsx` (linhas 1950-2114)

**Zerar Frete ao Mudar Tipo de Retirada:**
- Ja implementado (linhas 1964-1970)
- Verificar sincronizacao com Conferencia Lancamento

**Arquivo**: `src/pages/Vendas.tsx` (tabela de historico)

**Reordenar Colunas da Tabela:**
- Ordem atual: ID > Data > Cliente > Resp. Venda > V. Custo > V. Venda > Lucro > Margem
- Nova ordem: Modelo > Loja > IMEI > ID Venda > Data/Hora > Cliente > Resp. Venda > V. Custo > V. Venda > Lucro > Margem
- Remover colunas "Resp. Loja" e "Valor Recomendado" da tabela principal

**Modal de Acessorios:**
- Ajustar DialogContent para `max-w-6xl max-h-[85vh]` conforme padrao do sistema

---

## MODULO 2: ESTOQUE

### 2.1 Nova Aba "Pendencias - Base de Trocas"

**Novos Arquivos a Criar:**
- `src/pages/EstoquePendenciasBaseTrocas.tsx` (pagina principal)
- `src/utils/baseTrocasPendentesApi.ts` (API de dados)

**Modificar Layout:**
- `src/components/layout/EstoqueLayout.tsx` - adicionar nova aba

**Estrutura da Tabela:**
| Coluna | Descricao |
|--------|-----------|
| ID Venda | Referencia da venda original |
| Cliente | Nome do cliente |
| Modelo | Modelo do aparelho trade-in |
| IMEI | IMEI formatado |
| Valor Trade-In | Valor acordado |
| SLA Devolucao | Timer "X dias e Y horas" desde a venda |
| Status | Aguardando Devolucao |
| Acoes | Botao "Registrar Recebimento" |

**Modal "Registrar Recebimento":**
- Exibir fotos originais da venda (carrossel para comparacao)
- Campo de upload para novas fotos do estado de recebimento
- Botao "Confirmar Recebimento":
  - Encerra SLA de Devolucao
  - Move aparelho para Estoque > Produtos Pendentes
  - Inicia SLA de Tratativas (parecer estoque + assistencia)

**Formato do SLA:**
```
const calcularSLA = (dataVenda: string) => {
  const diff = Date.now() - new Date(dataVenda).getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${dias} dias e ${horas} horas`;
};
```

### 2.2 Movimentacoes - Matriz (Ajustes)

**Arquivo**: `src/pages/EstoqueMovimentacoesMatriz.tsx`
**Arquivo**: `src/pages/EstoqueMovimentacaoMatrizDetalhes.tsx`

**Preenchimento Automatico do Responsavel:**
- Na nova movimentacao, preencher automaticamente com usuario logado do `authStore`

**Estrutura de 3 Quadros (Ja Implementada):**
- Verificar se o botao "Desfazer Conferencia" (Undo2) esta funcionando corretamente
- Ja existe implementacao em linhas 144-159

### 2.3 Ajustes Gerais de Estoque

**Sincronizacao de Limite Minimo:**
- O limite de estoque minimo para aparelhos deve ser sincronizado com Cadastros > Acessorios
- Verificar integracao com `useCadastroStore`

**Notas de Entrada:**
- Alargar colunas "Categoria" e "Custo Unitario" na tabela

**Fluxo Novo vs Semi-novo:**
- Ja implementado conforme memoria `estoque-novo-vs-seminovo-routing`
- Verificar funcao `migrarAparelhoNovoParaEstoque`

**Icone Tesoura em Produtos Pendentes:**
- Ja existe conforme memoria `estoque/retirada-pecas-unified-v4`
- Verificar se aparece corretamente

---

## MODULO 3: FINANCEIRO E CONFERENCIA

### 3.1 Conferencia de Lancamento

**Arquivo**: `src/pages/VendasConferenciaLancamento.tsx`
**Arquivo**: `src/pages/VendasEditar.tsx`

**Sincronizacao do Quadro Retirada/Logistica:**
- Garantir que ao mudar de "Entrega" para "Retirada", o frete seja zerado
- Reutilizar mesma logica de `VendasNova.tsx`

**Validacao de Sinal:**
- Ja implementado com tolerancia de 0.01 conforme memoria `financial-calculation-tolerance`
- Verificar se botao "Salvar" habilita quando:
  - `Math.abs(valorPendente) <= 0.01 || valorPendente <= 0`

### 3.2 Conferencia - Gestor

**Arquivo**: `src/pages/VendasConferenciaGestor.tsx`

**Filtro por Conta Destino:**
- Ja implementado (linhas 86 e 125-129)
- `filtroContaDestino` com estado e filtro aplicado

### 3.3 Seguranca de Contas na Venda

**Arquivo**: `src/components/vendas/PagamentoQuadro.tsx`

**Filtrar Contas por Loja:**
- Receber `lojaVendaId` como prop (ja existe)
- No Select de "Conta de Destino", filtrar apenas contas vinculadas a loja:
```
contasFinanceiras.filter(c => c.lojaId === lojaVendaId)
```

---

## ARQUIVOS A CRIAR

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/EstoquePendenciasBaseTrocas.tsx` | Nova aba de pendencias de trade-in |
| `src/utils/baseTrocasPendentesApi.ts` | API para gerenciar trade-ins pendentes |

## ARQUIVOS A MODIFICAR

| Arquivo | Alteracoes |
|---------|------------|
| `src/components/layout/EstoqueLayout.tsx` | Adicionar aba "Pendencias - Base de Trocas" |
| `src/pages/VendasNova.tsx` | Modal trade-in com campos de entrega e anexos |
| `src/utils/vendasApi.ts` | Atualizar interface ItemTradeIn |
| `src/components/vendas/PagamentoQuadro.tsx` | Campos de recorrencia Fiado e filtro de contas |
| `src/pages/Vendas.tsx` | Reordenar colunas da tabela |
| `src/pages/VendasConferenciaLancamento.tsx` | Sincronizar logica de frete |
| `src/pages/VendasEditar.tsx` | Sincronizar logica de frete |
| `src/App.tsx` | Adicionar rota para nova pagina |

---

## DETALHES TECNICOS

### Interface Atualizada - ItemTradeIn

```text
interface ItemTradeIn {
  id: string;
  produtoId?: string;
  modelo: string;
  descricao: string;
  imei: string;
  valorCompraUsado: number;
  imeiValidado: boolean;
  condicao: 'Novo' | 'Semi-novo';
  // NOVOS CAMPOS
  tipoEntrega: 'Entregue no Ato' | 'Com o Cliente';
  termoResponsabilidade?: {
    id: string;
    nome: string;
    tipo: string;
    tamanho: number;
    dataUrl: string;
  };
  fotosAparelho?: {
    id: string;
    nome: string;
    tipo: string;
    tamanho: number;
    dataUrl: string;
  }[];
  dataRegistro?: string;
}
```

### Interface - TradeInPendente (Nova)

```text
interface TradeInPendente {
  id: string;
  vendaId: string;
  clienteId: string;
  clienteNome: string;
  tradeIn: ItemTradeIn;
  dataVenda: string;
  status: 'Aguardando Devolucao' | 'Recebido';
  fotosRecebimento?: AnexoTemporario[];
  dataRecebimento?: string;
  responsavelRecebimento?: string;
}
```

### Fluxo de Trade-In com Cliente

```text
1. [VENDA] Vendedor registra trade-in como "Com o Cliente"
   - Anexa Termo de Responsabilidade (obrigatorio)
   - Anexa Fotos do Aparelho (obrigatorio)
   
2. [ESTOQUE] Registro aparece em "Pendencias - Base de Trocas"
   - Timer SLA começa a contar
   - Status: "Aguardando Devolução"
   
3. [ESTOQUE] Cliente devolve aparelho
   - Estoquista clica "Registrar Recebimento"
   - Modal exibe fotos originais para comparação
   - Estoquista anexa novas fotos do estado atual
   - Confirma recebimento
   
4. [ESTOQUE] Aparelho migra para "Produtos Pendentes"
   - SLA de Devolução encerra
   - SLA de Tratativas inicia
   - Fluxo normal de parecer Estoque + Assistência
```

### Validacoes Obrigatorias

**Trade-In "Com o Cliente":**
- Termo de Responsabilidade: obrigatorio (pelo menos 1 arquivo)
- Fotos do Aparelho: obrigatorio (pelo menos 1 foto)
- Se campos vazios: bloquear botao "Adicionar" no modal

**Registro de Recebimento:**
- Fotos de Recebimento: obrigatorio (pelo menos 1 foto)
- Responsavel: preenchido automaticamente com usuario logado

---

## ORDEM DE IMPLEMENTACAO SUGERIDA

1. **Fase 1 - Infraestrutura**
   - Criar API `baseTrocasPendentesApi.ts`
   - Atualizar interface ItemTradeIn
   - Adicionar rota no App.tsx

2. **Fase 2 - Estoque**
   - Criar pagina `EstoquePendenciasBaseTrocas.tsx`
   - Atualizar EstoqueLayout com nova aba
   - Implementar modal de recebimento

3. **Fase 3 - Vendas**
   - Modificar modal trade-in em VendasNova
   - Adicionar campos de upload (reutilizar BufferAnexos)
   - Implementar validacoes

4. **Fase 4 - Conferencia**
   - Sincronizar logica de frete
   - Verificar validacoes de Fiado

5. **Fase 5 - Ajustes Finais**
   - Reordenar colunas tabela Vendas
   - Ajustar modais de acessorios
   - Testes de integracao
