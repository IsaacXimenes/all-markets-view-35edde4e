// Vendas Digital API - Pré-cadastro rápido e fila de pendentes
import { addNotification } from './notificationsApi';

export type VendaDigitalStatus = 
  | 'Pendente' 
  | 'Ajuste Solicitado' 
  | 'Em Finalização' 
  | 'Concluída Digital';

export interface TimelineEntry {
  id: string;
  data: string;
  acao: string;
  responsavel: string;
  responsavelId: string;
  detalhes?: string;
}

export interface VendaDigital {
  id: string;
  numero: number;
  dataHora: string;
  responsavelVendaId: string;
  responsavelVendaNome: string;
  clienteNome: string; // Nome livre no pré-cadastro
  clienteId?: string; // Preenchido na finalização
  valorTotal: number;
  status: VendaDigitalStatus;
  timeline: TimelineEntry[];
  finalizadorId?: string;
  finalizadorNome?: string;
  dataFinalizacao?: string;
  motivoAjuste?: string;
  // Dados completos (preenchidos na finalização)
  dadosCompletos?: {
    itens: any[];
    tradeIns: any[];
    pagamentos: any[];
    observacoes: string;
    origemVenda: string;
    localRetirada: string;
  };
}

// Mock de colaboradores com permissão Digital
export const colaboradoresDigital = [
  { id: '143ac0c2', nome: 'Antonio Sousa Silva Filho', cargo: 'Vendedor (a)', permissao: 'Digital' },
  { id: '1b9137c8', nome: 'Evelyn Cordeiro de Oliveira', cargo: 'Vendedor (a)', permissao: 'Digital' },
  { id: '62312809', nome: 'Izaquiel Costa Santos', cargo: 'Vendedor (a)', permissao: 'Digital' },
];

export const colaboradoresFinalizador = [
  { id: '143ac0c2', nome: 'Antonio Sousa Silva Filho', cargo: 'Vendedor (a)', permissao: 'Finalizador Digital' },
  { id: '1b9137c8', nome: 'Evelyn Cordeiro de Oliveira', cargo: 'Vendedor (a)', permissao: 'Finalizador Digital' },
];

