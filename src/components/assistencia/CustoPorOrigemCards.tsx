import React, { useMemo } from 'react';
import { StatsCard } from '@/components/ui/StatsCard';
import { Wrench, Shield, Package, PackageCheck } from 'lucide-react';
import { OrdemServico, PecaServico } from '@/utils/assistenciaApi';
import { formatCurrency } from '@/utils/formatUtils';

export interface CustosPorOrigem {
  custoBalcao: number;
  custoGarantia: number;
  custoEstoque: number;
  investimentoConsignados: number;
}

export const calcularCustosPorOrigem = (osList: OrdemServico[]): CustosPorOrigem => {
  const result: CustosPorOrigem = {
    custoBalcao: 0,
    custoGarantia: 0,
    custoEstoque: 0,
    investimentoConsignados: 0,
  };

  osList.forEach(os => {
    os.pecas.forEach(p => {
      const custo = p.valorCustoReal ?? 0;
      if (p.origemServico === 'Balcao') result.custoBalcao += custo;
      if (p.origemServico === 'Garantia') result.custoGarantia += custo;
      if (p.origemServico === 'Estoque') result.custoEstoque += custo;
      if (p.origemPeca === 'Consignado') result.investimentoConsignados += custo;
    });
  });

  return result;
};

/** Calcula custos a partir de um array de PecaServico direto (para preview em tempo real) */
export const calcularCustosDePecas = (pecas: PecaServico[]): CustosPorOrigem => {
  const result: CustosPorOrigem = {
    custoBalcao: 0,
    custoGarantia: 0,
    custoEstoque: 0,
    investimentoConsignados: 0,
  };

  pecas.forEach(p => {
    const custo = p.valorCustoReal ?? 0;
    if (p.origemServico === 'Balcao') result.custoBalcao += custo;
    if (p.origemServico === 'Garantia') result.custoGarantia += custo;
    if (p.origemServico === 'Estoque') result.custoEstoque += custo;
    if (p.origemPeca === 'Consignado') result.investimentoConsignados += custo;
  });

  return result;
};

interface CustoPorOrigemCardsProps {
  ordensServico?: OrdemServico[];
  pecas?: PecaServico[];
  titulo?: string;
}

export function CustoPorOrigemCards({ ordensServico, pecas, titulo }: CustoPorOrigemCardsProps) {
  const custos = useMemo(() => {
    if (pecas) return calcularCustosDePecas(pecas);
    if (ordensServico) return calcularCustosPorOrigem(ordensServico);
    return { custoBalcao: 0, custoGarantia: 0, custoEstoque: 0, investimentoConsignados: 0 };
  }, [ordensServico, pecas]);

  const temDados = custos.custoBalcao > 0 || custos.custoGarantia > 0 || custos.custoEstoque > 0 || custos.investimentoConsignados > 0;

  if (!temDados) return null;

  return (
    <div className="space-y-2">
      {titulo && (
        <h3 className="text-sm font-semibold text-muted-foreground">{titulo}</h3>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Custo - Balcão"
          value={formatCurrency(custos.custoBalcao)}
          icon={<Wrench />}
          className="bg-blue-500/5 border-blue-500/20"
        />
        <StatsCard
          title="Custo - Garantia"
          value={formatCurrency(custos.custoGarantia)}
          icon={<Shield />}
          className="bg-red-500/5 border-red-500/20"
        />
        <StatsCard
          title="Custo - Estoque"
          value={formatCurrency(custos.custoEstoque)}
          icon={<Package />}
          className="bg-green-500/5 border-green-500/20"
        />
        <StatsCard
          title="Invest. Consignados"
          value={formatCurrency(custos.investimentoConsignados)}
          icon={<PackageCheck />}
          className="bg-violet-500/5 border-violet-500/20"
        />
      </div>
    </div>
  );
}
