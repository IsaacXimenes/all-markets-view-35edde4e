

# Plano: Espelhar Tabela de Conferencia de Contas na Aba Emissao NFE

## Resumo da Alteracao

Modificar a aba "Emissao - NFE" no Teto Bancario para exibir os lancamentos no mesmo formato da tela de Conferencia de Contas, mostrando apenas os registros com status "Finalizado".

---

## Situacao Atual vs Desejada

| Aspecto | Atual (NFE) | Desejado (Espelho Conferencia) |
|---------|-------------|--------------------------------|
| Agrupamento | 1 linha por venda | 1 linha por metodo de pagamento |
| Colunas | ID, Data, Cliente, Valor Total, Status Nota, Acoes | ID Venda, Data, SLA, Metodo Pagamento, Valor, Conta Destino, Situacao, Status, Acoes |
| Fonte de dados | vendasAgrupadas | linhasConferencia (filtrado por Finalizado) |
| Estilo | Simples | Igual a Conferencia de Contas |

---

## Alteracoes Tecnicas

### Arquivo: `src/pages/FinanceiroTetoBancario.tsx`

**1. Importar hook useFluxoVendas**
```text
import { useFluxoVendas } from '@/hooks/useFluxoVendas';
```

**2. Adicionar logica de linhas de conferencia (igual FinanceiroConferencia)**
- Reutilizar a estrutura `LinhaConferencia` 
- Criar useMemo que processa vendas finalizadas em linhas por metodo de pagamento
- Buscar validacoes do localStorage para cada venda

**3. Atualizar estrutura da tabela na aba NFE**

Colunas novas (espelho de Conferencia de Contas):
- ID Venda
- Data
- SLA (tempo desde entrada no financeiro)
- Metodo Pagamento (Badge)
- Valor (por metodo)
- Conta Destino
- Situacao (Conferido)
- Status (Finalizado)
- Acoes (Olho para detalhes + Botao Gerar Nota)

**4. Logica de geracao de nota por linha**
- Quando clicar em "Gerar Nota" em uma linha, marca o vendaId como nota emitida
- Todas as linhas do mesmo vendaId mudam de cor para verde
- Valor distribuido por conta conforme cada pagamento

---

## Estrutura da Nova Tabela NFE

```text
+----------+------------+--------+------------------+---------------+----------------------+-----------+-------------+---------------+
| ID Venda | Data       | SLA    | Metodo Pagamento | Valor         | Conta Destino        | Situacao  | Status      | Acoes         |
+----------+------------+--------+------------------+---------------+----------------------+-----------+-------------+---------------+
| VEN-0001 | 15/01/2025 | 2h 30m | Pix              | R$ 8.500,00   | Matriz - Bradesco    | Conferido | Finalizado  | [O] [Gerar]   |
| VEN-0001 | 15/01/2025 | 2h 30m | Cartao Credito   | R$ 6.000,00   | JK - Santander       | Conferido | Finalizado  | [O] [Gerar]   |
| VEN-0002 | 16/01/2025 | 1h 45m | Dinheiro         | R$ 11.350,00  | Matriz - Caixa       | Conferido | Finalizado  | [O] ----      |
+----------+------------+--------+------------------+---------------+----------------------+-----------+-------------+---------------+
```

- Linhas verdes: Nota ja emitida para aquela venda
- Linhas brancas: Pendente de emissao
- [O] = Icone de olho (detalhar venda)
- [Gerar] = Botao para gerar nota (some apos emitir)

---

## Fluxo de Dados

```text
useFluxoVendas({ status: 'Finalizado' })
        |
        v
Processar vendas finalizadas
        |
        v
Para cada venda:
  - Buscar validacoes do localStorage
  - Criar 1 linha por metodo de pagamento
  - Incluir conta destino, valor, situacao
        |
        v
linhasConferenciaNFE[]
        |
        v
Renderizar tabela espelhada
```

---

## Implementacao Detalhada

### Novo useMemo para linhas NFE

```text
const linhasNFE = useMemo(() => {
  const linhas = [];
  const vendasFinalizadas = getVendasPorStatus('Finalizado');
  
  vendasFinalizadas.forEach(venda => {
    // Verificar se esta no periodo selecionado
    const dataFinalizacao = localStorage.getItem(`data_finalizacao_${venda.id}`);
    if (!dataFinalizacao) return;
    
    const data = new Date(dataFinalizacao);
    if (data.getMonth() !== mesSelecionado || data.getFullYear() !== anoSelecionado) return;
    
    // Buscar validacoes
    const validacoes = localStorage.getItem(`validacao_pagamentos_financeiro_${venda.id}`);
    
    // Criar linha para cada pagamento
    venda.pagamentos?.forEach(pag => {
      linhas.push({
        vendaId: venda.id,
        venda,
        metodoPagamento: pag.meioPagamento,
        valor: pag.valor,
        contaDestinoId: pag.contaDestino,
        contaDestinoNome: obterNomeConta(pag.contaDestino),
        conferido: true, // Sempre true pois esta Finalizado
        notaEmitida: isNotaEmitida(venda.id),
        dataVenda: venda.dataHora,
        clienteNome: venda.clienteNome
      });
    });
  });
  
  return linhas.sort((a, b) => 
    new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime()
  );
}, [mesSelecionado, anoSelecionado, refreshKey]);
```

---

## Resultado Esperado

Apos implementacao:
- Aba "Emissao - NFE" exibe tabela identica a Conferencia de Contas
- Apenas vendas com status "Finalizado" aparecem
- Cada metodo de pagamento aparece em linha separada
- Colunas: ID Venda, Data, SLA, Metodo, Valor, Conta Destino, Situacao, Status, Acoes
- Linhas do mesmo vendaId ficam verdes apos gerar nota
- Botao "Gerar Nota" aparece apenas para vendas sem nota emitida

