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

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 87500, change: 0, changePercent: 0, high: 89000, low: 86500, volume: 0, category: '암호화폐' },
  { symbol: 'ETH', name: 'Ethereum', price: 2930, change: 0, changePercent: 0, high: 2980, low: 2890, volume: 0, category: '암호화폐' },
];

// Hook to manage real-time data with API integration
export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const lastApiPrices = useRef<Record<string, { price: number; change: number; changePercent: number; high: number; low: number }>>({});
  const updateCounter = useRef(0);

  useEffect(() => {
    // Fetch real prices from API with timeout
    const fetchRealPrices = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/market/prices', {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn('Market API response not ok:', response.status);
          return;
        }
        
        const result = await response.json();
        
        if (!result.prices || result.prices.length === 0) {
          console.warn('Market API returned no prices');
          return;
        }
        
        // Skip if fallback data (no real-time connection yet) - but only if fallback is explicitly true
        // Allow data through if fallback field is missing (old API) or false
        if (result.fallback === true) {
          console.warn('Market API returned fallback data, waiting for live connection...');
          return;
        }

        updateCounter.current++;
        
        const newData = result.prices.map((apiPrice: any) => {
          lastApiPrices.current[apiPrice.symbol] = {
            price: apiPrice.price,
            change: apiPrice.change,
            changePercent: apiPrice.changePercent,
            high: apiPrice.high,
            low: apiPrice.low,
          };
          
          const existing = INITIAL_MARKET_DATA.find(m => m.symbol === apiPrice.symbol);
          return {
            symbol: apiPrice.symbol,
            name: existing?.name || apiPrice.symbol,
            price: apiPrice.price,
            change: apiPrice.change,
            changePercent: apiPrice.changePercent,
            high: apiPrice.high,
            low: apiPrice.low,
            volume: 0,
            category: '암호화폐' as const,
          };
        });
        
        if (updateCounter.current % 10 === 1) {
          console.log('[MarketData] Updated prices:', newData.map((d: MarketData) => `${d.symbol}: $${d.price}`).join(', '));
        }
        
        setData(newData);
      } catch (error) {
        console.warn('Market API fetch error:', error);
      }
    };

    // Initial API fetch
    fetchRealPrices();

    // Fetch from API every 500ms for real-time updates
    const apiInterval = setInterval(fetchRealPrices, 500);

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
