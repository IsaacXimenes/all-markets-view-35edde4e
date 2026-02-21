

## Enriquecer Dados Mockados com Exemplos de Rastreabilidade Cruzada

### Resumo

Adicionar novas OS ao mock e enriquecer as existentes para cobrir todas as combinacoes possiveis de Origem do Servico x Origem da Peca, gerando dados significativos nos 4 cards mestres e no grafico de composicao do Dashboard.

---

### Cobertura Atual vs. Desejada

| OS | Origem Servico | Origem Peca | Status |
|---|---|---|---|
| 0001 | Garantia (Balcao) | sem pecas | Aguardando Analise |
| 0002 | Balcao | Estoque Thiago | Em servico |
| 0003 | Garantia | Fornecedor | Solicitacao de Peca |
| 0004 | Garantia | Fornecedor | Aguardando Peca |
| 0005 | Balcao | Fornecedor | Peca Recebida |
| 0006 | Balcao | Fornecedor + Estoque Thiago | Servico concluido |
| 0007 | Garantia | Consignado + Estoque Thiago | Conferencia do Gestor |
| 0008 | Balcao | Retirada de Pecas | Liquidado |
| 0009 | Estoque | Estoque Thiago | Validar Aparelho |

**Combinacoes faltando:**
- Balcao + Consignado
- Garantia + Retirada de Pecas
- Estoque + Consignado
- Estoque + Retirada de Pecas
- OS com 3+ pecas de origens diferentes na mesma OS
- OS com origemPeca = 'Manual'

---

### Novas OS a Adicionar

**Arquivo: `src/utils/assistenciaApi.ts`**

#### OS-2025-0010 — Balcao + Consignado (Liquidado)
- origemOS: Balcao
- Pecas:
  - Tela LCD iPhone 12 | origemPeca: Consignado | valorCustoReal: R$ 280
  - Pelicula Especial | origemPeca: Manual | valorCustoReal: R$ 15
- Status: Liquidado (fluxo completo)
- Objetivo: popular card "Investimento Consignados" com origem Balcao

#### OS-2025-0011 — Garantia + Retirada de Pecas (Servico concluido)
- origemOS: Garantia
- Pecas:
  - Bateria iPhone 14 Pro | origemPeca: Retirada de Pecas | valorCustoReal: R$ 95 (valor do desmonte, nao zero)
  - Flex Power | origemPeca: Estoque Thiago | valorCustoReal: R$ 25
- Status: Servico concluido
- Objetivo: mostrar custo real de Retirada em contexto de Garantia

#### OS-2025-0012 — Estoque + Consignado + Retirada (Em servico)
- origemOS: Estoque
- Pecas:
  - Display AMOLED Samsung S23 | origemPeca: Consignado | valorCustoReal: R$ 520
  - Aro lateral | origemPeca: Retirada de Pecas | valorCustoReal: R$ 45
  - Tampa traseira | origemPeca: Estoque Thiago | valorCustoReal: R$ 80
- Status: Em servico
- Objetivo: OS com 3 origens diferentes na mesma OS, alimentando card Estoque + Consignados

#### OS-2025-0013 — Balcao + Mix completo (Conferencia do Gestor)
- origemOS: Balcao
- Pecas:
  - Placa auxiliar iPhone 15 | origemPeca: Fornecedor | valorCustoReal: R$ 320
  - Sensor proximidade | origemPeca: Consignado | valorCustoReal: R$ 55
  - Botao Home | origemPeca: Retirada de Pecas | valorCustoReal: R$ 30
- Status: Conferencia do Gestor
- Objetivo: OS rica com 3 origens de peca diferentes, todas com custo Balcao

---

### Resultado Esperado nos Cards

Apos as adicoes, os 4 cards terao valores significativos:

- **Custo Balcao**: OS 0002 + 0005 + 0006 + 0008 + 0010 + 0013 = valores expressivos
- **Custo Garantia**: OS 0003 + 0004 + 0007 + 0011 = valores expressivos
- **Custo Estoque**: OS 0009 + 0012 = valores expressivos
- **Investimento Consignados**: OS 0007 + 0010 + 0012 + 0013 = valores expressivos

O grafico de pizza no Dashboard tera fatias visiveis para todas as 5 categorias de origemPeca.

---

### Arquivo Afetado

- `src/utils/assistenciaApi.ts` (adicionar 4 novas OS no array mockado)

