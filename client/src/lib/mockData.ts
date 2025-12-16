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
  { symbol: 'NDX', name: 'NASDAQ 100', price: 21774.95, change: 85.32, changePercent: 0.39, high: 21850.00, low: 21680.00, volume: 920000, category: '지수' },
  { symbol: 'SP500', name: 'S&P 500', price: 6074.53, change: 23.47, changePercent: 0.39, high: 6095.00, low: 6050.00, volume: 1350000, category: '지수' },
  { symbol: 'AAPL', name: 'Apple', price: 251.04, change: 1.92, changePercent: 0.77, high: 252.50, low: 249.00, volume: 48500000, category: '나스닥' },
  { symbol: 'MSFT', name: 'Microsoft', price: 454.46, change: 3.21, changePercent: 0.71, high: 456.00, low: 450.50, volume: 18700000, category: '나스닥' },
  { symbol: 'GOOGL', name: 'Alphabet', price: 196.84, change: 2.15, changePercent: 1.10, high: 198.00, low: 194.50, volume: 21200000, category: '나스닥' },
  { symbol: 'AMZN', name: 'Amazon', price: 229.15, change: 1.85, changePercent: 0.81, high: 231.00, low: 227.00, volume: 38500000, category: '나스닥' },
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
