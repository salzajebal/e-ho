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

// Realistic base prices (anchor points) - prices will fluctuate within small range of these
const BASE_PRICES: Record<string, number> = {
  'NDX': 21547,
  'SP500': 5867,
  'AAPL': 250,
  'MSFT': 442,
  'GOOGL': 191,
  'AMZN': 224,
  'NVDA': 129,
  'META': 605,
  'TSLA': 477,
};

// Maximum deviation from base price (in points)
const MAX_DEVIATION: Record<string, number> = {
  'NDX': 5,      // Index: ±5 points
  'SP500': 3,    // Index: ±3 points
  'AAPL': 2,     // Stocks: ±2 points
  'MSFT': 3,
  'GOOGL': 2,
  'AMZN': 2,
  'NVDA': 2,
  'META': 3,
  'TSLA': 4,     // Tesla more volatile: ±4 points
};

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'NDX', name: 'NASDAQ 100', price: 21547.80, change: -110.50, changePercent: -0.51, high: 21660.00, low: 21520.00, volume: 920000, category: '지수' },
  { symbol: 'SP500', name: 'S&P 500', price: 5867.50, change: -25.40, changePercent: -0.43, high: 5895.00, low: 5855.00, volume: 1350000, category: '지수' },
  { symbol: 'AAPL', name: 'Apple', price: 250.25, change: -0.85, changePercent: -0.34, high: 252.00, low: 249.00, volume: 48500000, category: '나스닥' },
  { symbol: 'MSFT', name: 'Microsoft', price: 442.30, change: -3.20, changePercent: -0.72, high: 446.00, low: 440.00, volume: 18700000, category: '나스닥' },
  { symbol: 'GOOGL', name: 'Alphabet', price: 191.45, change: -1.35, changePercent: -0.70, high: 193.00, low: 190.00, volume: 21200000, category: '나스닥' },
  { symbol: 'AMZN', name: 'Amazon', price: 224.80, change: -1.50, changePercent: -0.66, high: 227.00, low: 223.00, volume: 38500000, category: '나스닥' },
  { symbol: 'NVDA', name: 'NVIDIA', price: 129.75, change: -2.25, changePercent: -1.71, high: 132.50, low: 128.50, volume: 245000000, category: '나스닥' },
  { symbol: 'META', name: 'Meta', price: 605.50, change: -4.50, changePercent: -0.74, high: 612.00, low: 602.00, volume: 12800000, category: '나스닥' },
  { symbol: 'TSLA', name: 'Tesla', price: 477.25, change: 2.75, changePercent: 0.58, high: 482.00, low: 472.00, volume: 98500000, category: '나스닥' },
];

// Hook to manage real-time data with API integration
export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const [useApi, setUseApi] = useState(true);
  const previousPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    // Initialize previous prices
    INITIAL_MARKET_DATA.forEach(item => {
      previousPrices.current[item.symbol] = item.price;
    });

    // Fetch real prices from API
    const fetchRealPrices = async () => {
      try {
        const response = await fetch('/api/market/prices');
        const result = await response.json();
        
        if (result.fallback || !result.prices) {
          setUseApi(false);
          return false;
        }

        setData(prev => prev.map(item => {
          const apiPrice = result.prices.find((p: any) => p.symbol === item.symbol);
          if (apiPrice) {
            previousPrices.current[item.symbol] = apiPrice.price;
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
        console.log('Falling back to simulation mode');
        setUseApi(false);
        return false;
      }
    };

    // Simulate NASDAQ stock price movements - keep within realistic range (fallback)
    const simulateMarkets = () => {
      setData(prev => prev.map(item => {
        const basePrice = BASE_PRICES[item.symbol] || item.price;
        const maxDev = MAX_DEVIATION[item.symbol] || 3;
        
        // Small random change (0.01 to 0.15 points)
        const smallChange = (Math.random() - 0.5) * 0.3;
        
        let currentPrice = previousPrices.current[item.symbol] || item.price;
        let newPrice = currentPrice + smallChange;
        
        // Calculate current deviation from base
        const deviation = newPrice - basePrice;
        
        // If too far from base, pull back towards it
        if (Math.abs(deviation) > maxDev) {
          const pullBack = deviation * 0.1;
          newPrice = newPrice - pullBack;
        } else if (Math.abs(deviation) > maxDev * 0.7) {
          const pullBack = deviation * 0.03;
          newPrice = newPrice - pullBack;
        }
        
        // Clamp to absolute maximum range
        newPrice = Math.max(basePrice - maxDev, Math.min(basePrice + maxDev, newPrice));
        
        // Calculate change from open (base price)
        const change = newPrice - basePrice;
        const changePercent = (change / basePrice) * 100;
        
        previousPrices.current[item.symbol] = newPrice;
        
        return {
          ...item,
          price: newPrice,
          change: change,
          changePercent: changePercent,
          high: Math.max(basePrice, newPrice),
          low: Math.min(basePrice, newPrice),
        };
      }));
    };

    // Initial API fetch
    fetchRealPrices();

    // Set up intervals
    let apiInterval: NodeJS.Timeout | null = null;
    let simInterval: NodeJS.Timeout | null = null;

    if (useApi) {
      // Fetch from API every 10 seconds
      apiInterval = setInterval(fetchRealPrices, 10000);
      // Small simulation between API calls for smoother UI
      simInterval = setInterval(simulateMarkets, 1000);
    } else {
      // Pure simulation mode
      simInterval = setInterval(simulateMarkets, 1000);
    }

    return () => {
      if (apiInterval) clearInterval(apiInterval);
      if (simInterval) clearInterval(simInterval);
    };
  }, [useApi]);

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
