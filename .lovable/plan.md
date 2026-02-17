

## Plano: Remover "Abrir OS" + Gerenciar Peca Nao Utilizada na Oficina + Indicador de Anexo na Conferencia Gestor

### Parte 1: Remover botao "Abrir OS" do VendaDetalhes

**Arquivo: `src/pages/VendaDetalhes.tsx` (linhas 127-141)**

Remover o bloco do botao que navega para `/os/assistencia/nova?vendaId=...`. Manter apenas o botao "Imprimir Recibo".

---

### Parte 2: Botao "Gerenciar Peca Nao Utilizada" na Oficina

**Arquivo: `src/pages/OSOficina.tsx`**

**Novos estados:**
- `pecaNaoUtilizadaModal: boolean`
- `osParaGerenciarPeca: OrdemServico | null`
- `solicitacoesParaGerenciar: SolicitacaoPeca[]`
- `justificativaNaoUso: string`
- `solicitacaoSelecionada: SolicitacaoPeca | null`

**Imports adicionais:**
- `cancelarSolicitacao` de `solicitacaoPecasApi`
- `addPeca`, `addMovimentacaoPeca` de `pecasApi`
- `Undo2` (ou icone similar) de `lucide-react`

**Botao na tabela:** Dentro de `getAcoes`, para OSs com status "Em servico", adicionar botao "Gerenciar Peca" ao lado de "Finalizar Servico". O botao so aparece se houver solicitacoes vinculadas a OS.

**Modal "Gerenciar Peca Nao Utilizada":**
- Lista as solicitacoes de pecas vinculadas a OS (via `getSolicitacoesByOS`)
- Para cada solicitacao, exibir: nome da peca, quantidade, status, valor (se paga)
- Botao "Marcar Nao Utilizada" com campo obrigatorio de justificativa

**Cenario A - Peca NAO Paga** (`Pendente`, `Aprovada`, `Enviada`, `Aguardando Aprovacao`):
- Chamar `cancelarSolicitacao(id, justificativa)`
- OS retorna para "Em servico"
- Timeline: "Solicitacao de peca [Nome] cancelada. Motivo: [Justificativa]"

**Cenario B - Peca JA PAGA** (`Pagamento Finalizado`, `Recebida`, `Em Estoque`):
- Chamar `addPeca()` para criar entrada no estoque da loja com status "Disponivel"
- Chamar `addMovimentacaoPeca()` para registrar entrada
- Recalcular `valorVendaTecnico` e `valorCustoTecnico` subtraindo o valor da peca
- Atualizar a OS com `updateOrdemServico`
- OS retorna para "Em servico"
- Timeline: "Peca [Nome] (Paga) nao utilizada. Incorporada ao estoque. Motivo: [Justificativa]"

**Trava de Finalizacao:** Em `handleAbrirFinalizar`, verificar se existem solicitacoes com status pendente (`Pendente`, `Aprovada`, `Enviada`, `Aguardando Chegada`, `Pagamento - Financeiro`). Se houver, exibir toast de erro.

---

### Parte 3: Indicador de Anexo na Conferencia do Gestor

**Arquivo: `src/pages/OSConferenciaGestor.tsx`**

**Na tabela (entre colunas "Status" e "Acoes"):**
- Adicionar coluna "Anexo" com icone `Paperclip`
- Para cada OS, verificar se `os.pagamentos` possui pelo menos um pagamento com `comprovante` preenchido
- Se sim: exibir badge verde "Contém Anexo"
- Se nao: exibir badge amarelo "Sem Anexo" (usando `ComprovanteBadgeSemAnexo` ja existente)

**No painel lateral de conferencia (linhas 693-735):**
- Ja exibe `ComprovantePreview` para cada pagamento (linhas 714-719) - isso ja funciona corretamente
- Garantir que a miniatura do comprovante apareca com `size="md"` para melhor visualizacao (ja esta implementado)

---

### Detalhes Tecnicos

**VendaDetalhes.tsx - Remover linhas 128-141:**
Remover todo o bloco `<Button variant="outline" onClick={...}>Abrir OS</Button>`.

**OSOficina.tsx - getAcoes (linhas 296-304):**
```text
if (status === 'Em servico') {
  const solicitacoesOS = getSolicitacoesByOS(os.id);
  return (
    <div className="flex gap-1">
      {solicitacoesOS.length > 0 && (
        <Button size="sm" variant="outline" onClick={() => handleAbrirGerenciarPeca(os)}>
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button size="sm" onClick={() => handleAbrirFinalizar(os)}>
        <CheckCircle className="h-3.5 w-3.5" /> Finalizar
      </Button>
    </div>
  );
}
```

**OSConferenciaGestor.tsx - Coluna Anexo na tabela (apos linha 544):**
```text
<TableHead>Anexo</TableHead>
```

**OSConferenciaGestor.tsx - Celula Anexo (apos linha 578):**
```text
<TableCell>
  {os.pagamentos.some(p => p.comprovante) ? (
    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
      <Paperclip className="h-3 w-3 mr-1" /> Contém Anexo
    </Badge>
  ) : (
    <ComprovanteBadgeSemAnexo />
  )}
</TableCell>
```

**Imports adicionais no OSConferenciaGestor.tsx:**
- `Paperclip` de `lucide-react`
- `ComprovanteBadgeSemAnexo` de `@/components/vendas/ComprovantePreview`

**Arquivos modificados:**
1. `src/pages/VendaDetalhes.tsx` - Remover botao "Abrir OS"
2. `src/pages/OSOficina.tsx` - Adicionar botao, modal, logica de bifurcacao, trava de finalizacao
3. `src/pages/OSConferenciaGestor.tsx` - Adicionar coluna e badge de anexo na tabela

