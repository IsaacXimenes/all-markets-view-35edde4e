
# Plano de Implementacao: Trade-In Inteligente e Base de Trocas

## Analise do Estado Atual

### O Que Ja Esta Implementado

**Modulo de Vendas (VendasNova.tsx):**
- Campo "Tipo de Entrega" com opcoes "Entregue no Ato" e "Com o Cliente"
- Upload de Termo de Responsabilidade (PDF/imagem, max 5MB)
- Upload de Fotos do Aparelho (multiplas imagens, max 5MB cada)
- Validacoes obrigatorias para anexos quando "Com o Cliente"
- Interface completa no modal de Trade-In

**Modulo de Estoque (EstoquePendenciasBaseTrocas.tsx):**
- Pagina criada com layout e estatisticas
- Tabela com colunas: Modelo, IMEI, Cliente, ID Venda, Loja, Valor, SLA Devolucao, Acoes
- Componente SLABadge com animacoes Framer Motion (cores por nivel)
- Modal de Recebimento com carrossel de fotos originais
- Upload de fotos de recebimento
- Funcao de confirmar recebimento

**API (baseTrocasPendentesApi.ts):**
- Interface TradeInPendente completa
- Funcoes: getTradeInsPendentes, addTradeInPendente, registrarRecebimento
- Calculo de SLA (dias, horas, nivel)
- Estatisticas da base
- Dados mockados para teste

---

## Pendencias Criticas Identificadas

### 1. Integracao Venda -> Base de Trocas (NAO IMPLEMENTADO)

**Problema:**
Quando uma venda e registrada com trade-in "Com o Cliente", o sistema NAO esta chamando `addTradeInPendente()` para enviar o registro para a aba de Pendencias.

**Solucao:**
Modificar a funcao de registro de venda em `VendasNova.tsx` para:

```text
// Apos registrar a venda com sucesso
tradeIns.forEach(tradeIn => {
  if (tradeIn.tipoEntrega === 'Com o Cliente') {
    addTradeInPendente({
      vendaId: venda.id,
      clienteId,
      clienteNome,
      tradeIn,
      dataVenda: new Date().toISOString(),
      lojaVenda,
      vendedorId: confirmVendedor,
      vendedorNome,
      status: 'Aguardando Devolucao',
      termoResponsabilidade: tradeIn.termoResponsabilidade,
      fotosAparelho: tradeIn.fotosAparelho
    });
  }
});
```

### 2. Migracao para Produtos Pendentes (PARCIALMENTE IMPLEMENTADO)

**Problema:**
A funcao `migrarParaProdutosPendentes()` existe mas esta marcada como TODO sem integracao real com o estoque.

**Solucao:**
Implementar a integracao completa:

```text
// Em baseTrocasPendentesApi.ts
import { addProdutoPendente } from './osApi';

export function migrarParaProdutosPendentes(tradeInPendenteId: string): boolean {
  const tradeIn = getTradeInPendenteById(tradeInPendenteId);
  if (!tradeIn || tradeIn.status !== 'Recebido') return false;

  addProdutoPendente({
    modelo: tradeIn.tradeIn.modelo,
    imei: tradeIn.tradeIn.imei,
    condicao: tradeIn.tradeIn.condicao,
    valorCusto: tradeIn.tradeIn.valorCompraUsado,
    origem: 'Base de Troca',
    vendaOrigemId: tradeIn.vendaId,
    dataEntrada: tradeIn.dataRecebimento,
    // Iniciar SLA de Tratativas
    slaInicio: new Date().toISOString()
  });
  
  return true;
}
```

### 3. Coluna Vendedor Faltando na Tabela

**Problema:**
A tabela de Pendencias nao exibe a coluna "Vendedor" conforme especificado.

**Solucao:**
Adicionar coluna entre "Loja" e "Valor":

```text
<TableHead>Vendedor</TableHead>
...
<TableCell>{tradeIn.vendedorNome}</TableCell>
```

