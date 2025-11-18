
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { MarketOverview } from '@/components/markets/MarketOverview';
import { useCategoryData, mockCategories } from '@/utils/productsApi';

const Markets = () => {
  const categories = useCategoryData(mockCategories);
  
  return (
    <PageLayout title="Categorias">
      <div className="grid grid-cols-1 gap-6">
        <MarketOverview indices={categories.map(cat => ({
          symbol: cat.id,
          name: cat.name,
          value: cat.revenue,
          change: cat.change,
          changePercent: cat.changePercent,
          region: `${cat.totalProducts} produtos`,
          lastUpdated: cat.lastUpdated
        }))} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-card rounded-lg p-6 shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-muted-foreground text-sm">{category.totalProducts} produtos</p>
                </div>
                <div className={`text-lg font-bold ${category.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {category.changePercent >= 0 ? '+' : ''}{category.changePercent.toFixed(2)}%
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold">R$ {(category.revenue / 1000).toFixed(2)}k</span>
                <span className={`ml-2 ${category.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {category.change >= 0 ? '+' : ''}R$ {category.change.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Última atualização: {new Date(category.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Markets;
