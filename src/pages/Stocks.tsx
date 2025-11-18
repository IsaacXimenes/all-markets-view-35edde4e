
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useProductData, mockProducts, generatePriceHistory } from '@/utils/productsApi';
import { StockCard } from '@/components/stocks/StockCard';
import { StockChart } from '@/components/stocks/StockChart';

const Stocks = () => {
  const products = useProductData(mockProducts);
  const [selectedProduct, setSelectedProduct] = React.useState(products[0]);
  
  const productsWithHistory = products.map(product => {
    return {
      ...product,
      priceHistory: generatePriceHistory(30, product.price, 2)
    };
  });
  
  return (
    <PageLayout title="Smartphones">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Todos os Smartphones</h2>
          <div className="space-y-4">
            {productsWithHistory.filter(p => p.category === 'Smartphones').map((product) => (
              <StockCard 
                key={product.id} 
                stock={{
                  symbol: product.id,
                  name: product.name,
                  price: product.price,
                  change: product.discount || 0,
                  changePercent: product.discount ? ((product.discount / product.price) * 100) : 0,
                  volume: product.sales,
                  marketCap: product.stock,
                  lastUpdated: product.lastUpdated
                }}
                priceHistory={product.priceHistory}
                onClick={() => setSelectedProduct(product)}
                className={selectedProduct.id === product.id ? "ring-2 ring-primary" : ""}
              />
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <StockChart 
            symbol={selectedProduct.id} 
            name={selectedProduct.name} 
            currentPrice={selectedProduct.price}
            volatility={2.5}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">Estoque</h3>
              <p className="text-xl font-semibold mt-1">
                {selectedProduct.stock} unidades
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">Vendas</h3>
              <p className="text-xl font-semibold mt-1">
                {selectedProduct.sales} unidades
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">Avaliação</h3>
              <p className="text-xl font-semibold mt-1">
                {selectedProduct.rating} ⭐
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Stocks;
