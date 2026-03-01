// Cadastros API - Supabase-backed with sync cache for backward compatibility
import { supabase } from '@/integrations/supabase/client';

// ==================== INTERFACES ====================

export interface Loja {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  cep: string;
  cidade: string;
  estado: string;
  responsavel: string;
  horarioFuncionamento: string;
  status: 'Ativo' | 'Inativo';
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  status: 'Ativo' | 'Inativo';
  origemCliente: 'Assistência' | 'Venda';
  idsCompras: string[];
  tipoCliente: 'Novo' | 'Normal' | 'VIP';
  tipoPessoa: 'Pessoa Física' | 'Pessoa Jurídica';
}

export interface Colaborador {
  id: string;
  cpf: string;
  nome: string;
  cargo: string;
  loja: string;
  dataAdmissao: string;
  dataInativacao?: string;
  dataNascimento?: string;
  email: string;
  telefone: string;
  modeloPagamento: string;
  salario?: number;
  foto?: string;
  status: 'Ativo' | 'Inativo';
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  responsavel: string;
  telefone: string;
  status: 'Ativo' | 'Inativo';
  ultimaCompra?: string;
}

export interface OrigemVenda {
  id: string;
  origem: string;
  status: 'Ativo' | 'Inativo';
}

export interface ProdutoCadastro {
  id: string;
  marca: string;
  categoria: string;
  produto: string;
}

export interface TipoDesconto {
  id: string;
  nome: string;
  desconto: number;
  descricao: string;
}

export interface Cargo {
  id: string;
  funcao: string;
  permissoes: string[];
}

export interface ModeloPagamento {
  id: string;
  modelo: string;
}

export interface HistoricoAlteracaoConta {
  dataHora: string;
  usuario: string;
  statusAnterior: string;
  novoStatus: string;
  observacao?: string;
}

export interface ContaFinanceira {
  id: string;
  nome: string;
  tipo: string;
  lojaVinculada: string;
  banco: string;
  agencia: string;
  conta: string;
  cnpj: string;
  saldoInicial: number;
  saldoAtual: number;
  status: 'Ativo' | 'Inativo';
  ultimoMovimento?: string;
  statusMaquina: 'Terceirizada' | 'Própria';
  notaFiscal: boolean;
  habilitada: boolean;
  historicoAlteracoes: HistoricoAlteracaoConta[];
}

export interface MaquinaCartao {
  id: string;
  nome: string;
  cnpjVinculado: string;
  contaOrigem: string;
  status: 'Ativo' | 'Inativo';
  percentualMaquina?: number;
  taxas: {
    credito: { [parcela: number]: number };
    debito: number;
  };
  parcelamentos?: { parcelas: number; taxa: number }[];
}

// ==================== HELPERS ====================

export const calcularTipoPessoa = (cpfCnpj: string): 'Pessoa Física' | 'Pessoa Jurídica' => {
  const numeros = cpfCnpj.replace(/\D/g, '');
  return numeros.length <= 11 ? 'Pessoa Física' : 'Pessoa Jurídica';
};

const calcularTipoCliente = (idsCompras: string[]): 'Novo' | 'Normal' | 'VIP' => {
  const numCompras = idsCompras.length;
  if (numCompras === 0) return 'Novo';
  if (numCompras === 1) return 'Normal';
  return 'VIP';
};

// ==================== CACHE MODULE-LEVEL ====================
// Cache local para compatibilidade com chamadas síncronas legadas.
// Populado automaticamente na primeira chamada async.

let _lojasCache: Loja[] = [];
let _clientesCache: Cliente[] = [];
let _colaboradoresCache: Colaborador[] = [];
let _fornecedoresCache: Fornecedor[] = [];
let _contasFinanceirasCache: ContaFinanceira[] = [];
let _maquinasCartaoCache: MaquinaCartao[] = [];

let _lojasLoaded = false;
let _clientesLoaded = false;
let _colaboradoresLoaded = false;
let _fornecedoresLoaded = false;
let _contasLoaded = false;
let _maquinasLoaded = false;

// ==================== DADOS DE REFERÊNCIA (estáticos) ====================

let origensVenda: OrigemVenda[] = [
  { id: 'ORIG-001', origem: 'Loja Física', status: 'Ativo' },
  { id: 'ORIG-002', origem: 'Online', status: 'Ativo' },
  { id: 'ORIG-003', origem: 'WhatsApp', status: 'Ativo' },
  { id: 'ORIG-004', origem: 'Indicação', status: 'Ativo' },
  { id: 'ORIG-005', origem: 'Mercado Livre', status: 'Ativo' },
  { id: 'ORIG-006', origem: 'Site Próprio', status: 'Ativo' },
];

