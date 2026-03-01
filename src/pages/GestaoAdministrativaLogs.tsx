import { useState, useMemo } from 'react';
import { GestaoAdministrativaLayout } from '@/components/layout/GestaoAdministrativaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { History, CheckCircle, XCircle, FileEdit, ShieldAlert, CalendarIcon, ListChecks } from 'lucide-react';
import { useCadastroStore } from '@/store/cadastroStore';
import { useAuthStore } from '@/store/authStore';
import { useIsAcessoGeral } from '@/utils/permissoesUtils';
import { AutocompleteLoja } from '@/components/AutocompleteLoja';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  getLogsAuditoria,
  LogAuditoria
} from '@/utils/gestaoAdministrativaApi';
import {
  getLogsAtividades,
  LogAtividade
} from '@/utils/atividadesGestoresApi';

interface LogUnificado {
  id: string;
  modulo: string;
  dataHora: string;
  usuario: string;
  acao: string;
  acaoTipo: 'conferencia_marcada' | 'conferencia_desmarcada' | 'ajuste_registrado' | 'atividade_marcada' | 'atividade_desmarcada';
  lojaId?: string;
  detalhes: string;
}

export default function GestaoAdministrativaLogs() {
  const { lojas, colaboradores } = useCadastroStore();
  const { user } = useAuthStore();
  
  const colaboradorLogado = colaboradores.find(c => c.id === user?.colaborador?.id);
  const acessoGeral = useIsAcessoGeral();
  const ehGestor = acessoGeral || (colaboradorLogado?.eh_gestor ?? user?.colaborador?.cargo?.toLowerCase().includes('gestor') ?? false);
  
  const [lojaId, setLojaId] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState<Date | undefined>(endOfMonth(new Date()));
  
  const logs = useMemo(() => {
    const resultado: LogUnificado[] = [];
    
    // Logs de conferência de caixa
    const competencia = dataInicio ? format(dataInicio, 'yyyy-MM') : undefined;
    const logsConf = getLogsAuditoria(competencia, lojaId || 'todas');
    logsConf.forEach(log => {
      resultado.push({
        id: log.id,
        modulo: 'Conferência de Caixa',
        dataHora: log.dataHora,
        usuario: log.usuarioNome,
        acao: log.acao === 'conferencia_marcada' ? 'Conferência Marcada' :
              log.acao === 'conferencia_desmarcada' ? 'Conferência Desmarcada' : 'Ajuste Registrado',
        acaoTipo: log.acao,
        lojaId: log.lojaId,
        detalhes: log.detalhes,
      });
    });
    
    // Logs de atividades dos gestores
    const logsAtv = getLogsAtividades();
    logsAtv.forEach(log => {
      resultado.push({
        id: log.id,
        modulo: 'Atividades Gestores',
        dataHora: log.dataHora,
        usuario: log.gestorNome,
        acao: log.acao === 'marcou' ? 'Atividade Marcada' : 'Atividade Desmarcada',
        acaoTipo: log.acao === 'marcou' ? 'atividade_marcada' : 'atividade_desmarcada',
        detalhes: log.detalhes,
      });
    });
    
    // Filter by date range
    let filtrado = resultado;
    if (dataInicio || dataFim) {
      filtrado = filtrado.filter(log => {
        const logDate = new Date(log.dataHora);
        if (dataInicio && logDate < dataInicio) return false;
        if (dataFim) {
          const fimDia = new Date(dataFim);
          fimDia.setHours(23, 59, 59, 999);
          if (logDate > fimDia) return false;
        }
        return true;
      });
    }
    
    // Filter by loja (only for conferência logs that have lojaId)
    if (lojaId) {
      filtrado = filtrado.filter(log => !log.lojaId || log.lojaId === lojaId);
    }
    
    // Sort by most recent
    return filtrado.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }, [lojaId, dataInicio, dataFim]);
  
  const getLojaNome = (id?: string) => {
    if (!id || id === 'todas') return '-';
    const loja = lojas.find(l => l.id === id);
    return loja?.nome || id;
  };
  
  const getAcaoBadge = (acaoTipo: LogUnificado['acaoTipo'], acao: string) => {
    switch (acaoTipo) {
      case 'conferencia_marcada':
      case 'atividade_marcada':
        return (
          <Badge className="bg-green-500/20 text-green-700 border-green-500/30 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {acao}
          </Badge>
        );
      case 'conferencia_desmarcada':
      case 'atividade_desmarcada':
        return (
          <Badge className="bg-red-500/20 text-red-700 border-red-500/30 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {acao}
          </Badge>
        );
      case 'ajuste_registrado':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30 flex items-center gap-1">
            <FileEdit className="h-3 w-3" />
            {acao}
          </Badge>
        );
      default:
        return <Badge variant="outline">{acao}</Badge>;
    }
  };
  
  if (!ehGestor) {
    return (
      <GestaoAdministrativaLayout title="Logs de Auditoria">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Este módulo é restrito a usuários com perfil de gestor. Entre em contato com o administrador do sistema.
          </AlertDescription>
        </Alert>
      </GestaoAdministrativaLayout>
    );
  }
  
  return (
    <GestaoAdministrativaLayout title="Logs de Auditoria">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label>Data Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataInicio ? format(dataInicio, 'dd/MM/yyyy') : 'Selecione'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Data Fim</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataFim ? format(dataFim, 'dd/MM/yyyy') : 'Selecione'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dataFim} onSelect={setDataFim} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Loja</Label>
          <AutocompleteLoja
            value={lojaId}
            onChange={setLojaId}
            placeholder="Todas as Lojas"
            apenasLojasTipoLoja
          />
        </div>
      </div>
      
      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Ações ({logs.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log de auditoria encontrado.</p>
              <p className="text-sm">Os logs serão exibidos aqui após ações de conferência ou marcação de atividades.</p>
            </div>
          ) : (
            <ScrollArea className="w-full" type="always">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Data/Hora</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.dataHora), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {log.modulo === 'Atividades Gestores' ? <ListChecks className="h-3 w-3" /> : <History className="h-3 w-3" />}
                            {log.modulo}
                          </Badge>
                        </TableCell>
                        <TableCell>{getLojaNome(log.lojaId)}</TableCell>
                        <TableCell>{getAcaoBadge(log.acaoTipo, log.acao)}</TableCell>
                        <TableCell>{log.usuario}</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.detalhes}>
                          {log.detalhes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" className="h-4" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </GestaoAdministrativaLayout>
  );
}
