

# Plano: Emissao NFE e Controle de Teto Bancario

## Resumo da Funcionalidade

Implementar uma nova aba "Emissao - NFE" dentro da pagina Teto Bancario que permitira:
- Visualizar vendas finalizadas agrupadas por venda (nao por pagamento individual)
- Gerar notas fiscais eletronicas com confirmacao em duas etapas
- Atualizar automaticamente o campo "Valor de Notas Emitidas" nos cards de cada conta bancaria
- Rastrear quais vendas ja tiveram notas emitidas

---

## Arquitetura da Solucao

```text
+----------------------------+
|  FinanceiroTetoBancario    |
|  (pagina principal)        |
+----------------------------+
          |
          v
+----------------------------+
|  Sistema de Abas           |
|  - Visao Geral (atual)     |
|  - Emissao NFE (NOVA)      |
+----------------------------+
          |
          v
+----------------------------+     +-------------------------+
|  Tabela Vendas Agrupadas   |---->|  Modal Detalhes Venda   |
|  (vendaId unico)           |     |  (Dialog fullscreen)    |
+----------------------------+     +-------------------------+
          |
          v
+----------------------------+     +-------------------------+
|  Botao "Gerar Nota"        |---->|  Sheet Confirmacao      |
|  (por linha)               |     |  (2 etapas)             |
+----------------------------+     +-------------------------+
          |
          v
+----------------------------+
|  Atualiza valorNotasEmitidas|
|  por conta bancaria         |
+----------------------------+
```

---

## Componentes a Criar/Modificar

### 1. Arquivo Principal: `src/pages/FinanceiroTetoBancario.tsx`

**Modificacoes:**

1. **Adicionar sistema de abas** usando componente `Tabs` do Radix UI
2. **Criar aba "Emissao - NFE"** que exibe vendas finalizadas agrupadas
3. **Adicionar estado para notas emitidas** no localStorage
4. **Novo campo nos cards**: "Valor de Notas Emitidas"

### 2. Estrutura de Dados

```text
Interface VendaAgrupada:
  - vendaId: string
  - clienteNome: string
  - dataVenda: string
  - valorTotal: number
  - pagamentos: Array<{contaId, valor, metodo}>
  - notaEmitida: boolean
  - dataEmissaoNota?: string

localStorage Keys:
  - notas_emitidas_{vendaId}: boolean
  - data_emissao_nota_{vendaId}: string
  - valor_notas_emitidas_por_conta: Record<contaId, number>
```

---

## Detalhamento Tecnico

### Etapa 1: Sistema de Abas

```text
Adicionar imports:
  - Tabs, TabsContent, TabsList, TabsTrigger de @/components/ui/tabs

Estrutura:
  <Tabs defaultValue="visao-geral">
    <TabsList>
      <TabsTrigger value="visao-geral">Visao Geral</TabsTrigger>
      <TabsTrigger value="emissao-nfe">Emissao - NFE</TabsTrigger>
    </TabsList>
    <TabsContent value="visao-geral">
      {/* Conteudo atual da pagina */}
    </TabsContent>
    <TabsContent value="emissao-nfe">
      {/* Nova tabela de vendas para emissao */}
    </TabsContent>
  </Tabs>
```

### Etapa 2: Tabela de Vendas Agrupadas

**Fonte de dados:** Reutilizar logica de `FinanceiroConferencia.tsx`

```text
Colunas da Tabela:
  - ID Venda
  - Data
  - Cliente
  - Valor Total (soma de todos os pagamentos)
  - Metodos de Pagamento (badge resumo)
  - Status Nota (Badge: "Pendente" ou "Nota Emitida")
  - Acoes (Icone Olho + Botao Gerar Nota)

Logica de Agrupamento:
  const vendasAgrupadas = useMemo(() => {
    return vendas
      .filter(v => v.statusFluxo === 'Finalizado')
      .map(venda => ({
        vendaId: venda.id,
        clienteNome: venda.clienteNome,
        dataVenda: venda.dataHora,
        valorTotal: venda.total,
        pagamentos: venda.pagamentos || [],
        notaEmitida: localStorage.getItem(`nota_emitida_${venda.id}`) === 'true'
      }));
  }, [vendas]);
```

### Etapa 3: Modal de Detalhes (Dialog Fullscreen)

```text
Componente: Dialog com className="max-w-4xl max-h-[90vh]"

Conteudo:
  - Cabecalho com ID e Cliente
  - Grid com informacoes da venda
  - Tabela de produtos vendidos
  - Tabela de distribuicao de pagamentos por conta
  - Timeline da venda (opcional)
```

