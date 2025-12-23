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
  'GOLD': 2650,
};

// Maximum deviation from base price (in points)
const MAX_DEVIATION: Record<string, number> = {
  'NDX': 5,      // Index: ±5 points
  'GOLD': 2,     // Gold: ±2 points
};

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'NDX', name: 'NASDAQ 100', price: 21547.80, change: -110.50, changePercent: -0.51, high: 21660.00, low: 21520.00, volume: 920000, category: '지수' },
  { symbol: 'GOLD', name: 'GOLD', price: 2650.30, change: 12.50, changePercent: 0.47, high: 2660.00, low: 2640.00, volume: 450000, category: '지수' },
];

// Hook to manage real-time data with API integration
export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const [apiAvailable, setApiAvailable] = useState(true);
  const lastApiPrices = useRef<Record<string, { price: number; change: number; changePercent: number; high: number; low: number }>>({});

  useEffect(() => {
    // Fetch real prices from API
    const fetchRealPrices = async () => {
      try {
        const response = await fetch('/api/market/prices');
        const result = await response.json();
        
        if (result.fallback || !result.prices) {
          setApiAvailable(false);
          return false;
        }

        setApiAvailable(true);
        
        setData(prev => prev.map(item => {
          const apiPrice = result.prices.find((p: any) => p.symbol === item.symbol);
          if (apiPrice) {
            // Store API prices as the authoritative source
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
        console.log('Falling back to simulation mode');
        setApiAvailable(false);
        return false;
      }
    };

    // Micro-simulation for smooth UI (only tiny variations around API price)
    const microSimulate = () => {
      if (!apiAvailable) return;
      
      setData(prev => prev.map(item => {
        const apiData = lastApiPrices.current[item.symbol];
        if (!apiData) return item;
        
        // Very small random variation (0.01% max) for smooth UI
        const microChange = apiData.price * 0.0001 * (Math.random() - 0.5);
        const newPrice = apiData.price + microChange;
        
        return {
          ...item,
          price: parseFloat(newPrice.toFixed(2)),
          change: apiData.change,
          changePercent: apiData.changePercent,
          high: apiData.high,
          low: apiData.low,
        };
      }));
    };

    // Fallback simulation only when API is not available
    const fallbackSimulate = () => {
      if (apiAvailable) return;
      
      setData(prev => prev.map(item => {
        const basePrice = BASE_PRICES[item.symbol] || item.price;
        const maxDev = MAX_DEVIATION[item.symbol] || 3;
        const smallChange = (Math.random() - 0.5) * 0.3;
        let newPrice = item.price + smallChange;
        
        const deviation = newPrice - basePrice;
        if (Math.abs(deviation) > maxDev) {
          newPrice = newPrice - deviation * 0.1;
        }
        newPrice = Math.max(basePrice - maxDev, Math.min(basePrice + maxDev, newPrice));
        
        const change = newPrice - basePrice;
        const changePercent = (change / basePrice) * 100;
        
        return {
          ...item,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
        };
      }));
    };

    // Initial API fetch
    fetchRealPrices();

    // Fetch from API every 5 seconds for real-time sync with TradingView
    const apiInterval = setInterval(fetchRealPrices, 5000);
    
    // Micro-simulation for smooth price display (every second)
    const simInterval = setInterval(() => {
      if (apiAvailable) {
        microSimulate();
      } else {
        fallbackSimulate();
      }
    }, 1000);

    return () => {
      clearInterval(apiInterval);
      clearInterval(simInterval);
    };
  }, [apiAvailable]);

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
