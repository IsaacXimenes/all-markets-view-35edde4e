
# Plano: Conferência Automática de Itens Pendentes via Venda

## Visão Geral

Implementar uma funcionalidade de conferência automática no módulo de Movimentações - Matriz. Quando uma movimentação é visualizada, o sistema irá verificar automaticamente se algum dos itens "Pendentes" foi vendido, conferindo-os automaticamente e exibindo os dados da venda (ID da Venda + Vendedor).

---

## 1. Fluxo de Conferência Automática

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Usuário abre detalhes                              │
│                              da movimentação                                 │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Para cada item com status "Enviado"                       │
│                         (Pendente de retorno)                                │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              Buscar na base de Vendas por IMEI do aparelho                   │
│                   (considera apenas vendas Concluídas)                       │
└───────────────┬───────────────────────────────────────────┬─────────────────┘
                │                                           │
        Venda encontrada                            Sem venda
                │                                           │
                ▼                                           ▼
┌───────────────────────────────────┐      ┌───────────────────────────────────┐
│  Item → status: "Vendido"         │      │   Item permanece "Enviado"        │
│  Gravar vendaId + vendedorNome    │      │   (continua em Pendentes)         │
│  Adicionar entrada na timeline    │      │                                   │
│  Toast de sucesso                 │      │                                   │
└───────────────────────────────────┘      └───────────────────────────────────┘
```

---

## 2. Alterações Necessárias

### 2.1 Criar Função de Busca de Venda por IMEI (vendasApi.ts)

Adicionar função para buscar venda por IMEI do aparelho:

```typescript
// Buscar venda concluída que contenha um item com o IMEI especificado
export const buscarVendaPorImei = (imei: string): { venda: Venda; item: ItemVenda; } | null => {
  const imeiLimpo = imei.replace(/\D/g, '');
  
  for (const venda of vendas) {
    // Apenas vendas concluídas
    if (venda.status !== 'Concluída') continue;
    
    const item = venda.itens.find(i => i.imei === imeiLimpo);
    if (item) {
      return { venda, item };
    }
  }
  
  return null;
};
```

### 2.2 Atualizar Interface MovimentacaoMatrizItem (estoqueApi.ts)

Adicionar campos para armazenar dados da venda quando item for conferido automaticamente:

```typescript
export interface MovimentacaoMatrizItem {
  aparelhoId: string;
  imei: string;
  modelo: string;
  cor: string;
  statusItem: 'Enviado' | 'Devolvido' | 'Vendido';
  dataHoraRetorno?: string;
  responsavelRetorno?: string;
  // Novos campos para conferência automática via venda
  vendaId?: string;           // ID da venda quando conferido automaticamente
  vendedorId?: string;        // ID do vendedor responsável
  vendedorNome?: string;      // Nome do vendedor
  conferenciaAutomatica?: boolean; // Flag para indicar conferência automática
}
```

### 2.3 Criar Função de Conferência Automática (estoqueApi.ts)

Nova função que verifica e confere itens pendentes automaticamente:

```typescript
import { buscarVendaPorImei } from './vendasApi';

