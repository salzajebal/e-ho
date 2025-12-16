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
  { symbol: 'NDX', name: 'NASDAQ 100', price: 21453.20, change: 125.50, changePercent: 0.59, high: 21500.00, low: 21350.00, volume: 850000, category: '지수' },
  { symbol: 'SP500', name: 'S&P 500', price: 6051.09, change: 32.80, changePercent: 0.54, high: 6070.00, low: 6020.00, volume: 1200000, category: '지수' },
  { symbol: 'AAPL', name: 'Apple', price: 248.50, change: 2.35, changePercent: 0.95, high: 250.00, low: 246.00, volume: 45000000, category: '나스닥' },
  { symbol: 'MSFT', name: 'Microsoft', price: 438.20, change: -1.80, changePercent: -0.41, high: 442.00, low: 436.00, volume: 22000000, category: '나스닥' },
  { symbol: 'GOOGL', name: 'Alphabet', price: 192.35, change: 1.25, changePercent: 0.65, high: 194.00, low: 190.50, volume: 18000000, category: '나스닥' },
  { symbol: 'AMZN', name: 'Amazon', price: 227.80, change: 3.40, changePercent: 1.51, high: 229.00, low: 224.50, volume: 35000000, category: '나스닥' },
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
