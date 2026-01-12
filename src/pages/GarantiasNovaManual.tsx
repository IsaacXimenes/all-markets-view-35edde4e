import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GarantiasLayout } from '@/components/layout/GarantiasLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Shield, User, Phone, Mail, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getLojas, getProdutosCadastro } from '@/utils/cadastrosApi';
import { addGarantia, addTimelineEntry } from '@/utils/garantiasApi';
import { format, addMonths } from 'date-fns';
import { formatIMEI, unformatIMEI } from '@/utils/imeiMask';

export default function GarantiasNovaManual() {
  const navigate = useNavigate();
  const lojas = getLojas();
  const produtos = getProdutosCadastro();
  
  // Form state
  const [formData, setFormData] = useState<{
    imei: string;
    modelo: string;
    tipoGarantia: 'Garantia - Apple' | 'Garantia - Thiago Imports';
    mesesGarantia: number;
    dataInicioGarantia: string;
    lojaVenda: string;
    clienteNome: string;
    clienteTelefone: string;
    clienteEmail: string;
    observacoes: string;
  }>({
    imei: '',
    modelo: '',
    tipoGarantia: 'Garantia - Apple',
    mesesGarantia: 12,
    dataInicioGarantia: format(new Date(), 'yyyy-MM-dd'),
    lojaVenda: '',
    clienteNome: '',
    clienteTelefone: '',
    clienteEmail: '',
    observacoes: ''
  });

  // Calculate end date
  const dataFimGarantia = useMemo(() => {
    if (!formData.dataInicioGarantia) return '';
    const dataInicio = new Date(formData.dataInicioGarantia);
    return format(addMonths(dataInicio, formData.mesesGarantia), 'dd/MM/yyyy');
  }, [formData.dataInicioGarantia, formData.mesesGarantia]);

  const handleSalvar = () => {
    // Validations
    if (!formData.imei || !formData.modelo || !formData.lojaVenda || !formData.clienteNome) {
      toast.error('Preencha todos os campos obrigatórios (IMEI, Modelo, Loja e Nome do Cliente)');
      return;
    }

    const imeiLimpo = unformatIMEI(formData.imei);
    if (imeiLimpo.length !== 15) {
      toast.error('IMEI deve ter 15 dígitos');
      return;
    }

    const dataInicio = new Date(formData.dataInicioGarantia);
    const dataFimCalc = format(addMonths(dataInicio, formData.mesesGarantia), 'yyyy-MM-dd');

    const novaGarantia = addGarantia({
      vendaId: '',
      itemVendaId: '',
      produtoId: '',
      imei: imeiLimpo,
      modelo: formData.modelo,
      tipoGarantia: formData.tipoGarantia,
      mesesGarantia: formData.mesesGarantia,
      dataInicioGarantia: formData.dataInicioGarantia,
      dataFimGarantia: dataFimCalc,
      status: 'Ativa',
      lojaVenda: formData.lojaVenda,
      clienteId: '',
      clienteNome: formData.clienteNome,
      clienteTelefone: formData.clienteTelefone,
      clienteEmail: formData.clienteEmail
    });

    // Add timeline entry
    addTimelineEntry({
      garantiaId: novaGarantia.id,
      dataHora: new Date().toISOString(),
      tipo: 'registro_venda',
      titulo: 'Garantia Registrada Manualmente',
      descricao: formData.observacoes || 'Garantia registrada manualmente sem vínculo com venda',
      usuarioId: 'COL-001',
      usuarioNome: 'Usuário Sistema'
    });

    toast.success('Garantia registrada com sucesso!');
    navigate(`/garantias/${novaGarantia.id}`);
  };

  const getLojaName = (id: string) => lojas.find(l => l.id === id)?.nome || id;

  return (
    <GarantiasLayout title="Nova Garantia Manual">
      {/* Header with back button */}
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate('/garantias/nova')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleSalvar}>
          <Save className="h-4 w-4 mr-2" />
          Registrar Garantia
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Dados do Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IMEI *</Label>
                  <Input
                    placeholder="00-000000-000000-0"
                    value={formData.imei}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      imei: formatIMEI(e.target.value) 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Select 
                    value={formData.modelo} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, modelo: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map(p => (
                        <SelectItem key={p.id} value={p.produto}>{p.produto}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Resp. Garantia *</Label>
                  <Select 
                    value={formData.tipoGarantia} 
                    onValueChange={(v) => setFormData(prev => ({ 
                      ...prev, 
                      tipoGarantia: v as 'Garantia - Apple' | 'Garantia - Thiago Imports' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Garantia - Apple">Garantia - Apple</SelectItem>
                      <SelectItem value="Garantia - Thiago Imports">Garantia - Thiago Imports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duração da Garantia *</Label>
                  <Select 
                    value={String(formData.mesesGarantia)} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, mesesGarantia: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                      <SelectItem value="24">24 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Início *</Label>
                  <Input
                    type="date"
                    value={formData.dataInicioGarantia}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataInicioGarantia: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Loja *</Label>
                <Select 
                  value={formData.lojaVenda} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, lojaVenda: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Client Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Cliente *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.clienteNome}
                    onChange={(e) => setFormData(prev => ({ ...prev, clienteNome: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Telefone
                  </Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.clienteTelefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, clienteTelefone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    E-mail
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.clienteEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clienteEmail: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações sobre a garantia..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Warranty Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Resumo da Garantia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">IMEI</p>
                <p className="font-mono font-medium">{formData.imei || '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{formData.modelo || '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Resp. Garantia</p>
                <p className="font-medium">{formData.tipoGarantia}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="font-medium">{formData.mesesGarantia} meses</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Data Fim Garantia</p>
                <p className="font-medium text-primary">{dataFimGarantia || '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Loja</p>
                <p className="font-medium">{formData.lojaVenda ? getLojaName(formData.lojaVenda) : '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Client Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{formData.clienteNome || '-'}</p>
              </div>
              {formData.clienteTelefone && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{formData.clienteTelefone}</p>
                </div>
              )}
              {formData.clienteEmail && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{formData.clienteEmail}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </GarantiasLayout>
  );
}
