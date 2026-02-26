

# Plano: Aprimoramentos Completos no Modulo de Garantia

## Analise do Estado Atual

A maioria das funcionalidades base ja esta implementada. Este plano foca nos ajustes e refinamentos pendentes.

| Funcionalidade | Status Atual |
|---|---|
| Estrutura 4 quadros | Implementado |
| IMEI camera scan | Implementado |
| 4 tipos de tratativa | Implementado |
| Foto aparelho emprestimo | Implementado (1 campo) |
| Foto devolucao | Implementado |
| origemOS = "Garantia" | Implementado |
| Troca Direta (nota + pendentes + status) | Implementado |
| Garantia Extendida completa | Implementado |
| Toggle Colaboradores | Implementado |
| Extrato Log coluna | Implementado |
| Fix observacao fantasma | Implementado |

---

## Alteracoes Necessarias

### 1. Autocomplete para campo Modelo (GarantiasNovaManual.tsx, linhas 477-489)

Substituir o `<Select>` estatico por um autocomplete pesquisavel usando `Popover` + `Command` (cmdk), seguindo o padrao arquitetural do sistema. Fonte de dados: `getProdutosCadastro()`.

### 2. Segundo campo de anexo: Termo de Responsabilidade (GarantiasNovaManual.tsx)

Adicionar um segundo `FileUploadComprovante` para "Assistencia + Emprestimo", abaixo do campo de fotos do aparelho:
- Novo estado: `fotoTermo` e `fotoTermoNome`
- Label: "Termo de Responsabilidade *"
- Tipos aceitos: image/jpeg, image/png, image/webp, application/pdf
- Validacao obrigatoria no `handleSalvar`: ambos os campos devem estar preenchidos

### 3. Filtro de aparelhos: apenas status "Disponivel" (GarantiasNovaManual.tsx, linhas 139-149)

O filtro atual aceita qualquer Seminovo com `quantidade > 0`. Deve usar `getStatusAparelho(p) === 'Disponivel'` para garantir que apenas aparelhos realmente disponiveis sejam listados (excluindo bloqueados, em movimentacao, emprestados, etc.). Tambem deve aceitar aparelhos Novos e Seminovos (remover restricao `p.tipo === 'Seminovo'`).

### 4. Dupla confirmacao para Troca Direta (GarantiasNovaManual.tsx)

Quando `tipoTratativa === 'Troca Direta'`:
- Ao clicar "Salvar Registro", abrir um modal de confirmacao com resumo (aparelho saindo, aparelho entrando, cliente)
- Usuario deve confirmar marcando um checkbox "Confirmo a troca direta"
- Apos primeira confirmacao, habilitar botao "Confirmar Troca"
- Apos segunda confirmacao (clique no botao), exibir botao "Gerar Nota" ao lado do "Salvar Registro" no header

### 5. Botao "Gerar Nota" ao lado de "Salvar Registro" (GarantiasNovaManual.tsx)

Apos a dupla confirmacao da Troca Direta:
- Estado `trocaConfirmada` = true
- No header, exibir botao "Gerar Nota de Garantia" em destaque (variant default, icone FileText) ao lado do "Salvar Registro"
- Ao clicar, buscar a venda gerada automaticamente e chamar `gerarNotaGarantiaPdf`

### 6. Motivo automatizado para aparelho defeituoso (garantiasApi.ts, linha 793-807)

Na funcao `aprovarTratativa`, ao registrar o aparelho defeituoso em Aparelhos Pendentes via `addProdutoPendente`, adicionar campo de motivo/observacao automatizado:
- `motivoAssistencia: "Defeito relatado na Garantia ID #[ID_GARANTIA]"`
- Origem identificada como "Garantia" (nao apenas "Base de Troca")

### 7. Alerta visual "Servico Concluido" (GarantiasEmAndamento.tsx)

Na tabela de garantias em andamento, quando uma OS vinculada tiver status finalizado/concluido:
- Exibir badge destacado "Servico Concluido - Chamar Cliente" em amarelo/verde
- Adicionar indicador visual na linha da tabela (fundo verde claro)
- Logica: verificar se a OS vinculada (`tratativa.osId`) tem status "Serviço concluído" ou similar

---

## Arquivos Modificados

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/GarantiasNovaManual.tsx` | Autocomplete Modelo, Termo de Responsabilidade, filtro aparelhos, dupla confirmacao, botao Gerar Nota |
| `src/utils/garantiasApi.ts` | Motivo automatizado no addProdutoPendente, origem "Garantia" |
| `src/pages/GarantiasEmAndamento.tsx` | Alerta visual "Servico Concluido" |

## Sequencia de Implementacao

1. Autocomplete Modelo
2. Segundo campo de anexo (Termo)
3. Filtro aparelhos com getStatusAparelho
4. Dupla confirmacao + botao Gerar Nota para Troca Direta
5. Motivo automatizado no aparelho pendente
6. Alerta visual Servico Concluido

