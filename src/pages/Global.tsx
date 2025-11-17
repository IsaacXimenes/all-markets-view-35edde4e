
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useMarketIndices, mockIndices } from '@/utils/stocksApi';
import { Globe } from 'lucide-react';

const Global = () => {
  const indices = useMarketIndices(mockIndices);
  
  const regions = [
    { name: 'North America', markets: ['United States', 'Canada'] },
    { name: 'Europe', markets: ['United Kingdom', 'Germany', 'France', 'Switzerland'] },
    { name: 'Asia-Pacific', markets: ['Japan', 'China', 'Hong Kong', 'Australia'] },
  ];
  
  return (
    <PageLayout title="Mercados Globais">
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-card rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Visão Geral dos Mercados Mundiais</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {regions.map((region) => (
              <div key={region.name} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{region.name}</h3>
                <ul className="space-y-2">
                  {region.markets.map((market) => {
                    const index = indices.find(i => i.region === market);
                    return (
                      <li key={market} className="flex justify-between items-center">
                        <span>{market}</span>
                        {index ? (
                          <span className={index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Calendário Econômico</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Hora</th>
                  <th className="text-left py-2 px-4">Região</th>
                  <th className="text-left py-2 px-4">Evento</th>
                  <th className="text-left py-2 px-4">Impacto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4">08:30 AM</td>
                  <td className="py-2 px-4">Estados Unidos</td>
                  <td className="py-2 px-4">Folha de Pagamento Não-Agrícola</td>
                  <td className="py-2 px-4">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Alto</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">10:00 AM</td>
                  <td className="py-2 px-4">Zona do Euro</td>
                  <td className="py-2 px-4">Decisão de Taxa de Juros do BCE</td>
                  <td className="py-2 px-4">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Alto</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">02:00 PM</td>
                  <td className="py-2 px-4">Reino Unido</td>
                  <td className="py-2 px-4">PIB (TaT)</td>
                  <td className="py-2 px-4">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Médio</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Global;
