import { useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  sales: number;
  rating: number;
  image?: string;
  lastUpdated: Date;
}

export interface Category {
  id: string;
  name: string;
  totalProducts: number;
  revenue: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export interface SalesMetric {
  period: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  category?: string;
}

export const mockProducts: Product[] = [
  {
    id: 'IP15PM',
    name: 'iPhone 15 Pro Max',
    category: 'Smartphones',
    price: 7999.00,
    originalPrice: 8499.00,
    discount: 500.00,
    stock: 45,
    sales: 1234,
    rating: 4.9,
    lastUpdated: new Date()
  },
  {
    id: 'IP15P',
    name: 'iPhone 15 Pro',
    category: 'Smartphones',
    price: 6999.00,
    stock: 62,
    sales: 987,
    rating: 4.8,
    lastUpdated: new Date()
  },
  {
    id: 'IP15',
    name: 'iPhone 15',
    category: 'Smartphones',
    price: 5499.00,
    stock: 78,
    sales: 1456,
    rating: 4.7,
    lastUpdated: new Date()
  },
  {
    id: 'IP14PM',
    name: 'iPhone 14 Pro Max',
    category: 'Smartphones',
    price: 5999.00,
    originalPrice: 6999.00,
    discount: 1000.00,
    stock: 34,
    sales: 654,
    rating: 4.8,
    lastUpdated: new Date()
  },
  {
    id: 'AIRPODSP',
    name: 'AirPods Pro 2ª Geração',
    category: 'Acessórios',
    price: 1899.00,
    stock: 125,
    sales: 2345,
    rating: 4.9,
    lastUpdated: new Date()
  },
  {
    id: 'CASE01',
    name: 'Capinha Silicone iPhone 15',
    category: 'Capinhas',
    price: 149.00,
    stock: 456,
    sales: 3456,
    rating: 4.5,
    lastUpdated: new Date()
  },
  {
    id: 'CASE02',
    name: 'Capinha Leather iPhone 15 Pro',
    category: 'Capinhas',
    price: 299.00,
    stock: 234,
    sales: 1234,
    rating: 4.7,
    lastUpdated: new Date()
  },
  {
    id: 'MAGSAFE',
    name: 'Carregador MagSafe',
    category: 'Acessórios',
    price: 349.00,
    stock: 189,
    sales: 876,
    rating: 4.6,
    lastUpdated: new Date()
  }
];

export const mockCategories: Category[] = [
  {
    id: 'smartphones',
    name: 'Smartphones',
    totalProducts: 8,
    revenue: 45678900,
    change: 12345,
    changePercent: 2.8,
    lastUpdated: new Date()
  },
  {
    id: 'capinhas',
    name: 'Capinhas',
    totalProducts: 45,
    revenue: 234560,
    change: -1234,
    changePercent: -0.5,
    lastUpdated: new Date()
  },
  {
    id: 'acessorios',
    name: 'Acessórios',
    totalProducts: 23,
    revenue: 3456780,
    change: 23456,
    changePercent: 7.2,
    lastUpdated: new Date()
  }
];

export const mockSalesMetrics: SalesMetric[] = [
  {
    period: 'Hoje',
    value: 45678,
    change: 3456,
    changePercent: 8.2,
    lastUpdated: new Date()
  },
  {
    period: 'Esta Semana',
    value: 234567,
    change: 12345,
    changePercent: 5.6,
    lastUpdated: new Date()
  },
  {
    period: 'Este Mês',
    value: 987654,
    change: 45678,
    changePercent: 4.9,
    lastUpdated: new Date()
  }
];

export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Apple anuncia novo iPhone 16 com recursos revolucionários',
    summary: 'A Apple revelou sua mais nova linha de iPhones com melhorias significativas em câmera e bateria.',
    source: 'TechNews',
    url: '#',
    category: 'Lançamentos',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Vendas de acessórios Apple crescem 15% no último trimestre',
    summary: 'Acessórios como AirPods e capinhas lideram o crescimento no mercado.',
    source: 'BusinessDaily',
    url: '#',
    category: 'Mercado',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Black Friday: Descontos de até 30% em iPhones',
    summary: 'Prepare-se para as melhores ofertas da temporada em produtos Apple.',
    source: 'ShopNews',
    url: '#',
    category: 'Promoções',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
  },
  {
    id: '4',
    title: 'Novas capinhas MagSafe chegam ao mercado',
    summary: 'Linha premium de capinhas com tecnologia MagSafe disponível agora.',
    source: 'TechGadgets',
    url: '#',
    category: 'Produtos',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  }
];

// Simular mudanças em tempo real nos produtos
const fluctuateValue = (value: number, maxChange: number): number => {
  const changePercent = (Math.random() - 0.5) * 2 * maxChange;
  return value * (1 + changePercent / 100);
};

export const generatePriceHistory = (days: number, currentPrice: number, volatility: number) => {
  const history = [];
  let price = currentPrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    price = fluctuateValue(price, volatility);
    
    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2))
    });
  }
  
  return history;
};

// Hook para atualizar dados dos produtos em tempo real
export const useProductData = (initialProducts: Product[]) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProducts(currentProducts => 
        currentProducts.map(product => ({
          ...product,
          sales: Math.max(0, product.sales + Math.floor(Math.random() * 5 - 2)),
          stock: Math.max(0, product.stock + Math.floor(Math.random() * 3 - 1)),
          lastUpdated: new Date()
        }))
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return products;
};

// Hook para atualizar categorias em tempo real
export const useCategoryData = (initialCategories: Category[]) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCategories(currentCategories => 
        currentCategories.map(category => {
          const revenueChange = Math.random() * 10000 - 5000;
          const newRevenue = category.revenue + revenueChange;
          return {
            ...category,
            revenue: Math.max(0, newRevenue),
            change: revenueChange,
            changePercent: (revenueChange / category.revenue) * 100,
            lastUpdated: new Date()
          };
        })
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return categories;
};

// Hook para atualizar métricas de vendas
export const useSalesMetrics = (initialMetrics: SalesMetric[]) => {
  const [metrics, setMetrics] = useState<SalesMetric[]>(initialMetrics);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(currentMetrics => 
        currentMetrics.map(metric => {
          const change = Math.random() * 1000 - 500;
          const newValue = metric.value + change;
          return {
            ...metric,
            value: Math.max(0, newValue),
            change: change,
            changePercent: (change / metric.value) * 100,
            lastUpdated: new Date()
          };
        })
      );
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return metrics;
};