### Etapa 4: Sheet de Confirmacao (2 Etapas)

```text
Etapa 1 - Resumo:
  - Exibir resumo da venda
  - Lista de pagamentos que serao vinculados
  - Botao "Continuar para Confirmacao"

Etapa 2 - Confirmacao Final:
  - Mensagem de aviso
  - Checkbox "Confirmo que desejo gerar a nota fiscal"
  - Botao "Confirmar Emissao" (desabilitado ate marcar checkbox)
```

### Etapa 5: Logica de Distribuicao

```text
Ao confirmar emissao:

1. Marcar venda como nota emitida:
   localStorage.setItem(`nota_emitida_${vendaId}`, 'true')
   localStorage.setItem(`data_emissao_nota_${vendaId}`, new Date().toISOString())

2. Atualizar valorNotasEmitidas por conta:
   venda.pagamentos.forEach(pag => {
     const contaId = pag.contaDestino
     const valorAtual = getValorNotasEmitidas(contaId, mes, ano)
     setValorNotasEmitidas(contaId, mes, ano, valorAtual + pag.valor)
   })

3. Recarregar dados da tabela e cards
```

### Etapa 6: Atualizacao dos Cards

```text
Novo campo em cada card de conta:

<div className="flex justify-between items-center">
  <span className="text-sm text-muted-foreground">Notas Emitidas</span>
  <span className="text-lg font-bold text-blue-600">
    {formatCurrency(valorNotasEmitidas[conta.id] || 0)}
  </span>
</div>

Calculo respeita o mesmo filtro de periodo (mes/ano) ja aplicado
```

---

## Interface Visual

### Tabela Emissao NFE

```text
+----------+------------+------------------+---------------+------------------+---------------+
| ID Venda | Data       | Cliente          | Valor Total   | Status Nota      | Acoes         |
+----------+------------+------------------+---------------+------------------+---------------+
| VEN-0001 | 15/01/2025 | Joao Silva       | R$ 14.500,00  | [Pendente]       | [O] [Gerar]   |
| VEN-0002 | 16/01/2025 | Maria Santos     | R$ 11.350,00  | [Nota Emitida]   | [O] ----      |
| VEN-0003 | 17/01/2025 | Pedro Oliveira   | R$ 6.500,00   | [Pendente]       | [O] [Gerar]   |
+----------+------------+------------------+---------------+------------------+---------------+
```

- Linhas verdes: Nota ja emitida
- Linhas brancas: Pendente
- [O] = Icone de olho (detalhar)
- [Gerar] = Botao para gerar nota

### Card de Conta com Novo Campo

```text
+----------------------------------+
|  Bradesco Thiago Eduardo         |
|  Loja Matriz                     |
+----------------------------------+
|  Vendas no Periodo    R$ 77.000  |
|  Qtd. Vendas               5     |
|  Notas Emitidas       R$ 42.000  | <- NOVO CAMPO
+----------------------------------+
|  [====75%============] 75% teto  |
+----------------------------------+
```

---

## Arquivos a Serem Modificados

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/pages/FinanceiroTetoBancario.tsx` | Adicionar abas, tabela NFE, modal detalhes, sheet confirmacao, logica de emissao |
| `src/components/ui/tabs.tsx` | Ja existe, apenas usar |
| `src/components/ui/sheet.tsx` | Ja existe, apenas usar |

---

## Consideracoes de Implementacao

1. **Responsividade**: Manter padroes existentes do sistema (branco com detalhes pretos)

2. **Persistencia**: Usar localStorage para armazenar:
   - Status de nota emitida por venda
   - Data de emissao
   - Valor de notas emitidas por conta/periodo

3. **Filtragem**: Respeitar filtro de periodo (mes/ano) existente

4. **Feedback Visual**: Toast de sucesso apos emissao + mudanca de cor da linha

5. **Seguranca**: Confirmacao em 2 etapas para evitar cliques acidentais

---

## Resultado Esperado

Apos implementacao:
- Nova aba "Emissao - NFE" na pagina Teto Bancario
- Tabela com vendas finalizadas agrupadas por vendaId
- Modal fullscreen para ver detalhes da venda
- Sheet lateral com confirmacao em 2 etapas
- Cards de conta mostrando "Valor de Notas Emitidas"
- Linha muda para verde apos emitir nota
- Dados persistidos no localStorage por periodo

