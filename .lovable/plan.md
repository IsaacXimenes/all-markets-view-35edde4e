

# Plano: Ajustes na Tela de Nova Nota de Entrada

## 1. Campo "Data de Entrada" como Read-Only

### Arquivo: `src/pages/EstoqueNotaCadastrar.tsx`

- Adicionar `readOnly` ao Input de data (linha 284-289)
- Manter o valor auto-preenchido com a data atual
- Aplicar estilo visual de campo bloqueado (`bg-muted cursor-not-allowed`)

---

## 2. Remover Duplicidade do Botao "Solicitacao de Urgencia"

### Arquivo: `src/pages/EstoqueNotaCadastrar.tsx`

- Remover o segundo bloco duplicado do checkbox de urgencia (linhas 321-333)
- Manter apenas o primeiro bloco (linhas 308-320)

---

## 3. Novo Campo "Responsavel pelo Lancamento"

### Arquivo: `src/pages/EstoqueNotaCadastrar.tsx`

- Adicionar estado `responsavelLancamento` (string)
- Adicionar campo `AutocompleteColaborador` no quadro "Informacoes da Nota", ao lado do Fornecedor
- Import do `AutocompleteColaborador`
- Pre-preencher com o colaborador logado (authStore)
- Adicionar validacao obrigatoria em `validarCampos`
- Passar o valor para `criarNotaEntrada` no campo `responsavel`

---

## 4. Anexos - Ja Implementado

O componente `BufferAnexos` ja utiliza armazenamento temporario em memoria (Base64). Os arquivos sao descartados ao recarregar a pagina e so seriam persistidos no salvamento. Nenhuma alteracao necessaria neste ponto -- o sistema ja funciona conforme especificado.

---

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/EstoqueNotaCadastrar.tsx` | Data read-only, remover urgencia duplicada, campo Responsavel |