// Calcula dias desde registro
export const calcularSLA = (dataHora: string): number => {
  const data = new Date(dataHora);
  const hoje = new Date();
  const diffTime = Math.abs(hoje.getTime() - data.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Mock data - 5 pré-cadastros ordenados por data recente primeiro
let vendasDigitais: VendaDigital[] = [
  {
    id: 'VEN-DIG-2025-0001',
    numero: 1,
    dataHora: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
    responsavelVendaId: '143ac0c2',
    responsavelVendaNome: 'Antonio Sousa Silva Filho',
    clienteNome: 'Carlos Mendes',
    valorTotal: 8500.00,
    status: 'Pendente',
    timeline: [
      {
        id: 'TL-001',
        data: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
        acao: 'Pré-cadastro enviado',
        responsavel: 'Antonio Sousa Silva Filho',
        responsavelId: '143ac0c2'
      }
    ]
  },
  {
    id: 'VEN-DIG-2025-0002',
    numero: 2,
    dataHora: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    responsavelVendaId: '1b9137c8',
    responsavelVendaNome: 'Evelyn Cordeiro de Oliveira',
    clienteNome: 'Patricia Lima',
    valorTotal: 12300.00,
    status: 'Pendente',
    timeline: [
      {
        id: 'TL-002',
        data: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        acao: 'Pré-cadastro enviado',
        responsavel: 'Evelyn Cordeiro de Oliveira',
        responsavelId: '1b9137c8'
      }
    ]
  },
  {
    id: 'VEN-DIG-2025-0003',
    numero: 3,
    dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    responsavelVendaId: '62312809',
    responsavelVendaNome: 'Izaquiel Costa Santos',
    clienteNome: 'Fernando Souza',
    valorTotal: 5200.00,
    status: 'Pendente',
    timeline: [
      {
        id: 'TL-003',
        data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        acao: 'Pré-cadastro enviado',
        responsavel: 'Izaquiel Costa Santos',
        responsavelId: '62312809'
      }
    ]
  },
  {
    id: 'VEN-DIG-2025-0004',
    numero: 4,
    dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    responsavelVendaId: '143ac0c2',
    responsavelVendaNome: 'Antonio Sousa Silva Filho',
    clienteNome: 'Amanda Torres',
    valorTotal: 9800.00,
    status: 'Pendente',
    timeline: [
      {
        id: 'TL-004',
        data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        acao: 'Pré-cadastro enviado',
        responsavel: 'Antonio Sousa Silva Filho',
        responsavelId: '143ac0c2'
      }
    ]
  },
  {
    id: 'VEN-DIG-2025-0005',
    numero: 5,
    dataHora: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    responsavelVendaId: '1b9137c8',
    responsavelVendaNome: 'Evelyn Cordeiro de Oliveira',
    clienteNome: 'Roberto Almeida',
    valorTotal: 14500.00,
    status: 'Pendente',
    timeline: [
      {
        id: 'TL-005',
        data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        acao: 'Pré-cadastro enviado',
        responsavel: 'Evelyn Cordeiro de Oliveira',
        responsavelId: '1b9137c8'
      }
    ]
  }
];

let vendaDigitalCounter = 5;
let timelineCounter = 10;

// Funções de API
export const getVendasDigitais = (): VendaDigital[] => {
  return [...vendasDigitais];
};

export const getVendaDigitalById = (id: string): VendaDigital | null => {
  return vendasDigitais.find(v => v.id === id) || null;
};

export const getVendasDigitaisPendentes = (): VendaDigital[] => {
  return vendasDigitais.filter(v => 
    v.status === 'Pendente' || v.status === 'Ajuste Solicitado' || v.status === 'Em Finalização'
  );
};

export const criarPreCadastro = (
  responsavelVendaId: string,
  responsavelVendaNome: string,
  clienteNome: string,
  valorTotal: number
): VendaDigital => {
  vendaDigitalCounter++;
  const year = new Date().getFullYear();
  const now = new Date().toISOString();
  
  const novaVenda: VendaDigital = {
    id: `VEN-DIG-${year}-${String(vendaDigitalCounter).padStart(4, '0')}`,
    numero: vendaDigitalCounter,
    dataHora: now,
    responsavelVendaId,
    responsavelVendaNome,
    clienteNome,
    valorTotal,
    status: 'Pendente',
    timeline: [
      {
        id: `TL-${String(++timelineCounter).padStart(3, '0')}`,
        data: now,
        acao: 'Pré-cadastro enviado',
        responsavel: responsavelVendaNome,
        responsavelId: responsavelVendaId
      }
    ]
  };
  
  vendasDigitais.push(novaVenda);
  
  // Notificar finalizadores
  addNotification({
    type: 'venda_digital',
    title: 'Novo pré-cadastro digital',
    description: `${novaVenda.id} - ${clienteNome} - R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    targetUsers: colaboradoresFinalizador.map(c => c.id)
  });
  
  return novaVenda;
};

export const solicitarAjuste = (
  vendaId: string,
  finalizadorId: string,
  finalizadorNome: string,
  motivo: string
): VendaDigital | null => {
  const index = vendasDigitais.findIndex(v => v.id === vendaId);
  if (index === -1) return null;
  
  const now = new Date().toISOString();
  
  vendasDigitais[index] = {
    ...vendasDigitais[index],
    status: 'Ajuste Solicitado',
    motivoAjuste: motivo,
    timeline: [
      ...vendasDigitais[index].timeline,
      {
        id: `TL-${String(++timelineCounter).padStart(3, '0')}`,
        data: now,
        acao: 'Ajuste solicitado',
        responsavel: finalizadorNome,
        responsavelId: finalizadorId,
        detalhes: motivo
      }
    ]
  };
  
  // Notificar vendedor digital
  addNotification({
    type: 'ajuste_venda',
    title: 'Ajuste solicitado',
    description: `Venda ${vendaId} – motivo: ${motivo.substring(0, 50)}...`,
    targetUsers: [vendasDigitais[index].responsavelVendaId]
  });
  
  return vendasDigitais[index];
};

export const finalizarVendaDigital = (
  vendaId: string,
  finalizadorId: string,
  finalizadorNome: string,
  clienteId: string,
  dadosCompletos: VendaDigital['dadosCompletos']
): VendaDigital | null => {
  const index = vendasDigitais.findIndex(v => v.id === vendaId);
  if (index === -1) return null;
  
  const now = new Date().toISOString();
  
  vendasDigitais[index] = {
    ...vendasDigitais[index],
    status: 'Concluída Digital',
    clienteId,
    finalizadorId,
    finalizadorNome,
    dataFinalizacao: now,
    dadosCompletos,
    timeline: [
      ...vendasDigitais[index].timeline,
      {
        id: `TL-${String(++timelineCounter).padStart(3, '0')}`,
        data: now,
        acao: 'Venda finalizada',
        responsavel: finalizadorNome,
        responsavelId: finalizadorId
      }
    ]
  };
  
  // Notificar vendedor digital
  addNotification({
    type: 'venda_finalizada',
    title: 'Venda digital finalizada',
    description: `${vendaId} foi finalizada por ${finalizadorNome}`,
    targetUsers: [vendasDigitais[index].responsavelVendaId]
  });
  
  return vendasDigitais[index];
};

export const getColaboradoresDigital = () => [...colaboradoresDigital];
export const getColaboradoresFinalizador = () => [...colaboradoresFinalizador];

// formatCurrency removido - usar import { formatCurrency } from '@/utils/formatUtils'
export { formatCurrency } from '@/utils/formatUtils';

export const exportVendasDigitaisToCSV = (data: VendaDigital[], filename: string) => {
  if (data.length === 0) return;
  
  const csvData = data.map(v => ({
    'ID': v.id,
    'Data/Hora': new Date(v.dataHora).toLocaleString('pt-BR'),
    'Responsável Venda': v.responsavelVendaNome,
    'Cliente': v.clienteNome,
    'Valor Total': v.valorTotal,
    'Status': v.status,
    'SLA (dias)': calcularSLA(v.dataHora),
    'Finalizador': v.finalizadorNome || '-',
    'Data Finalização': v.dataFinalizacao ? new Date(v.dataFinalizacao).toLocaleString('pt-BR') : '-'
  }));
  
  const headers = Object.keys(csvData[0]).join(',');
  const rows = csvData.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Verifica se colaborador tem permissão Digital
export const temPermissaoDigital = (colaboradorId: string): boolean => {
  return colaboradoresDigital.some(c => c.id === colaboradorId);
};

// Verifica se colaborador tem permissão Finalizador
export const temPermissaoFinalizador = (colaboradorId: string): boolean => {
  return colaboradoresFinalizador.some(c => c.id === colaboradorId);
};
