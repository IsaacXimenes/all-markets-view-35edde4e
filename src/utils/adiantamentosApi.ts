// Adiantamentos API - Mock Data

export interface HistoricoAlteracao {
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  tipoAcao: 'Criação' | 'Edição';
}

export interface Adiantamento {
  id: string;
  dataLancamento: string;
  lancadoPor: string;
  lancadoPorNome: string;
  lojaId: string;
  colaboradorId: string;
  observacao: string;
  valorFinal: number;
  quantidadeVezes: number;
  inicioCompetencia: string; // Formato: "Jan-2026"
  historico: HistoricoAlteracao[];
}

// Mock Data
let adiantamentos: Adiantamento[] = [
  {
    id: 'ADT-001',
    dataLancamento: '2026-01-12T11:00:00',
    lancadoPor: 'COL-001',
    lancadoPorNome: 'Lucas Mendes',
    lojaId: 'LOJA-001',
    colaboradorId: 'COL-005',
    observacao: 'Adiantamento para reforma residencial',
    valorFinal: 1500,
    quantidadeVezes: 5,
    inicioCompetencia: 'Fev-2026',
    historico: [
      {
        dataHora: '2026-01-12T11:00:00',
        usuarioId: 'COL-001',
        usuarioNome: 'Lucas Mendes',
        campoAlterado: '-',
        valorAnterior: '-',
        valorNovo: '-',
        tipoAcao: 'Criação'
      }
    ]
  },
  {
    id: 'ADT-002',
    dataLancamento: '2026-01-05T16:30:00',
    lancadoPor: 'COL-002',
    lancadoPorNome: 'Fernanda Lima',
    lojaId: 'LOJA-002',
    colaboradorId: 'COL-006',
    observacao: 'Adiantamento salarial - 50%',
    valorFinal: 1100,
    quantidadeVezes: 1,
    inicioCompetencia: 'Jan-2026',
    historico: [
      {
        dataHora: '2026-01-05T16:30:00',
        usuarioId: 'COL-002',
        usuarioNome: 'Fernanda Lima',
        campoAlterado: '-',
        valorAnterior: '-',
        valorNovo: '-',
        tipoAcao: 'Criação'
      }
    ]
  },
  {
    id: 'ADT-003',
    dataLancamento: '2025-12-20T08:20:00',
    lancadoPor: 'COL-003',
    lancadoPorNome: 'Roberto Alves',
    lojaId: 'LOJA-003',
    colaboradorId: 'COL-009',
    observacao: 'Adiantamento para compra de veículo',
    valorFinal: 3000,
    quantidadeVezes: 10,
    inicioCompetencia: 'Jan-2026',
    historico: [
      {
        dataHora: '2025-12-20T08:20:00',
        usuarioId: 'COL-003',
        usuarioNome: 'Roberto Alves',
        campoAlterado: '-',
        valorAnterior: '-',
        valorNovo: '-',
        tipoAcao: 'Criação'
      }
    ]
  },
];

// API Functions
export const getAdiantamentos = (): Adiantamento[] => {
  return [...adiantamentos].sort((a, b) => 
    new Date(b.dataLancamento).getTime() - new Date(a.dataLancamento).getTime()
  );
};

export const getAdiantamentoById = (id: string): Adiantamento | undefined => {
  return adiantamentos.find(a => a.id === id);
};

export const addAdiantamento = (adiantamento: Omit<Adiantamento, 'id'>): Adiantamento => {
  const id = `ADT-${String(adiantamentos.length + 1).padStart(3, '0')}`;
  const newAdiantamento: Adiantamento = { ...adiantamento, id };
  adiantamentos.push(newAdiantamento);
  return newAdiantamento;
};

export const updateAdiantamento = (id: string, updates: Partial<Adiantamento>): Adiantamento | undefined => {
  const index = adiantamentos.findIndex(a => a.id === id);
  if (index === -1) return undefined;
  
  adiantamentos[index] = { ...adiantamentos[index], ...updates };
  return adiantamentos[index];
};

export const deleteAdiantamento = (id: string): boolean => {
  const index = adiantamentos.findIndex(a => a.id === id);
  if (index === -1) return false;
  
  adiantamentos.splice(index, 1);
  return true;
};

// Helper para calcular valor da parcela
export const calcularValorParcela = (valorFinal: number, quantidadeVezes: number): number => {
  if (quantidadeVezes <= 0) return 0;
  return valorFinal / quantidadeVezes;
};

// Helper para gerar próximos 24 meses
export const getProximosMeses = (): string[] => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const hoje = new Date();
  const resultado: string[] = [];
  
  for (let i = 0; i < 24; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    resultado.push(`${mes}-${ano}`);
  }
  
  return resultado;
};

// Helper para calcular situação das parcelas
export const calcularSituacaoParcelas = (inicioCompetencia: string, quantidadeVezes: number): { pagas: number; total: number; percentual: number } => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Parse início competência (ex: "Jan-2026")
  const [mesStr, anoStr] = inicioCompetencia.split('-');
  const mesIndex = meses.indexOf(mesStr);
  const ano = parseInt(anoStr);
  
  if (mesIndex === -1 || isNaN(ano)) {
    return { pagas: 0, total: quantidadeVezes, percentual: 0 };
  }
  
  const dataInicio = new Date(ano, mesIndex, 1);
  const hoje = new Date();
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  
  // Calcular quantas parcelas já venceram (mês atual conta como pago)
  let parcelasPagas = 0;
  for (let i = 0; i < quantidadeVezes; i++) {
    const mesParcela = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + i, 1);
    if (mesParcela <= mesAtual) {
      parcelasPagas++;
    }
  }
  
  const percentual = (parcelasPagas / quantidadeVezes) * 100;
  
  return { 
    pagas: parcelasPagas, 
    total: quantidadeVezes, 
    percentual 
  };
};

// Helper para converter competência em data para filtro
export const competenciaParaData = (competencia: string): Date | null => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [mesStr, anoStr] = competencia.split('-');
  const mesIndex = meses.indexOf(mesStr);
  const ano = parseInt(anoStr);
  
  if (mesIndex === -1 || isNaN(ano)) return null;
  
  return new Date(ano, mesIndex, 1);
};
