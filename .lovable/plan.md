
# Plano: Exibir Anexos do Trade-In na Tela de Nova Venda

## Objetivo
Mostrar as imagens e o termo anexados **imediatamente** na tabela de Trade-Ins da tela de Nova Venda, antes de finalizar a venda.

---

## Alterações Propostas

### Arquivo: `src/pages/VendasNova.tsx`

#### 1. Adicionar Novas Colunas na Tabela de Trade-Ins (linhas 1571-1611)

**Colunas atuais:**
- Modelo | Condição | IMEI | IMEI Validado | Valor de Compra Usado | (remover)

**Novas colunas a adicionar:**
- **Status Entrega**: Badge mostrando "Entregue" (verde) ou "Com Cliente" (âmbar)
- **Anexos**: Ícones clicáveis para visualizar Termo e Fotos em modal

```text
<TableHead>Status</TableHead>
<TableHead>Anexos</TableHead>
```

#### 2. Renderização das Novas Células

```text
{/* Coluna Status Entrega */}
<TableCell>
  {trade.tipoEntrega === 'Entregue no Ato' ? (
    <Badge className="bg-green-500">Entregue</Badge>
  ) : trade.tipoEntrega === 'Com o Cliente' ? (
    <Badge className="bg-amber-500">Com Cliente</Badge>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>

{/* Coluna Anexos */}
<TableCell>
  {trade.tipoEntrega === 'Com o Cliente' && (
    <div className="flex items-center gap-2">
      {/* Ícone Termo */}
      {trade.termoResponsabilidade && (
        <Tooltip>
          <TooltipTrigger>
            <FileText className="h-4 w-4 text-blue-500 cursor-pointer" 
              onClick={() => abrirPreviewAnexo(trade, 'termo')} />
          </TooltipTrigger>
          <TooltipContent>Termo de Responsabilidade</TooltipContent>
        </Tooltip>
      )}
      
      {/* Ícone Fotos */}
      {trade.fotosAparelho && trade.fotosAparelho.length > 0 && (
        <Tooltip>
          <TooltipTrigger>
            <div className="relative cursor-pointer" 
              onClick={() => abrirPreviewAnexo(trade, 'fotos')}>
              <Camera className="h-4 w-4 text-green-500" />
              <span className="absolute -top-1 -right-1 text-xs bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
                {trade.fotosAparelho.length}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{trade.fotosAparelho.length} foto(s)</TooltipContent>
        </Tooltip>
      )}
    </div>
  )}
</TableCell>
```

#### 3. Adicionar Estado e Modal de Visualização

```text
// Estado para modal de preview
const [previewAnexo, setPreviewAnexo] = useState<{
  aberto: boolean;
  tipo: 'termo' | 'fotos';
  trade: ItemTradeIn | null;
}>({ aberto: false, tipo: 'termo', trade: null });

// Função para abrir preview
const abrirPreviewAnexo = (trade: ItemTradeIn, tipo: 'termo' | 'fotos') => {
  setPreviewAnexo({ aberto: true, tipo, trade });
};
```

#### 4. Modal de Visualização de Anexos

```text
{/* Modal Preview Anexos Trade-In */}
<Dialog open={previewAnexo.aberto} onOpenChange={(open) => 
  setPreviewAnexo({ ...previewAnexo, aberto: open })}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>
        {previewAnexo.tipo === 'termo' 
          ? 'Termo de Responsabilidade' 
          : `Fotos do Aparelho (${previewAnexo.trade?.fotosAparelho?.length || 0})`}
      </DialogTitle>
    </DialogHeader>
    
    {previewAnexo.tipo === 'termo' && previewAnexo.trade?.termoResponsabilidade && (
      <div className="space-y-4">
        {/* Preview do documento ou link para download */}
        {previewAnexo.trade.termoResponsabilidade.tipo.includes('image') ? (
          <img src={previewAnexo.trade.termoResponsabilidade.dataUrl} 
            className="max-h-[60vh] object-contain mx-auto rounded" />
        ) : (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            <p>{previewAnexo.trade.termoResponsabilidade.nome}</p>
            <Button onClick={() => {/* download logic */}}>
              Baixar Documento
            </Button>
          </div>
        )}
      </div>
    )}
    
    {previewAnexo.tipo === 'fotos' && previewAnexo.trade?.fotosAparelho && (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {previewAnexo.trade.fotosAparelho.map((foto) => (
          <img key={foto.id} src={foto.dataUrl} 
            className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
            onClick={() => window.open(foto.dataUrl, '_blank')} />
        ))}
      </div>
    )}
  </DialogContent>
</Dialog>
```

#### 5. Importar Componentes Necessários

```text
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
// Camera já está importado
```

---

## Resumo Visual

**Antes:**
| Modelo | Condição | IMEI | IMEI Validado | Valor | X |

**Depois:**
| Modelo | Condição | IMEI | IMEI Validado | Status | Anexos | Valor | X |

Com ícones clicáveis que abrem modal para visualizar:
- Termo de Responsabilidade (PDF/imagem)
- Grid de Fotos do Aparelho

---

## Benefícios

1. **Feedback imediato** - usuário vê os anexos assim que adiciona
2. **Verificação visual** - pode conferir se anexou corretamente antes de salvar
3. **Consistência** - mesmo padrão de ícones usado em Vendas.tsx e VendaDetalhes.tsx
