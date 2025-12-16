import { useState, useEffect, useRef, useMemo } from 'react';

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
  { symbol: 'NVDA', name: 'NVIDIA', price: 134.25, change: -1.45, changePercent: -1.07, high: 137.50, low: 133.00, volume: 245000000, category: '나스닥' },
  { symbol: 'META', name: 'Meta', price: 622.77, change: 5.43, changePercent: 0.88, high: 625.00, low: 617.00, volume: 12800000, category: '나스닥' },
  { symbol: 'TSLA', name: 'Tesla', price: 463.02, change: 11.25, changePercent: 2.49, high: 468.00, low: 450.00, volume: 98500000, category: '나스닥' },
];

// Hook to manage real-time data
export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const wsRef = useRef<WebSocket | null>(null);
  const previousPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    // Initialize previous prices
    INITIAL_MARKET_DATA.forEach(item => {
      previousPrices.current[item.symbol] = item.price;
    });

    // Simulate NASDAQ stock price movements
    const simulateMarkets = () => {
      setData(prev => prev.map(item => {
        // Volatility varies by stock type
        let volatility = 0.0003;
        if (item.symbol === 'TSLA' || item.symbol === 'NVDA') volatility = 0.0008;
        if (item.symbol === 'NDX' || item.symbol === 'SP500') volatility = 0.0002;
        
        const basePrice = previousPrices.current[item.symbol] || item.price;
        const priceChange = basePrice * volatility * (Math.random() - 0.5) * 2;
        const newPrice = basePrice + priceChange;
        
        // Accumulate daily change
        const totalChange = item.change + priceChange;
        const openPrice = item.price - item.change;
        const changePercent = openPrice !== 0 ? (totalChange / openPrice) * 100 : 0;
        
        previousPrices.current[item.symbol] = newPrice;
        
        return {
          ...item,
          price: newPrice,
          change: totalChange,
          changePercent: changePercent,
          high: Math.max(item.high, newPrice),
          low: Math.min(item.low, newPrice),
        };
      }));
    };

    // Set up interval for simulated markets
    const simInterval = setInterval(simulateMarkets, 1000);

    return () => {
      clearInterval(simInterval);
    };
  }, []);

  return data;
}

// Generate initial chart data
function generateInitialChartData(price: number, count: number = 60): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let current = price * 0.995;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000);
    const volatility = 0.0015;
    const change = current * volatility * (Math.random() - 0.5) * 2;
    const close = current + change;
    
    data.push({
      time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      close: close,
      timestamp: time.getTime()
    });
    current = close;
  }
  return data;
}

interface ChartDataPoint {
  time: string;
  close: number;
  timestamp: number;
}

// Real-time chart data hook
export function useChartData(symbol: string, currentPrice: number): ChartDataPoint[] {
  const [chartData, setChartData] = useState<ChartDataPoint[]>(() => 
    generateInitialChartData(currentPrice)
  );
  const lastSymbolRef = useRef<string>(symbol);
  const lastPriceRef = useRef<number>(currentPrice);

  // Reset chart data when symbol changes
  useEffect(() => {
    if (symbol !== lastSymbolRef.current) {
      setChartData(generateInitialChartData(currentPrice));
      lastSymbolRef.current = symbol;
    }
  }, [symbol, currentPrice]);

  // Update chart with live price
  useEffect(() => {
    lastPriceRef.current = currentPrice;
  }, [currentPrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return generateInitialChartData(lastPriceRef.current);
        
        const now = new Date();
        const lastPoint = prev[prev.length - 1];
        const timeDiff = now.getTime() - lastPoint.timestamp;
        
        if (timeDiff >= 60000) {
          // Add new data point every minute
          const newPoint: ChartDataPoint = {
            time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            close: lastPriceRef.current,
            timestamp: now.getTime()
          };
          return [...prev.slice(1), newPoint];
        } else {
          // Update last point with current price
          const updatedLast = { ...lastPoint, close: lastPriceRef.current };
          return [...prev.slice(0, -1), updatedLast];
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return chartData;
}

// Legacy function for backwards compatibility
export function generateCandleData(currentPrice: number, count: number = 50) {
  const data = [];
  let current = currentPrice * 0.995;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000);
    const volatility = 0.001;
    const change = current * volatility * (Math.random() - 0.5) * 2;
    const close = current + change;
    
    data.push({
      time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      open: current,
      close: close,
      high: Math.max(current, close) * 1.001,
      low: Math.min(current, close) * 0.999,
      volume: Math.floor(Math.random() * 1000)
    });
    current = close;
  }
  return data;
}
