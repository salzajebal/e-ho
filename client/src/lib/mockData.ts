export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  category: '통화';
}

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'USD', name: 'USD/KRW', price: 87500.00, change: 0, changePercent: 0, high: 89500.00, low: 86500.00, volume: 0, category: '통화' },
  { symbol: 'JPY', name: 'JPY/KRW', price: 2930.00, change: 0, changePercent: 0, high: 3000.00, low: 2890.00, volume: 0, category: '통화' },
  { symbol: 'EUR', name: 'EUR/KRW', price: 87500.00, change: 0, changePercent: 0, high: 89500.00, low: 86500.00, volume: 0, category: '통화' },
  { symbol: 'AUD', name: 'AUD/KRW', price: 2930.00, change: 0, changePercent: 0, high: 3000.00, low: 2890.00, volume: 0, category: '통화' },
];

export function generatePriceUpdate(currentPrice: number): number {
  const volatility = 0.0005; // 0.05% per tick
  const change = currentPrice * volatility * (Math.random() - 0.5);
  return Number((currentPrice + change).toFixed(2));
}

export function generateCandleData(startPrice: number, count: number = 50) {
  const data = [];
  let current = startPrice;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000 * 15); // 15 min intervals
    const open = current;
    const close = generatePriceUpdate(open);
    const high = Math.max(open, close) + Math.random() * (open * 0.001);
    const low = Math.min(open, close) - Math.random() * (open * 0.001);
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open,
      close,
      high,
      low,
      volume: Math.floor(Math.random() * 1000)
    });
    current = close;
  }
  return data;
}
