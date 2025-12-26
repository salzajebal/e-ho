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
  category: '암호화폐';
}

// Realistic base prices (anchor points) - updated to match current market prices
const BASE_PRICES: Record<string, number> = {
  'BTC': 89000,
  'ETH': 2980,
};

// Maximum deviation from base price (in points)
const MAX_DEVIATION: Record<string, number> = {
  'BTC': 500,      // Bitcoin: ±500 points
  'ETH': 50,       // Ethereum: ±50 points
};

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 89000.00, change: 0, changePercent: 0, high: 90000.00, low: 87000.00, volume: 0, category: '암호화폐' },
  { symbol: 'ETH', name: 'Ethereum', price: 2980.00, change: 0, changePercent: 0, high: 3050.00, low: 2900.00, volume: 0, category: '암호화폐' },
];

// Hook to manage real-time data with API integration
export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const [apiAvailable, setApiAvailable] = useState(true);
  const lastApiPrices = useRef<Record<string, { price: number; change: number; changePercent: number; high: number; low: number }>>({});

  useEffect(() => {
    // Fetch real prices from API with timeout
    const fetchRealPrices = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/market/prices', {
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          setApiAvailable(false);
          return false;
        }
        
        const result = await response.json();
        
        if (result.fallback || !result.prices) {
          setApiAvailable(false);
          return false;
        }

        setApiAvailable(true);
        
        setData(prev => prev.map(item => {
          const apiPrice = result.prices.find((p: any) => p.symbol === item.symbol);
          if (apiPrice) {
            lastApiPrices.current[item.symbol] = {
              price: apiPrice.price,
              change: apiPrice.change,
              changePercent: apiPrice.changePercent,
              high: apiPrice.high,
              low: apiPrice.low,
            };
            return {
              ...item,
              price: apiPrice.price,
              change: apiPrice.change,
              changePercent: apiPrice.changePercent,
              high: apiPrice.high || item.high,
              low: apiPrice.low || item.low,
            };
          }
          return item;
        }));
        return true;
      } catch (error) {
        setApiAvailable(false);
        return false;
      }
    };

    // Initial API fetch with multiple retries
    fetchRealPrices();
    setTimeout(fetchRealPrices, 300);
    setTimeout(fetchRealPrices, 800);

    // Fetch from API every 1 second for real-time updates
    const apiInterval = setInterval(fetchRealPrices, 1000);

    return () => {
      clearInterval(apiInterval);
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
