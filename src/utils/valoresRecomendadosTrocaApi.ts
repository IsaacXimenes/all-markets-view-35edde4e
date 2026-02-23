// API de Valores Recomendados para Trade-In / Base de Troca

export interface ValorRecomendadoTroca {
  id: string;
  modelo: string;
  marca: string;
  condicao: 'Novo' | 'Semi-novo';
  valorMin: number;
  valorMax: number;
  valorSugerido: number;
  ultimaAtualizacao: string;
}

// Tabela mock de valores recomendados para compra de aparelhos usados
const valoresRecomendados: ValorRecomendadoTroca[] = [
  // iPhones
  { id: 'VR-001', modelo: 'iPhone 16 Pro Max', marca: 'Apple', condicao: 'Novo', valorMin: 7500, valorMax: 8500, valorSugerido: 8000, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-002', modelo: 'iPhone 16 Pro Max', marca: 'Apple', condicao: 'Semi-novo', valorMin: 6500, valorMax: 7500, valorSugerido: 7000, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-003', modelo: 'iPhone 16 Pro', marca: 'Apple', condicao: 'Novo', valorMin: 6500, valorMax: 7500, valorSugerido: 7000, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-004', modelo: 'iPhone 16 Pro', marca: 'Apple', condicao: 'Semi-novo', valorMin: 5500, valorMax: 6500, valorSugerido: 6000, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-005', modelo: 'iPhone 16', marca: 'Apple', condicao: 'Novo', valorMin: 4800, valorMax: 5500, valorSugerido: 5200, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-006', modelo: 'iPhone 16', marca: 'Apple', condicao: 'Semi-novo', valorMin: 4000, valorMax: 4800, valorSugerido: 4400, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-007', modelo: 'iPhone 15 Pro Max', marca: 'Apple', condicao: 'Novo', valorMin: 6000, valorMax: 7000, valorSugerido: 6500, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-008', modelo: 'iPhone 15 Pro Max', marca: 'Apple', condicao: 'Semi-novo', valorMin: 5000, valorMax: 6000, valorSugerido: 5500, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-009', modelo: 'iPhone 15 Pro', marca: 'Apple', condicao: 'Novo', valorMin: 5200, valorMax: 6200, valorSugerido: 5700, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-010', modelo: 'iPhone 15 Pro', marca: 'Apple', condicao: 'Semi-novo', valorMin: 4200, valorMax: 5200, valorSugerido: 4700, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-011', modelo: 'iPhone 15', marca: 'Apple', condicao: 'Novo', valorMin: 3800, valorMax: 4500, valorSugerido: 4200, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-012', modelo: 'iPhone 15', marca: 'Apple', condicao: 'Semi-novo', valorMin: 3000, valorMax: 3800, valorSugerido: 3400, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-013', modelo: 'iPhone 14 Pro Max', marca: 'Apple', condicao: 'Semi-novo', valorMin: 4000, valorMax: 5000, valorSugerido: 4500, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-014', modelo: 'iPhone 14 Pro', marca: 'Apple', condicao: 'Semi-novo', valorMin: 3500, valorMax: 4300, valorSugerido: 3900, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-015', modelo: 'iPhone 14', marca: 'Apple', condicao: 'Semi-novo', valorMin: 2500, valorMax: 3200, valorSugerido: 2800, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-016', modelo: 'iPhone 13 Pro Max', marca: 'Apple', condicao: 'Semi-novo', valorMin: 3200, valorMax: 4000, valorSugerido: 3600, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-017', modelo: 'iPhone 13', marca: 'Apple', condicao: 'Semi-novo', valorMin: 2000, valorMax: 2700, valorSugerido: 2300, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-018', modelo: 'iPhone 12', marca: 'Apple', condicao: 'Semi-novo', valorMin: 1500, valorMax: 2000, valorSugerido: 1700, ultimaAtualizacao: '2025-12-01' },
  
  // Samsung
  { id: 'VR-019', modelo: 'Samsung Galaxy S24 Ultra', marca: 'Samsung', condicao: 'Novo', valorMin: 5500, valorMax: 6500, valorSugerido: 6000, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-020', modelo: 'Samsung Galaxy S24 Ultra', marca: 'Samsung', condicao: 'Semi-novo', valorMin: 4500, valorMax: 5500, valorSugerido: 5000, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-021', modelo: 'Samsung Galaxy S24+', marca: 'Samsung', condicao: 'Novo', valorMin: 4000, valorMax: 4800, valorSugerido: 4400, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-022', modelo: 'Samsung Galaxy S24+', marca: 'Samsung', condicao: 'Semi-novo', valorMin: 3200, valorMax: 4000, valorSugerido: 3600, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-023', modelo: 'Samsung Galaxy S24', marca: 'Samsung', condicao: 'Novo', valorMin: 3000, valorMax: 3700, valorSugerido: 3400, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-024', modelo: 'Samsung Galaxy S24', marca: 'Samsung', condicao: 'Semi-novo', valorMin: 2300, valorMax: 3000, valorSugerido: 2600, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-025', modelo: 'Samsung Galaxy S23 Ultra', marca: 'Samsung', condicao: 'Semi-novo', valorMin: 3500, valorMax: 4300, valorSugerido: 3900, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-026', modelo: 'Samsung Galaxy Z Flip 5', marca: 'Samsung', condicao: 'Semi-novo', valorMin: 2500, valorMax: 3200, valorSugerido: 2800, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-027', modelo: 'Samsung Galaxy Z Fold 5', marca: 'Samsung', condicao: 'Semi-novo', valorMin: 4500, valorMax: 5500, valorSugerido: 5000, ultimaAtualizacao: '2025-12-01' },

  // Xiaomi
  { id: 'VR-028', modelo: 'Xiaomi 14 Ultra', marca: 'Xiaomi', condicao: 'Novo', valorMin: 4000, valorMax: 4800, valorSugerido: 4400, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-029', modelo: 'Xiaomi 14 Ultra', marca: 'Xiaomi', condicao: 'Semi-novo', valorMin: 3200, valorMax: 4000, valorSugerido: 3600, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-030', modelo: 'Xiaomi 14', marca: 'Xiaomi', condicao: 'Novo', valorMin: 2800, valorMax: 3500, valorSugerido: 3100, ultimaAtualizacao: '2025-12-01' },
  { id: 'VR-031', modelo: 'Xiaomi 14', marca: 'Xiaomi', condicao: 'Semi-novo', valorMin: 2200, valorMax: 2800, valorSugerido: 2500, ultimaAtualizacao: '2025-12-01' },
];

export const getValoresRecomendadosTroca = (): ValorRecomendadoTroca[] => {
  return [...valoresRecomendados];
};

export const getValorRecomendado = (modelo: string, condicao: 'Novo' | 'Semi-novo'): ValorRecomendadoTroca | null => {
  return valoresRecomendados.find(
    v => v.modelo.toLowerCase() === modelo.toLowerCase() && v.condicao === condicao
  ) || null;
};

export const buscarValoresRecomendados = (busca: string): ValorRecomendadoTroca[] => {
  if (!busca.trim()) return valoresRecomendados;
  const termo = busca.toLowerCase();
  return valoresRecomendados.filter(
    v => v.modelo.toLowerCase().includes(termo) || v.marca.toLowerCase().includes(termo)
  );
};
