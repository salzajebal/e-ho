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
  { symbol: 'USD', name: 'EUR/USD', price: 1.0500, change: 0, changePercent: 0, high: 1.0600, low: 1.0400, volume: 0, category: '통화' },
  { symbol: 'JPY', name: 'USD/JPY', price: 150.000, change: 0, changePercent: 0, high: 151.000, low: 149.000, volume: 0, category: '통화' },
  { symbol: 'EUR', name: 'GBP/USD', price: 1.2700, change: 0, changePercent: 0, high: 1.2800, low: 1.2600, volume: 0, category: '통화' },
  { symbol: 'AUD', name: 'AUD/USD', price: 0.6500, change: 0, changePercent: 0, high: 0.6600, low: 0.6400, volume: 0, category: '통화' },
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
