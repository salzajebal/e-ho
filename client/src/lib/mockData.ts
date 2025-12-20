export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  category: '나스닥' | '지수';
}

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'NDX', name: 'NASDAQ 100', price: 21547.80, change: -110.50, changePercent: -0.51, high: 21660.00, low: 21520.00, volume: 920000, category: '지수' },
  { symbol: 'SP500', name: 'S&P 500', price: 5867.50, change: -25.40, changePercent: -0.43, high: 5895.00, low: 5855.00, volume: 1350000, category: '지수' },
  { symbol: 'GOLD', name: 'GOLD', price: 2650.30, change: 12.50, changePercent: 0.47, high: 2660.00, low: 2640.00, volume: 450000, category: '지수' },
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
