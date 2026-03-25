
export interface User {
  id: string;
  email?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  priceYuan: number;
  quantity: number;
}

export interface CalculatedItem extends ProductItem {
  distributedFreightBRL: number;
  distributedTaxBRL: number;
  totalCostBRL: number;
  suggestedPriceBRL: number;
  profitBRL: number;
}

export interface PackageData {
  items: ProductItem[];
  totalFreightYuan: number;
  totalTaxBRL: number;
  exchangeRate: number;
}

export interface AnalysisResult {
  totalInvestmentBRL: number;
  totalRevenueBRL: number;
  totalProfitBRL: number;
  roi: number;
  verdict: 'GEM' | 'HEALTHY' | 'RISKY';
  items: CalculatedItem[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