### 4. Chamada da Migracao no Recebimento

**Problema:**
O `handleConfirmarRecebimento` registra o recebimento mas nao chama a migracao.

**Solucao:**
```text
const resultado = registrarRecebimento(tradeInSelecionado.id, {...});

if (resultado) {
  // Migrar para Produtos Pendentes
  migrarParaProdutosPendentes(tradeInSelecionado.id);
  
  toast.success('Recebimento registrado!', {
    description: 'Aparelho migrado para Produtos Pendentes. SLA de Tratativas iniciado.'
  });
}
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/VendasNova.tsx` | Adicionar chamada `addTradeInPendente` apos registro de venda |
| `src/utils/baseTrocasPendentesApi.ts` | Implementar integracao real com `addProdutoPendente` |
| `src/pages/EstoquePendenciasBaseTrocas.tsx` | Adicionar coluna Vendedor e chamar migracao |
| `src/pages/VendasEditar.tsx` | Replicar logica de trade-in inteligente (se necessario) |
| `src/pages/VendasFinalizarDigital.tsx` | Replicar logica de trade-in inteligente (se necessario) |

---

## Detalhes Tecnicos

### Fluxo Completo de Dados

```text
VENDA NOVA
    |
    v
[Trade-In "Com o Cliente"]
    |
    +-- Validar: Termo + Fotos obrigatorios
    |
    +-- Registrar venda normalmente
    |
    +-- addTradeInPendente() --> Base de Trocas
    |
    v
ESTOQUE > PENDENCIAS - BASE DE TROCAS
    |
    +-- SLA Devolucao comeca a contar
    |
    +-- Status: "Aguardando Devolucao"
    |
    v
[Cliente entrega aparelho]
    |
    +-- Estoquista clica "Registrar Recebimento"
    |
    +-- Modal exibe fotos originais
    |
    +-- Anexar novas fotos do estado atual
    |
    +-- Confirmar recebimento
    |
    v
MIGRACAO AUTOMATICA
    |
    +-- registrarRecebimento() --> Status: "Recebido"
    |
    +-- migrarParaProdutosPendentes() --> addProdutoPendente()
    |
    +-- SLA Devolucao finaliza
    |
    +-- SLA Tratativas inicia
    |
    v
ESTOQUE > APARELHOS PENDENTES
    |
    +-- Produto aparece com origem "Base de Troca"
    |
    +-- Fluxo normal de parecer Estoque/Assistencia
```

### Persistencia de Anexos

Os anexos (Termo e Fotos) sao armazenados como DataURLs no estado. Isso funciona para o mock atual, mas para producao precisara de:

1. Upload para storage (Supabase Storage ou similar)
2. Armazenar apenas URLs no banco de dados
3. A infraestrutura ja esta preparada em `imagensProdutoApi.ts`

### Validacoes Implementadas

- Termo de Responsabilidade: obrigatorio quando "Com o Cliente"
- Fotos do Aparelho: minimo 1 foto obrigatoria
- Fotos de Recebimento: minimo 1 foto obrigatoria
- IMEI Validado: continua bloqueando registro de venda

---

## Ordem de Implementacao

1. **Integracao Venda -> Base de Trocas**
   - Importar `addTradeInPendente` em VendasNova.tsx
   - Adicionar logica apos registro de venda

2. **Completar Migracao**
   - Implementar integracao real em `migrarParaProdutosPendentes`
   - Chamar funcao no `handleConfirmarRecebimento`

3. **Ajustes de Tabela**
   - Adicionar coluna Vendedor
   - Garantir exibicao correta de todos os dados

4. **Replicar em Outras Paginas**
   - VendasEditar.tsx (se aplicavel)
   - VendasFinalizarDigital.tsx (se aplicavel)

5. **Testes End-to-End**
   - Criar venda com trade-in "Com o Cliente"
   - Verificar aparicao em Pendencias
   - Registrar recebimento
   - Verificar migracao para Produtos Pendentes
