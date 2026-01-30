
# Plano: Responsividade Completa para Conferência de Contas

## Diagnóstico da Estrutura Atual

A tela `FinanceiroConferencia.tsx` possui os seguintes elementos que precisam de ajustes para mobile:

### Elementos Identificados:
1. **Cards de Pendentes/Conferidos** (linhas 734, 808): Usam `[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]` - funciona bem mas pode melhorar em mobile
2. **Cards de Resumo** (linha 878): Usam `[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]` - muito largo para 390px
3. **Filtros** (linha 920): Usam `[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]` - precisa de 1 coluna em mobile
4. **Tabela** (linha 1002): Tem `min-w-[1100px]` mas scroll pode não estar visível
5. **Painel Lateral** (linha 1077): Em mobile ocupa 100% da largura, precisa empilhar verticalmente

---

## Implementação

### 1. Cards de Pendentes e Conferidos
**Linha 734 e 808**

```text
Antes:
[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]

Depois:
grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]
```

Em mobile (390px), 2 colunas = ~195px cada (cabe bem)
Em tablet, 3 colunas
Em desktop, auto-fit com mínimo 180px

### 2. Cards de Resumo
**Linha 878**

```text
Antes:
[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]

Depois:
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

Em mobile: 1 coluna (ocupa 100%)
Em tablet: 2 colunas
Em desktop: 3 colunas

### 3. Filtros
**Linha 920**

```text
Antes:
[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]

Depois:
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]
```

Em mobile: 1 coluna (cada filtro empilhado)
Em tablet: 2 colunas
Em desktop: 3 colunas
Em telas grandes: auto-fit

### 4. Tabela - Garantir Scroll Horizontal Visível
**Linha 1000-1072**

A tabela já tem `min-w-[1100px]` e usa o componente `Table` que tem `TableScrollArea` embutido.

Verificar se o wrapper `<Card>` permite overflow:
```text
Antes:
<Card>
  <CardContent className="p-0">
    <Table className="min-w-[1100px]">

Depois:
<Card className="overflow-hidden">
  <CardContent className="p-0 overflow-x-auto">
    <Table className="min-w-[1100px]">
```

### 5. Layout Principal - Empilhar Painel em Mobile
**Linha 726**

```text
Antes:
<div className="flex flex-col xl:flex-row gap-4 xl:gap-6 min-w-0">

Depois (manter igual, já está correto):
flex-col em mobile, flex-row em xl
```

### 6. Painel Lateral - Ajustar para Mobile
**Linha 1077-1089**

```text
Antes:
<div className="w-full xl:w-[380px] xl:min-w-[350px] xl:max-w-[420px] xl:sticky xl:top-4 h-fit flex-shrink-0">

Depois (ajustar padding):
<div className="w-full xl:w-[380px] xl:min-w-[350px] xl:max-w-[420px] xl:sticky xl:top-4 h-fit flex-shrink-0">
```

O painel já ocupa 100% em mobile, está correto.

### 7. Grid interno do Painel (2 colunas → 1 em mobile extremo)
**Linha 1089**

```text
Antes:
<div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg text-sm">

Manter igual - 2 colunas funciona em 390px (cada ~180px)
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/FinanceiroConferencia.tsx` | Ajustar grids para breakpoints mobile-first, garantir scroll na tabela |

---

## Resumo das Mudanças

```text
1. Cards Pendentes/Conferidos (linha 734, 808):
   - De: [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]
   - Para: grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]

2. Cards Resumo (linha 878):
   - De: [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]
   - Para: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

3. Filtros (linha 920):
   - De: [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]
   - Para: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]

4. Tabela (linha 1000):
   - Adicionar overflow-hidden no Card
   - Adicionar overflow-x-auto no CardContent
   - Manter min-w-[1100px] para forçar scroll

5. Botões de Filtro (linha 985):
   - Ajustar para empilhar em mobile: flex-col sm:flex-row
```

---

## Resultado Esperado no Mobile (390px)

- **Cards Pendentes/Conferidos**: 2 por linha, compactos
- **Cards Resumo**: 1 por linha, empilhados verticalmente
- **Filtros**: 1 por linha, cada select ocupa 100% da largura
- **Tabela**: Scroll horizontal visível, barra de scroll aparente
- **Painel Lateral**: Aparece abaixo da tabela (já funciona com flex-col)

---

## Validação

1. Clicar em "Show mobile preview" no Lovable
2. Navegar para `/financeiro/conferencia`
3. Verificar:
   - Cards de métodos de pagamento: 2 por linha
   - Cards de resumo: 1 por linha
   - Filtros: 1 por linha
   - Tabela: scroll horizontal funcional
   - Ao clicar em uma linha, painel aparece abaixo
