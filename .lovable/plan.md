

## Adaptar Layout da Tabela "Notas Pendentes - Assistencia" com Identidade Visual

### Objetivo
Replicar o layout da tabela `TabelaNotasPendencias` (Estoque) na pagina `FinanceiroNotasAssistencia.tsx`, aplicando a paleta de cores da identidade visual do cliente e ordenando por data mais recente primeiro.

### Paleta de Cores Aplicada

| Elemento | Cor | Hex |
|----------|-----|-----|
| Fundo geral | Branco puro | `#FFFFFF` |
| Destaques, badges atencao, botoes | Amarelo principal | `#F7BB05` |
| Badges alerta, icones secundarios | Dourado/laranja | `#F48F03` |
| Titulos, textos, menus | Preto | `#111111` |
| Textos secundarios, divisores | Cinza escuro | `#212121` |
| Linhas de tabela, bordas sutis | Cinza medio | `#7F7F7F` |

### Alteracoes no Arquivo `src/pages/FinanceiroNotasAssistencia.tsx`

**1. Ordenacao por data decrescente (mais novas em cima)**
- Remover a logica que prioriza "Pendente" no topo
- Ordenar exclusivamente por `dataCriacao` decrescente

**2. Cards de Resumo - Aplicar cores da identidade visual**
- Card "Pendentes": trocar `text-yellow-600` por cor customizada `text-[#F7BB05]`
- Icone Clock: trocar `text-yellow-600` por `text-[#F7BB05]`
- Card "Total Pendente": mesma troca de amarelo
- Card "Conferidas": manter verde (sucesso)
- Textos principais dos cards: `text-[#111111]`

**3. Tabela - Replicar estrutura visual do Estoque**
- Adicionar coluna "Data/Hora" com icone Clock e formatacao `dd/MM/yyyy HH:mm` (mesmo padrao do Estoque)
- Adicionar coluna "Dias" com badge colorido baseado nos dias decorridos
- Cabecalhos da tabela: fundo sutil com texto `text-[#212121]`
- Linhas da tabela: fundo branco `#FFFFFF` com bordas sutis em `#7F7F7F` com opacidade
- Coloracao de status nas linhas: manter apenas nos badges, nao na linha inteira (remover `getStatusRowClass`)
- Badge "Pendente": fundo `#F7BB05/15` com texto `#F48F03`
- Badge "Concluido": manter verde (indicador de sucesso)
- Botao "Conferir": fundo `#F7BB05` com texto `#111111`
- Valor total no rodape: texto `#111111` em negrito

**4. Filtros - Ajustar cores**
- Botao "Limpar": bordas e texto em `#212121`
- Labels: `text-[#212121]`

**5. Botao Exportar CSV**
- Borda e texto em `#212121`, hover sutil

### Secao Tecnica - Detalhes de Implementacao

```text
Arquivo: src/pages/FinanceiroNotasAssistencia.tsx

1. Ordenacao (linha 69-73):
   - Remover priorizacao por status
   - Manter apenas: sort por dataCriacao desc

2. Coluna Data/Hora:
   - Adicionar formatacao com toLocaleString('pt-BR')
   - Icone Clock h-3 w-3 ao lado da data

3. Coluna Dias:
   - Calcular dias decorridos desde dataCriacao
   - Badge com cores: >=7 dias = vermelho, >=5 = amarelo (#F7BB05), <5 = cinza

4. Badges de Status:
   - Pendente: className="bg-[#F7BB05]/15 text-[#F48F03] border-[#F7BB05]/30"
   - Concluido: manter bg-green (sucesso visual)

5. Botao Conferir:
   - className="bg-[#F7BB05] text-[#111111] hover:bg-[#F48F03]"

6. Cards resumo:
   - Pendentes e Total Pendente: text-[#F7BB05] e icones text-[#F7BB05]
   
7. Linhas da tabela:
   - Remover getStatusRowClass (cores na linha)
   - Fundo branco limpo, cores apenas nos badges
```

### Resultado Esperado
- Tabela com visual limpo e branco, identico ao padrao do Estoque
- Cores da identidade visual (amarelo/dourado) nos destaques e badges
- Dados ordenados do mais recente para o mais antigo
- Coluna de "Dias" para acompanhamento visual de prazo
- Consistencia visual com o restante do sistema

