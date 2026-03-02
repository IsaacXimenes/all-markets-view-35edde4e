import React, { useState, useEffect, useMemo } from 'react';
import { EstoqueLayout } from '@/components/layout/EstoqueLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Search, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCadastroStore } from '@/store/cadastroStore';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  produto_id: string | null;
  tipo_acao: string;
  quantidade_antes: number | null;
  quantidade_depois: number | null;
  loja_origem_id: string | null;
  loja_destino_id: string | null;
  referencia_id: string | null;
  referencia_tipo: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  descricao: string | null;
  created_at: string;
  // joined
  produto_modelo?: string;
  produto_imei?: string;
  produto_marca?: string;
}

const TIPOS_ACAO = ['Todos', 'Entrada', 'Saida', 'Transferencia', 'Ajuste', 'Cancelamento'];

export default function EstoqueAuditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const { obterNomeLoja } = useCadastroStore();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('estoque_audit_log')
        .select(`
          *,
          produtos:produto_id (modelo, imei, marca)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (filtroTipo !== 'Todos') {
        query = query.eq('tipo_acao', filtroTipo);
      }
      if (filtroDataInicio) {
        query = query.gte('created_at', filtroDataInicio + 'T00:00:00');
      }
      if (filtroDataFim) {
        query = query.lte('created_at', filtroDataFim + 'T23:59:59');
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar audit logs:', error);
        setLogs([]);
      } else {
        const mapped = (data || []).map((row: any) => ({
          ...row,
          produto_modelo: row.produtos?.modelo || '—',
          produto_imei: row.produtos?.imei || '—',
          produto_marca: row.produtos?.marca || '',
        }));
        setLogs(mapped);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filtroTipo, filtroDataInicio, filtroDataFim]);

  const logsFiltrados = useMemo(() => {
    if (!filtroBusca.trim()) return logs;
    const busca = filtroBusca.toLowerCase();
    return logs.filter(log =>
      (log.produto_modelo || '').toLowerCase().includes(busca) ||
      (log.produto_imei || '').toLowerCase().includes(busca) ||
      (log.usuario_nome || '').toLowerCase().includes(busca) ||
      (log.descricao || '').toLowerCase().includes(busca) ||
      (log.referencia_id || '').toLowerCase().includes(busca)
    );
  }, [logs, filtroBusca]);

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'Entrada': return 'default';
      case 'Saida': return 'destructive';
      case 'Transferencia': return 'secondary';
      case 'Ajuste': return 'outline';
      case 'Cancelamento': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <EstoqueLayout title="Auditoria de Estoque" icon={ClipboardList}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Histórico de Movimentação</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto, IMEI, usuário..."
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ACAO.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="pl-9"
                placeholder="Data Início"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="pl-9"
                placeholder="Data Fim"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Carregando logs...
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum registro de auditoria encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead className="text-center">Qtd Antes</TableHead>
                  <TableHead className="text-center">Qtd Depois</TableHead>
                  <TableHead>Loja Origem</TableHead>
                  <TableHead>Loja Destino</TableHead>
                  <TableHead>Referência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsFiltrados.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-xs">{log.usuario_nome || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(log.tipo_acao)}>{log.tipo_acao}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.produto_marca ? `${log.produto_marca} ` : ''}{log.produto_modelo}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{log.produto_imei}</TableCell>
                    <TableCell className="text-center">{log.quantidade_antes ?? '—'}</TableCell>
                    <TableCell className="text-center font-semibold">{log.quantidade_depois ?? '—'}</TableCell>
                    <TableCell className="text-xs">{log.loja_origem_id ? obterNomeLoja(log.loja_origem_id) : '—'}</TableCell>
                    <TableCell className="text-xs">{log.loja_destino_id ? obterNomeLoja(log.loja_destino_id) : '—'}</TableCell>
                    <TableCell className="text-xs">
                      {log.referencia_tipo && <span className="text-muted-foreground mr-1">{log.referencia_tipo}:</span>}
                      {log.referencia_id ? log.referencia_id.substring(0, 8) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-3 text-xs text-muted-foreground text-right">
            {logsFiltrados.length} registro(s) exibido(s)
          </div>
        </CardContent>
      </Card>
    </EstoqueLayout>
  );
}
