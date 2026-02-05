
# Plano: Exibir Anexos do Trade-In na Tela de Vendas

## Objetivo
Após registrar um Trade-In com "Aparelho com o Cliente", os anexos (Termo de Responsabilidade e Fotos do Aparelho) devem ser visíveis tanto na tela principal de Vendas quanto na página de detalhes da venda.

---

## Alterações Propostas

### 1. Tela Principal de Vendas (`src/pages/Vendas.tsx`)

**Adicionar coluna/indicador de Trade-In com Anexos:**

Na tabela principal, adicionar uma nova coluna "Trade-In" após a coluna "Resp. Venda" que mostra:
- Badge "Entregue" (verde) - quando o aparelho foi entregue no ato
- Badge "Com Cliente" (âmbar) com ícone de anexo - quando está com o cliente
- Ícones clicáveis para visualizar os anexos (Termo e Fotos)

**Estrutura da coluna:**
```text
Trade-In
├── Se não tem trade-in: "-"
├── Se "Entregue no Ato": Badge verde "Entregue"
└── Se "Com o Cliente": 
    ├── Badge âmbar "Com Cliente"
    ├── Ícone de documento (Termo) - clicável
    └── Ícone de imagem (Fotos) - clicável com contador
```

---

### 2. Página de Detalhes (`src/pages/VendaDetalhes.tsx`)

**Expandir o Card "Base de Troca" para exibir:**

1. **Status de Entrega**: Badge indicando "Entregue no Ato" ou "Com o Cliente"
2. **Termo de Responsabilidade**: 
   - Ícone de documento com nome do arquivo
   - Botão para visualizar/baixar o PDF
3. **Fotos do Aparelho**:
   - Grid de miniaturas das fotos anexadas
   - Clique para ampliar em modal/carrossel

**Nova estrutura da tabela de Trade-In:**
```text
| Modelo | Descrição | IMEI | Status Entrega | Anexos | Valor |
```

---

## Detalhes Técnicos

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/Vendas.tsx` | Adicionar coluna Trade-In com badges e ícones de anexos |
| `src/pages/VendaDetalhes.tsx` | Expandir card de Base de Troca com visualização de anexos |

### Componentes UI a Utilizar

- `Badge` - para status de entrega
- `Dialog` - para modal de visualização de fotos
- `Tooltip` - para mostrar nome do arquivo ao passar o mouse
- `FileText` e `Image` icons do Lucide - para indicar tipo de anexo

### Lógica de Verificação

```text
// Para cada venda, verificar se há trade-ins com anexos
const temTradeInComCliente = venda.tradeIns.some(
  t => t.tipoEntrega === 'Com o Cliente'
);

const totalAnexos = venda.tradeIns.reduce((acc, t) => {
  const qtdFotos = t.fotosAparelho?.length || 0;
  const temTermo = t.termoResponsabilidade ? 1 : 0;
  return acc + qtdFotos + temTermo;
}, 0);
```

---

## Experiência do Usuário

### Na Tela Principal (Vendas.tsx):
1. Visualização rápida do status do trade-in
2. Contador de anexos visível
3. Clique nos ícones abre modal para visualizar

### Na Página de Detalhes (VendaDetalhes.tsx):
1. Card de Base de Troca expandido
2. Status de entrega destacado
3. Grid de fotos com miniaturas clicáveis
4. Botão de download para o Termo de Responsabilidade
5. Modal de visualização em tela cheia para fotos

---

## Ordem de Implementação

1. **Modificar `Vendas.tsx`**
   - Adicionar coluna "Trade-In" na tabela
   - Implementar badges de status
   - Adicionar ícones de anexos com contadores
   - Criar modal de visualização rápida

2. **Modificar `VendaDetalhes.tsx`**
   - Expandir tabela de Base de Troca
   - Adicionar coluna de Status de Entrega
   - Criar seção de anexos com grid de fotos
   - Implementar modal de visualização de fotos
   - Adicionar botão de download do Termo
