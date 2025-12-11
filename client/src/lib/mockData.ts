export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  category: 'Crypto' | 'Forex' | 'Commodity' | 'Index';
}

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 98450.00, change: 1250.00, changePercent: 1.28, high: 99000.00, low: 97500.00, volume: 45000, category: 'Crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 2750.50, change: -15.20, changePercent: -0.55, high: 2800.00, low: 2720.00, volume: 120000, category: 'Crypto' },
  { symbol: 'USD/KRW', name: 'US Dollar', price: 1432.50, change: 5.50, changePercent: 0.38, high: 1435.00, low: 1425.00, volume: 5000000, category: 'Forex' },
  { symbol: 'WTI', name: 'Crude Oil', price: 72.45, change: -0.85, changePercent: -1.16, high: 73.50, low: 71.80, volume: 85000, category: 'Commodity' },
  { symbol: 'XAU/USD', name: 'Gold', price: 2045.80, change: 12.40, changePercent: 0.61, high: 2050.00, low: 2030.00, volume: 15000, category: 'Commodity' },
  { symbol: 'HSI', name: 'Hang Seng', price: 16540.00, change: -230.00, changePercent: -1.37, high: 16800.00, low: 16450.00, volume: 200000, category: 'Index' },
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