let produtosCadastro: ProdutoCadastro[] = [
  { id: 'AP-001', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy A05S 128 GB6 Ram' },
  { id: 'AP-002', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy A06 128 GB4 Ram' },
  { id: 'AP-003', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy A15 128 GB4 Ram' },
  { id: 'AP-004', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy A16 128 GB4 Ram' },
  { id: 'AP-005', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy A26 5G 256 GB8 Ram' },
  { id: 'AP-006', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy A35 5G' },
  { id: 'AP-007', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy A55 5G 256 GB8 Ram' },
  { id: 'AP-008', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy M15 5G 128 GB4 Ram' },
  { id: 'AP-009', marca: 'Samsung', categoria: 'Smartphone', produto: 'Galaxy S24 Fe 128 GB8 Ram' },
  { id: 'AP-010', marca: 'Apple', categoria: 'Ipad', produto: 'Ipad 10 64 GB' },
  { id: 'AP-011', marca: 'Apple', categoria: 'Ipad', produto: 'Ipad 11 128 GB' },
  { id: 'AP-012', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 11 128 GB' },
  { id: 'AP-013', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 11 256 GB' },
  { id: 'AP-014', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 11 64 GB' },
  { id: 'AP-015', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 11 Pro 64 GB' },
  { id: 'AP-016', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 11 Pro Max 256 GB' },
  { id: 'AP-017', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 11 Pro Max 64 GB' },
  { id: 'AP-018', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 12 128 GB' },
  { id: 'AP-019', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 12 256 GB' },
  { id: 'AP-020', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 12 64 GB' },
  { id: 'AP-021', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 12 Pro 128 GB' },
  { id: 'AP-022', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 12 Pro Max 128 GB' },
  { id: 'AP-023', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 12 Pro Max 256 GB' },
  { id: 'AP-024', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 12 Pro Max 512 GB' },
  { id: 'AP-025', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 13 128 GB' },
  { id: 'AP-026', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 13 256 GB' },
  { id: 'AP-027', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 13 Pro 128 GB' },
  { id: 'AP-028', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 13 Pro 256 GB' },
  { id: 'AP-029', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 13 Pro Max' },
  { id: 'AP-030', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 13 Pro Max 128 GB' },
  { id: 'AP-031', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 13 Pro Max 256 GB' },
  { id: 'AP-032', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 14 128 GB' },
  { id: 'AP-033', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 14 128 GB Chip' },
  { id: 'AP-034', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 14 Plus 128 GB' },
  { id: 'AP-035', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 14 Pro 128 GB' },
  { id: 'AP-036', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 14 Pro 256 GB' },
  { id: 'AP-037', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 14 Pro Max 128 GB' },
  { id: 'AP-038', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 14 Pro Max 256 GB' },
  { id: 'AP-039', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 15 128 GB' },
  { id: 'AP-040', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 15 256 GB' },
  { id: 'AP-041', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 15 Pro 128 GB' },
  { id: 'AP-042', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 15 Pro 256 GB' },
  { id: 'AP-043', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 15 Pro Max 1Tb' },
  { id: 'AP-044', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 15 Pro Max 256 GB' },
  { id: 'AP-045', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 15 Pro Max 512 GB' },
  { id: 'AP-046', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 16 128 GB' },
  { id: 'AP-047', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 16 Pro 128 GB' },
  { id: 'AP-048', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 16 Pro 256 GB' },
  { id: 'AP-049', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 16 Pro Max 256 GB' },
  { id: 'AP-050', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 16 Pro Max 256 GB' },
  { id: 'AP-051', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 17 256 GB' },
  { id: 'AP-052', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 17 Pro 256 GB' },
  { id: 'AP-053', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 17 Pro Max 256 GB' },
  { id: 'AP-054', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 17 Pro Max 512 GB' },
  { id: 'AP-055', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone 8 Plus 64 GB' },
  { id: 'AP-056', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone XR 128 GB' },
  { id: 'AP-057', marca: 'Apple', categoria: 'Smartphone', produto: 'Iphone XR 64 GB' },
  { id: 'AP-058', marca: 'Motorola', categoria: 'Smartphone', produto: 'Moto E 22 64 GB4 Ram' },
  { id: 'AP-059', marca: 'Motorola', categoria: 'Smartphone', produto: 'Moto G05 128 GB4 Ram' },
  { id: 'AP-060', marca: 'Motorola', categoria: 'Smartphone', produto: 'Moto G24' },
  { id: 'AP-061', marca: 'Motorola', categoria: 'Smartphone', produto: 'Moto G24 128 GB4 Ram' },
  { id: 'AP-062', marca: 'Motorola', categoria: 'Smartphone', produto: 'Moto G35 5G 128 GB4 Ram' },
  { id: 'AP-063', marca: 'Motorola', categoria: 'Smartphone', produto: 'Moto G35 5G 256 GB4 Ram' },
  { id: 'AP-064', marca: 'Motorola', categoria: 'Smartphone', produto: 'Motorola Edge 50 Fusion' },
  { id: 'AP-065', marca: 'Motorola', categoria: 'Smartphone', produto: 'Motorola Edge 50 Fusion 8/256 GB' },
  { id: 'AP-066', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Poco C85 256 GB8 Ram' },
  { id: 'AP-067', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Poco M7 Pro 5G 256 GB8 Ram' },
  { id: 'AP-068', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Poco X7 256 GB8 Ram' },
  { id: 'AP-069', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Poco X7 512 GB12 Ram' },
  { id: 'AP-070', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Poco X7 Pro 256 GB 8Ram' },
  { id: 'AP-071', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Poco X7 Pro 512 GB 12Ram' },
  { id: 'AP-072', marca: 'Realme', categoria: 'Smartphone', produto: 'Realme C75 256 GB 8Ram' },
  { id: 'AP-073', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi 15 256 GB 8Ram' },
  { id: 'AP-074', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi 15C 128 GB4 Ram' },
  { id: 'AP-075', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi 15C 256 GB8 Ram' },
  { id: 'AP-076', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi A5 128 GB' },
  { id: 'AP-077', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi A5 128 GB4 Ram' },
  { id: 'AP-078', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi A5 64 GB3Ram' },
  { id: 'AP-079', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Note 14 256 GB8 Ram' },
  { id: 'AP-080', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Note 14 5G 256 GB8 Ram' },
  { id: 'AP-081', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Note 14 Pro 256 GB8 Ram' },
  { id: 'AP-082', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Note 14 Pro 5G 256 GB8 Ram' },
  { id: 'AP-083', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Note 14S 256 GB8 Ram' },
  { id: 'AP-084', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Note 15 256 GB8 Ram' },
  { id: 'AP-085', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Note 15 Pro 5G 256 GB8 Ram' },
  { id: 'AP-086', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Pad 2 256 GB8 Ram' },
  { id: 'AP-087', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Pad 2 4G 128 GB4 Ram' },
  { id: 'AP-088', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Pad 2 566 GB8 Ram' },
  { id: 'AP-089', marca: 'Xiaomi', categoria: 'Smartphone', produto: 'Redmi Pad Se 128/4GB' },
  { id: 'AP-090', marca: 'Samsung', categoria: 'Smartphone', produto: 'Samsung Galaxy A07 128 GB4 Ram' },
  { id: 'AP-091', marca: 'Samsung', categoria: 'Smartphone', produto: 'Samsung Galaxy A25 5G 256 GB8 Ram' },
  { id: 'AP-092', marca: 'Samsung', categoria: 'Smartphone', produto: 'Samsung S23 Ultra 512 GB12 Ram' },
  { id: 'AP-093', marca: 'Samsung', categoria: 'Smartphone', produto: 'Samsung S25 Ultra 256 GB12 Ram' },
  { id: 'AP-094', marca: 'Samsung', categoria: 'Smartphone', produto: 'Samsung S25 Ultra 512 GB' },
];

let tiposDesconto: TipoDesconto[] = [
  { id: 'DESC-001', nome: 'Desconto Funcionário', desconto: 10, descricao: 'Desconto para funcionários da empresa' },
  { id: 'DESC-002', nome: 'Desconto Cliente VIP', desconto: 15, descricao: 'Desconto para clientes VIP' },
  { id: 'DESC-003', nome: 'Desconto Promocional', desconto: 5, descricao: 'Desconto em promoções especiais' },
  { id: 'DESC-004', nome: 'Desconto Black Friday', desconto: 20, descricao: 'Desconto Black Friday' },
];

let cargos: Cargo[] = [
  { id: 'CARGO-001', funcao: 'Gerente Geral', permissoes: ['Financeiro', 'Estoque', 'Vendas', 'Assistência', 'Cadastros', 'Relatórios', 'Admin'] },
  { id: 'CARGO-002', funcao: 'Gerente Financeiro', permissoes: ['Financeiro', 'Relatórios', 'Cadastros'] },
  { id: 'CARGO-003', funcao: 'Gerente de Estoque', permissoes: ['Estoque', 'Relatórios', 'Cadastros'] },
  { id: 'CARGO-004', funcao: 'Vendedor', permissoes: ['Vendas'] },
  { id: 'CARGO-005', funcao: 'Técnico Assistência', permissoes: ['Assistência', 'Estoque'] },
  { id: 'CARGO-006', funcao: 'Auxiliar Administrativo', permissoes: ['Cadastros'] },
  { id: 'CARGO-007', funcao: 'Analista Financeiro', permissoes: ['Financeiro', 'Relatórios'] },
  { id: 'CARGO-008', funcao: 'Supervisor de Loja', permissoes: ['Vendas', 'Estoque', 'Relatórios'] },
  { id: 'CARGO-009', funcao: 'Motoboy', permissoes: ['Entregas'] },
  { id: 'CARGO-010', funcao: 'Sócio Administrador', permissoes: ['Financeiro', 'Estoque', 'Vendas', 'Assistência', 'Cadastros', 'Relatórios', 'Admin'] },
  { id: 'CARGO-011', funcao: 'Assistente Administrativo', permissoes: ['Cadastros', 'Financeiro'] },
  { id: 'CARGO-012', funcao: 'Analista de Dados', permissoes: ['Relatórios', 'Admin'] },
  { id: 'CARGO-013', funcao: 'Estoquista', permissoes: ['Estoque'] },
  { id: 'CARGO-014', funcao: 'Marketing', permissoes: ['Admin'] },
];

let modelosPagamento: ModeloPagamento[] = [
  { id: 'MP-001', modelo: 'Salário Fixo' },
  { id: 'MP-002', modelo: 'Fixo + Comissão' },
  { id: 'MP-003', modelo: 'Comissão 100%' },
];

// ==================== MAPPERS ====================

const mapRowToLoja = (row: any): Loja => ({
  id: row.id, nome: row.nome, cnpj: row.cnpj || '', endereco: row.endereco || '',
  telefone: row.telefone || '', cep: row.cep || '', cidade: row.cidade || '',
  estado: row.estado || '', responsavel: row.responsavel || '',
  horarioFuncionamento: row.horario_funcionamento || '',
  status: row.ativa === false ? 'Inativo' : 'Ativo',
});

const mapRowToCliente = (row: any): Cliente => ({
  id: row.id, nome: row.nome, cpf: row.cpf || '', telefone: row.telefone || '',
  dataNascimento: row.data_nascimento || '', email: row.email || '',
  cep: row.cep || '', endereco: row.endereco || '', numero: row.numero || '',
  bairro: row.bairro || '', cidade: row.cidade || '', estado: row.estado || '',
  status: (row.status as 'Ativo' | 'Inativo') || 'Ativo',
  origemCliente: (row.origem_cliente as 'Assistência' | 'Venda') || 'Venda',
  idsCompras: Array.isArray(row.ids_compras) ? row.ids_compras : [],
  tipoCliente: calcularTipoCliente(Array.isArray(row.ids_compras) ? row.ids_compras : []),
  tipoPessoa: (row.tipo_pessoa as 'Pessoa Física' | 'Pessoa Jurídica') || calcularTipoPessoa(row.cpf || ''),
});

const mapRowToColaborador = (row: any): Colaborador => ({
  id: row.id, cpf: row.cpf || '', nome: row.nome, cargo: row.cargo || '',
  loja: row.loja_id || '', dataAdmissao: row.data_admissao || '',
  dataInativacao: row.data_inativacao || undefined, dataNascimento: row.data_nascimento || undefined,
  email: row.email || '', telefone: row.telefone || '',
  modeloPagamento: row.modelo_pagamento || '', salario: row.salario ?? undefined,
  foto: row.foto || undefined,
  status: row.ativo === false ? 'Inativo' : (row.status as 'Ativo' | 'Inativo') || 'Ativo',
});

const mapRowToFornecedor = (row: any): Fornecedor => ({
  id: row.id, nome: row.nome, cnpj: row.cnpj || '', endereco: row.endereco || '',
  responsavel: row.responsavel || '', telefone: row.telefone || '',
  status: (row.status as 'Ativo' | 'Inativo') || 'Ativo',
  ultimaCompra: row.ultima_compra || undefined,
});

const mapRowToContaFinanceira = (row: any): ContaFinanceira => ({
  id: row.id, nome: row.nome, tipo: row.tipo || '', lojaVinculada: row.loja_vinculada || '',
  banco: row.banco || '', agencia: row.agencia || '', conta: row.conta || '', cnpj: row.cnpj || '',
  saldoInicial: row.saldo_inicial ?? 0, saldoAtual: row.saldo_atual ?? 0,
  status: (row.status as 'Ativo' | 'Inativo') || 'Ativo',
  ultimoMovimento: row.ultimo_movimento || undefined,
  statusMaquina: (row.status_maquina as 'Terceirizada' | 'Própria') || 'Própria',
  notaFiscal: row.nota_fiscal ?? false, habilitada: row.habilitada ?? true,
  historicoAlteracoes: Array.isArray(row.historico_alteracoes) ? row.historico_alteracoes : [],
});

const mapRowToMaquinaCartao = (row: any): MaquinaCartao => ({
  id: row.id, nome: row.nome, cnpjVinculado: row.cnpj_vinculado || '',
  contaOrigem: row.conta_origem || '', status: (row.status as 'Ativo' | 'Inativo') || 'Ativo',
  percentualMaquina: row.percentual_maquina ?? 0,
  taxas: row.taxas && typeof row.taxas === 'object' ? row.taxas : { credito: {}, debito: 0 },
  parcelamentos: Array.isArray(row.parcelamentos) ? row.parcelamentos : [],
});

// ==================== LOJAS ====================

export const getLojas = (): Loja[] => [..._lojasCache];

export const getLojasAsync = async (): Promise<Loja[]> => {
  try {
    const { data, error } = await supabase.from('lojas').select('*').order('nome');
    if (error) throw error;
    _lojasCache = (data || []).map(mapRowToLoja);
    _lojasLoaded = true;
    return [..._lojasCache];
  } catch (e) { console.error('Erro ao buscar lojas:', e); return [..._lojasCache]; }
};

export const getLojaById = (id: string): Loja | undefined => _lojasCache.find(l => l.id === id);

export const addLoja = async (loja: Omit<Loja, 'id'>): Promise<Loja> => {
  const { data, error } = await supabase.from('lojas').insert({
    nome: loja.nome, cnpj: loja.cnpj, endereco: loja.endereco, telefone: loja.telefone,
    cep: loja.cep, cidade: loja.cidade, estado: loja.estado, responsavel: loja.responsavel,
    horario_funcionamento: loja.horarioFuncionamento, ativa: loja.status === 'Ativo',
    comissao_percentual: loja.nome.toLowerCase().includes('online') ? 6 : 10,
  }).select().single();
  if (error) throw error;
  const nova = mapRowToLoja(data);
  _lojasCache.push(nova);
  return nova;
};

export const updateLoja = async (id: string, updates: Partial<Loja>): Promise<Loja | null> => {
  const mapped: any = {};
  if (updates.nome !== undefined) mapped.nome = updates.nome;
  if (updates.cnpj !== undefined) mapped.cnpj = updates.cnpj;
  if (updates.endereco !== undefined) mapped.endereco = updates.endereco;
  if (updates.telefone !== undefined) mapped.telefone = updates.telefone;
  if (updates.cep !== undefined) mapped.cep = updates.cep;
  if (updates.cidade !== undefined) mapped.cidade = updates.cidade;
  if (updates.estado !== undefined) mapped.estado = updates.estado;
  if (updates.responsavel !== undefined) mapped.responsavel = updates.responsavel;
  if (updates.horarioFuncionamento !== undefined) mapped.horario_funcionamento = updates.horarioFuncionamento;
  if (updates.status !== undefined) mapped.ativa = updates.status === 'Ativo';
  const { data, error } = await supabase.from('lojas').update(mapped).eq('id', id).select().single();
  if (error) { console.error('Erro ao atualizar loja:', error); return null; }
  const updated = mapRowToLoja(data);
  const idx = _lojasCache.findIndex(l => l.id === id);
  if (idx !== -1) _lojasCache[idx] = updated;
  return updated;
};

export const deleteLoja = async (id: string): Promise<void> => {
  const { error } = await supabase.from('lojas').delete().eq('id', id);
  if (error) console.error('Erro ao deletar loja:', error);
  _lojasCache = _lojasCache.filter(l => l.id !== id);
};

// ==================== CLIENTES ====================

export const getClientes = (): Cliente[] => [..._clientesCache];

export const getClientesAsync = async (): Promise<Cliente[]> => {
  try {
    const { data, error } = await supabase.from('clientes').select('*').order('nome');
    if (error) throw error;
    _clientesCache = (data || []).map(mapRowToCliente);
    _clientesLoaded = true;
    return [..._clientesCache];
  } catch (e) { console.error('Erro ao buscar clientes:', e); return [..._clientesCache]; }
};

export const getClienteById = (id: string): Cliente | undefined => _clientesCache.find(c => c.id === id);
export const getClienteByCpf = (cpf: string): Cliente | undefined => _clientesCache.find(c => c.cpf === cpf);

export const addCliente = async (cliente: Omit<Cliente, 'id' | 'tipoCliente' | 'tipoPessoa'>): Promise<Cliente> => {
  const idsCompras = cliente.idsCompras || [];
  const { data, error } = await supabase.from('clientes').insert({
    nome: cliente.nome, cpf: cliente.cpf, telefone: cliente.telefone,
    data_nascimento: cliente.dataNascimento || null, email: cliente.email,
    cep: cliente.cep, endereco: cliente.endereco, numero: cliente.numero,
    bairro: cliente.bairro, cidade: cliente.cidade, estado: cliente.estado,
    status: cliente.status || 'Ativo', origem_cliente: cliente.origemCliente || 'Venda',
    ids_compras: idsCompras, tipo_pessoa: calcularTipoPessoa(cliente.cpf),
    tipo_cliente: calcularTipoCliente(idsCompras),
  }).select().single();
  if (error) throw error;
  const novo = mapRowToCliente(data);
  _clientesCache.push(novo);
  return novo;
};

export const updateCliente = async (id: string, updates: Partial<Cliente>): Promise<Cliente | null> => {
  const mapped: any = {};
  if (updates.nome !== undefined) mapped.nome = updates.nome;
  if (updates.cpf !== undefined) { mapped.cpf = updates.cpf; mapped.tipo_pessoa = calcularTipoPessoa(updates.cpf); }
  if (updates.telefone !== undefined) mapped.telefone = updates.telefone;
  if (updates.dataNascimento !== undefined) mapped.data_nascimento = updates.dataNascimento || null;
  if (updates.email !== undefined) mapped.email = updates.email;
  if (updates.cep !== undefined) mapped.cep = updates.cep;
  if (updates.endereco !== undefined) mapped.endereco = updates.endereco;
  if (updates.numero !== undefined) mapped.numero = updates.numero;
  if (updates.bairro !== undefined) mapped.bairro = updates.bairro;
  if (updates.cidade !== undefined) mapped.cidade = updates.cidade;
  if (updates.estado !== undefined) mapped.estado = updates.estado;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.origemCliente !== undefined) mapped.origem_cliente = updates.origemCliente;
  if (updates.idsCompras !== undefined) {
    mapped.ids_compras = updates.idsCompras;
    mapped.tipo_cliente = calcularTipoCliente(updates.idsCompras);
  }
  const { data, error } = await supabase.from('clientes').update(mapped).eq('id', id).select().single();
  if (error) { console.error('Erro ao atualizar cliente:', error); return null; }
  const updated = mapRowToCliente(data);
  const idx = _clientesCache.findIndex(c => c.id === id);
  if (idx !== -1) _clientesCache[idx] = updated;
  return updated;
};

export const deleteCliente = async (id: string): Promise<void> => {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) console.error('Erro ao deletar cliente:', error);
  _clientesCache = _clientesCache.filter(c => c.id !== id);
};

export const addCompraToCliente = async (clienteId: string, vendaId: string): Promise<Cliente | null> => {
  const cliente = _clientesCache.find(c => c.id === clienteId);
  if (!cliente) return null;
  const idsCompras = [...cliente.idsCompras];
  if (!idsCompras.includes(vendaId)) idsCompras.push(vendaId);
  return await updateCliente(clienteId, { idsCompras });
};

// ==================== COLABORADORES ====================

export const getColaboradores = (): Colaborador[] => [..._colaboradoresCache];

export const getColaboradoresAsync = async (): Promise<Colaborador[]> => {
  try {
    const { data, error } = await supabase.from('colaboradores').select('*').order('nome');
    if (error) throw error;
    _colaboradoresCache = (data || []).map(mapRowToColaborador);
    _colaboradoresLoaded = true;
    return [..._colaboradoresCache];
  } catch (e) { console.error('Erro ao buscar colaboradores:', e); return [..._colaboradoresCache]; }
};

export const getColaboradorById = (id: string): Colaborador | undefined => _colaboradoresCache.find(c => c.id === id);

export const getColaboradoresByLoja = (lojaId: string): Colaborador[] =>
  _colaboradoresCache.filter(c => c.loja === lojaId && c.status === 'Ativo');

export const getColaboradoresByPermissao = (permissao: string): Colaborador[] => {
  return _colaboradoresCache.filter(col => {
    const cargo = cargos.find(c => c.id === col.cargo);
    return cargo?.permissoes.includes(permissao);
  });
};

export const getAniversariantesDaSemana = (): Colaborador[] => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  return _colaboradoresCache.filter(col => {
    if (!col.dataNascimento || col.status !== 'Ativo') return false;
    const birthday = new Date(col.dataNascimento);
    birthday.setFullYear(today.getFullYear());
    return birthday >= today && birthday <= nextWeek;
  }).sort((a, b) => {
    const dateA = new Date(a.dataNascimento!);
    const dateB = new Date(b.dataNascimento!);
    dateA.setFullYear(today.getFullYear());
    dateB.setFullYear(today.getFullYear());
    return dateA.getTime() - dateB.getTime();
  });
};

export const getContagemColaboradoresPorLoja = (): Record<string, number> => {
  const contagem: Record<string, number> = {};
  _colaboradoresCache.forEach(col => {
    if (col.status === 'Ativo' && col.loja) {
      contagem[col.loja] = (contagem[col.loja] || 0) + 1;
    }
  });
  return contagem;
};

export const getCargoNome = (cargoId: string) => {
  const cargo = cargos.find(c => c.id === cargoId);
  return cargo?.funcao || cargoId;
};

export const addColaborador = async (colaborador: Omit<Colaborador, 'id'>): Promise<Colaborador> => {
  const { data, error } = await supabase.from('colaboradores').insert({
    nome: colaborador.nome, cpf: colaborador.cpf, email: colaborador.email,
    telefone: colaborador.telefone, loja_id: colaborador.loja || null,
    cargo: colaborador.cargo, data_admissao: colaborador.dataAdmissao || null,
    data_nascimento: colaborador.dataNascimento || null,
    modelo_pagamento: colaborador.modeloPagamento || null,
    salario: colaborador.salario ?? null, status: colaborador.status,
    ativo: colaborador.status === 'Ativo', foto: colaborador.foto || null,
  }).select().single();
  if (error) throw error;
  const novo = mapRowToColaborador(data);
  _colaboradoresCache.push(novo);
  return novo;
};

export const updateColaborador = async (id: string, updates: Partial<Colaborador>): Promise<Colaborador | null> => {
  const mapped: any = {};
  if (updates.nome !== undefined) mapped.nome = updates.nome;
  if (updates.cpf !== undefined) mapped.cpf = updates.cpf;
  if (updates.email !== undefined) mapped.email = updates.email;
  if (updates.telefone !== undefined) mapped.telefone = updates.telefone;
  if (updates.cargo !== undefined) mapped.cargo = updates.cargo;
  if (updates.loja !== undefined) mapped.loja_id = updates.loja;
  if (updates.dataAdmissao !== undefined) mapped.data_admissao = updates.dataAdmissao;
  if (updates.dataInativacao !== undefined) mapped.data_inativacao = updates.dataInativacao;
  if (updates.dataNascimento !== undefined) mapped.data_nascimento = updates.dataNascimento;
  if (updates.modeloPagamento !== undefined) mapped.modelo_pagamento = updates.modeloPagamento;
  if (updates.salario !== undefined) mapped.salario = updates.salario;
  if (updates.foto !== undefined) mapped.foto = updates.foto;
  if (updates.status !== undefined) { mapped.status = updates.status; mapped.ativo = updates.status === 'Ativo'; }
  const { data, error } = await supabase.from('colaboradores').update(mapped).eq('id', id).select().single();
  if (error) { console.error('Erro ao atualizar colaborador:', error); return null; }
  const updated = mapRowToColaborador(data);
  const idx = _colaboradoresCache.findIndex(c => c.id === id);
  if (idx !== -1) _colaboradoresCache[idx] = updated;
  return updated;
};

export const deleteColaborador = async (id: string): Promise<void> => {
  const { error } = await supabase.from('colaboradores').delete().eq('id', id);
  if (error) console.error('Erro ao deletar colaborador:', error);
  _colaboradoresCache = _colaboradoresCache.filter(c => c.id !== id);
};

// ==================== FORNECEDORES ====================

export const getFornecedores = (): Fornecedor[] => [..._fornecedoresCache];

export const getFornecedoresAsync = async (): Promise<Fornecedor[]> => {
  try {
    const { data, error } = await supabase.from('fornecedores').select('*').order('nome');
    if (error) throw error;
    _fornecedoresCache = (data || []).map(mapRowToFornecedor);
    _fornecedoresLoaded = true;
    return [..._fornecedoresCache];
  } catch (e) { console.error('Erro ao buscar fornecedores:', e); return [..._fornecedoresCache]; }
};

export const getFornecedorById = (id: string): Fornecedor | undefined => _fornecedoresCache.find(f => f.id === id);

export const addFornecedor = async (fornecedor: Omit<Fornecedor, 'id'>): Promise<Fornecedor> => {
  const { data, error } = await supabase.from('fornecedores').insert({
    nome: fornecedor.nome, cnpj: fornecedor.cnpj, endereco: fornecedor.endereco,
    responsavel: fornecedor.responsavel, telefone: fornecedor.telefone,
    status: fornecedor.status || 'Ativo', ultima_compra: fornecedor.ultimaCompra || null,
  }).select().single();
  if (error) throw error;
  const novo = mapRowToFornecedor(data);
  _fornecedoresCache.push(novo);
  return novo;
};

export const updateFornecedor = async (id: string, updates: Partial<Fornecedor>): Promise<Fornecedor | null> => {
  const mapped: any = {};
  if (updates.nome !== undefined) mapped.nome = updates.nome;
  if (updates.cnpj !== undefined) mapped.cnpj = updates.cnpj;
  if (updates.endereco !== undefined) mapped.endereco = updates.endereco;
  if (updates.responsavel !== undefined) mapped.responsavel = updates.responsavel;
  if (updates.telefone !== undefined) mapped.telefone = updates.telefone;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.ultimaCompra !== undefined) mapped.ultima_compra = updates.ultimaCompra;
  const { data, error } = await supabase.from('fornecedores').update(mapped).eq('id', id).select().single();
  if (error) { console.error('Erro ao atualizar fornecedor:', error); return null; }
  const updated = mapRowToFornecedor(data);
  const idx = _fornecedoresCache.findIndex(f => f.id === id);
  if (idx !== -1) _fornecedoresCache[idx] = updated;
  return updated;
};

export const deleteFornecedor = async (id: string): Promise<void> => {
  const { error } = await supabase.from('fornecedores').delete().eq('id', id);
  if (error) console.error('Erro ao deletar fornecedor:', error);
  _fornecedoresCache = _fornecedoresCache.filter(f => f.id !== id);
};

// ==================== CONTAS FINANCEIRAS ====================

export const getContasFinanceiras = (): ContaFinanceira[] => [..._contasFinanceirasCache];

export const getContasFinanceirasAsync = async (): Promise<ContaFinanceira[]> => {
  try {
    const { data, error } = await supabase.from('contas_financeiras').select('*').order('nome');
    if (error) throw error;
    _contasFinanceirasCache = (data || []).map(mapRowToContaFinanceira);
    _contasLoaded = true;
    return [..._contasFinanceirasCache];
  } catch (e) { console.error('Erro ao buscar contas financeiras:', e); return [..._contasFinanceirasCache]; }
};

export const getContasFinanceirasHabilitadas = (): ContaFinanceira[] =>
  _contasFinanceirasCache.filter(c => c.habilitada !== false && c.status === 'Ativo');

export const getContaFinanceiraById = (id: string): ContaFinanceira | undefined =>
  _contasFinanceirasCache.find(c => c.id === id);

export const toggleContaFinanceira = async (id: string, usuario: string, observacao?: string): Promise<ContaFinanceira | null> => {
  try {
    const conta = _contasFinanceirasCache.find(c => c.id === id);
    if (!conta) return null;
    const statusAnterior = conta.habilitada ? 'Habilitada' : 'Desabilitada';
    const novoStatus = conta.habilitada ? 'Desabilitada' : 'Habilitada';
    const historico = [...conta.historicoAlteracoes];
    historico.unshift({ dataHora: new Date().toISOString(), usuario, statusAnterior, novoStatus, observacao });
    const { data, error } = await supabase.from('contas_financeiras').update({
      habilitada: !conta.habilitada, historico_alteracoes: historico as any,
    }).eq('id', id).select().single();
    if (error) throw error;
    const updated = mapRowToContaFinanceira(data);
    const idx = _contasFinanceirasCache.findIndex(c => c.id === id);
    if (idx !== -1) _contasFinanceirasCache[idx] = updated;
    return updated;
  } catch (e) { console.error('Erro ao toggle conta financeira:', e); return null; }
};

export const addContaFinanceira = async (conta: Omit<ContaFinanceira, 'id'>): Promise<ContaFinanceira> => {
  const { data, error } = await supabase.from('contas_financeiras').insert({
    nome: conta.nome, tipo: conta.tipo, loja_vinculada: conta.lojaVinculada,
    banco: conta.banco, agencia: conta.agencia, conta: conta.conta, cnpj: conta.cnpj,
    saldo_inicial: conta.saldoInicial, saldo_atual: conta.saldoAtual, status: conta.status || 'Ativo',
    status_maquina: conta.statusMaquina, nota_fiscal: conta.notaFiscal,
    habilitada: conta.habilitada ?? true, historico_alteracoes: (conta.historicoAlteracoes || []) as any,
  } as any).select().single();
  if (error) throw error;
  const nova = mapRowToContaFinanceira(data);
  _contasFinanceirasCache.push(nova);
  return nova;
};

export const updateContaFinanceira = async (id: string, updates: Partial<ContaFinanceira>): Promise<ContaFinanceira | null> => {
  const mapped: any = {};
  if (updates.nome !== undefined) mapped.nome = updates.nome;
  if (updates.tipo !== undefined) mapped.tipo = updates.tipo;
  if (updates.lojaVinculada !== undefined) mapped.loja_vinculada = updates.lojaVinculada;
  if (updates.banco !== undefined) mapped.banco = updates.banco;
  if (updates.agencia !== undefined) mapped.agencia = updates.agencia;
  if (updates.conta !== undefined) mapped.conta = updates.conta;
  if (updates.cnpj !== undefined) mapped.cnpj = updates.cnpj;
  if (updates.saldoInicial !== undefined) mapped.saldo_inicial = updates.saldoInicial;
  if (updates.saldoAtual !== undefined) mapped.saldo_atual = updates.saldoAtual;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.statusMaquina !== undefined) mapped.status_maquina = updates.statusMaquina;
  if (updates.notaFiscal !== undefined) mapped.nota_fiscal = updates.notaFiscal;
  if (updates.habilitada !== undefined) mapped.habilitada = updates.habilitada;
  if (updates.historicoAlteracoes !== undefined) mapped.historico_alteracoes = updates.historicoAlteracoes;
  const { data, error } = await supabase.from('contas_financeiras').update(mapped).eq('id', id).select().single();
  if (error) { console.error('Erro ao atualizar conta financeira:', error); return null; }
  const updated = mapRowToContaFinanceira(data);
  const idx = _contasFinanceirasCache.findIndex(c => c.id === id);
  if (idx !== -1) _contasFinanceirasCache[idx] = updated;
  return updated;
};

export const deleteContaFinanceira = async (id: string): Promise<void> => {
  const { error } = await supabase.from('contas_financeiras').delete().eq('id', id);
  if (error) console.error('Erro ao deletar conta financeira:', error);
  _contasFinanceirasCache = _contasFinanceirasCache.filter(c => c.id !== id);
};

// ==================== MÁQUINAS DE CARTÃO ====================

export const getMaquinasCartao = (): MaquinaCartao[] => [..._maquinasCartaoCache];

export const getMaquinasCartaoAsync = async (): Promise<MaquinaCartao[]> => {
  try {
    const { data, error } = await supabase.from('maquinas_cartao').select('*').order('nome');
    if (error) throw error;
    _maquinasCartaoCache = (data || []).map(mapRowToMaquinaCartao);
    _maquinasLoaded = true;
    return [..._maquinasCartaoCache];
  } catch (e) { console.error('Erro ao buscar máquinas de cartão:', e); return [..._maquinasCartaoCache]; }
};

export const getMaquinaCartaoById = (id: string): MaquinaCartao | undefined =>
  _maquinasCartaoCache.find(m => m.id === id);

export const addMaquinaCartao = async (maquina: Omit<MaquinaCartao, 'id'>): Promise<MaquinaCartao> => {
  const { data, error } = await supabase.from('maquinas_cartao').insert({
    nome: maquina.nome, cnpj_vinculado: maquina.cnpjVinculado,
    conta_origem: maquina.contaOrigem, status: maquina.status || 'Ativo',
    percentual_maquina: maquina.percentualMaquina ?? 0,
    taxas: maquina.taxas, parcelamentos: maquina.parcelamentos || [],
  }).select().single();
  if (error) throw error;
  const nova = mapRowToMaquinaCartao(data);
  _maquinasCartaoCache.push(nova);
  return nova;
};

export const updateMaquinaCartao = async (id: string, updates: Partial<MaquinaCartao>): Promise<MaquinaCartao | null> => {
  const mapped: any = {};
  if (updates.nome !== undefined) mapped.nome = updates.nome;
  if (updates.cnpjVinculado !== undefined) mapped.cnpj_vinculado = updates.cnpjVinculado;
  if (updates.contaOrigem !== undefined) mapped.conta_origem = updates.contaOrigem;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.percentualMaquina !== undefined) mapped.percentual_maquina = updates.percentualMaquina;
  if (updates.taxas !== undefined) mapped.taxas = updates.taxas;
  if (updates.parcelamentos !== undefined) mapped.parcelamentos = updates.parcelamentos;
  const { data, error } = await supabase.from('maquinas_cartao').update(mapped).eq('id', id).select().single();
  if (error) { console.error('Erro ao atualizar máquina de cartão:', error); return null; }
  const updated = mapRowToMaquinaCartao(data);
  const idx = _maquinasCartaoCache.findIndex(m => m.id === id);
  if (idx !== -1) _maquinasCartaoCache[idx] = updated;
  return updated;
};

export const deleteMaquinaCartao = async (id: string): Promise<void> => {
  const { error } = await supabase.from('maquinas_cartao').delete().eq('id', id);
  if (error) console.error('Erro ao deletar máquina de cartão:', error);
  _maquinasCartaoCache = _maquinasCartaoCache.filter(m => m.id !== id);
};

// ==================== DADOS DE REFERÊNCIA (in-memory) ====================

export const getOrigensVenda = () => [...origensVenda];
export const addOrigemVenda = (origem: Omit<OrigemVenda, 'id'>) => {
  const newId = `ORIG-${String(origensVenda.length + 1).padStart(3, '0')}`;
  const newOrigem = { ...origem, id: newId };
  origensVenda.push(newOrigem);
  return newOrigem;
};
export const updateOrigemVenda = (id: string, updates: Partial<OrigemVenda>) => {
  const index = origensVenda.findIndex(o => o.id === id);
  if (index !== -1) { origensVenda[index] = { ...origensVenda[index], ...updates }; return origensVenda[index]; }
  return null;
};
export const deleteOrigemVenda = (id: string) => { origensVenda = origensVenda.filter(o => o.id !== id); };

export const getProdutosCadastro = () => [...produtosCadastro];
let nextApId = 95;
export const addProdutoCadastro = (produto: Omit<ProdutoCadastro, 'id'>) => {
  const newId = `AP-${String(nextApId++).padStart(3, '0')}`;
  const newProduto = { ...produto, id: newId };
  produtosCadastro.push(newProduto);
  return newProduto;
};
export const updateProdutoCadastro = (id: string, updates: Partial<ProdutoCadastro>) => {
  const index = produtosCadastro.findIndex(p => p.id === id);
  if (index !== -1) { produtosCadastro[index] = { ...produtosCadastro[index], ...updates }; return produtosCadastro[index]; }
  return null;
};
export const deleteProdutoCadastro = (id: string) => { produtosCadastro = produtosCadastro.filter(p => p.id !== id); };

export const getTiposDesconto = () => [...tiposDesconto];
export const addTipoDesconto = (tipo: Omit<TipoDesconto, 'id'>) => {
  const newId = `DESC-${String(tiposDesconto.length + 1).padStart(3, '0')}`;
  const newTipo = { ...tipo, id: newId };
  tiposDesconto.push(newTipo);
  return newTipo;
};
export const updateTipoDesconto = (id: string, updates: Partial<TipoDesconto>) => {
  const index = tiposDesconto.findIndex(t => t.id === id);
  if (index !== -1) { tiposDesconto[index] = { ...tiposDesconto[index], ...updates }; return tiposDesconto[index]; }
  return null;
};
export const deleteTipoDesconto = (id: string) => { tiposDesconto = tiposDesconto.filter(t => t.id !== id); };

export const getCargos = () => [...cargos];
export const addCargo = (cargo: Omit<Cargo, 'id'>) => {
  const newId = `CARGO-${String(cargos.length + 1).padStart(3, '0')}`;
  const newCargo = { ...cargo, id: newId };
  cargos.push(newCargo);
  return newCargo;
};
export const updateCargo = (id: string, updates: Partial<Cargo>) => {
  const index = cargos.findIndex(c => c.id === id);
  if (index !== -1) { cargos[index] = { ...cargos[index], ...updates }; return cargos[index]; }
  return null;
};
export const deleteCargo = (id: string) => { cargos = cargos.filter(c => c.id !== id); };

export const getModelosPagamento = () => [...modelosPagamento];
export const addModeloPagamento = (modelo: Omit<ModeloPagamento, 'id'>) => {
  const newId = `MP-${String(modelosPagamento.length + 1).padStart(3, '0')}`;
  const newModelo = { ...modelo, id: newId };
  modelosPagamento.push(newModelo);
  return newModelo;
};
export const updateModeloPagamento = (id: string, updates: Partial<ModeloPagamento>) => {
  const index = modelosPagamento.findIndex(m => m.id === id);
  if (index !== -1) { modelosPagamento[index] = { ...modelosPagamento[index], ...updates }; return modelosPagamento[index]; }
  return null;
};
export const deleteModeloPagamento = (id: string) => { modelosPagamento = modelosPagamento.filter(m => m.id !== id); };

// Motoboys
export const getMotoboys = (): Colaborador[] =>
  _colaboradoresCache.filter(c => c.status === 'Ativo' && c.cargo === 'CARGO-009');

// ==================== UTILITIES ====================

export { formatCurrency } from '@/utils/formatUtils';

export const formatCPF = (value: string): string => {
  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (value: string): string => {
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatPhone = (value: string): string => {
  if (value.length === 11) {
    return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

export const getCargoById = (id: string) => cargos.find(c => c.id === id);
export const getModeloPagamentoById = (id: string) => modelosPagamento.find(m => m.id === id);

// ==================== INICIALIZAÇÃO ====================
// Carrega todos os caches do Supabase em background
export const initCadastrosCache = async (): Promise<void> => {
  await Promise.all([
    getLojasAsync(),
    getClientesAsync(),
    getColaboradoresAsync(),
    getFornecedoresAsync(),
    getContasFinanceirasAsync(),
    getMaquinasCartaoAsync(),
  ]);
};

// Auto-init on import
initCadastrosCache().catch(e => console.error('Erro ao inicializar cache cadastros:', e));
