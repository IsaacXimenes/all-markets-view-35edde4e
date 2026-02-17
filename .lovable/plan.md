

## Plano: Conclusao do Servico + Mock Estoque + Pix no Financeiro + Bug Gerenciar Peca + Confirmar Recebimento

### Problema 1: Campo "Conclusao do Servico" no modal de Finalizacao (Aba Oficina)

**Arquivo: `src/pages/OSOficina.tsx`**

Adicionar um campo de texto obrigatorio "Conclusao do Servico" no modal de Finalizar Servico (quadro de avaliacao tecnica). Esse campo e separado do "Resumo da Conclusao" existente e serve para descrever a conclusao tecnica do reparo.

- Novo estado: `conclusaoServico: string`
- Novo campo `Textarea` no modal, antes do Resumo, com label "Conclusao do Servico *"
- Validacao no `handleFinalizar`: se vazio, exibir toast de erro
- Persistir na OS via `updateOrdemServico` com novo campo `conclusaoServico`
- Incluir na timeline: "Conclusao: [texto]"

**Arquivo: `src/utils/assistenciaApi.ts`**

Adicionar campo opcional `conclusaoServico?: string` na interface `OrdemServico`.

---

### Problema 2: Dados Mockados na aba Estoque - Assistencia

**Arquivo: `src/utils/pecasApi.ts`**

A lista `pecasBase` ja possui 5 pecas mockadas (PEC-0001 a PEC-0005), porem so sao inicializadas quando `initializePecasWithLojaIds` e chamada. Adicionar mais itens mockados para enriquecer a visualizacao:

- Adicionar 5-8 pecas extras com variedade de modelos, origens e status
- Incluir pecas com origem "Retirada de Peca" e "Solicitacao" 
- Incluir pecas com status "Reservada" e "Utilizada" alem de "Disponivel"
- Atualizar `nextPecaId` para refletir os novos itens

---

### Problema 3: Dados de Pix (Banco/Chave) da Aprovacao devem aparecer no Financeiro

**Problema:** Na aprovacao de solicitacoes de pecas (`OSSolicitacoesPecas.tsx`), o gestor preenche `bancoDestinatario` e `chavePix`, mas esses campos NAO sao salvos na interface `SolicitacaoPeca` nem passados para `aprovarSolicitacao()`. O financeiro nao tem acesso a essas informacoes.

**Correcoes:**

1. **`src/utils/solicitacaoPecasApi.ts`** - Adicionar campos na interface:
   ```
   bancoDestinatario?: string;
   chavePix?: string;
   ```
   E na funcao `aprovarSolicitacao`, aceitar e persistir esses campos.

2. **`src/pages/OSSolicitacoesPecas.tsx`** - Passar `bancoDestinatario` e `chavePix` na chamada de `aprovarSolicitacao`:
   ```
   aprovarSolicitacao(sol.id, {
     ...dados existentes,
     bancoDestinatario: dados.bancoDestinatario,
     chavePix: dados.chavePix
   });
   ```

3. **`src/pages/FinanceiroNotasAssistencia.tsx`** - Na secao de pagamento do modal de conferir nota, exibir os dados de Pix vindos das solicitacoes vinculadas:
   - Buscar solicitacoes da OS via `getSolicitacoesByOS(nota.osId)`
   - Para cada solicitacao com `formaPagamento === 'Pix'`, exibir:
     - Banco do Destinatario
     - Chave Pix
   - Exibir em um card informativo acima dos campos de pagamento

---

### Problema 4: Botao "Gerenciar Peca Nao Utilizada" desaparece apos pagamento

**Problema:** O botao so aparece quando `status === 'Em servico'` (linha 411 de OSOficina.tsx). Apos o pagamento no financeiro, `finalizarNotaAssistencia` muda o status da OS para 'Peca Recebida' com `proximaAtuacao: 'Tecnico: Avaliar/Executar'`. Nesse ponto, a condicao `status === 'Em servico'` falha e o botao some.

**Correcao em `src/pages/OSOficina.tsx` - funcao `getAcoes`:**

Alterar a logica para exibir o botao "Gerenciar Peca Nao Utilizada" tambem nos status de peca recebida:

```
// Peça recebida - confirmar recebimento + gerenciar peça
if (atuacao === 'Técnico (Recebimento)' || 
    atuacao === 'Técnico: Avaliar/Executar' || 
    status === 'Peça Recebida' || 
    status === 'Pagamento Concluído') {
  const solicitacoesOS = getSolicitacoesByOS(os.id).filter(s => 
    !['Cancelada', 'Rejeitada'].includes(s.status)
  );
  return (
    <div className="flex gap-1">
      {solicitacoesOS.length > 0 && (
        <Button ... Gerenciar Peça Não Utilizada />
      )}
      <Button ... Confirmar Recebimento />
    </div>
  );
}

// Em serviço - finalizar + gerenciar peça (manter logica existente)
if (status === 'Em serviço') { ... }
```

---

### Problema 5: Status "Peca Recebida" nao deve ser condicionado ao pagamento

**Problema:** A funcao `finalizarNotaAssistencia` no `solicitacaoPecasApi.ts` (linhas 556-570) muda automaticamente o status da OS para "Peca Recebida" quando o financeiro finaliza a nota. Porem, segundo a regra de negocio, o status "Peca Recebida" deve ser atribuido APENAS quando o tecnico clica em "Confirmar Recebimento" na tabela de Servicos.

**Correcao em `src/utils/solicitacaoPecasApi.ts` - funcao `finalizarNotaAssistencia`:**

Ao finalizar a nota, em vez de mudar para "Peca Recebida", manter o status em "Pagamento Concluido" e mudar a `proximaAtuacao` para "Tecnico (Recebimento)" para sinalizar que o tecnico precisa confirmar fisicamente o recebimento.

```
// ANTES:
status: 'Peça Recebida',
proximaAtuacao: 'Técnico: Avaliar/Executar'

// DEPOIS:
status: 'Pagamento Concluído',
proximaAtuacao: 'Técnico (Recebimento)'
```

Dessa forma, o tecnico vera o botao "Confirmar Recebimento" na aba Oficina, e ao clicar, a OS mudara para "Em servico" (logica ja existente em `handleConfirmarRecebimento`).

---

### Resumo de Arquivos Modificados

1. `src/utils/assistenciaApi.ts` - Adicionar campo `conclusaoServico` na interface OrdemServico
2. `src/pages/OSOficina.tsx` - Campo obrigatorio de conclusao + botao de gerenciar peca em mais status
3. `src/utils/pecasApi.ts` - Mais dados mockados de pecas
4. `src/utils/solicitacaoPecasApi.ts` - Campos `bancoDestinatario`/`chavePix` na interface + correcao do status pos-pagamento
5. `src/pages/OSSolicitacoesPecas.tsx` - Passar `bancoDestinatario`/`chavePix` na aprovacao
6. `src/pages/FinanceiroNotasAssistencia.tsx` - Exibir dados Pix no modal de pagamento

