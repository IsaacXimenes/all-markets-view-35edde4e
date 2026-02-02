import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Scissors, AlertTriangle } from 'lucide-react';
import { Produto } from '@/utils/estoqueApi';
import { solicitarRetiradaPecas, verificarDisponibilidadeRetirada } from '@/utils/retiradaPecasApi';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { formatIMEI } from '@/utils/imeiMask';

interface ModalRetiradaPecasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: Produto | null;
  onSuccess?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function ModalRetiradaPecas({ open, onOpenChange, produto, onSuccess }: ModalRetiradaPecasProps) {
  const { user } = useAuthStore();
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);

  if (!produto) return null;

  const disponibilidade = verificarDisponibilidadeRetirada(produto.id);

  const handleSubmit = () => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo da retirada de peças');
      return;
    }
    setShowConfirmacao(true);
  };

  const handleConfirmar = async () => {
    if (!user) {
      toast.error('Usuário não identificado');
      return;
    }

    setIsSubmitting(true);

    try {
      const resultado = solicitarRetiradaPecas(
        produto.id,
        motivo,
        user.username
      );

      if (resultado.sucesso) {
        toast.success('Solicitação de retirada criada com sucesso!', {
          description: `O aparelho foi enviado para desmonte na Assistência.`
        });
        setMotivo('');
        setShowConfirmacao(false);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(resultado.mensagem);
      }
    } catch (error) {
      toast.error('Erro ao criar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMotivo('');
    setShowConfirmacao(false);
    onOpenChange(false);
  };

  return (
    <>
      {/* Modal Principal */}
      <Dialog open={open && !showConfirmacao} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-orange-500" />
              Solicitar Retirada de Peças
            </DialogTitle>
            <DialogDescription>
              O aparelho será enviado para a Assistência para desmonte e aproveitamento de peças.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informações do Produto */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{produto.modelo}</p>
                  <p className="text-sm text-muted-foreground">{produto.marca} • {produto.cor}</p>
                </div>
                <Badge variant={produto.tipo === 'Novo' ? 'default' : 'secondary'}>
                  {produto.tipo}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">IMEI:</span>
                  <span className="ml-1 font-mono">{formatIMEI(produto.imei)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <span className="ml-1 font-mono">{produto.id}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground text-sm">Valor de Custo:</span>
                <span className="ml-2 font-bold text-lg">{formatCurrency(produto.valorCusto)}</span>
              </div>
            </div>

            {/* Aviso */}
            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-700 dark:text-orange-400">Atenção</p>
                <p className="text-orange-600 dark:text-orange-300">
                  Após a confirmação, o aparelho ficará <strong>indisponível para venda</strong> até que o desmonte seja concluído ou cancelado.
                </p>
              </div>
            </div>

            {!disponibilidade.disponivel && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm text-destructive">
                  <p className="font-medium">Aparelho indisponível</p>
                  <p>{disponibilidade.motivo}</p>
                </div>
              </div>
            )}

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Retirada *</Label>
              <Textarea
                id="motivo"
                placeholder="Descreva o motivo pelo qual este aparelho está sendo enviado para desmonte..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                disabled={!disponibilidade.disponivel}
              />
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <Label>Responsável pelo Registro</Label>
              <div className="p-2 bg-muted rounded text-sm">
                {user?.username || 'Não identificado'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!disponibilidade.disponivel || !motivo.trim() || isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Confirmar Retirada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação (2 etapas) */}
      <Dialog open={showConfirmacao} onOpenChange={setShowConfirmacao}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Retirada de Peças
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você está prestes a enviar o seguinte aparelho para desmonte:
            </p>
            
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="font-semibold">{produto.modelo}</p>
              <p className="text-sm text-muted-foreground">IMEI: {formatIMEI(produto.imei)}</p>
              <p className="text-lg font-bold mt-2">{formatCurrency(produto.valorCusto)}</p>
            </div>

            <p className="text-sm text-center font-medium">
              Esta ação <span className="text-destructive">não pode ser desfeita</span> após a conclusão do desmonte.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmacao(false)}
              disabled={isSubmitting}
            >
              Voltar
            </Button>
            <Button 
              onClick={handleConfirmar}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? 'Processando...' : 'Confirmar Retirada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