export const conferirItensAutomaticamentePorVenda = (
  movimentacaoId: string,
  obterNomeColaborador: (id: string) => string
): { 
  movimentacao: MovimentacaoMatriz | null; 
  itensConferidos: Array<{ imei: string; vendaId: string; vendedor: string }>; 
} => {
  const movimentacao = movimentacoesMatriz.find(m => m.id === movimentacaoId);
  if (!movimentacao) {
    return { movimentacao: null, itensConferidos: [] };
  }
  
  // Apenas movimentações não finalizadas
  if (movimentacao.statusMovimentacao.startsWith('Finalizado')) {
    return { movimentacao, itensConferidos: [] };
  }
  
  const agora = new Date();
  const agoraISO = agora.toISOString();
  const itensConferidos: Array<{ imei: string; vendaId: string; vendedor: string }> = [];
  
  // Para cada item pendente (Enviado), verificar se existe venda
  movimentacao.itens.forEach(item => {
    if (item.statusItem !== 'Enviado') return;
    
    const resultado = buscarVendaPorImei(item.imei);
    if (resultado) {
      const { venda } = resultado;
      const vendedorNome = obterNomeColaborador(venda.vendedor) || 'Vendedor Desconhecido';
      
      // Atualizar item
      item.statusItem = 'Vendido';
      item.dataHoraRetorno = agoraISO;
      item.vendaId = venda.id;
      item.vendedorId = venda.vendedor;
      item.vendedorNome = vendedorNome;
      item.conferenciaAutomatica = true;
      
      // Adicionar à lista de conferidos
      itensConferidos.push({
        imei: item.imei,
        vendaId: venda.id,
        vendedor: vendedorNome
      });
      
      // Adicionar entrada na timeline
      movimentacao.timeline.unshift({
        id: `TL-${Date.now()}-auto-${item.imei}`,
        data: agoraISO,
        tipo: 'venda_matriz',
        titulo: 'Conferido Automaticamente via Venda',
        descricao: `${item.modelo} ${item.cor} - Venda ${venda.id} por ${vendedorNome}`,
        responsavel: 'Sistema',
        aparelhoId: item.aparelhoId
      });
    }
  });
  
  // Verificar se movimentação finalizou
  const todosFinalizados = movimentacao.itens.every(
    i => i.statusItem === 'Devolvido' || i.statusItem === 'Vendido'
  );
  
  if (todosFinalizados && itensConferidos.length > 0) {
    const limite = new Date(movimentacao.dataHoraLimiteRetorno);
    movimentacao.statusMovimentacao = (movimentacao.statusMovimentacao === 'Atrasado' || agora >= limite)
      ? 'Finalizado - Atrasado'
      : 'Finalizado - Dentro do Prazo';
      
    movimentacao.timeline.unshift({
      id: `TL-${Date.now()}-auto-conc`,
      data: agoraISO,
      tipo: 'retorno_matriz',
      titulo: 'Movimentação Finalizada Automaticamente',
      descricao: `Todos os itens conferidos - ${movimentacao.statusMovimentacao}`,
      responsavel: 'Sistema'
    });
  }
  
  return { movimentacao, itensConferidos };
};
```

### 2.4 Atualizar Tela de Detalhes (EstoqueMovimentacaoMatrizDetalhes.tsx)

#### Importar função e chamar no useEffect:

```typescript
import { 
  // ... imports existentes
  conferirItensAutomaticamentePorVenda
} from '@/utils/estoqueApi';
```

```typescript
// No useEffect de carregamento
useEffect(() => {
  if (id) {
    // Verificar status de todas as movimentações
    verificarStatusMovimentacoesMatriz();
    
    // Tentar conferir itens automaticamente por venda
    const { movimentacao: movAtualizada, itensConferidos } = 
      conferirItensAutomaticamentePorVenda(id, obterNomeColaborador);
    
    if (movAtualizada) {
      setMovimentacao(movAtualizada);
      
      // Mostrar toast se houver conferências automáticas
      if (itensConferidos.length > 0) {
        toast({
          title: 'Conferência Automática',
          description: `${itensConferidos.length} item(ns) conferido(s) automaticamente via vendas realizadas`,
        });
      }
    } else {
      const mov = getMovimentacaoMatrizById(id);
      setMovimentacao(mov);
    }
    
    setIsLoading(false);
  }
}, [id]);
```

#### Atualizar Exibição no Quadro "Conferidos":

No quadro de itens conferidos, separar itens conferidos manualmente dos automáticos e exibir dados adicionais:

```typescript
{/* Quadro Conferidos - Exibição com dados de venda */}
{itensConferidos.map(item => (
  <div 
    key={item.aparelhoId}
    className={`p-3 rounded-lg border ${
      item.conferenciaAutomatica 
        ? 'bg-blue-500/10 border-blue-500/30' 
        : 'bg-green-500/10 border-green-500/30'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-sm">{item.modelo}</p>
        <p className="text-xs text-muted-foreground font-mono">{formatIMEI(item.imei)}</p>
        
        {item.conferenciaAutomatica && item.vendaId && (
          <div className="mt-1 space-y-1">
            <p className="text-xs text-blue-600">
              <strong>Venda:</strong> {item.vendaId}
            </p>
            <p className="text-xs text-blue-600">
              <strong>Vendedor:</strong> {item.vendedorNome}
            </p>
          </div>
        )}
        
        {!item.conferenciaAutomatica && item.dataHoraRetorno && (
          <p className="text-xs text-green-600 mt-1">
            {format(new Date(item.dataHoraRetorno), "dd/MM HH:mm")} - {item.responsavelRetorno}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {item.conferenciaAutomatica ? (
          <Badge className="bg-blue-600 text-xs">Venda Automática</Badge>
        ) : (
          <Badge className="bg-green-600 text-xs">Devolvido</Badge>
        )}
      </div>
    </div>
  </div>
))}
```

#### Atualizar Lista de Itens Conferidos:

```typescript
// Separar itens por status
const itensRelacaoOriginal = movimentacao?.itens ?? [];
const itensConferidos = itensRelacaoOriginal.filter(
  i => i.statusItem === 'Devolvido' || i.statusItem === 'Vendido'
);
const itensPendentes = itensRelacaoOriginal.filter(i => i.statusItem === 'Enviado');
```

---

## 3. Resumo de Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/utils/vendasApi.ts` | Adicionar função `buscarVendaPorImei` |
| `src/utils/estoqueApi.ts` | Atualizar interface `MovimentacaoMatrizItem`, criar função `conferirItensAutomaticamentePorVenda` |
| `src/pages/EstoqueMovimentacaoMatrizDetalhes.tsx` | Chamar conferência automática no carregamento, atualizar UI para exibir dados de venda |

---

## 4. Detalhes Técnicos

### Lógica de Busca de Venda

- Busca em todas as vendas com `status === 'Concluída'`
- Compara IMEI limpo (sem formatação) com `venda.itens[].imei`
- Se múltiplas vendas (improvável), retorna a primeira encontrada (mais antiga)
- Para priorizar mais recente, ordenar vendas por `dataHora` desc antes da busca

### Performance

A busca é O(n*m) onde n = vendas e m = itens por venda. Para otimização futura:
- Criar índice Map por IMEI
- Cache de resultados

### Visualização no Timeline (Histórico de Ações)

Entries de conferência automática terão:
- Título: "Conferido Automaticamente via Venda"
- Descrição: "{Modelo} {Cor} - Venda {ID} por {Vendedor}"
- Responsável: "Sistema"
- Tipo: `venda_matriz`

### Cores e Badges

| Tipo | Cor Background | Badge |
|------|----------------|-------|
| Devolvido (Manual) | `bg-green-500/10` | `Devolvido` (verde) |
| Vendido (Automático) | `bg-blue-500/10` | `Venda Automática` (azul) |
| Pendente | `bg-yellow-500/10` | N/A |
