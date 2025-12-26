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

// Realistic base prices (anchor points) - prices will fluctuate within small range of these
const BASE_PRICES: Record<string, number> = {
  'BTC': 95000,
  'ETH': 3400,
};

// Maximum deviation from base price (in points)
const MAX_DEVIATION: Record<string, number> = {
  'BTC': 500,      // Bitcoin: ±500 points
  'ETH': 50,       // Ethereum: ±50 points
};

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 95000.00, change: 0, changePercent: 0, high: 96000.00, low: 94000.00, volume: 0, category: '암호화폐' },
  { symbol: 'ETH', name: 'Ethereum', price: 3400.00, change: 0, changePercent: 0, high: 3500.00, low: 3300.00, volume: 0, category: '암호화폐' },
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

    // No micro-simulation - use exact API prices for 100% sync with server
    const syncWithApi = () => {
      if (!apiAvailable) return;
      
      setData(prev => prev.map(item => {
        const apiData = lastApiPrices.current[item.symbol];
        if (!apiData) return item;
        
        // Use exact API price without any modification
        return {
          ...item,
          price: apiData.price,
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

    // Fetch from API every 3 seconds for more real-time updates
    const apiInterval = setInterval(fetchRealPrices, 3000);
    
    // Sync prices (every 500ms) - exact API prices, no random variation
    const simInterval = setInterval(() => {
      if (apiAvailable) {
        syncWithApi();
      } else {
        fallbackSimulate();
      }
    }, 500);

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
