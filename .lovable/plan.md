

# Plano Revisado: Correções no Assistência e Controle Financeiro na Desmontagem

## Resumo

Tres entregas sem criacao de nova aba no Estoque:
1. Corrigir filtro de IMEI no modulo de Assistencia
2. Adicionar coluna e filtro de IMEI na aba existente "Analise de Tratativas" (Assistencia)
3. Controle financeiro de prejuizo na desmontagem (Retirada de Pecas)

O fluxo Estoque > Aparelhos Pendentes > "Encaminhado para conferencia da Assistencia" ja envia corretamente para a aba existente "Analise de Tratativas" no modulo da Assistencia (`/os/analise-garantia`). Nenhuma nova aba sera criada no Estoque.

---

## 1. Correcao do Filtro de IMEI na Assistencia

### Arquivo: `src/pages/OSAssistencia.tsx`
- Linha 52: substituir `filtroIMEI.replace(/-/g, '')` por `unformatIMEI(filtroIMEI)` (remove todos os caracteres nao-digitos, nao apenas hifens)
- Tambem aplicar `unformatIMEI` no valor do IMEI da peca e no `imeiAparelho` da OS para comparacao consistente
- Importar `unformatIMEI` de `@/utils/imeiMask`

---

## 2. Coluna e Filtro de IMEI na Analise de Tratativas

### Arquivo: `src/pages/OSAnaliseGarantia.tsx`
- Adicionar filtro de IMEI na area de filtros (input com busca por IMEI)
- Adicionar coluna "IMEI" na tabela entre "ID" e "Origem"
- Extrair IMEI da `clienteDescricao` (que ja contem "IMEI: XXXXXXX") ou do registro de origem
- Filtrar usando `unformatIMEI` para comparacao sem mascara

---

## 3. Controle Financeiro na Desmontagem

### 3.1. Novas colunas na tabela de Retirada de Pecas
- Arquivo: `src/pages/AssistRetiradaPecas.tsx`
- Adicionar coluna "Valor Total Pecas": soma dos valores das pecas retiradas
- Adicionar coluna "Prejuizo": diferenca negativa entre custo do aparelho e valor total das pecas (exibir em vermelho se negativo)

### 3.2. Card de Somatorio de Prejuizo nos detalhes
- Arquivo: `src/pages/AssistRetiradaPecasDetalhes.tsx`
- Adicionar Card destacado (fundo vermelho) exibindo:
  - Custo do Aparelho
  - Valor Total das Pecas Retiradas
  - Prejuizo (diferenca)
- Exibido quando ha pecas registradas e soma das pecas e menor que o custo

---

## Arquivos a editar

- `src/pages/OSAssistencia.tsx` - correcao filtro IMEI
- `src/pages/OSAnaliseGarantia.tsx` - coluna e filtro de IMEI
- `src/pages/AssistRetiradaPecas.tsx` - colunas financeiras
- `src/pages/AssistRetiradaPecasDetalhes.tsx` - card de prejuizo

Nenhum arquivo novo sera criado. Nenhuma nova aba sera adicionada ao Estoque.

