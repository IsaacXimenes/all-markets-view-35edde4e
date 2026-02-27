
# Corrigir Movimentacao de Pecas na Assistencia

## Problemas Identificados

### 1. Data registrando D-1 (bug de fuso horario)
Na linha 176 de `OSMovimentacaoPecas.tsx`, a data usa `new Date().toISOString()` que converte para UTC, causando o registro com o dia anterior. O mesmo problema ocorre na linha 200 (data de recebimento).

### 2. Filtros de loja sem restricao por tipo
Os componentes `AutocompleteLoja` nos filtros (origem/destino) e no formulario de nova movimentacao nao estao restritos a unidades do tipo "Assistencia". Devem usar `filtrarPorTipo="Assistência"` para manter a consistencia com o modulo.

---

## Alteracoes

### Arquivo: `src/pages/OSMovimentacaoPecas.tsx`

**1. Corrigir data de registro (linha 176)**
Substituir:
```
data: formData.data ? new Date(formData.data).toISOString() : new Date().toISOString(),
```
Por data local:
```
data: formData.data || (() => { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`; })(),
```

**2. Corrigir data de recebimento (linha 200)**
Substituir:
```
movimentacoesPecas[idx].dataRecebimento = new Date().toISOString();
```
Por:
```
const h = new Date();
movimentacoesPecas[idx].dataRecebimento = `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`;
```

**3. Restringir AutocompleteLoja a unidades tipo Assistencia**
Nos filtros de origem e destino (linhas 288-299) e no formulario de nova movimentacao, adicionar `filtrarPorTipo="Assistência"` a todos os componentes `AutocompleteLoja`.

---

## Resumo
- 1 arquivo modificado: `src/pages/OSMovimentacaoPecas.tsx`
- Correcoes: datas locais em 2 pontos + restricao de tipo de loja em filtros e formulario
